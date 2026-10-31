import test, { before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createSchoolDatabase } from './database.mjs';
import { createSchoolServer } from './server.mjs';
import { quizFixture } from './quiz-fixture.mjs';
import { evaluateExercise } from '../../packages/exercises/src/index.ts';
let db, app, f;
const streams = [];
before(async () => {
  db = await createSchoolDatabase();
});
after(async () => {
  await db?.close();
});
beforeEach(async () => {
  f = await quizFixture(db.pool, 30);
  app = await createSchoolServer({ pool: db.pool, fixtureActors: f.actors });
});
afterEach(async () => {
  for (const s of streams.splice(0)) s.close();
  await app?.close();
});
async function login(key) {
  const r = await fetch(app.origin);
  const cookie = r.headers.get('set-cookie').split(';')[0];
  await r.text();
  const session = { cookie, key };
  await post(session, 'session', { actor: key });
  return session;
}
async function post(s, action, p) {
  const r = await fetch(app.origin + '/api/' + action, {
    method: 'POST',
    headers: { cookie: s.cookie, origin: app.origin, 'content-type': 'application/json' },
    body: JSON.stringify(p),
  });
  const value = await r.json();
  assert.equal(r.status, 200, JSON.stringify(value));
  return value;
}
async function listen(session, id, mode = 'learner') {
  const controller = new AbortController(),
    response = await fetch(
      `${app.origin}/api/quiz-events?${new URLSearchParams({ id, mode, locale: 'de' })}`,
      { headers: { cookie: session.cookie }, signal: controller.signal },
    );
  assert.equal(response.status, 200);
  const waiting = new Set();
  let latest, error;
  const result = {
    close: () => controller.abort(),
    async until(predicate) {
      if (latest && predicate(latest)) return latest;
      if (error) throw error;
      return new Promise((resolve, reject) => {
        const waiter = {
          predicate,
          resolve: (v) => {
            clearTimeout(timer);
            waiting.delete(waiter);
            resolve(v);
          },
          reject,
        };
        const timer = setTimeout(() => {
          waiting.delete(waiter);
          reject(new Error('SSE snapshot timeout'));
        }, 8000);
        waiting.add(waiter);
      });
    },
  };
  streams.push(result);
  void (async () => {
    let buffer = '';
    try {
      for await (const chunk of response.body) {
        buffer += new TextDecoder().decode(chunk);
        let end;
        while ((end = buffer.indexOf('\n\n')) >= 0) {
          const frame = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          const line = frame.split('\n').find((l) => l.startsWith('data: '));
          if (!line) continue;
          latest = frame.startsWith('event: unavailable')
            ? { unavailable: true }
            : JSON.parse(line.slice(6));
          for (const w of waiting) if (w.predicate(latest)) w.resolve(latest);
        }
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        error = e;
        for (const w of waiting) w.reject(e);
      }
    }
  })();
  return result;
}
async function prepare(teacher, count = 2) {
  return post(teacher, 'quiz-create', {
    class: f.classId,
    title: 'HTTP live draft',
    seconds: 30,
    blocks: [{ key: 'notes', count }],
  });
}
async function right(id, index) {
  const { items } = (
    await db.pool.query('select items from school_draft.quiz_material where quiz_id=$1', [id])
  ).rows[0];
  return items[index].item.choices.find((c) => evaluateExercise(items[index].item, c).correct);
}
test('30 actual HTTP/SSE clients converge, retry once, reconnect and receive the same final leaderboard', async () => {
  const teacher = await login('teacherA'),
    created = await prepare(teacher, 1);
  const sessions = await Promise.all(f.learners.map((a) => login(a.key)));
  await Promise.all(
    sessions.map((s) => post(s, 'quiz-join', { code: created.code, ranking: true })),
  );
  const sockets = await Promise.all(sessions.map((s) => listen(s, created.id)));
  await Promise.all(sockets.map((s) => s.until((v) => v.phase === 'lobby')));
  const started = performance.now();
  await post(teacher, 'quiz-start', { id: created.id, index: -1 });
  const snapshots = await Promise.all(sockets.map((s) => s.until((v) => v.phase === 'question')));
  const latency = performance.now() - started;
  assert.ok(latency < 5000, `30-client transition: ${latency} ms`);
  assert.equal(new Set(snapshots.map((v) => JSON.stringify(v.question))).size, 1);
  const answer = await right(created.id, 0);
  await Promise.all(
    sessions.map((s) => post(s, 'quiz-answer', { id: created.id, index: 0, answer })),
  );
  await post(sessions[0], 'quiz-answer', { id: created.id, index: 0, answer });
  sockets[0].close();
  const resumed = await listen(sessions[0], created.id);
  assert.ok((await resumed.until((v) => v.self?.answered)).self.answered);
  await post(teacher, 'quiz-reveal', { id: created.id, index: 0 });
  const reviews = await Promise.all(
    [resumed, ...sockets.slice(1)].map((s) => s.until((v) => v.phase === 'review')),
  );
  assert.ok(
    reviews.every(
      (v) => v.board.length === 30 && v.board.every((r) => r.rank === 1 && r.score === 1),
    ),
  );
  await post(teacher, 'quiz-next', { id: created.id, index: 0 });
  await Promise.all(
    [resumed, ...sockets.slice(1)].map((s) => s.until((v) => v.phase === 'finished')),
  );
  assert.equal(
    (await db.pool.query('select count(*)::int n from school_draft.quiz_answers')).rows[0].n,
    30,
  );
  console.log(
    `Synthetic 30-client HTTP/SSE transition: ${Math.round(latency)} ms; 30 unique answers.`,
  );
});
test('quiet SSE connections recheck consent, teacher removal and session identity; projector contains no roster', async () => {
  const teacher = await login('teacherA'),
    learner = await login('learnerA'),
    created = await prepare(teacher, 1),
    id = created.id;
  await post(learner, 'quiz-join', { code: created.code, ranking: true });
  await post(teacher, 'quiz-start', { id, index: -1 });
  await post(learner, 'quiz-answer', { id, index: 0, answer: await right(id, 0) });
  await post(teacher, 'quiz-finish', { id, index: 0 });
  await post(learner, 'sharing', { class: f.classId, enabled: true });
  const privateStream = await listen(teacher, id, 'teacher'),
    projector = await listen(teacher, id, 'projector'),
    own = await listen(learner, id);
  assert.equal(
    (await privateStream.until((v) => v.summary?.included === 1)).results[0].result.correct,
    1,
  );
  const projected = await projector.until((v) => v.phase === 'finished');
  assert.equal(projected.results, undefined);
  assert.equal(projected.summary, undefined);
  assert.ok(!JSON.stringify(projected).includes('Fixture 1'));
  await post(learner, 'sharing', { class: f.classId, enabled: false });
  assert.equal(
    (await privateStream.until((v) => v.summary?.included === 0)).results[0].result,
    null,
  );
  await post(learner, 'quiz-ranking', { id, enabled: false });
  assert.deepEqual((await projector.until((v) => v.board?.length === 0)).board, []);
  await post(learner, 'session', { actor: 'learnerB' });
  assert.ok((await own.until((v) => v.unavailable)).unavailable);
  // Direct database/service change deliberately emits no HTTP wake signal.
  await f.act('adminA', 'removeTeacher', { org: f.org, actor: f.ids.teacherA });
  assert.ok((await privateStream.until((v) => v.unavailable)).unavailable);
  assert.ok((await projector.until((v) => v.unavailable)).unavailable);
});
test('concurrent subscriptions cannot exceed the per-session bound or bypass participant access', async () => {
  const teacher = await login('teacherA'),
    created = await prepare(teacher),
    learner = await login('learnerA');
  const url =
    app.origin +
    '/api/quiz-events?' +
    new URLSearchParams({ id: created.id, mode: 'teacher', locale: 'de' });
  const denied = await fetch(url, { headers: { cookie: learner.cookie } });
  assert.equal(denied.status, 403);
  await denied.text();
  const controllers = Array.from({ length: 6 }, () => new AbortController());
  try {
    const responses = await Promise.all(
      controllers.map((c) => fetch(url, { headers: { cookie: teacher.cookie }, signal: c.signal })),
    );
    assert.equal(responses.filter((r) => r.status === 200).length, 4);
    assert.equal(responses.filter((r) => r.status === 503).length, 2);
  } finally {
    for (const c of controllers) c.abort();
  }
});
