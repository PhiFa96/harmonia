import { startFixture, fixtureAnswers } from './test-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { certificateDigests } from './binding.mjs';
import { createCertificateService, RETENTION_MS } from './service.mjs';
import { createCertificateServer } from './server.mjs';
import { SESSION_IDLE_MS, SESSION_MAX_MS } from './sessions.mjs';
import { sampleCertificatePdf } from './pdf.mjs';

function fixture(t, options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-cert-complete-'));
  const database = join(dir, 'test.sqlite');
  const service = createCertificateService(database, {
    now: () => Date.UTC(2026, 10, 2, 12),
    ...options,
  });
  t.after(() => {
    service.close();
    rmSync(dir, { recursive: true, force: true });
  });
  return { service, database };
}

test('E3: the certificate binding includes the entire playback import family', () => {
  const digests = certificateDigests();
  for (const path of ['tools/voice-leading/workbench-model.ts', 'tools/voice-leading/report.ts'])
    assert.ok(digests[path], path);
});

function paid(service, owner, profile = 'certificate-draft-1') {
  const order = service.order(owner, { profile, requestId: randomUUID() });
  return service.settle(owner, { id: order.id, outcome: 'paid' });
}
function finishAll(service, database, owner, run) {
  for (const [index, a] of fixtureAnswers(database, run.id).entries())
    run = service.answer(owner, { id: run.id, index, answer: a.right, locale: 'de' });
  return run;
}

test('a paid, owned, matching test order is required; no client entitlement is accepted', (t) => {
  const { service } = fixture(t);
  const payload = { profile: 'certificate-draft-1', locale: 'de' };
  assert.throws(() => service.start('owner', payload), /invalid/);
  const order = service.order('owner', { profile: payload.profile, requestId: randomUUID() });
  assert.throws(
    () => service.start('owner', { ...payload, purchase: order.id }),
    /purchaseRequired/,
  );
  assert.throws(() => service.start('other', { ...payload, purchase: order.id }), /notFound/);
  assert.throws(() => service.settle('other', { id: order.id, outcome: 'paid' }), /notFound/);
  assert.throws(
    () => service.settle('owner', { id: order.id, outcome: 'paid', amount: 0 }),
    /invalid/,
  );
  service.settle('owner', { id: order.id, outcome: 'paid' });
  assert.throws(
    () =>
      service.start('owner', { ...payload, profile: 'certificate-draft-2', purchase: order.id }),
    /conflict/,
  );
  const run = service.start('owner', { ...payload, purchase: order.id });
  assert.equal(run.phase, 'active');
  assert.deepEqual(service.start('owner', { ...payload, purchase: order.id }), run);
  assert.equal(service.state('owner', 'de').attempts.length, 1);
});

test('test checkout is idempotent, cancellation is final and deleting an attempt does not restore a consumed order', (t) => {
  const { service } = fixture(t),
    requestId = randomUUID(),
    profile = 'certificate-draft-1';
  const order = service.order('owner', { profile, requestId });
  assert.deepEqual(service.order('owner', { profile, requestId }), order);
  assert.throws(
    () => service.order('owner', { profile: 'certificate-draft-2', requestId }),
    /conflict/,
  );
  service.settle('owner', { id: order.id, outcome: 'cancelled' });
  assert.throws(() => service.settle('owner', { id: order.id, outcome: 'paid' }), /conflict/);
  const purchase = paid(service, 'owner');
  const run = service.start('owner', { profile, locale: 'de', purchase: purchase.id });
  assert.throws(() => service.remove('other', { id: run.id }), /notFound/);
  service.remove('owner', { id: run.id });
  assert.throws(
    () => service.start('owner', { profile, locale: 'de', purchase: purchase.id }),
    /purchaseConsumed/,
  );
  assert.equal(service.state('owner', 'de').attempts.length, 0);
});

