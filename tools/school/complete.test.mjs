import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createSchoolDatabase, asActor } from './database.mjs';
import { quizFixture } from './quiz-fixture.mjs';
import { createAssignmentService } from './assignment-service.mjs';
import { createQuizService } from './quiz-service.mjs';

let database, fixture;
before(async () => {
  database = await createSchoolDatabase();
});
after(async () => {
  await database?.close();
});
beforeEach(async () => {
  fixture = await quizFixture(database.pool);
});
const policy = 'school-draft-sharing-v2';
const sql = (actor, query, values = []) =>
  asActor(database.pool, actor, (db) => db.query(query, values));

test('D-F1: a legacy actor setting cannot replace the verified identity', async () => {
  const { ids, classId } = fixture;
  const result = await sql(
    ids.teacherB,
    "select set_config('school_draft.actor',$1,true), school_draft.teaches($2) as allowed",
    [ids.teacherA, classId],
  );
  assert.equal(result.rows[0].allowed, false);
});
test('D-F2: legacy consent shares neither progress nor results; renewed consent is versioned', async () => {
  const { ids, school, classId, act } = fixture;
  await database.pool.query(
    'update school_draft.class_members set sharing=true where actor_id=$1',
    [ids.learnerA],
  );
  assert.deepEqual((await school.report(ids.teacherA, classId)).learners[0].areas, []);
  await assert.rejects(
    act('learnerA', 'sharing', {
      class: classId,
      enabled: true,
      policy: 'school-draft-sharing-v1',
    }),
    /sharingPolicy/,
  );
  await act('learnerA', 'sharing', {
    class: classId,
    enabled: true,
    policy,
  });
  assert.equal((await school.report(ids.teacherA, classId)).learners[0].areas.length, 3);
  assert.equal(
    (
      await sql(ids.learnerB, 'select school_draft.sharing_current($1,$2) as visible', [
        classId,
        ids.learnerA,
      ])
    ).rows[0].visible,
    false,
  );
  assert.equal(
    (await sql(ids.learnerA, 'select policy from school_draft.sharing_events')).rows[0].policy,
    policy,
  );
});
test('D-F3: reports use membership handles and never contain learner account identifiers', async () => {
  const { ids, school, classId } = fixture;
  const report = await school.report(ids.teacherA, classId);
  assert.ok(!JSON.stringify(report).includes(ids.learnerA));
  assert.ok(report.learners[0].member);
  assert.ok(!Object.hasOwn(report.learners[0], 'actor'));
});
test('D-F6: actor-role queries cannot expose quiz mappings or licence event targets', async () => {
  const { ids, classId } = fixture;
  const quiz = createQuizService(database.pool);
  const room = await quiz.call(ids.teacherA, 'create', {
    class: classId,
    title: 'Private mapping',
    seconds: 15,
    blocks: [{ key: 'notes', count: 1 }],
  });
  await quiz.call(ids.learnerA, 'join', { code: room.code, ranking: true });
  assert.equal(
    (await sql(ids.teacherA, 'select actor_id from school_draft.quiz_players')).rowCount,
    0,
  );
  await assert.rejects(
    sql(ids.operator, 'select target from school_draft.license_events'),
    (error) => error.code === '42501',
  );
});
test('D-F5: direct grader writes cannot add an answer after the database deadline', async () => {
  const { ids, classId } = fixture;
  const assignments = createAssignmentService(database.pool);
  const { id } = await assignments.call(ids.teacherA, 'create', {
    class: classId,
    title: 'Deadline',
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    blocks: [{ key: 'notes', count: 2 }],
  });
  await assignments.call(ids.learnerA, 'start', { id, locale: 'de' });
  await database.pool.query(
    "update school_draft.assignments set created_at=clock_timestamp()-interval '2 days',due_at=clock_timestamp()-interval '1 day' where id=$1",
    [id],
  );
  await assert.rejects(
    asActor(database.pool, ids.learnerA, async (db) => {
      await db.query('set local role harmonia_school_grader');
      await db.query(
        `update school_draft.assignment_attempts set answers='[{"answer":"forged","correct":true}]',correct=1 where assignment_id=$1`,
        [id],
      );
    }),
    (error) => error.code === '42501',
  );
});
test('D-F7: an administrator cannot silently assign themselves to an existing class', async () => {
  const { ids, classId, act } = fixture;
  await assert.rejects(
    act('adminA', 'setTeacher', { class: classId, actor: ids.adminA, enabled: true }),
    /selfAssignment/,
  );
});
test('D-F9: failed code guesses are limited across rolled-back requests', async () => {
  const { act } = fixture;
  for (let i = 0; i < 10; i++)
    await assert.rejects(
      act('learnerA', 'join', { code: 'SCHOOL-FFFFFFFFFFFFFFFFFFFFFFFF' }),
      /invalidCode/,
    );
  await assert.rejects(
    act('learnerA', 'join', { code: 'SCHOOL-FFFFFFFFFFFFFFFFFFFFFFFF' }),
    (error) => error.code === 'rateLimited' && error.status === 429,
  );
});

