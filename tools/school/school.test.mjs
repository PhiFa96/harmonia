import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { createSchoolDatabase, seedSchoolFixtures, FIXTURE_ACTORS, asActor } from './database.mjs';
import { createSchoolService, hashCode } from './service.mjs';
import { createSchoolServer } from './server.mjs';

let database, service;
const ids = Object.fromEntries(FIXTURE_ACTORS.map((a) => [a.key, a.id]));
before(async () => {
  database = await createSchoolDatabase();
  service = createSchoolService(database.pool);
});
after(async () => {
  await database?.close();
});
beforeEach(async () => {
  await database.pool.query(
    'truncate school_draft.organizations,school_draft.actors restart identity cascade',
  );
  await seedSchoolFixtures(database.pool);
});
const act = (who, action, payload) => service.act(ids[who], action, payload);
const read = (who, sql, values = []) =>
  asActor(database.pool, ids[who], (db) => db.query(sql, values));
const denied = (promise) =>
  assert.rejects(promise, (error) => error.code === 'forbidden' || error.code === '42501');
async function fixtures() {
  const org = (await act('adminA', 'createOrg', { label: 'Synthetic A' })).id;
  const other = (await act('adminB', 'createOrg', { label: 'Synthetic B' })).id;
  const invite = await act('adminA', 'invite', { org, class: null, kind: 'teacher', uses: 2 });
  for (const who of ['teacherA', 'teacherB']) await act(who, 'join', { code: invite.code });
  const first = (await act('teacherA', 'createClass', { org, label: 'Class A' })).id;
  const second = (await act('teacherB', 'createClass', { org, label: 'Class B' })).id;
  const foreign = (await act('adminB', 'createClass', { org: other, label: 'Foreign class' })).id;
  return { org, other, first, second, foreign };
}
async function enroll(org, first, learner = 'learnerA', uses = 3) {
  const code = await act('teacherA', 'invite', { org, class: first, kind: 'learner', uses });
  await act(learner, 'join', { code: code.code });
  return code;
}

test('actual PostgreSQL RLS: teachers only their classes; administrators do not inherit learning access', async () => {
  const { org, first, second, foreign } = await fixtures();
  await enroll(org, first);
  await act('learnerA', 'sharing', { class: first, enabled: true });
  assert.deepEqual(
    (await read('teacherA', 'select id from school_draft.classes')).rows.map((x) => x.id),
    [first],
  );
  assert.equal((await read('teacherB', 'select * from school_draft.class_members')).rowCount, 0);
  assert.equal((await read('adminA', 'select * from school_draft.sample_evidence')).rowCount, 0);
  await denied(service.report(ids.teacherA, second));
  await denied(service.report(ids.teacherA, foreign));
  await denied(service.report(ids.adminA, first));
  assert.equal((await service.report(ids.teacherA, first)).learners[0].areas.length, 3);
  await denied(
    act('teacherA', 'createClass', {
      org: (await service.state(ids.adminB)).organizations[0].id,
      label: 'Forged',
    }),
  );
  await denied(
    act('teacherA', 'setTeacher', { class: second, actor: ids.teacherA, enabled: true }),
  );
});

test('sharing off by default, class scoped, immediately withdrawn; classmates cannot read each other', async () => {
  const { org, first, second } = await fixtures();
  await enroll(org, first);
  assert.deepEqual((await service.report(ids.teacherA, first)).learners[0].areas, []);
  const code = await act('teacherB', 'invite', { org, class: second, kind: 'learner', uses: 1 });
  await act('learnerA', 'join', { code: code.code });
  await act('learnerA', 'sharing', { class: first, enabled: true });
  assert.deepEqual((await service.report(ids.teacherB, second)).learners[0].areas, []);
  await enroll(org, first, 'learnerB');
  assert.equal((await read('learnerB', 'select * from school_draft.class_members')).rowCount, 1);
  assert.equal(
    (
      await read('learnerB', 'select * from school_draft.sample_evidence where actor_id=$1', [
        ids.learnerA,
      ])
    ).rowCount,
    0,
  );
  await act('learnerA', 'sharing', { class: first, enabled: false });
  assert.equal((await read('teacherA', 'select * from school_draft.sample_evidence')).rowCount, 0);
  assert.equal((await read('learnerA', 'select * from school_draft.sharing_events')).rowCount, 2);
  assert.deepEqual((await service.report(ids.teacherA, first)).learners[0].areas, []);
});