test('a simulated refund withdraws the sample code and a retry uses a new test order', (t) => {
  const { service, database } = fixture(t);
  const finished = finishAll(
    service,
    database,
    'owner',
    startFixture(service, 'owner', { profile: 'certificate-draft-1', locale: 'de' }),
  );
  assert.equal(service.verify({ code: finished.result.code }).status, 'draft');
  const refund = service.refund('owner', { id: finished.purchaseId });
  assert.equal(refund.status, 'refunded');
  assert.deepEqual(service.refund('owner', { id: finished.purchaseId }), refund);
  assert.equal(service.verify({ code: finished.result.code }).status, 'revoked');
  assert.throws(() => service.receipt('owner', finished.id), /purchaseRefunded/);
  assert.equal(service.state('owner', 'de').attempts[0].phase, 'cancelled');
  const next = startFixture(service, 'owner', { profile: 'certificate-draft-1', locale: 'de' });
  assert.notEqual(next.purchaseId, finished.purchaseId);
  service.refund('owner', { id: next.purchaseId });
  assert.throws(
    () => service.answer('owner', { id: next.id, index: 0, answer: 'anything', locale: 'de' }),
    /outdated|purchaseRefunded/,
  );
  assert.equal(
    startFixture(service, 'owner', { profile: 'certificate-draft-2', locale: 'de' }).phase,
    'active',
  );
});

test('corrupt stored answers or receipts affect only their own row, and cannot issue a PDF or a current verification', (t) => {
  const { service, database } = fixture(t);
  const old = finishAll(
    service,
    database,
    'owner',
    startFixture(service, 'owner', { profile: 'certificate-draft-1', locale: 'de' }),
  );
  const current = startFixture(service, 'owner', { profile: 'certificate-draft-2', locale: 'de' });
  const db = new DatabaseSync(database);
  const tampered = { ...old.result, points: 999 };
  delete tampered.revoked;
  db.prepare('update certificate_drafts set result=? where id=?').run(
    JSON.stringify(tampered),
    old.id,
  );
  db.close();
  const state = service.state('owner', 'de');
  assert.equal(state.attempts.find((r) => r.id === old.id).phase, 'outdated');
  assert.equal(state.attempts.find((r) => r.id === current.id).phase, 'active');
  assert.throws(() => service.receipt('owner', old.id), /outdated/);
  assert.equal(service.verify({ code: old.result.code }).status, 'outdatedCode');
  const db2 = new DatabaseSync(database);
  db2.prepare('update certificate_drafts set answers=? where id=?').run('not json', old.id);
  db2.close();
  const exported = service.exportData('owner');
  assert.equal(exported.attempts.find((r) => r.id === old.id).answers, null);
  assert.equal(exported.attempts.find((r) => r.id === old.id).result, null);
});

test('export, per-attempt deletion and erasure are scoped; retention also removes abandoned orders', (t) => {
  let instant = Date.UTC(2026, 10, 2, 12);
  const { service, database } = fixture(t, { now: () => instant });
  const own = finishAll(
    service,
    database,
    'owner',
    startFixture(service, 'owner', { profile: 'certificate-draft-1', locale: 'de' }),
  );
  const other = startFixture(service, 'other', { profile: 'certificate-draft-2', locale: 'de' });
  service.order('owner', { profile: 'certificate-draft-2', requestId: randomUUID() });
  service.remove('owner', { id: own.id });
  assert.equal(service.verify({ code: own.result.code }).status, 'notFound');
  service.erase('owner');
  assert.deepEqual(service.exportData('owner').purchases, []);
  assert.equal(service.state('other', 'de').attempts[0].id, other.id);
  instant += RETENTION_MS + 1;
  assert.deepEqual(service.exportData('other').attempts, []);
  assert.deepEqual(service.exportData('other').purchases, []);
});

