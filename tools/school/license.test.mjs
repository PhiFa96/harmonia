import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createSchoolDatabase, asActor } from './database.mjs';
import { quizFixture } from './quiz-fixture.mjs';
import { createLicenseService } from './license-service.mjs';
import { evaluateExercise } from '../../packages/exercises/src/index.ts';
let db, f, l;
before(async () => {
  db = await createSchoolDatabase();
  l = createLicenseService(db.pool);
});
after(async () => {
  await db?.close();
});
beforeEach(async () => {
  f = await quizFixture(db.pool);
});
const call = (who, action, p = {}) => l.call(f.ids[who], action, p);
const denied = (p) =>
  assert.rejects(p, (e) => ['forbidden', '42501', 'licenseRequired'].includes(e.code));
async function invoice(seats = 2, startsAt = null) {
  const p = { id: randomUUID(), org: f.org, seats, unitCents: 250, days: 30, startsAt };
  await call('operator', 'create', p);
  return p;
}
async function activate(who = 'learnerA') {
  const p = await invoice();
  await call('operator', 'pay', { id: p.id });
  await call('adminA', 'assign', { id: p.id, actor: f.ids[who], enabled: true });
  return p;
}
for (const locale of ['de', 'en-US', 'en-GB'])
  test(`${locale}: invoice, simulated settlement, seat, premium practice and immediate revocation`, async () => {
    const p = await invoice();
    assert.equal((await call('adminA', 'overview')).invoices[0].totalCents, 500);
    await assert.rejects(
      call('adminA', 'assign', { id: p.id, actor: f.ids.learnerA, enabled: true }),
      /licenseState/,
    );
    await call('operator', 'pay', { id: p.id });
    await call('adminA', 'assign', { id: p.id, actor: f.ids.learnerA, enabled: true });
    assert.equal((await call('learnerA', 'status')).status.tier, 'premium');
    assert.equal((await call('learnerA', 'status')).status.remaining, null);
    const id = randomUUID(),
      v = await call('learnerA', 'practice', { id, source: 'hearing', locale });
    assert.ok(v.question.audio);
    assert.equal(v.result, null);
    const item = (
      await db.pool.query('select item from school_draft.license_practice where id=$1', [id])
    ).rows[0].item;
    const answer = item.choices.find((a) => evaluateExercise(item, a).correct);
    await Promise.all(
      Array.from({ length: 10 }, () => call('learnerA', 'practice-answer', { id, answer, locale })),
    );
    assert.equal((await call('learnerA', 'practice-view', { id, locale })).result.correct, true);
    await call('adminA', 'assign', { id: p.id, actor: f.ids.learnerA, enabled: false });
    assert.equal((await call('learnerA', 'status')).status.tier, 'free');
    await denied(call('learnerA', 'practice-view', { id, locale }));
  });