test('concurrent final-seat joins never oversubscribe; duplicate successful joins are idempotent', async () => {
  const { org, first } = await fixtures();
  const { code } = await act('teacherA', 'invite', { org, class: first, kind: 'learner', uses: 1 });
  const outcomes = await Promise.allSettled(
    ['learnerA', 'learnerB', 'learnerC'].map((who) => act(who, 'join', { code })),
  );
  assert.equal(outcomes.filter((x) => x.status === 'fulfilled').length, 1);
  const winner = ['learnerA', 'learnerB', 'learnerC'][
    outcomes.findIndex((x) => x.status === 'fulfilled')
  ];
  await Promise.all(Array.from({ length: 8 }, () => act(winner, 'join', { code })));
  assert.equal((await service.report(ids.teacherA, first)).learners.length, 1);
  assert.equal(
    (
      await database.pool.query('select remaining from school_draft.invites where code_hash=$1', [
        hashCode(code),
      ])
    ).rows[0].remaining,
    0,
  );
});

test('codes are hashed, rotate, expire, revoke and reject role or organization injection', async () => {
  const { org, other, first } = await fixtures();
  const firstCode = await act('teacherA', 'invite', {
    org,
    class: first,
    kind: 'learner',
    uses: 2,
  });
  const secondCode = await act('teacherA', 'invite', {
    org,
    class: first,
    kind: 'learner',
    uses: 2,
  });
  await assert.rejects(act('learnerA', 'join', { code: firstCode.code }), /invalidCode/);
  await assert.rejects(act('teacherB', 'join', { code: secondCode.code }), /invalidCode/);
  await denied(act('teacherA', 'invite', { org: other, class: first, kind: 'learner', uses: 2 }));
  await denied(act('learnerA', 'invite', { org, class: first, kind: 'learner', uses: 2 }));
  assert.equal((await read('teacherA', 'select * from school_draft.invites')).rowCount, 0);
  assert.ok(
    !JSON.stringify(
      (await database.pool.query('select * from school_draft.invites')).rows,
    ).includes(secondCode.code),
  );
  await database.pool.query("update school_draft.invites set expires_at=now()-interval '1 second'");
  await assert.rejects(act('learnerA', 'join', { code: secondCode.code }), /invalidCode/);
  const third = await act('teacherA', 'invite', { org, class: first, kind: 'learner', uses: 2 });
  await act('teacherA', 'revokeInvites', { org, class: first });
  await assert.rejects(act('learnerA', 'join', { code: third.code }), /invalidCode/);
});

test('teacher reassignment, organization removal, archive and class deletion revoke all relevant access', async () => {
  const { org, first } = await fixtures();
  await enroll(org, first);
  await act('learnerA', 'sharing', { class: first, enabled: true });
  await act('adminA', 'setTeacher', { class: first, actor: ids.teacherB, enabled: true });
  assert.equal((await service.report(ids.teacherB, first)).learners[0].areas.length, 3);
  await act('adminA', 'setTeacher', { class: first, actor: ids.teacherB, enabled: false });
  await denied(service.report(ids.teacherB, first));
  const code = await act('teacherA', 'invite', { org, class: first, kind: 'learner', uses: 3 });
  await act('adminA', 'removeTeacher', { org, actor: ids.teacherA });
  await denied(service.report(ids.teacherA, first));
  await assert.rejects(act('learnerB', 'join', { code: code.code }), /invalidCode/);
  await denied(act('adminA', 'removeTeacher', { org, actor: ids.adminA }));
  await act('adminA', 'archive', { class: first });
  assert.equal((await service.state(ids.learnerA)).memberships[0].sharing, false);
  await denied(act('learnerA', 'sharing', { class: first, enabled: true }));
  await act('adminA', 'deleteClass', { class: first });
  assert.equal((await read('learnerA', 'select * from school_draft.class_members')).rowCount, 0);
  assert.equal((await read('learnerA', 'select * from school_draft.sharing_events')).rowCount, 0);
});

