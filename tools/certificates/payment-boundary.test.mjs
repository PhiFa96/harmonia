import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createCertificateService } from './service.mjs';
import { createCertificateServer, certificatePreviewOptions } from './server.mjs';
import {
  createCertificatePaymentSimulation,
  paymentSimulationEnabled,
} from './payment-simulation.mjs';
import { spawnSync } from 'node:child_process';
import { PURCHASE_POLICY } from './purchases.mjs';
import { startFixture, fixtureAnswers } from './test-fixture.mjs';

const instant = Date.UTC(2026, 10, 14, 12);
function directory(t) {
  const root = mkdtempSync(join(tmpdir(), 'harmonia-cert-payment-boundary-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return join(root, 'draft.sqlite');
}
function insertOrder(database, owner, status = 'pending', policy = PURCHASE_POLICY) {
  const id = randomUUID(),
    db = new DatabaseSync(database);
  try {
    db.prepare(
      'insert into certificate_purchases(id,owner,request_id,profile,policy,status,created,updated) values(?,?,?,?,?,?,?,?)',
    ).run(id, owner, randomUUID(), 'certificate-draft-1', policy, status, instant, instant);
  } finally {
    db.close();
  }
  return id;
}
function purchase(database, id) {
  const db = new DatabaseSync(database, { readOnly: true });
  try {
    return db.prepare('select * from certificate_purchases where id=?').get(id);
  } finally {
    db.close();
  }
}
async function server(t, options = {}) {
  const database = directory(t),
    app = await createCertificateServer({ database, now: () => instant, ...options });
  t.after(() => app.close());
  const cookie = (await fetch(app.origin)).headers.get('set-cookie').split(';')[0];
  const owner = createHash('sha256').update(cookie.split('=')[1]).digest('hex');
  const post = (path, body, session = cookie, extraHeaders = {}) =>
    fetch(app.origin + '/api/' + path, {
      method: 'POST',
      headers: {
        cookie: session,
        Origin: app.origin,
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    });
  return { database, app, cookie, owner, post };
}

test('default service cannot turn an owner claim into a paid test order', (t) => {
  const database = directory(t),
    service = createCertificateService(database, { now: () => instant });
  t.after(() => service.close());
  const id = insertOrder(database, 'owner');
  if (typeof service.settle === 'function') service.settle('owner', { id, outcome: 'paid' });
  assert.equal(purchase(database, id).status, 'pending');
  assert.equal(service.settle, undefined);
  assert.equal(service.refund, undefined);
  assert.throws(
    () => service.start('owner', { profile: 'certificate-draft-1', locale: 'de', purchase: id }),
    /paymentsUnavailable/,
  );
});

test('default HTTP server does not create purchase authority without an explicit simulator', async (t) => {
  const f = await server(t);
  const response = await f.post('order', {
    profile: 'certificate-draft-1',
    requestId: randomUUID(),
  });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'paymentsUnavailable');
});

for (const operation of ['settle', 'refund'])
  test(`the legacy client ${operation} endpoint cannot change a purchase`, async (t) => {
    const f = await server(t),
      status = operation === 'settle' ? 'pending' : 'paid';
    const id = insertOrder(f.database, f.owner, status);
    const response = await f.post(
      operation,
      operation === 'settle' ? { id, outcome: 'paid' } : { id },
    );
    assert.equal(response.status, 404);
    assert.equal(purchase(f.database, id).status, status);
  });

test('a persisted simulated payment cannot become authority after reopening the default service', (t) => {
  const database = directory(t),
    sourceHash = 'c'.repeat(64);
  let service = createCertificateService(database, {
    now: () => instant,
    sourceHash,
    paymentSimulation: createCertificatePaymentSimulation(),
  });
  t.after(() => service.close());
  let run = startFixture(service, 'owner', { profile: 'certificate-draft-1', locale: 'de' });
  for (const [index, answer] of fixtureAnswers(database, run.id).entries())
    run = service.answer('owner', { id: run.id, index, answer: answer.right, locale: 'de' });
  const code = run.result.code;
  service.close();
  service = createCertificateService(database, { now: () => instant, sourceHash });
  assert.equal(service.verify({ code }).status, 'outdatedCode');
  assert.throws(() => service.receipt('owner', run.id), /outdated/);
});

test('unimplemented provider configuration is rejected instead of silently using a simulator', (t) => {
  const database = directory(t);
  let service;
  try {
    assert.throws(() => {
      service = createCertificateService(database, { payments: 'real', now: () => instant });
    }, /configuration/);
  } finally {
    service?.close();
  }
});

test('client JSON and headers cannot enable the default simulator or create an attempt', async (t) => {
  const f = await server(t),
    id = insertOrder(f.database, f.owner);
  for (const operation of ['settle', 'refund'])
    assert.equal((await f.post('simulation/' + operation, { id, outcome: 'paid' })).status, 404);
  for (const override of [
    { paymentSimulation: true },
    { simulated: true },
    { paymentMode: 'local-simulation' },
    { dataKind: 'real' },
  ])
    assert.equal(
      (
        await f.post(
          'order',
          {
            profile: 'certificate-draft-1',
            requestId: randomUUID(),
            ...override,
          },
          f.cookie,
          { 'X-Payment-Simulation': 'true' },
        )
      ).status,
      400,
    );
  assert.equal(
    (
      await f.post('simulation/settle', { id, outcome: 'paid' }, f.cookie, {
        'X-Payment-Simulation': 'true',
      })
    ).status,
    404,
  );
  assert.equal(
    (await f.post('start', { profile: 'certificate-draft-1', locale: 'de', purchase: id })).status,
    503,
  );
  const state = await (
    await fetch(f.app.origin + '/api/state?locale=de', { headers: { cookie: f.cookie } })
  ).json();
  assert.equal(state.paymentMode, 'unavailable');
  assert.equal(state.paymentPolicy, PURCHASE_POLICY);
  assert.deepEqual(state.attempts, []);
  assert.equal(purchase(f.database, id).status, 'pending');
});

test('only an in-process capability enables simulation; forged and serialized options fail before opening storage', async (t) => {
  const database = directory(t);
  for (const paymentSimulation of [
    true,
    'local-simulation',
    {},
    JSON.parse(JSON.stringify(createCertificatePaymentSimulation())),
  ]) {
    assert.throws(() => createCertificateService(database, { paymentSimulation }), /configuration/);
    await assert.rejects(createCertificateServer({ database, paymentSimulation }), /configuration/);
    assert.equal(existsSync(database), false);
  }
  for (const options of [
    { payments: 'real' },
    { provider: 'stripe' },
    { paymentMode: 'local-simulation' },
  ]) {
    await assert.rejects(createCertificateServer({ database, ...options }), /configuration/);
    assert.equal(existsSync(database), false);
  }
});

test('explicit HTTP simulation preserves ownership, rejects real-payment claims and settles concurrent retries once', async (t) => {
  const f = await server(t, { paymentSimulation: createCertificatePaymentSimulation() }),
    profile = 'certificate-draft-1';
  const order = await (await f.post('order', { profile, requestId: randomUUID() })).json();
  assert.equal(order.simulated, true);
  assert.equal(order.policy, PURCHASE_POLICY);
  const other = (await fetch(f.app.origin)).headers.get('set-cookie').split(';')[0];
  assert.equal(
    (await f.post('simulation/settle', { id: order.id, outcome: 'paid' }, other)).status,
    404,
  );
  assert.equal(
    (
      await f.post('simulation/settle', {
        id: order.id,
        outcome: 'paid',
        providerReceipt: 'claimed-real-payment',
      })
    ).status,
    400,
  );
  for (const operation of ['settle', 'refund'])
    assert.equal((await f.post(operation, { id: order.id, outcome: 'paid' })).status, 404);
  assert.equal(purchase(f.database, order.id).status, 'pending');
  const responses = await Promise.all(
    Array.from({ length: 4 }, () => f.post('simulation/settle', { id: order.id, outcome: 'paid' })),
  );
  assert.deepEqual(
    responses.map((r) => r.status),
    [200, 200, 200, 200],
  );
  const payloads = await Promise.all(responses.map((r) => r.json()));
  assert.ok(payloads.every((r) => r.id === order.id && r.status === 'paid' && r.simulated));
  const runs = await Promise.all(
    Array.from({ length: 2 }, async () =>
      (await f.post('start', { profile, locale: 'de', purchase: order.id })).json(),
    ),
  );
  assert.equal(runs[0].id, runs[1].id);
  assert.equal(runs[0].phase, 'active');
  assert.equal((await f.post('simulation/refund', { id: order.id })).status, 200);
  assert.equal(purchase(f.database, order.id).status, 'refunded');
});

test('legacy simulation policies cannot be upgraded or consumed, but remain erasable test data', (t) => {
  const database = directory(t),
    service = createCertificateService(database, {
      now: () => instant,
      paymentSimulation: createCertificatePaymentSimulation(),
    });
  t.after(() => service.close());
  const pending = insertOrder(database, 'owner', 'pending', 'certificate-test-purchase-v1'),
    paid = insertOrder(database, 'owner', 'paid', 'certificate-test-purchase-v1');
  assert.throws(
    () => service.simulateSettlement('owner', { id: pending, outcome: 'paid' }),
    /outdated/,
  );
  assert.throws(() => service.simulateRefund('owner', { id: paid }), /outdated/);
  assert.throws(
    () => service.start('owner', { profile: 'certificate-draft-1', locale: 'de', purchase: paid }),
    /purchaseRequired/,
  );
  assert.equal(purchase(database, pending).status, 'pending');
  assert.equal(service.exportData('owner').purchases.length, 2);
  service.erase('owner');
  assert.deepEqual(service.exportData('owner').purchases, []);
});

test('switching off simulation hides questions and receipts without invalidating matching test history', (t) => {
  const database = directory(t),
    sourceHash = 'd'.repeat(64),
    options = { now: () => instant, sourceHash };
  let service = createCertificateService(database, {
    ...options,
    paymentSimulation: createCertificatePaymentSimulation(),
  });
  t.after(() => service.close());
  const run = startFixture(service, 'owner', { profile: 'certificate-draft-1', locale: 'de' });
  const answer = fixtureAnswers(database, run.id)[0].right;
  service.answer('owner', { id: run.id, index: 0, answer, locale: 'de' });
  service.close();
  service = createCertificateService(database, options);
  const unavailable = service.state('owner', 'de').attempts[0];
  assert.equal(unavailable.phase, 'unavailable');
  assert.equal(unavailable.question, undefined);
  assert.equal(unavailable.result, undefined);
  assert.throws(
    () => service.answer('owner', { id: run.id, index: 1, answer, locale: 'de' }),
    /outdated/,
  );
  assert.throws(() => service.finish('owner', { id: run.id, locale: 'de' }), /outdated/);
  const exported = service.exportData('owner');
  assert.equal(exported.paymentMode, 'unavailable');
  assert.equal(exported.attempts[0].answers.length, 1);
  assert.equal(exported.attempts[0].result, null);
  service.close();
  service = createCertificateService(database, {
    ...options,
    paymentSimulation: createCertificatePaymentSimulation(),
  });
  const resumed = service.state('owner', 'de').attempts[0];
  assert.equal(resumed.phase, 'active');
  assert.equal(resumed.question.index, 1);
  service.close();
  service = createCertificateService(database, options);
  service.remove('owner', { id: run.id });
  service.erase('owner');
  assert.deepEqual(service.exportData('owner').attempts, []);
  assert.deepEqual(service.exportData('owner').purchases, []);
});

test('preview CLI enables simulation only for its single explicit local flag', () => {
  assert.equal(certificatePreviewOptions([]).paymentSimulation, null);
  assert.equal(
    paymentSimulationEnabled(certificatePreviewOptions(['--simulate-payments']).paymentSimulation),
    true,
  );
  for (const args of [
    null,
    ['--simulate-payments', '--simulate-payments'],
    ['--production'],
    ['--live'],
    ['--provider=stripe'],
    ['--simulate-payments', '--live'],
    ['--simulate-payments=true'],
  ])
    assert.throws(() => certificatePreviewOptions(args), /Only local preview/);
});

test('production and unknown application contexts reject simulation with no fallback', () => {
  for (const context of [
    { APP_VARIANT: 'production', NODE_ENV: 'test' },
    { APP_VARIANT: 'preview', NODE_ENV: 'production' },
    { APP_VARIANT: 'staging', NODE_ENV: 'test' },
  ]) {
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `
      import assert from 'node:assert/strict';
      import { createCertificatePaymentSimulation } from './tools/certificates/payment-simulation.mjs';
      import { certificatePreviewOptions } from './tools/certificates/server.mjs';
      assert.throws(() => createCertificatePaymentSimulation(), /not local/);
      assert.throws(() => certificatePreviewOptions(['--simulate-payments']), /not local/);
      assert.equal(certificatePreviewOptions([]).paymentSimulation, null);
    `,
      ],
      {
        cwd: new URL('../..', import.meta.url),
        env: { ...process.env, ...context },
        encoding: 'utf8',
      },
    );
    assert.equal(result.status, 0, result.stderr);
  }
});

test('a context change after startup immediately disables the already-created simulator', () => {
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    import { randomUUID } from 'node:crypto';
    import { createCertificatePaymentSimulation } from './tools/certificates/payment-simulation.mjs';
    import { createCertificateService } from './tools/certificates/service.mjs';
    const service = createCertificateService(':memory:', { paymentSimulation: createCertificatePaymentSimulation() });
    try {
      const order = service.order('owner', { profile: 'certificate-draft-1', requestId: randomUUID() });
      process.env.NODE_ENV = 'production';
      assert.equal(service.paymentMode(), 'unavailable');
      assert.throws(() => service.simulateSettlement('owner', { id: order.id, outcome: 'paid' }), /paymentsUnavailable/);
      assert.throws(() => service.start('owner', { profile: order.profile, locale: 'de', purchase: order.id }), /paymentsUnavailable/);
      assert.equal(service.state('owner', 'de').purchases[0].status, 'pending');
    } finally { service.close(); }
  `,
    ],
    {
      cwd: new URL('../..', import.meta.url),
      env: { ...process.env, APP_VARIANT: 'preview', NODE_ENV: 'test' },
      encoding: 'utf8',
    },
  );
  assert.equal(result.status, 0, result.stderr);
});