test('D-F4: export is scoped, consent history survives leaving, and deletion cascades through issuer records', async () => {
  const { ids, act, classId } = fixture;
  const { createPrivacyService } = await import('./privacy-service.mjs');
  const privacy = createPrivacyService(database.pool);
  await act('learnerA', 'sharing', { class: classId, enabled: true, policy });
  const own = await privacy.call(ids.learnerA, 'export', {});
  assert.equal(own.actor.id, ids.learnerA);
  assert.ok(!JSON.stringify(own).includes(ids.learnerB));
  await act('learnerA', 'leave', { class: classId });
  const left = await privacy.call(ids.learnerA, 'export', {});
  assert.equal(left.memberships.length, 0);
  assert.equal(left.sharingEvents.length, 1);
  await act('teacherA', 'invite', { org: fixture.org, class: classId, kind: 'learner', uses: 1 });
  await privacy.call(ids.teacherA, 'delete', {});
  assert.equal(
    (await database.pool.query('select 1 from school_draft.actors where id=$1', [ids.teacherA]))
      .rowCount,
    0,
  );
  assert.equal(
    (
      await database.pool.query('select 1 from school_draft.invites where issuer=$1', [
        ids.teacherA,
      ])
    ).rowCount,
    0,
  );
  await privacy.call(ids.learnerA, 'delete', {});
  assert.equal(
    (
      await database.pool.query('select 1 from school_draft.sharing_events where actor_id=$1', [
        ids.learnerA,
      ])
    ).rowCount,
    0,
  );
});
test('D-F4: a last administrator transfers ownership before deleting the account', async () => {
  const { createPrivacyService } = await import('./privacy-service.mjs');
  const privacy = createPrivacyService(database.pool);
  await assert.rejects(privacy.call(fixture.ids.adminA, 'delete', {}), /adminTransferRequired/);
  await fixture.act('adminA', 'transferAdmin', { org: fixture.org, actor: fixture.ids.teacherB });
  await privacy.call(fixture.ids.adminA, 'delete', {});
  assert.equal((await fixture.school.state(fixture.ids.teacherB)).organizations[0].role, 'admin');
});
test('D-F7: assignment changes are visible to class members and omit account mappings', async () => {
  await fixture.act('adminA', 'setTeacher', {
    class: fixture.classId,
    actor: fixture.ids.teacherB,
    enabled: true,
  });
  const history = await fixture.act('learnerA', 'teacherHistory', { class: fixture.classId });
  assert.equal(history.events.at(-1).teacher, 'teacherB');
  assert.equal(history.events.at(-1).enabled, true);
  assert.ok(!JSON.stringify(history).includes(fixture.ids.teacherB));
  await assert.rejects(
    fixture.act('learnerC', 'teacherHistory', { class: fixture.classId }),
    (error) => error.code === 'forbidden',
  );
});
test('D-F8: independent quiz snapshot reads can hold shared class locks concurrently', async () => {
  let release, entered;
  const hold = new Promise((resolve) => {
    release = resolve;
  });
  const ready = new Promise((resolve) => {
    entered = resolve;
  });
  const first = asActor(database.pool, fixture.ids.learnerA, async (db) => {
    await db.query('set local role harmonia_school_grader');
    await db.query('select school_draft.assignment_class_read($1)', [fixture.classId]);
    entered();
    await hold;
  });
  await ready;
  try {
    await asActor(database.pool, fixture.ids.learnerB, async (db) => {
      await db.query('set local role harmonia_school_grader');
      await db.query("set local lock_timeout='500ms'");
      await db.query('select school_draft.assignment_class_read($1)', [fixture.classId]);
    });
  } finally {
    release();
    await first;
  }
});
test('D-F10: quiz-code and nickname collisions retry without aborting the transaction', async () => {
  let codeIndex = 0,
    nickIndex = 0;
  const quiz = createQuizService(database.pool, {
    makeCode: () => ['AAAAAAAAAA', 'AAAAAAAAAA', 'BBBBBBBBBB'][codeIndex++] ?? 'CCCCCCCCCC',
    makeNickname: () => ['Q-SAME', 'Q-SAME', 'Q-OTHER'][nickIndex++] ?? 'Q-NEXT',
  });
  const room = () =>
    quiz.call(fixture.ids.teacherA, 'create', {
      class: fixture.classId,
      title: 'Collision test',
      seconds: 15,
      blocks: [{ key: 'notes', count: 1 }],
    });
  const first = await room(),
    second = await room();
  assert.equal(second.code, 'BBBBBBBBBB');
  await quiz.call(fixture.ids.learnerA, 'join', { code: first.code, ranking: false });
  await quiz.call(fixture.ids.learnerB, 'join', { code: first.code, ranking: false });
  assert.deepEqual(
    (
      await database.pool.query('select nickname from school_draft.quiz_players order by nickname')
    ).rows.map((r) => r.nickname),
    ['Q-OTHER', 'Q-SAME'],
  );
  const colliding = createQuizService(database.pool, { makeCode: () => first.code });
  await assert.rejects(
    colliding.call(fixture.ids.teacherA, 'create', {
      class: fixture.classId,
      title: 'Exhausted',
      seconds: 15,
      blocks: [{ key: 'notes', count: 1 }],
    }),
    (error) => error.code === 'codeConflict' && error.status === 409,
  );
  assert.equal(
    (await database.pool.query('select count(*)::int as n from school_draft.quizzes')).rows[0].n,
    2,
  );
});
test('D-F12: a learner requests a seat without granting learning data or exposing account IDs', async () => {
  const { createLicenseService } = await import('./license-service.mjs');
  const licenses = createLicenseService(database.pool);
  let overview = await licenses.call(fixture.ids.adminA, 'overview', {});
  assert.equal(overview.candidates.filter((c) => c.label).length, 0);
  await licenses.call(fixture.ids.learnerA, 'request', { org: fixture.org, enabled: true });
  overview = await licenses.call(fixture.ids.adminA, 'overview', {});
  assert.equal(overview.candidates.filter((c) => c.label).length, 1);
  assert.ok(!JSON.stringify(overview).includes(fixture.ids.learnerA));
  assert.equal(
    (await fixture.school.report(fixture.ids.teacherA, fixture.classId)).learners[0].sharing,
    false,
  );
  await licenses.call(fixture.ids.learnerA, 'request', { org: fixture.org, enabled: false });
  assert.equal(
    (await licenses.call(fixture.ids.adminA, 'overview', {})).candidates.filter((c) => c.label)
      .length,
    0,
  );
});

