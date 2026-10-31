import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createSchoolDatabase, asActor } from './database.mjs';
import { createQuizService } from './quiz-service.mjs';
import { quizFixture } from './quiz-fixture.mjs';
import { evaluateExercise } from '../../packages/exercises/src/index.ts';
let db, q, f;
before(async () => {
  db = await createSchoolDatabase();
  q = createQuizService(db.pool);
});
after(async () => {
  await db?.close();
});
beforeEach(async () => {
  f = await quizFixture(db.pool);
});
const call = (who, action, p) => q.call(f.ids[who], action, p);
const view = (who, id, mode = who.startsWith('learner') ? 'learner' : 'teacher', locale = 'de') =>
  call(who, 'view', { id, mode, locale });
const create = () =>
  call('teacherA', 'create', {
    class: f.classId,
    title: 'Quiz draft',
    seconds: 30,
    blocks: [
      { key: 'notes', count: 2 },
      { key: 'hearing', count: 1 },
    ],
  });
async function answer(id, index) {
  const m = (
    await db.pool.query('select items from school_draft.quiz_material where quiz_id=$1', [id])
  ).rows[0];
  const item = m.items[index].item;
  return item.choices.find((a) => evaluateExercise(item, a).correct);
}
const denied = (p) =>
  assert.rejects(p, (e) => ['forbidden', '42501', 'invalidCode'].includes(e.code));
for (const locale of ['de', 'en-US', 'en-GB'])
  test(`${locale}: lobby, three synchronized rounds, opt-in ranking and shared results`, async () => {
    const { id, code } = await create();
    await call('learnerA', 'join', { code, ranking: true });
    await call('learnerB', 'join', { code, ranking: false });
    await call('teacherA', 'start', { id, index: -1 });
    for (let index = 0; index < 3; index++) {
      const v = await view('learnerA', id, 'learner', locale);
      assert.equal(v.index, index);
      assert.equal(v.phase, 'question');
      assert.equal(v.solution, undefined);
      assert.deepEqual(v.board, []);
      if (index === 2) assert.ok(v.question.audio);
      await call('learnerA', 'answer', { id, index, answer: await answer(id, index) });
      assert.equal((await view('learnerA', id)).self.result, undefined);
      await call('teacherA', 'reveal', { id, index });
      const reveal = await view('teacherA', id, 'projector', locale);
      assert.ok(reveal.solution);
      assert.equal(reveal.board.length, 1);
      assert.equal(reveal.board[0].score, index + 1);
      assert.equal(reveal.results, undefined);
      await Promise.all([
        call('teacherA', 'next', { id, index }),
        call('teacherA', 'next', { id, index }),
      ]);
    }
    const self = await view('learnerA', id);
    assert.equal(self.phase, 'finished');
    assert.equal(self.self.result.correct, 3);
    assert.equal((await view('teacherA', id)).results[0].result, null);
    await f.act('learnerA', 'sharing', { class: f.classId, enabled: true });
    assert.deepEqual((await view('teacherA', id)).summary, {
      included: 1,
      participants: 2,
      correct: 3,
      total: 3,
    });
    await call('learnerA', 'ranking', { id, enabled: false });
    assert.deepEqual((await view('teacherA', id, 'projector')).board, []);
    await f.act('learnerA', 'sharing', { class: f.classId, enabled: false });
    assert.equal((await view('teacherA', id)).summary.total, 0);
  });
