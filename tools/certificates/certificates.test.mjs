import { fixtureAnswers } from './test-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { request } from 'node:http';
import { PDFDocument } from 'pdf-lib';
import { createCertificateService, RETENTION_MS } from './service.mjs';
import { createCertificateServer } from './server.mjs';
import {
  CERTIFICATE_DRAFT_MESSAGES,
  certificateTranslator,
} from '../../packages/i18n/src/certificate-draft.ts';

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-certificate-'));
  const filename = join(dir, 'test.sqlite');
  let clock = Date.UTC(2026, 9, 23, 12);
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return {
    filename,
    now: () => clock,
    advance: (ms) => {
      clock += ms;
    },
  };
}
function complete(service, filename, initial, locale, owner = 'owner', misses = 0) {
  const answers = fixtureAnswers(filename, initial.id);
  let state = initial;
  for (const [index, expected] of answers.entries()) {
    assert.equal(state.question.index, index);
    assert.equal(state.question.audio !== null, expected.aural);
    if (expected.aural) assert.equal(state.question.svg, null, 'No score for a hearing question');
    assert.ok(!JSON.stringify(state).includes('fingerprint'));
    assert.ok(!Object.hasOwn(state, 'result'), 'No grading feedback before completion');
    for (const { text } of state.question.description ?? [])
      assert.doesNotMatch(
        text,
        /gestrichen|\bkleines [a-h]|\bgroßes [A-H]|\b[A-G](?: (?:double )?(?:sharp|flat))? \d\b/,
        `Question ${index} description names pitches and gives the answer away: ${text}`,
      );
    state = service.answer(owner, {
      id: state.id,
      index,
      answer: index < misses ? expected.wrong : expected.right,
      locale,
    });
  }
  return state;
}

for (const locale of ['de', 'en-US', 'en-GB'])
  for (const stage of [1, 2]) {
    test(`stage ${stage}, ${locale}: all 12 source tasks, server result and stable draft receipt`, (t) => {
      const f = fixture(t),
        service = createCertificateService(f.filename, { now: f.now });
      t.after(() => service.close());
      const initial = service.start('owner', { profile: `certificate-draft-${stage}`, locale });
      assert.deepEqual(
        service.start('owner', { profile: `certificate-draft-${stage}`, locale }),
        initial,
        'Repeated start resumes one active attempt',
      );
      const result = complete(service, f.filename, initial, locale);
      assert.equal(result.phase, 'finished');
      assert.equal(result.reason, 'completed');
      assert.equal(result.result.points, 60);
      assert.equal(result.result.maxPoints, 60);
      assert.deepEqual(
        result.result.areas.map((a) => a.points),
        [40, 20],
      );
      assert.equal(result.result.status, 'draft');
      assert.equal(result.result.qualified, true);
      assert.match(result.result.code, /^DRAFT-[A-F0-9]{32}$/);
      assert.equal(
        service.finish('owner', { id: initial.id, locale }).result.code,
        result.result.code,
      );
      assert.deepEqual(Object.keys(service.verify({ code: result.result.code })).sort(), [
        'issuedAt',
        'profileVersion',
        'stage',
        'status',
      ]);
    });
  }

test('test threshold, incomplete attempt and exact server deadline never issue a false sample', (t) => {
  const f = fixture(t),
    service = createCertificateService(f.filename, { now: f.now });
  t.after(() => service.close());
  const start = (owner) => service.start(owner, { profile: 'certificate-draft-1', locale: 'de' });
  const above = complete(service, f.filename, start('above'), 'de', 'above', 2);
  const below = complete(service, f.filename, start('below'), 'de', 'below', 3);
  assert.equal(above.result.points, 50);
  assert.equal(above.result.qualified, true);
  assert.equal(below.result.points, 45);
  assert.equal(below.result.code, null);
  const early = start('early'),
    late = start('late');
  assert.equal(service.finish('early', { id: early.id, locale: 'de' }).result.code, null);
  const answer = fixtureAnswers(f.filename, late.id)[0].right;
  f.advance(20 * 60_000);
  const expired = service.answer('late', { id: late.id, index: 0, answer, locale: 'de' });
  assert.equal(expired.reason, 'timeout');
  assert.equal(expired.result.points, 0);
  assert.equal(expired.result.code, null);
});

