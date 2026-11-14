import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createCertificateService, RETENTION_MS } from './service.mjs';
import { startFixture, fixtureAnswers } from './test-fixture.mjs';
import { createCertificateServer, CERTIFICATE_MAINTENANCE_MS } from './server.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'harmonia-certificate-reads-'));
  const database = join(directory, 'draft.sqlite');
  let instant = Date.UTC(2026, 10, 14, 12);
  const service = createCertificateService(database, { now: () => instant });
  t.after(() => {
    service.close();
    rmSync(directory, { recursive: true, force: true });
  });
  return {
    service,
    database,
    now: () => instant,
    advance: (ms) => {
      instant += ms;
    },
  };
}
function snapshot(database) {
  return hash(readFileSync(database));
}
function query(database, sql, args = []) {
  const db = new DatabaseSync(database);
  try {
    return db.prepare(sql).all(...args);
  } finally {
    db.close();
  }
}
function mutate(database, sql, args = []) {
  const db = new DatabaseSync(database);
  try {
    db.prepare(sql).run(...args);
  } finally {
    db.close();
  }
}
function start(service, owner = 'owner', profile = 'certificate-draft-1') {
  return startFixture(service, owner, { profile, locale: 'de' });
}
function completed(service, database, owner = 'owner') {
  let run = start(service, owner);
  for (const [index, answer] of fixtureAnswers(database, run.id).entries())
    run = service.answer(owner, { id: run.id, index, answer: answer.right, locale: 'de' });
  return run;
}

for (const operation of ['state', 'export', 'verify', 'receipt'])
  test(`${operation}: a read never purges another account's expired data`, (t) => {
    const f = fixture(t),
      { service, database } = f;
    const own = completed(service, database);
    const other = start(service, 'other');
    mutate(database, 'update certificate_drafts set started=? where id=?', [
      f.now() - RETENTION_MS - 1,
      other.id,
    ]);
    mutate(database, 'update certificate_purchases set created=? where id=?', [
      f.now() - RETENTION_MS - 1,
      other.purchaseId,
    ]);
    const before = snapshot(database);
    const actions = {
      state: () => service.state('owner', 'de'),
      export: () => service.exportData('owner'),
      verify: () => service.verify({ code: own.result.code }),
      receipt: () => service.receipt('owner', own.id),
    };
    actions[operation]();
    assert.equal(snapshot(database), before, 'Reading must leave every stored byte unchanged');
    assert.equal(
      query(database, 'select count(*) as n from certificate_drafts where id=?', [other.id])[0].n,
      1,
    );
  });

test('outdated state and export are isolated projections and do not persist invalidation', (t) => {
  const { service, database } = fixture(t);
  const old = completed(service, database),
    current = start(service, 'owner', 'certificate-draft-2');
  mutate(database, 'update certificate_drafts set answers=? where id=?', ['not json', old.id]);
  const before = snapshot(database);
  const state = service.state('owner', 'de');
  assert.equal(state.attempts.find((r) => r.id === old.id).phase, 'outdated');
  assert.equal(state.attempts.find((r) => r.id === current.id).phase, 'active');
  const data = service.exportData('owner');
  assert.equal(data.attempts.find((r) => r.id === old.id).result, null);
  assert.equal(data.attempts.find((r) => r.id === old.id).answers, null);
  assert.equal(snapshot(database), before, 'No invalidated timestamp may be written by a read');
});

test('a timeout export is coherent and leaves completion to an explicit write', (t) => {
  const f = fixture(t),
    { service, database } = f;
  const run = start(service);
  const answer = fixtureAnswers(database, run.id)[0].right;
  service.answer('owner', { id: run.id, index: 0, answer, locale: 'de' });
  f.advance(run.deadlineAt - f.now());
  const before = snapshot(database);
  const row = service.exportData('owner').attempts[0];
  assert.equal(snapshot(database), before, 'Timeout projection must not finish the stored row');
  assert.equal(row.phase, 'finished');
  assert.equal(row.reason, 'timeout');
  assert.equal(row.finishedAt, run.deadlineAt);
  assert.equal(row.result.issuedAt, run.deadlineAt);
  assert.equal(row.result.points, 5);
  assert.equal(row.result.code, null);
  assert.equal(
    query(database, 'select finished from certificate_drafts where id=?', [run.id])[0].finished,
    null,
  );
  const finished = service.finish('owner', { id: run.id, locale: 'de' });
  assert.deepEqual(finished.result, row.result);
  assert.equal(
    query(database, 'select finished from certificate_drafts where id=?', [run.id])[0].finished,
    run.deadlineAt,
  );
});

test('a reserved writer does not block read transactions and a failed read restores write access', (t) => {
  const { service, database } = fixture(t);
  const run = completed(service, database);
  const writer = new DatabaseSync(database);
  writer.exec('begin immediate');
  try {
    assert.equal(service.state('owner', 'de').attempts[0].id, run.id);
    assert.equal(service.exportData('owner').attempts[0].id, run.id);
    assert.equal(service.verify({ code: run.result.code }).status, 'draft');
    assert.equal(service.receipt('owner', run.id).code, run.result.code);
    assert.throws(() => service.receipt('stranger', run.id), /notFound/);
  } finally {
    writer.exec('rollback');
    writer.close();
  }
  assert.equal(
    service.order('owner', { profile: 'certificate-draft-2', requestId: randomUUID() }).status,
    'pending',
  );
});