test('leaving and removal delete sharing; rejoining starts private; old code cannot undo teacher removal', async () => {
  const { org, first } = await fixtures();
  const code = await enroll(org, first);
  await act('learnerA', 'sharing', { class: first, enabled: true });
  await act('learnerA', 'leave', { class: first });
  assert.equal((await service.report(ids.teacherA, first)).learners.length, 0);
  await act('learnerA', 'join', { code: code.code });
  assert.deepEqual((await service.report(ids.teacherA, first)).learners[0].areas, []);
  await act('teacherA', 'removeLearner', { class: first, actor: ids.learnerA });
  await assert.rejects(act('learnerA', 'join', { code: code.code }), /invalidCode/);
});

test('payload tampering, SQL writes, wrong roles and stale evidence cannot manufacture progress or privileges', async () => {
  const { org, first } = await fixtures();
  await enroll(org, first);
  await act('learnerA', 'sharing', { class: first, enabled: true });
  await assert.rejects(
    act('learnerA', 'sharing', { class: first, enabled: true, actor: ids.learnerB }),
    /invalid/,
  );
  await assert.rejects(
    act('teacherA', 'createClass', { org, label: 'Name', role: 'admin' }),
    /invalid/,
  );
  await denied(act('learnerA', 'createOrg', { label: 'Forged' }));
  await assert.rejects(act('learnerA', '__proto__', {}), /invalid/);
  await denied(read('learnerA', 'update school_draft.sample_evidence set correct=total'));
  await denied(read('teacherA', "update school_draft.org_members set role='admin'"));
  await database.pool.query(
    "update school_draft.sample_evidence set at=now()-interval '31 days' where actor_id=$1",
    [ids.learnerA],
  );
  assert.deepEqual((await service.report(ids.teacherA, first)).learners[0].areas, []);
});

test('parallel pooled requests never inherit another actor claim', async () => {
  const { org, first } = await fixtures();
  await enroll(org, first);
  await act('learnerA', 'sharing', { class: first, enabled: true });
  await Promise.all(
    Array.from({ length: 30 }, async (_, i) => {
      const who = i % 2 ? 'teacherB' : 'teacherA';
      const result = await read(who, 'select * from school_draft.sample_evidence');
      assert.equal(result.rowCount, who === 'teacherA' ? 3 : 0);
    }),
  );
  assert.equal(
    (
      await database.pool.query(
        "select nullif(current_setting('school_draft.actor',true),'') as actor",
      )
    ).rows[0].actor,
    null,
  );
});

test('real HTTP: synthetic session isolation, CSRF/Host rejection, escaped labels and no-store', async (t) => {
  const app = await createSchoolServer({ pool: database.pool });
  t.after(() => app.close());
  const landing = await fetch(app.origin);
  const cookie = landing.headers.get('set-cookie').split(';')[0];
  assert.match(landing.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  assert.equal(landing.headers.get('cache-control'), 'no-store');
  const post = (path, body, origin = app.origin) =>
    fetch(app.origin + path, {
      method: 'POST',
      headers: { cookie, origin, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await post('/api/createOrg', { label: 'Denied' }, 'https://example.invalid')).status,
    403,
  );
  assert.equal((await post('/api/session', { actor: 'not-a-fixture' })).status, 400);
  const label = '<img src=x onerror=alert(1)>';
  assert.equal((await post('/api/createOrg', { label })).status, 200);
  const state = await (await fetch(app.origin + '/api/state', { headers: { cookie } })).json();
  assert.equal(state.organizations[0].label, label);
  await post('/api/session', { actor: 'learnerA' });
  assert.deepEqual(
    (await (await fetch(app.origin + '/api/state', { headers: { cookie } })).json()).organizations,
    [],
  );
  assert.equal((await post('/api/createOrg', { label: 'No rights' })).status, 403);
  const forged = await new Promise((resolve, reject) => {
    const req = request(app.origin, { headers: { Host: 'attacker.invalid' } }, (res) => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
    req.end();
  });
  assert.equal(forged, 403);
});