test('replay, changed answers, injected scores, missing questions and owner isolation', (t) => {
  const f = fixture(t),
    service = createCertificateService(f.filename, { now: f.now });
  t.after(() => service.close());
  const run = service.start('owner', { profile: 'certificate-draft-1', locale: 'en-US' });
  const first = fixtureAnswers(f.filename, run.id)[0];
  const payload = { id: run.id, index: 0, answer: first.right, locale: 'en-US' };
  assert.throws(() => service.answer('owner', { ...payload, points: 60 }), /invalid/);
  assert.throws(() => service.answer('owner', { ...payload, index: 2 }), /conflict/);
  assert.throws(() => service.answer('owner', { ...payload, answer: 'injected' }), /invalid/);
  assert.throws(() => service.answer('other', payload), /notFound/);
  assert.throws(() => service.finish('other', { id: run.id, locale: 'de' }), /notFound/);
  assert.deepEqual(service.state('other', 'de').attempts, []);
  assert.deepEqual(service.answer('owner', payload), service.answer('owner', payload));
  assert.throws(() => service.answer('owner', { ...payload, answer: first.wrong }), /conflict/);
  assert.equal(service.finish('owner', { id: run.id, locale: 'de' }).result.points, 5);
});

test('restart, revocation, deletion and retention preserve the certificate lifecycle', (t) => {
  const f = fixture(t);
  let service = createCertificateService(f.filename, { now: f.now });
  const run = service.start('owner', { profile: 'certificate-draft-2', locale: 'de' });
  const initial = service.state('owner', 'de');
  service.close();
  service = createCertificateService(f.filename, { now: f.now });
  t.after(() => service.close());
  assert.deepEqual(service.state('owner', 'de'), initial);
  const result = complete(service, f.filename, run, 'de');
  assert.throws(() => service.receipt('other', run.id), /notFound/);
  assert.throws(() => service.revoke('other', { id: run.id }), /notFound/);
  service.revoke('owner', { id: run.id });
  service.revoke('owner', { id: run.id });
  assert.equal(service.verify({ code: result.result.code }).status, 'revoked');
  assert.throws(() => service.receipt('owner', run.id), /revoked/);
  const second = complete(
    service,
    f.filename,
    service.start('other', { profile: 'certificate-draft-1', locale: 'de' }),
    'de',
    'other',
  );
  service.erase('owner');
  assert.equal(service.verify({ code: result.result.code }).status, 'notFound');
  assert.equal(service.verify({ code: second.result.code }).status, 'draft');
  f.advance(RETENTION_MS + 1);
  assert.equal(service.verify({ code: second.result.code }).status, 'notFound');
  assert.deepEqual(service.state('other', 'de').attempts, []);
});

test('changed content fingerprint refuses continuation instead of changing an exam', (t) => {
  const f = fixture(t),
    service = createCertificateService(f.filename, { now: f.now });
  t.after(() => service.close());
  service.start('owner', { profile: 'certificate-draft-1', locale: 'de' });
  const db = new DatabaseSync(f.filename);
  db.exec("update certificate_drafts set fingerprint='old'");
  db.close();
  assert.throws(() => service.state('owner', 'de'), /outdated/);
  service.erase('owner');
  assert.deepEqual(service.state('owner', 'de').attempts, []);
});

test('isolated translations have matching placeholders and never enter app resources', () => {
  const expected = Object.keys(CERTIFICATE_DRAFT_MESSAGES.de).sort();
  for (const locale of ['de', 'en-US', 'en-GB']) {
    const messages = CERTIFICATE_DRAFT_MESSAGES[locale],
      t = certificateTranslator(locale);
    assert.deepEqual(Object.keys(messages).sort(), expected);
    for (const key of expected) {
      assert.ok(messages[key].trim());
      assert.deepEqual(
        messages[key].match(/{{\w+}}/g)?.sort(),
        CERTIFICATE_DRAFT_MESSAGES.de[key].match(/{{\w+}}/g)?.sort(),
      );
      assert.notEqual(t(key, { stage: 1 }), key);
    }
  }
  const resources = readFileSync(
    new URL('../../packages/i18n/src/resources.ts', import.meta.url),
    'utf8',
  );
  assert.ok(!resources.includes('certificate-draft'));
});

