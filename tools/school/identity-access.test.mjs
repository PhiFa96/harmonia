import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { request } from 'node:http';
import pg from 'pg';
import { createSchoolDatabase } from './database.mjs';
import { quizFixture } from './quiz-fixture.mjs';
import { createSchoolServer } from './server.mjs';
import { keys, epoch, issuer, subject } from './auth-fixture.mjs';
import { createQuizService } from './quiz-service.mjs';

let database, fixture;
before(async () => {
  database = await createSchoolDatabase();
});
after(async () => database?.close());
beforeEach(async () => {
  fixture = await quizFixture(database.pool);
});

test('a school actor cannot exist without its Auth account', async () => {
  await assert.rejects(
    database.pool.query(
      "insert into school_draft.actors(id,key,kind) values($1,'orphan','learner')",
      [randomUUID()],
    ),
    (error) => error.code === '23503',
  );
});

test('revoking the provider session immediately rejects its existing HTTP cookie and replayed JWT', async (t) => {
  const signing = keys();
  const app = await createSchoolServer({
    pool: database.pool,
    authentication: { issuer, jwks: { keys: [signing.jwk] } },
    now: () => epoch,
  });
  t.after(() => app.close());
  const authorization = 'Bearer ' + signing.token({ session_id: subject });
  const landing = await fetch(app.origin, { headers: { authorization } });
  assert.equal(landing.status, 200);
  const cookie = landing.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(app.origin + '/api/state', { headers: { cookie } })).status, 200);
  await database.pool.query('delete from auth.sessions where id=$1', [subject]);
  assert.equal((await fetch(app.origin + '/api/state', { headers: { cookie } })).status, 401);
  assert.equal((await fetch(app.origin, { headers: { authorization } })).status, 401);
});

