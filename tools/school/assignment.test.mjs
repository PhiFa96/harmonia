import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createSchoolDatabase, seedSchoolFixtures, FIXTURE_ACTORS, asActor } from './database.mjs';
import { createSchoolService } from './service.mjs';
import { createAssignmentService } from './assignment-service.mjs';
import { fixtureAssignmentAnswers } from './assignment-fixture.mjs';
let db, s, a;
const ids = Object.fromEntries(FIXTURE_ACTORS.map((x) => [x.key, x.id]));
const act = (who, action, p) => s.act(ids[who], action, p);
const call = (who, action, p) => a.call(ids[who], action, p);
const denied = (p) => assert.rejects(p, (e) => e.code === 'forbidden' || e.code === '42501');
before(async () => {
  db = await createSchoolDatabase();
  s = createSchoolService(db.pool);
  a = createAssignmentService(db.pool);
});
after(async () => {
  await db?.close();
});
beforeEach(async () => {
  await db.pool.query(
    'truncate school_draft.organizations,school_draft.actors restart identity cascade',
  );
  await seedSchoolFixtures(db.pool);
});
async function fixture() {
  const org = (await act('adminA', 'createOrg', { label: 'Assignment fixtures' })).id;
  const code = await act('adminA', 'invite', { org, class: null, kind: 'teacher', uses: 2 });
  await act('teacherA', 'join', { code: code.code });
  await act('teacherB', 'join', { code: code.code });
  const first = (await act('teacherA', 'createClass', { org, label: 'First' })).id;
  const second = (await act('teacherB', 'createClass', { org, label: 'Second' })).id;
  const invite = await act('teacherA', 'invite', { org, class: first, kind: 'learner', uses: 3 });
  await act('learnerA', 'join', { code: invite.code });
  return { org, first, second, invite: invite.code };
}
async function assign(c, blocks = [{ key: 'notes', count: 2 }]) {
  return (
    await call('teacherA', 'create', {
      class: c,
      title: 'Own draft assignment',
      dueAt: new Date(Date.now() + 86400000).toISOString(),
      blocks,
    })
  ).id;
}
async function complete(id, locale = 'de', who = 'learnerA', misses = 0) {
  let view = await call(who, 'start', { id, locale });
  const answers = await fixtureAssignmentAnswers(db.pool, id);
  for (const [index, r] of answers.entries()) {
    assert.equal(view.question.index, index);
    assert.equal(Object.hasOwn(view, 'result'), false);
    view = await call(who, 'answer', {
      id,
      locale,
      index,
      answer: index < misses ? r.wrong : r.right,
    });
  }
  return view;
}
for (const locale of ['de', 'en-US', 'en-GB'])
  test(`${locale}: lesson and aural block, server grading, per-class sharing and report`, async () => {
    const f = await fixture(),
      id = await assign(f.first, [
        { key: 'notation.l1.staff.anchor', count: 1 },
        { key: 'hearing', count: 3 },
      ]);
    const result = await complete(id, locale, 'learnerA', 1);
    assert.equal(result.phase, 'finished');
    assert.equal(result.result.correct, 10);
    assert.equal(result.total, 11);
    assert.equal(result.result.reason, 'completed');
    assert.deepEqual(
      result.result.areas.map((x) => x.total),
      [8, 3],
    );
    assert.equal((await call('teacherA', 'report', { id })).learners[0].result, null);
    await act('learnerA', 'sharing', { class: f.first, enabled: true });
    assert.deepEqual((await call('teacherA', 'report', { id })).summary, {
      recipients: 1,
      shared: 1,
      submitted: 1,
      correct: 10,
      total: 11,
    });
    await act('learnerA', 'sharing', { class: f.first, enabled: false });
    assert.equal((await call('teacherA', 'report', { id })).summary.total, 0);
    assert.equal((await call('learnerA', 'view', { id, locale })).result.correct, 10);
  });