test('production bundle gate rejects certificate draft UI and profile identifiers', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-certificate-bundle-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const text of [
    'certificate-draft-1',
    CERTIFICATE_DRAFT_MESSAGES.de.title,
    CERTIFICATE_DRAFT_MESSAGES['en-US'].policy,
  ]) {
    writeFileSync(join(dir, 'app.js'), `const leaked = ${JSON.stringify(text)};`);
    const result = spawnSync(process.execPath, ['tools/check-public-bundle.mjs', dir], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /P4\.18/);
  }
  writeFileSync(join(dir, 'app.js'), 'const publicFixture = "Harmonia";');
  assert.equal(spawnSync(process.execPath, ['tools/check-public-bundle.mjs', dir]).status, 0);
});

test('real HTTP: cookies, CSRF/Host rejection, concurrent replay, private PDFs and minimal code verification', async (t) => {
  const f = fixture(t),
    app = await createCertificateServer({ database: f.filename, now: f.now });
  t.after(() => app.close());
  const bootstrap = await fetch(app.origin),
    setCookie = bootstrap.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly; SameSite=Strict/);
  const cookie = setCookie.split(';')[0];
  const post = (path, body, headers = {}) =>
    fetch(app.origin + path, {
      method: 'POST',
      headers: { cookie, Origin: app.origin, 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  assert.equal((await fetch(app.origin + '/api/state?locale=de')).status, 401);
  const foreignHost = await new Promise((resolve, reject) => {
    const req = request(app.origin, { headers: { Host: 'evil.example' } }, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('error', reject);
    req.end();
  });
  assert.equal(foreignHost, 403);
  assert.equal((await post('/api/start', {}, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await post('/api/start', {}, { 'Content-Type': 'text/plain' })).status, 403);
  const run = await (
    await post('/api/start', { profile: 'certificate-draft-1', locale: 'de' })
  ).json();
  const answers = fixtureAnswers(f.filename, run.id);
  const payload = { id: run.id, index: 0, answer: answers[0].right, locale: 'de' };
  const [a, b] = await Promise.all([post('/api/answer', payload), post('/api/answer', payload)]);
  assert.deepEqual(await a.json(), await b.json());
  let result;
  for (let index = 1; index < answers.length; index++)
    result = await (
      await post('/api/answer', { id: run.id, index, answer: answers[index].right, locale: 'de' })
    ).json();
  for (const locale of ['de', 'en-US', 'en-GB']) {
    const response = await post('/api/pdf', { id: run.id, locale });
    assert.equal(response.headers.get('content-type'), 'application/pdf');
    assert.match(response.headers.get('content-disposition'), /DRAFT-INVALID/);
    const bytes = await response.arrayBuffer(),
      pdf = await PDFDocument.load(bytes);
    assert.equal(pdf.getPages().length, 1);
    assert.match(pdf.getSubject(), /ENTWURF|DRAFT/);
  }
  const secondBootstrap = await fetch(app.origin),
    otherCookie = secondBootstrap.headers.get('set-cookie').split(';')[0];
  assert.equal(
    (await post('/api/pdf', { id: run.id, locale: 'de' }, { cookie: otherCookie })).status,
    404,
  );
  assert.deepEqual(await (await post('/api/verify', { code: 'DRAFT-' + '0'.repeat(32) })).json(), {
    status: 'notFound',
  });
  assert.equal(
    (
      await (
        await post('/api/verify', { code: result.result.code }, { cookie: otherCookie })
      ).json()
    ).status,
    'draft',
  );
  await post('/api/revoke', { id: run.id });
  assert.equal((await post('/api/pdf', { id: run.id, locale: 'de' })).status, 410);
});