test('retention hides old rows while physical erasure is an explicit maintenance operation', (t) => {
  const f = fixture(t),
    { service, database } = f;
  const old = start(service, 'old'),
    current = start(service);
  const abandoned = service.order('owner', {
    profile: 'certificate-draft-2',
    requestId: randomUUID(),
  });
  mutate(database, 'update certificate_drafts set started=? where id=?', [
    f.now() - RETENTION_MS - 1,
    old.id,
  ]);
  mutate(database, 'update certificate_purchases set created=? where id in (?,?)', [
    f.now() - RETENTION_MS - 1,
    old.purchaseId,
    abandoned.id,
  ]);
  const before = snapshot(database);
  assert.deepEqual(service.exportData('old').attempts, []);
  assert.deepEqual(service.exportData('old').purchases, []);
  assert.equal(service.state('owner', 'de').attempts[0].id, current.id);
  assert.equal(service.state('owner', 'de').purchases.length, 1);
  assert.equal(snapshot(database), before, 'Filtering expired rows must not erase them');
  assert.deepEqual(service.maintain(), { attempts: 1, purchases: 2 });
  assert.equal(query(database, 'select count(*) as n from certificate_drafts')[0].n, 1);
  assert.equal(service.state('owner', 'de').attempts[0].id, current.id);
});

test('a new start explicitly retires a projected timeout or outdated active row', (t) => {
  for (const damaged of [false, true]) {
    const f = fixture(t),
      { service, database } = f;
    const old = start(service);
    if (damaged)
      mutate(database, 'update certificate_drafts set fingerprint=? where id=?', [
        'outdated',
        old.id,
      ]);
    else f.advance(old.deadlineAt - f.now());
    const before = snapshot(database);
    assert.equal(service.state('owner', 'de').attempts[0].phase, damaged ? 'outdated' : 'finished');
    assert.equal(snapshot(database), before);
    const next = start(service, 'owner', 'certificate-draft-2');
    assert.equal(next.phase, 'active');
    assert.notEqual(next.id, old.id);
    const stored = query(
      database,
      'select finished,invalidated from certificate_drafts where id=?',
      [old.id],
    )[0];
    if (damaged) assert.equal(stored.invalidated, f.now());
    else assert.equal(stored.finished, old.deadlineAt);
    assert.equal(
      service.state('owner', 'de').attempts.filter((r) => r.phase === 'active').length,
      1,
    );
  }
});

test('the exact retention boundary is visible; the next millisecond is hidden without erasure', (t) => {
  const f = fixture(t),
    { service, database } = f;
  const run = completed(service, database);
  f.advance(RETENTION_MS);
  const before = snapshot(database);
  assert.equal(service.verify({ code: run.result.code }).status, 'draft');
  assert.equal(service.receipt('owner', run.id).id, run.id);
  assert.equal(service.exportData('owner').attempts.length, 1);
  f.advance(1);
  assert.equal(service.verify({ code: run.result.code }).status, 'notFound');
  assert.throws(() => service.receipt('owner', run.id), /notFound/);
  assert.deepEqual(service.exportData('owner').attempts, []);
  assert.equal(snapshot(database), before);
});

test('a snapshot uses one server instant even when the clock crosses the deadline during reads', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'harmonia-cert-read-clock-'));
  const database = join(directory, 'draft.sqlite');
  let instant = Date.UTC(2026, 10, 14, 12);
  const service = createCertificateService(database, { now: () => instant++ });
  t.after(() => {
    service.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const run = start(service);
  instant = run.deadlineAt - 1;
  const before = snapshot(database),
    view = service.state('owner', 'de').attempts[0];
  assert.equal(view.serverNow, run.deadlineAt - 1);
  assert.equal(view.phase, 'active');
  const data = service.exportData('owner');
  assert.equal(data.exportedAt, run.deadlineAt);
  assert.equal(data.attempts[0].phase, 'finished');
  assert.equal(data.attempts[0].finishedAt, run.deadlineAt);
  assert.equal(snapshot(database), before);
});