test('only operator can issue/settle/void; school admins manage only their seats, never learning permissions', async () => {
  const p = await invoice();
  for (const who of ['adminA', 'teacherA', 'learnerA', 'adminB']) {
    await denied(call(who, 'create', { ...p, id: randomUUID() }));
    await denied(call(who, 'pay', { id: p.id }));
    await denied(call(who, 'void', { id: p.id }));
  }
  assert.deepEqual((await call('adminB', 'overview')).invoices, []);
  assert.deepEqual((await call('teacherA', 'overview')).invoices, []);
  await call('operator', 'pay', { id: p.id });
  for (const who of ['operator', 'teacherA', 'learnerA', 'adminB'])
    await denied(call(who, 'assign', { id: p.id, actor: f.ids.learnerA, enabled: true }));
  await denied(call('adminA', 'assign', { id: p.id, actor: f.ids.learnerC, enabled: true }));
  await call('adminA', 'assign', { id: p.id, actor: f.ids.learnerA, enabled: true });
  assert.equal((await f.school.report(f.ids.teacherA, f.classId)).learners[0].sharing, false);
  assert.deepEqual((await f.school.state(f.ids.operator)).classes, []);
  await denied(f.school.report(f.ids.operator, f.classId));
  assert.equal((await call('operator', 'overview')).candidates.length, 0);
  assert.equal((await call('operator', 'overview')).seats.length, 0);
});
test('parallel last-seat requests never oversubscribe; duplicate invoice and payment retries emit one event', async () => {
  const p = await invoice(1);
  await Promise.all(Array.from({ length: 8 }, () => call('operator', 'create', p)));
  await assert.rejects(call('operator', 'create', { ...p, seats: 2 }), /licenseConflict/);
  await Promise.all(Array.from({ length: 8 }, () => call('operator', 'pay', { id: p.id })));
  const results = await Promise.allSettled(
    ['learnerA', 'learnerB'].map((who) =>
      call('adminA', 'assign', { id: p.id, actor: f.ids[who], enabled: true }),
    ),
  );
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(results.find((r) => r.status === 'rejected').reason.code, 'licenseFull');
  const seat = (await db.pool.query('select actor_id from school_draft.license_seats')).rows[0]
    .actor_id;
  await Promise.all(
    Array.from({ length: 8 }, () =>
      call('adminA', 'assign', { id: p.id, actor: seat, enabled: true }),
    ),
  );
  assert.deepEqual(
    (
      await db.pool.query(
        'select kind,count(*)::int n from school_draft.license_events group by kind order by kind',
      )
    ).rows,
    [
      { kind: 'assigned', n: 1 },
      { kind: 'created', n: 1 },
      { kind: 'paid', n: 1 },
    ],
  );
});
test('scheduled periods, expiry, void and overlapping independent grants resolve from database time', async () => {
  const p = await invoice(2, new Date(Date.now() + 86400000).toISOString());
  await call('operator', 'pay', { id: p.id });
  await call('adminA', 'assign', { id: p.id, actor: f.ids.learnerA, enabled: true });
  assert.equal((await call('learnerA', 'status')).status.tier, 'free');
  const active = await activate();
  assert.equal((await call('learnerA', 'status')).status.tier, 'premium');
  await db.pool.query(
    "update school_draft.license_invoices set starts_at=clock_timestamp()-interval '2 days',ends_at=clock_timestamp()-interval '1 day' where id=$1",
    [active.id],
  );
  assert.equal((await call('learnerA', 'status')).status.tier, 'free');
  const other = await activate();
  await call('operator', 'void', { id: p.id });
  assert.equal((await call('learnerA', 'status')).status.tier, 'premium');
  await call('operator', 'void', { id: other.id });
  await call('operator', 'void', { id: other.id });
  assert.equal((await call('learnerA', 'status')).status.tier, 'free');
  await assert.rejects(call('operator', 'pay', { id: other.id }), /licenseState/);
});
test('last membership removal clears a seat and rejoining cannot revive it; another active class preserves it', async () => {
  const p = await activate();
  const second = (await f.act('teacherA', 'createClass', { org: f.org, label: 'Second' })).id;
  const code = await f.act('teacherA', 'invite', {
    org: f.org,
    class: second,
    kind: 'learner',
    uses: 2,
  });
  await f.act('learnerA', 'join', { code: code.code });
  await f.act('learnerA', 'leave', { class: f.classId });
  assert.equal((await call('learnerA', 'status')).status.tier, 'premium');
  await f.act('learnerA', 'leave', { class: second });
  assert.equal((await call('learnerA', 'status')).status.tier, 'free');
  await f.act('learnerA', 'join', { code: code.code });
  assert.equal((await call('learnerA', 'status')).status.tier, 'free');
  assert.equal((await call('adminA', 'overview')).invoices[0].used, 0);
  await call('adminA', 'assign', { id: p.id, actor: f.ids.learnerA, enabled: true });
  await f.act('teacherA', 'archive', { class: second });
  assert.equal((await call('learnerA', 'status')).status.tier, 'free');
});
test('teacher departure removes a staff seat; invoice and raw practice writes cannot be injected', async () => {
  const p = await activate('teacherA');
  await f.act('adminA', 'removeTeacher', { org: f.org, actor: f.ids.teacherA });
  assert.equal((await call('teacherA', 'status')).status.tier, 'free');
  for (const sql of [
    "update school_draft.license_invoices set state='paid'",
    'insert into school_draft.license_seats select null,null,null',
    'select item from school_draft.license_practice',
  ])
    await denied(asActor(db.pool, f.ids.adminA, (c) => c.query(sql)));
  await assert.rejects(call('operator', 'create', { ...p, totalCents: 1 }), /invalid/);
  await assert.rejects(
    call('adminA', 'assign', { id: p.id, actor: f.ids.learnerA, enabled: true, tier: 'premium' }),
    /invalid/,
  );
  await denied(call('learnerA', 'practice', { id: randomUUID(), source: 'notes', locale: 'de' }));
});
test('seat assignment racing the last membership removal never leaves a reusable grant', async () => {
  const p = await invoice();
  await call('operator', 'pay', { id: p.id });
  await Promise.allSettled([
    call('adminA', 'assign', { id: p.id, actor: f.ids.learnerA, enabled: true }),
    f.act('learnerA', 'leave', { class: f.classId }),
  ]);
  assert.equal(
    (await db.pool.query('select count(*)::int n from school_draft.license_seats')).rows[0].n,
    0,
  );
  assert.equal((await call('learnerA', 'status')).status.tier, 'free');
  const invite = await f.act('teacherA', 'invite', {
    org: f.org,
    class: f.classId,
    kind: 'learner',
    uses: 1,
  });
  await f.act('learnerA', 'join', { code: invite.code });
  assert.equal((await call('learnerA', 'status')).status.tier, 'free');
});