test('D-F1/D-F11: signed identity sessions cannot switch fixture accounts or outlive their JWT', async (t) => {
  const { keys, epoch, issuer } = await import('./auth-fixture.mjs');
  const { createSchoolServer } = await import('./server.mjs');
  const signing = keys();
  let now = epoch;
  const app = await createSchoolServer({
    pool: database.pool,
    authentication: { issuer, jwks: { keys: [signing.jwk] } },
    now: () => now,
  });
  t.after(() => app.close());
  assert.equal((await fetch(app.origin)).status, 401);
  const landing = await fetch(app.origin, {
    headers: {
      authorization: 'Bearer ' + signing.token({ user_metadata: { operator: true } }),
    },
  });
  assert.equal(landing.status, 200);
  const cookie = landing.headers.get('set-cookie').split(';')[0];
  const state = await (await fetch(app.origin + '/api/state', { headers: { cookie } })).json();
  assert.equal(state.fixtureMode, false);
  assert.deepEqual(
    state.actors.map((a) => a.id),
    [fixture.ids.learnerA],
  );
  const post = (path, p) =>
    fetch(app.origin + path, {
      method: 'POST',
      headers: { cookie, origin: app.origin, 'content-type': 'application/json' },
      body: JSON.stringify(p),
    });
  assert.equal((await post('/api/session', { actor: 'operator' })).status, 403);
  assert.equal(
    (
      await post('/api/license-create', {
        id: fixture.org,
        org: fixture.org,
        seats: 1,
        unitCents: 100,
        days: 30,
        startsAt: null,
      })
    ).status,
    403,
  );
  now = epoch + 60000;
  assert.equal((await fetch(app.origin + '/api/state', { headers: { cookie } })).status, 401);
});
test('D-F11: expired HTTP sessions reclaim capacity; logout and deletion revoke all matching sessions', async (t) => {
  const { createSchoolServer } = await import('./server.mjs');
  let now = 0;
  const app = await createSchoolServer({
    pool: database.pool,
    now: () => now,
    sessionLimits: { capacity: 2, idleMs: 10, maxMs: 30 },
  });
  t.after(() => app.close());
  const open = async () => {
    const r = await fetch(app.origin);
    return { status: r.status, cookie: r.headers.get('set-cookie')?.split(';')[0] };
  };
  const a = await open(),
    b = await open();
  assert.equal((await open()).status, 503);
  now = 10;
  const fresh = await open();
  assert.equal(fresh.status, 200);
  assert.equal(
    (await fetch(app.origin + '/api/state', { headers: { cookie: a.cookie } })).status,
    401,
  );
  const post = (cookie, path, p) =>
    fetch(app.origin + path, {
      method: 'POST',
      headers: { cookie, origin: app.origin, 'content-type': 'application/json' },
      body: JSON.stringify(p),
    });
  const second = await open();
  await post(fresh.cookie, '/api/session', { actor: 'learnerA' });
  await post(second.cookie, '/api/session', { actor: 'learnerA' });
  assert.equal((await post(fresh.cookie, '/api/privacy-delete', {})).status, 200);
  for (const cookie of [fresh.cookie, second.cookie, b.cookie])
    assert.equal((await fetch(app.origin + '/api/state', { headers: { cookie } })).status, 401);
  const latest = await open();
  assert.equal((await post(latest.cookie, '/api/logout', {})).status, 200);
  assert.equal(
    (await fetch(app.origin + '/api/state', { headers: { cookie: latest.cookie } })).status,
    401,
  );
});
test('D-F4: retention removes old responses and logs while preserving current data and access boundaries', async () => {
  const { createPrivacyService } = await import('./privacy-service.mjs');
  const privacy = createPrivacyService(database.pool);
  await fixture.act('learnerA', 'sharing', { class: fixture.classId, enabled: true, policy });
  await database.pool.query(
    "update school_draft.sample_evidence set at=clock_timestamp()-interval '31 days' where actor_id=$1",
    [fixture.ids.learnerA],
  );
  await database.pool.query(
    "update school_draft.sharing_events set at=clock_timestamp()-interval '181 days'",
  );
  await assert.rejects(
    privacy.call(fixture.ids.teacherA, 'purge', {}),
    (error) => error.code === 'forbidden',
  );
  const counts = await privacy.call(fixture.ids.operator, 'purge', {});
  assert.equal(counts.samples, 3);
  assert.equal(counts.audit, 1);
  assert.equal(
    (await database.pool.query('select count(*)::int as n from school_draft.sample_evidence'))
      .rows[0].n,
    6,
  );
});
test('D-F2/D-F4: personal export cannot disclose an open quiz answer grade', async () => {
  const { createPrivacyService } = await import('./privacy-service.mjs');
  const privacy = createPrivacyService(database.pool);
  const quiz = createQuizService(database.pool);
  const room = await quiz.call(fixture.ids.teacherA, 'create', {
    class: fixture.classId,
    title: 'Export boundary',
    seconds: 15,
    blocks: [{ key: 'notes', count: 1 }],
  });
  await quiz.call(fixture.ids.learnerA, 'join', { code: room.code, ranking: false });
  await quiz.call(fixture.ids.teacherA, 'start', { id: room.id, index: -1 });
  const view = await quiz.call(fixture.ids.learnerA, 'view', {
    id: room.id,
    locale: 'de',
    mode: 'learner',
  });
  await quiz.call(fixture.ids.learnerA, 'answer', {
    id: room.id,
    index: 0,
    answer: view.question.choices[0].id,
  });
  const hidden = await privacy.call(fixture.ids.learnerA, 'export', {});
  assert.equal(hidden.quizAnswers[0].correct, null);
  await quiz.call(fixture.ids.teacherA, 'reveal', { id: room.id, index: 0 });
  assert.equal(
    typeof (await privacy.call(fixture.ids.learnerA, 'export', {})).quizAnswers[0].correct,
    'boolean',
  );
});