async function open(t, options = {}) {
  const signing = keys();
  const app = await createSchoolServer({
    pool: database.pool,
    authentication: { issuer, jwks: { keys: [signing.jwk] } },
    now: () => epoch,
    ...options,
  });
  t.after(() => app.close());
  const login = async (claims = {}) => {
    const response = await fetch(app.origin, {
      headers: { authorization: 'Bearer ' + signing.token(claims) },
    });
    assert.equal(response.status, 200);
    return response.headers.get('set-cookie').split(';')[0];
  };
  return { ...app, login, signing };
}
const post = (origin, cookie, path, body = {}) =>
  fetch(origin + '/api/' + path, {
    method: 'POST',
    headers: { cookie, origin, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

test('revocation is shared across servers, blocks reads and writes, and preserves another provider session', async (t) => {
  const a = await open(t),
    b = await open(t);
  const first = await a.login(),
    second = await b.login();
  const otherId = randomUUID();
  await database.pool.query('insert into auth.sessions(id,user_id) values($1,$2)', [
    otherId,
    subject,
  ]);
  const other = await a.login({ session_id: otherId });
  await database.pool.query('delete from auth.sessions where id=$1', [subject]);
  for (const [app, cookie] of [
    [a, first],
    [b, second],
  ]) {
    const response = await fetch(app.origin + '/api/state', { headers: { cookie } });
    assert.equal(response.status, 401);
    assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
    assert.deepEqual(await response.json(), { error: 'sessionExpired' });
    assert.equal((await post(app.origin, cookie, 'privacy-export')).status, 401);
    assert.equal((await post(app.origin, cookie, 'leave', { class: fixture.classId })).status, 401);
  }
  assert.equal((await fetch(a.origin + '/api/state', { headers: { cookie: other } })).status, 200);
  assert.equal(
    (
      await database.pool.query(
        'select 1 from school_draft.class_members where class_id=$1 and actor_id=$2',
        [fixture.classId, subject],
      )
    ).rowCount,
    1,
  );
});

for (const [label, sql] of [
  [
    'banned account',
    "update auth.users set banned_until=clock_timestamp()+interval '1 hour' where id=$1",
  ],
  ['soft-deleted account', 'update auth.users set deleted_at=clock_timestamp() where id=$1'],
  [
    'expired provider session',
    "update auth.sessions set not_after=clock_timestamp()-interval '1 second' where user_id=$1",
  ],
  ['deleted Auth account', 'delete from auth.users where id=$1'],
])
  test(`${label} invalidates an existing cookie and new JWT entry`, async (t) => {
    const app = await open(t),
      cookie = await app.login();
    await database.pool.query(sql, [subject]);
    assert.equal((await post(app.origin, cookie, 'privacy-export')).status, 401);
    assert.equal(
      (await fetch(app.origin, { headers: { authorization: 'Bearer ' + app.signing.token() } }))
        .status,
      401,
    );
    if (label === 'deleted Auth account') {
      for (const table of ['actors', 'class_members', 'sample_evidence']) {
        const column = table === 'actors' ? 'id' : 'actor_id';
        assert.equal(
          (
            await database.pool.query(`select 1 from school_draft.${table} where ${column}=$1`, [
              subject,
            ])
          ).rowCount,
          0,
        );
      }
    }
  });

test('a signed token cannot borrow a session belonging to a different account', async (t) => {
  const app = await open(t);
  const response = await fetch(app.origin, {
    headers: { authorization: 'Bearer ' + app.signing.token({ session_id: fixture.ids.learnerB }) },
  });
  assert.equal(response.status, 401);
});

test('provider lookup failure returns 503 without leaking data or admitting a cached identity', async (t) => {
  let blocked = false;
  const pool = {
    connect: () =>
      blocked ? Promise.reject(new Error('private provider diagnostic')) : database.pool.connect(),
    query: (...args) => database.pool.query(...args),
  };
  const app = await open(t, { pool }),
    cookie = await app.login();
  blocked = true;
  const response = await fetch(app.origin + '/api/state', { headers: { cookie } });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'error' });
  assert.equal(
    (await fetch(app.origin, { headers: { authorization: 'Bearer ' + app.signing.token() } }))
      .status,
    503,
  );
  blocked = false;
  assert.equal((await fetch(app.origin + '/api/state', { headers: { cookie } })).status, 200);
});

test(
  'a revocation while a POST body is in flight blocks the eventual mutation',
  { timeout: 10000 },
  async (t) => {
    let observe = false,
      admitted;
    const admission = new Promise((resolve) => {
      admitted = resolve;
    });
    const pool = {
      async connect() {
        const client = await database.pool.connect();
        return {
          async query(...args) {
            const result = await client.query(...args);
            if (observe && String(args[0]).includes('resolve_identity') && result.rowCount) {
              observe = false;
              admitted();
            }
            return result;
          },
          release: () => client.release(),
        };
      },
    };
    const app = await open(t, { pool }),
      cookie = await app.login();
    const body = JSON.stringify({ class: fixture.classId });
    const req = request(app.origin + '/api/leave', {
      method: 'POST',
      headers: {
        cookie,
        origin: app.origin,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      },
    });
    t.after(() => req.destroy());
    const result = new Promise((resolve, reject) => {
      req.on('response', (res) => {
        res.resume();
        res.on('end', () => resolve(res.statusCode));
      });
      req.on('error', reject);
    });
    observe = true;
    req.write(body.slice(0, 1));
    // The initial check has actually accepted the live identity, not merely raced
    // a revocation before the request reached the server.
    await admission;
    await database.pool.query('delete from auth.sessions where id=$1', [subject]);
    req.end(body.slice(1));
    assert.equal(await result, 401);
    assert.equal(
      (
        await database.pool.query(
          'select 1 from school_draft.class_members where class_id=$1 and actor_id=$2',
          [fixture.classId, subject],
        )
      ).rowCount,
      1,
    );
  },
);

test('a quiet quiz stream closes on provider revocation without another data snapshot', async (t) => {
  const quiz = createQuizService(database.pool),
    room = await quiz.call(fixture.ids.teacherA, 'create', {
      class: fixture.classId,
      title: 'Revocation',
      seconds: 15,
      blocks: [{ key: 'notes', count: 1 }],
    });
  await quiz.call(subject, 'join', { code: room.code, ranking: false });
  const app = await open(t),
    cookie = await app.login();
  const controller = new AbortController();
  t.after(() => controller.abort());
  const response = await fetch(
    app.origin +
      '/api/quiz-events?' +
      new URLSearchParams({ id: room.id, locale: 'de', mode: 'learner' }),
    { headers: { cookie }, signal: controller.signal },
  );
  assert.equal(response.status, 200);
  let buffer = '',
    snapshots = 0,
    revoked = false,
    unavailable = false;
  const done = (async () => {
    for await (const chunk of response.body) {
      buffer += new TextDecoder().decode(chunk);
      let end;
      while ((end = buffer.indexOf('\n\n')) >= 0) {
        const frame = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (frame.startsWith('event: snapshot')) {
          assert.equal(revoked, false, 'No snapshot after provider revocation');
          snapshots++;
          await database.pool.query('delete from auth.sessions where id=$1', [subject]);
          revoked = true;
        }
        if (frame.startsWith('event: unavailable')) unavailable = true;
      }
    }
  })();
  const timer = setTimeout(() => controller.abort(), 8000);
  t.after(() => clearTimeout(timer));
  await done;
  assert.equal(snapshots, 1);
  assert.equal(unavailable, true);
});

test('the verified server works with an actual restricted database login and explicit grading capability', async (t) => {
  const name = 'school_worker_' + randomBytes(8).toString('hex'),
    password = randomBytes(32).toString('hex');
  await database.pool.query(
    `create role ${name} login noinherit nosuperuser nocreatedb nocreaterole nobypassrls password '${password}'`,
  );
  await database.pool.query(`grant harmonia_school_backend to ${name} with inherit false,set true`);
  const pool = new pg.Pool({ ...database.pool.options, user: name, password, max: 2 });
  t.after(async () => {
    await pool.end();
    await database.pool.query(`drop role ${name}`);
  });
  const app = await open(t, { pool }),
    cookie = await app.login();
  assert.equal((await fetch(app.origin + '/api/state', { headers: { cookie } })).status, 200);
  assert.equal(
    (await post(app.origin, cookie, 'quiz-join', { code: 'DEADBEEF', ranking: false })).status,
    400,
  );
  const quiz = createQuizService(database.pool),
    room = await quiz.call(fixture.ids.teacherA, 'create', {
      class: fixture.classId,
      title: 'Trusted grader',
      seconds: 15,
      blocks: [{ key: 'notes', count: 1 }],
    });
  assert.equal(
    (await post(app.origin, cookie, 'quiz-join', { code: room.code, ranking: false })).status,
    200,
  );
  assert.equal((await post(app.origin, cookie, 'privacy-export')).status, 200);
  for (const sql of [
    'select * from auth.users',
    'select * from auth.sessions',
    'select * from school_draft.quiz_answers',
  ])
    await assert.rejects(pool.query(sql), (error) => error.code === '42501');
});