test('registered test sessions have idle and absolute expiry, and logout really revokes a token', (t) => {
  let instant = Date.UTC(2026, 10, 2, 12);
  const { service } = fixture(t, { now: () => instant });
  assert.equal(service.resolveSession('a'.repeat(64)), null);
  const token = service.issueSession(),
    owner = service.resolveSession(token);
  assert.ok(owner && owner !== token);
  instant += SESSION_IDLE_MS - 1;
  assert.equal(service.resolveSession(token), owner);
  instant += SESSION_IDLE_MS;
  assert.equal(service.resolveSession(token), null);
  const current = service.issueSession(),
    start = instant;
  for (let i = 1; i < SESSION_MAX_MS / SESSION_IDLE_MS; i++) {
    instant = start + i * (SESSION_IDLE_MS - 1);
    assert.ok(service.resolveSession(current));
  }
  instant = start + SESSION_MAX_MS;
  assert.equal(service.resolveSession(current), null);
  const active = service.issueSession(),
    id = service.resolveSession(active);
  service.logout(id);
  assert.equal(service.resolveSession(active), null);
});

test('a consumed order is kept with its attempt while an abandoned old order expires', (t) => {
  let instant = Date.UTC(2026, 10, 2, 12);
  const { service } = fixture(t, { now: () => instant });
  const purchase = paid(service, 'owner');
  const abandoned = service.order('owner', {
    profile: 'certificate-draft-2',
    requestId: randomUUID(),
  });
  instant += RETENTION_MS - 60000;
  const run = service.start('owner', {
    profile: 'certificate-draft-1',
    locale: 'de',
    purchase: purchase.id,
  });
  instant += 60001;
  const state = service.state('owner', 'de');
  assert.equal(state.attempts[0].id, run.id);
  assert.equal(state.attempts[0].phase, 'active');
  assert.ok(state.purchases.some((p) => p.id === purchase.id));
  assert.ok(!state.purchases.some((p) => p.id === abandoned.id));
  instant += RETENTION_MS;
  assert.deepEqual(service.exportData('owner').attempts, []);
  assert.deepEqual(service.exportData('owner').purchases, []);
});