test('D-F3: joining two classes creates independent aliases and replacing membership replaces its handle', async () => {
  const { act, org, classId, school, ids } = fixture;
  const second = (await act('teacherB', 'createClass', { org, label: 'Second privacy class' })).id;
  const firstCode = await act('teacherA', 'invite', {
    org,
    class: classId,
    kind: 'learner',
    uses: 3,
  });
  const secondCode = await act('teacherB', 'invite', {
    org,
    class: second,
    kind: 'learner',
    uses: 1,
  });
  await act('learnerC', 'join', { code: firstCode.code });
  await act('learnerC', 'join', { code: secondCode.code });
  const memberships = (await school.state(ids.learnerC)).memberships;
  assert.equal(memberships.length, 2);
  assert.notEqual(memberships[0].alias, memberships[1].alias);
  for (const member of memberships) assert.match(member.alias, /^P-[A-F0-9]{12}$/);
  const previous = memberships.find((m) => m.class_id === classId).id;
  await act('learnerC', 'leave', { class: classId });
  await act('learnerC', 'join', { code: firstCode.code });
  const current = (await school.state(ids.learnerC)).memberships.find(
    (m) => m.class_id === classId,
  ).id;
  assert.notEqual(current, previous);
  await act('teacherA', 'removeLearner', { class: classId, member: previous });
  assert.ok((await school.state(ids.learnerC)).memberships.some((m) => m.id === current));
});
test('D-F1: operator permission follows the private registry rather than UUID or account label', async () => {
  const { createLicenseService } = await import('./license-service.mjs');
  const licenses = createLicenseService(database.pool);
  await database.pool.query('delete from school_draft.operators');
  assert.equal((await licenses.call(fixture.ids.operator, 'overview', {})).operator, false);
  await database.pool.query('insert into school_draft.operators values($1)', [
    fixture.ids.teacherA,
  ]);
  assert.equal((await licenses.call(fixture.ids.teacherA, 'overview', {})).operator, true);
  await assert.rejects(
    sql(fixture.ids.learnerA, 'insert into school_draft.operators values(school_draft.actor())'),
    (error) => error.code === '42501',
  );
});