function certificateData(database) {
  return hash(
    JSON.stringify(
      ['certificate_drafts', 'certificate_purchases'].map((table) =>
        query(database, `select * from ${table} order by id`),
      ),
    ),
  );
}
async function httpFixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'harmonia-cert-read-http-'));
  const database = join(directory, 'draft.sqlite');
  let instant = Date.UTC(2026, 10, 14, 12),
    closed = false;
  const app = await createCertificateServer({ database, now: () => instant });
  t.after(async () => {
    if (!closed) await app.close();
    rmSync(directory, { recursive: true, force: true });
  });
  const cookie = (await fetch(app.origin)).headers.get('set-cookie').split(';')[0];
  const post = (path, body, session = cookie) =>
    fetch(app.origin + '/api/' + path, {
      method: 'POST',
      headers: { cookie: session, Origin: app.origin, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  const start = async (session = cookie) => {
    const response = await post(
      'order',
      { profile: 'certificate-draft-1', requestId: randomUUID() },
      session,
    );
    assert.equal(response.status, 200);
    const order = await response.json();
    assert.equal((await post('settle', { id: order.id, outcome: 'paid' }, session)).status, 200);
    const launched = await post(
      'start',
      { profile: order.profile, purchase: order.id, locale: 'de' },
      session,
    );
    assert.equal(launched.status, 200);
    return launched.json();
  };
  return {
    app,
    database,
    cookie,
    post,
    start,
    now: () => instant,
    advance: (ms) => {
      instant += ms;
    },
    close: async () => {
      await app.close();
      closed = true;
    },
  };
}

test('HTTP export, state, verification and PDF never change certificate data, including foreign expired rows', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const f = await httpFixture(t);
  let own = await f.start();
  for (const [index, answer] of fixtureAnswers(f.database, own.id).entries()) {
    const response = await f.post('answer', {
      id: own.id,
      index,
      answer: answer.right,
      locale: 'de',
    });
    assert.equal(response.status, 200);
    own = await response.json();
  }
  const otherCookie = (await fetch(f.app.origin)).headers.get('set-cookie').split(';')[0];
  const other = await f.start(otherCookie);
  mutate(f.database, 'update certificate_drafts set started=? where id=?', [
    f.now() - RETENTION_MS - 1,
    other.id,
  ]);
  mutate(f.database, 'update certificate_purchases set created=? where id=?', [
    f.now() - RETENTION_MS - 1,
    other.purchaseId,
  ]);
  const before = certificateData(f.database);
  f.advance(1);
  const state = await fetch(f.app.origin + '/api/state?locale=de', {
    headers: { cookie: f.cookie },
  });
  assert.equal(state.status, 200);
  assert.equal((await state.json()).attempts[0].id, own.id);
  for (const response of await Promise.all(Array.from({ length: 4 }, () => f.post('export', {})))) {
    assert.equal(response.status, 200);
    assert.equal((await response.json()).attempts[0].id, own.id);
  }
  assert.equal((await (await f.post('verify', { code: own.result.code })).json()).status, 'draft');
  const pdf = await f.post('pdf', { id: own.id, locale: 'de' });
  assert.equal(pdf.status, 200);
  assert.ok((await pdf.arrayBuffer()).byteLength > 1000);
  assert.equal(certificateData(f.database), before);
  // Sitzungsaktivität ist getrennt von den Zertifikatsdaten und bleibt ausdrücklich schreibend.
  assert.ok(
    query(f.database, 'select seen from certificate_sessions').some((r) => r.seen === f.now()),
  );
});

test('HTTP timeout views and exports agree without persisting an exam or creating a PDF', async (t) => {
  const f = await httpFixture(t),
    run = await f.start();
  f.advance(run.deadlineAt - f.now());
  const before = certificateData(f.database);
  const state = await (
    await fetch(f.app.origin + '/api/state?locale=en-US', { headers: { cookie: f.cookie } })
  ).json();
  const data = await (await f.post('export', {})).json();
  assert.equal(state.attempts[0].phase, 'finished');
  assert.equal(state.attempts[0].reason, 'timeout');
  assert.deepEqual(data.attempts[0].result, state.attempts[0].result);
  assert.equal(data.attempts[0].finishedAt, run.deadlineAt);
  assert.equal((await f.post('pdf', { id: run.id, locale: 'de' })).status, 404);
  assert.equal(certificateData(f.database), before);
  assert.equal((await f.post('finish', { id: run.id, locale: 'de' })).status, 200);
  assert.equal(
    query(f.database, 'select finished from certificate_drafts where id=?', [run.id])[0].finished,
    run.deadlineAt,
  );
});

test('idle maintenance retries a busy database and is stopped with the local server', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const warning = t.mock.method(console, 'warn', () => {});
  const f = await httpFixture(t);
  await f.start();
  f.advance(RETENTION_MS + 1);
  const writer = new DatabaseSync(f.database);
  writer.exec('begin immediate');
  try {
    t.mock.timers.tick(CERTIFICATE_MAINTENANCE_MS);
    assert.equal(warning.mock.callCount(), 1);
    assert.equal(query(f.database, 'select count(*) as n from certificate_drafts')[0].n, 1);
  } finally {
    writer.exec('rollback');
    writer.close();
  }
  t.mock.timers.tick(CERTIFICATE_MAINTENANCE_MS);
  assert.equal(query(f.database, 'select count(*) as n from certificate_drafts')[0].n, 0);
  assert.equal(query(f.database, 'select count(*) as n from certificate_purchases')[0].n, 0);
  await f.close();
  t.mock.timers.tick(CERTIFICATE_MAINTENANCE_MS);
  assert.equal(warning.mock.callCount(), 1, 'No maintenance may run against the closed store');
});