test('snapshot recipients, departure/rejoin and archive remove access without resurrecting results', async () => {
  const f = await fixture(),
    id = await assign(f.first);
  await complete(id);
  await act('learnerB', 'join', { code: f.invite });
  assert.deepEqual((await call('learnerB', 'list', { class: f.first })).assignments, []);
  await denied(call('learnerB', 'start', { id, locale: 'de' }));
  await act('learnerA', 'leave', { class: f.first });
  await act('learnerA', 'join', { code: f.invite });
  await denied(call('learnerA', 'view', { id, locale: 'de' }));
  assert.equal(
    (await db.pool.query('select count(*)::int n from school_draft.assignment_attempts')).rows[0].n,
    0,
  );
  const next = await assign(f.first);
  await act('teacherA', 'archive', { class: f.first });
  await denied(call('learnerA', 'start', { id: next, locale: 'de' }));
  await denied(call('teacherA', 'report', { id: next }));
});
test('same-organization teachers and administrators cannot use shared links to bypass class assignment', async () => {
  const f = await fixture(),
    id = await assign(f.first);
  for (const who of ['teacherB', 'adminA', 'adminB', 'learnerC'])
    await denied(
      call(who, who.startsWith('learner') ? 'view' : 'report', {
        id,
        ...(who.startsWith('learner') ? { locale: 'de' } : {}),
      }),
    );
  await denied(
    call('teacherB', 'create', {
      class: f.first,
      title: 'Denied',
      dueAt: new Date(Date.now() + 60000).toISOString(),
      blocks: [{ key: 'notes', count: 1 }],
    }),
  );
  await act('adminA', 'removeTeacher', { org: f.org, actor: ids.teacherA });
  await denied(call('teacherA', 'report', { id }));
  await denied(call('teacherA', 'close', { id }));
});
test('concurrent retries score once; changed and out-of-order answers are rejected; restart resumes', async () => {
  const f = await fixture(),
    id = await assign(f.first);
  const answers = await fixtureAssignmentAnswers(db.pool, id);
  await call('learnerA', 'start', { id, locale: 'de' });
  const p = { id, locale: 'de', index: 0, answer: answers[0].right };
  await Promise.all(Array.from({ length: 12 }, () => call('learnerA', 'answer', p)));
  await assert.rejects(
    call('learnerA', 'answer', { ...p, answer: answers[0].wrong }),
    /answerConflict/,
  );
  await assert.rejects(call('learnerA', 'answer', { ...p, index: 2 }), /answerConflict/);
  a = createAssignmentService(db.pool);
  const resumed = await call('learnerA', 'view', { id, locale: 'en-US' });
  assert.equal(resumed.question.index, 1);
  const result = await call('learnerA', 'answer', {
    id,
    locale: 'de',
    index: 1,
    answer: answers[1].right,
  });
  assert.equal(result.result.correct, 2);
  assert.equal(result.result.answered, 2);
  assert.equal((await call('learnerA', 'start', { id, locale: 'de' })).result.correct, 2);
});
test('database deadline rejects late answers; unstarted work is missing data, not a zero result', async () => {
  const f = await fixture();
  await act('learnerB', 'join', { code: f.invite });
  const id = await assign(f.first);
  const answers = await fixtureAssignmentAnswers(db.pool, id);
  await call('learnerA', 'start', { id, locale: 'de' });
  await call('learnerA', 'answer', { id, locale: 'de', index: 0, answer: answers[0].right });
  await db.pool.query(
    "update school_draft.assignments set created_at=now()-interval '2 hours',due_at=now()-interval '1 hour' where id=$1",
    [id],
  );
  const late = await call('learnerA', 'answer', {
    id,
    locale: 'de',
    index: 1,
    answer: answers[1].right,
  });
  assert.equal(late.result.correct, 1);
  assert.equal(late.result.answered, 1);
  assert.equal(late.result.reason, 'deadline');
  assert.equal((await call('learnerB', 'start', { id, locale: 'de' })).phase, 'expired');
  for (const who of ['learnerA', 'learnerB'])
    await act(who, 'sharing', { class: f.first, enabled: true });
  const report = await call('teacherA', 'report', { id });
  assert.equal(report.summary.submitted, 1);
  assert.equal(report.summary.total, 2);
  assert.equal(report.learners.find((l) => l.actor === ids.learnerB).result, null);
});
test('early submission and teacher closure are final, without exposing unfinished results', async () => {
  const f = await fixture();
  const first = await assign(f.first),
    second = await assign(f.first);
  await act('learnerA', 'sharing', { class: f.first, enabled: true });
  await call('learnerA', 'start', { id: first, locale: 'de' });
  assert.equal((await call('teacherA', 'report', { id: first })).summary.submitted, 0);
  const early = await call('learnerA', 'finish', { id: first, locale: 'de' });
  assert.equal(early.result.reason, 'submitted');
  assert.equal(early.result.correct, 0);
  await call('learnerA', 'start', { id: second, locale: 'de' });
  await call('teacherA', 'close', { id: second });
  const answers = await fixtureAssignmentAnswers(db.pool, second);
  const late = await call('learnerA', 'answer', {
    id: second,
    locale: 'de',
    index: 0,
    answer: answers[0].right,
  });
  assert.equal(late.result.reason, 'closed');
  assert.equal(late.result.answered, 0);
  assert.equal((await call('teacherA', 'report', { id: second })).summary.submitted, 1);
});
test('start rechecks database time when the loaded clock snapshot predates the deadline', async () => {
  const f = await fixture(),
    id = await assign(f.first);
  await db.pool.query(
    "update school_draft.assignments set created_at=now()-interval '2 hours',due_at=now()-interval '1 hour' where id=$1",
    [id],
  );
  // Model a pause after loading metadata, without sleeps or changing PostgreSQL's clock.
  // Only the already-loaded timestamp is stale; every write uses the real database.
  const delayed = createAssignmentService({
    async connect() {
      const client = await db.pool.connect();
      return {
        release: () => client.release(),
        async query(sql, params) {
          const result = await client.query(sql, params);
          if (sql.includes('as server_now'))
            result.rows[0].server_now = new Date(result.rows[0].due_at.getTime() - 1);
          return result;
        },
      };
    },
  });
  assert.equal((await delayed.call(ids.learnerA, 'start', { id, locale: 'de' })).phase, 'expired');
  assert.equal(
    (await db.pool.query('select count(*)::int n from school_draft.assignment_attempts')).rows[0].n,
    0,
  );
});
test('client fields, scores, timestamps, grader role and raw materials cannot be injected or read', async () => {
  const f = await fixture(),
    id = await assign(f.first);
  await call('learnerA', 'start', { id, locale: 'de' });
  await assert.rejects(
    call('learnerA', 'answer', { id, locale: 'de', index: 0, answer: 'x', correct: true }),
    /invalid/,
  );
  await assert.rejects(
    call('learnerA', 'answer', { id, locale: 'de', index: 0, answer: 'x', at: 0 }),
    /invalid/,
  );
  assert.equal(
    (
      await db.pool.query(
        "select pg_has_role('harmonia_school_actor','harmonia_school_grader','SET') as allowed",
      )
    ).rows[0].allowed,
    false,
  );
  await denied(
    asActor(db.pool, ids.learnerA, (c) =>
      c.query('select * from school_draft.assignment_material'),
    ),
  );
  await denied(
    asActor(db.pool, ids.teacherA, (c) =>
      c.query('select answers from school_draft.assignment_attempts'),
    ),
  );
  await denied(
    asActor(db.pool, ids.learnerA, (c) =>
      c.query('update school_draft.assignment_attempts set correct=40'),
    ),
  );
  await denied(call('learnerA', 'close', { id }));
  const invalid = [
    [],
    [{ key: 'made-up', count: 1 }],
    [{ key: 'notes', count: 100 }],
    [{ key: 'notes', count: 1.5 }],
    [{ key: 'notes', count: 1, score: 100 }],
  ];
  for (const blocks of invalid)
    await assert.rejects(
      call('teacherA', 'create', {
        class: f.first,
        title: 'Invalid',
        dueAt: new Date(Date.now() + 60000).toISOString(),
        blocks,
      }),
      /invalid/,
    );
});
test('material changes block continuation; failed and empty assignments roll back atomically', async () => {
  const f = await fixture(),
    id = await assign(f.first);
  await call('learnerA', 'start', { id, locale: 'de' });
  await db.pool.query(
    "update school_draft.assignment_material set items=jsonb_set(items,'{0,item,choices,0}','\"tampered\"') where assignment_id=$1",
    [id],
  );
  await assert.rejects(call('learnerA', 'view', { id, locale: 'de' }), /materialChanged/);
  const empty = (await act('teacherA', 'createClass', { org: f.org, label: 'Empty' })).id;
  await assert.rejects(assign(empty), /noRecipients/);
  assert.equal((await call('teacherA', 'list', { class: empty })).assignments.length, 0);
});