test('codes, roles, material and direct writes do not bypass class boundaries', async () => {
  const { id, code } = await create();
  for (const who of ['teacherB', 'adminA', 'learnerC']) await denied(view(who, id));
  await denied(call('learnerC', 'join', { code, ranking: false }));
  await call('learnerA', 'join', { code, ranking: false });
  await denied(view('learnerA', id, 'projector'));
  await denied(call('learnerA', 'start', { id, index: -1 }));
  await denied(
    asActor(db.pool, f.ids.learnerA, (c) => c.query('select * from school_draft.quiz_material')),
  );
  await denied(
    asActor(db.pool, f.ids.learnerA, (c) => c.query('select * from school_draft.quiz_answers')),
  );
  await denied(
    asActor(db.pool, f.ids.learnerA, (c) =>
      c.query("update school_draft.quizzes set phase='finished'"),
    ),
  );
  const rotated = await call('teacherA', 'rotate', { id });
  await denied(call('learnerB', 'join', { code, ranking: false }));
  await call('learnerB', 'join', { code: rotated.code, ranking: false });
  await call('teacherA', 'start', { id, index: -1 });
  await denied(call('learnerB', 'join', { code: rotated.code, ranking: false }));
  await f.act('adminA', 'removeTeacher', { org: f.org, actor: f.ids.teacherA });
  await denied(view('teacherA', id));
});
test('parallel answers count once, stale controls cannot skip a round, deadline closes authoritatively', async () => {
  const { id, code } = await create();
  await call('learnerA', 'join', { code, ranking: true });
  await call('teacherA', 'start', { id, index: -1 });
  const p = { id, index: 0, answer: await answer(id, 0) };
  await Promise.all(Array.from({ length: 20 }, () => call('learnerA', 'answer', p)));
  assert.equal(
    (await db.pool.query('select count(*)::int n from school_draft.quiz_answers')).rows[0].n,
    1,
  );
  await assert.rejects(call('learnerA', 'answer', { ...p, answer: 'changed' }), /answerConflict/);
  await db.pool.query(
    "update school_draft.quizzes set due_at=clock_timestamp()-interval '1 second' where id=$1",
    [id],
  );
  assert.equal((await view('learnerA', id)).phase, 'review');
  await call('teacherA', 'next', { id, index: 0 });
  await call('teacherA', 'next', { id, index: 0 });
  assert.equal((await view('learnerA', id)).index, 1);
  await db.pool.query(
    "update school_draft.quizzes set due_at=clock_timestamp()-interval '1 second' where id=$1",
    [id],
  );
  await assert.rejects(
    call('learnerA', 'answer', { id, index: 1, answer: await answer(id, 1) }),
    /quizRoundClosed/,
  );
  await call('teacherA', 'finish', { id, index: 1 });
  assert.deepEqual((await view('learnerA', id)).self.result, { correct: 1, answered: 1, total: 2 });
});
test('membership removal, archive, expiry and changed material close access', async () => {
  const { id, code } = await create();
  await call('learnerA', 'join', { code, ranking: true });
  await call('teacherA', 'start', { id, index: -1 });
  await call('learnerA', 'answer', { id, index: 0, answer: await answer(id, 0) });
  await f.act('learnerA', 'leave', { class: f.classId });
  await denied(view('learnerA', id));
  assert.equal(
    (await db.pool.query('select count(*)::int n from school_draft.quiz_answers')).rows[0].n,
    0,
  );
  await db.pool.query(
    "update school_draft.quiz_material set digest=repeat('0',64) where quiz_id=$1",
    [id],
  );
  await assert.rejects(view('teacherA', id), /materialChanged/);
  await f.act('teacherA', 'archive', { class: f.classId });
  await denied(view('teacherA', id));
  f = await quizFixture(db.pool);
  const expired = await create();
  await db.pool.query(
    "update school_draft.quizzes set expires_at=clock_timestamp()-interval '1 second' where id=$1",
    [expired.id],
  );
  await denied(call('learnerA', 'join', { code: expired.code, ranking: false }));
  assert.equal((await view('teacherA', expired.id)).phase, 'cancelled');
});
test('thirty seats remain bounded under concurrent joins; identities, points and time are rejected', async () => {
  f = await quizFixture(db.pool, 31);
  const { id, code } = await create();
  const joined = await Promise.allSettled(
    f.learners.map((a) => q.call(a.id, 'join', { code, ranking: false })),
  );
  assert.equal(joined.filter((r) => r.status === 'fulfilled').length, 30);
  assert.equal(
    joined.filter((r) => r.status === 'rejected' && r.reason.code === 'quizFull').length,
    1,
  );
  assert.equal((await view('teacherA', id)).players, 30);
  await assert.rejects(
    call('learnerA', 'join', { code, ranking: true, actor: f.ids.teacherA }),
    /invalid/,
  );
  await assert.rejects(
    call('learnerA', 'answer', { id, index: 0, answer: 'x', correct: true }),
    /invalid/,
  );
  await assert.rejects(call('teacherA', 'start', { id, index: -1, at: 0 }), /invalid/);
});