test('real HTTP: payment replay, data rights, unknown cookies, logout and restart-safe session binding', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-cert-http-complete-')),
    database = join(dir, 'test.sqlite');
  let instant = Date.UTC(2026, 10, 2, 12),
    app = await createCertificateServer({ database, now: () => instant });
  t.after(async () => {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const cookie = (await fetch(app.origin)).headers.get('set-cookie').split(';')[0];
  const other = (await fetch(app.origin)).headers.get('set-cookie').split(';')[0];
  const post = (path, body, session = cookie) =>
    fetch(app.origin + path, {
      method: 'POST',
      headers: { cookie: session, Origin: app.origin, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await post('/api/export', {}, 'harmonia_certificate_draft=' + 'a'.repeat(64))).status,
    401,
  );
  const profile = 'certificate-draft-1',
    requestId = randomUUID();
  const [a, b] = await Promise.all([
    post('/api/order', { profile, requestId }),
    post('/api/order', { profile, requestId }),
  ]);
  const order = await a.json();
  assert.deepEqual(await b.json(), order);
  await post('/api/settle', { id: order.id, outcome: 'paid' });
  const payload = { profile, locale: 'de', purchase: order.id };
  const responses = await Promise.all([post('/api/start', payload), post('/api/start', payload)]);
  const run = await responses[0].json();
  assert.deepEqual(await responses[1].json(), run);
  assert.equal((await post('/api/remove', { id: run.id }, other)).status, 404);
  assert.deepEqual((await (await post('/api/export', {}, other)).json()).attempts, []);
  const exported = await (await post('/api/export', {})).json();
  assert.equal(exported.attempts[0].id, run.id);
  assert.ok(!JSON.stringify(exported).includes('seed'));
  assert.ok(!readFileSync(database).includes(cookie.split('=')[1]));
  await app.close();
  app = await createCertificateServer({ database, now: () => instant });
  assert.equal(
    (await fetch(app.origin + '/api/state?locale=de', { headers: { cookie } })).status,
    200,
  );
  await post('/api/logout', {});
  assert.equal((await post('/api/export', {})).status, 401);
  assert.equal((await post('/api/export', {}, other)).status, 200);
  const renewed = (await fetch(app.origin, { headers: { cookie } })).headers
    .get('set-cookie')
    .split(';')[0];
  assert.notEqual(renewed, cookie);
  assert.deepEqual((await (await post('/api/export', {}, renewed)).json()).attempts, []);
  await post('/api/erase', {}, other);
  assert.equal((await post('/api/export', {}, other)).status, 401);
  instant += SESSION_IDLE_MS;
  assert.equal((await post('/api/export', {}, renewed)).status, 401);
});

for (const action of ['refund', 'logout'])
  test(`a ${action} during asynchronous PDF generation prevents delivery`, async (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'harmonia-cert-pdf-race-')),
      database = join(dir, 'test.sqlite');
    let signalStarted, release;
    const started = new Promise((resolve) => {
        signalStarted = resolve;
      }),
      gate = new Promise((resolve) => {
        release = resolve;
      });
    const app = await createCertificateServer({
      database,
      renderPdf: async (receipt, locale) => {
        signalStarted();
        await gate;
        return sampleCertificatePdf(receipt, locale);
      },
    });
    t.after(async () => {
      release();
      await app.close();
      rmSync(dir, { recursive: true, force: true });
    });
    const cookie = (await fetch(app.origin)).headers.get('set-cookie').split(';')[0];
    const post = (path, body) =>
      fetch(app.origin + path, {
        method: 'POST',
        headers: { cookie, Origin: app.origin, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    const profile = 'certificate-draft-1';
    const order = await (await post('/api/order', { profile, requestId: randomUUID() })).json();
    await post('/api/settle', { id: order.id, outcome: 'paid' });
    const run = await (
      await post('/api/start', { profile, locale: 'de', purchase: order.id })
    ).json();
    for (const [index, a] of fixtureAnswers(database, run.id).entries())
      await post('/api/answer', { id: run.id, index, answer: a.right, locale: 'de' });
    const requested = post('/api/pdf', { id: run.id, locale: 'de' });
    await started;
    await post('/api/' + action, action === 'refund' ? { id: order.id } : {});
    release();
    const response = await requested;
    assert.equal(response.status, action === 'refund' ? 409 : 401);
    assert.match(response.headers.get('content-type'), /application\/json/);
    assert.equal(
      (await response.json()).error,
      action === 'refund' ? 'purchaseRefunded' : 'sessionExpired',
    );
  });

test('E4: a changed fingerprint is isolated and does not hide another finished attempt', (t) => {
  const { service, database } = fixture(t);
  const old = startFixture(service, 'owner', { profile: 'certificate-draft-1', locale: 'de' });
  service.finish('owner', { id: old.id, locale: 'de' });
  const current = startFixture(service, 'owner', { profile: 'certificate-draft-2', locale: 'de' });
  const db = new DatabaseSync(database);
  db.prepare('update certificate_drafts set fingerprint=? where id=?').run('changed', old.id);
  db.close();
  const rows = service.state('owner', 'de').attempts;
  assert.equal(rows.find((r) => r.id === old.id).phase, 'outdated');
  assert.equal(rows.find((r) => r.id === current.id).phase, 'active');
});

test('an outdated active attempt can be kept while a new attempt is started', (t) => {
  const { service, database } = fixture(t);
  const old = startFixture(service, 'owner', { profile: 'certificate-draft-1', locale: 'de' });
  const db = new DatabaseSync(database);
  db.prepare('update certificate_drafts set source_hash=? where id=?').run('old', old.id);
  db.close();
  const current = startFixture(service, 'owner', { profile: 'certificate-draft-2', locale: 'de' });
  assert.notEqual(current.id, old.id);
  assert.equal(service.state('owner', 'de').attempts.length, 2);
});

test('an export contains own records without private seeds or future answer keys', (t) => {
  const { service } = fixture(t);
  const own = startFixture(service, 'owner', { profile: 'certificate-draft-1', locale: 'de' });
  startFixture(service, 'other', { profile: 'certificate-draft-2', locale: 'de' });
  const data = service.exportData('owner');
  assert.deepEqual(
    data.attempts.map((r) => r.id),
    [own.id],
  );
  assert.ok(!JSON.stringify(data).includes('seed'));
  assert.ok(!JSON.stringify(data).includes('correctAnswer'));
});
