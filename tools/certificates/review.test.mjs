import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { certificateDigests, certificateSourceHash } from './binding.mjs';
import { certificateReview, certificateReviewHtml, REVIEW_SEEDS } from './review.mjs';
import { createCertificateService } from './service.mjs';
import { createCertificateServer } from './server.mjs';
import { fixtureAnswers } from './test-fixture.mjs';
import { sampleCertificatePdf } from './pdf.mjs';
import { catalogue } from '../../packages/content/src/authoring.ts';
import { CERTIFICATE_REVIEW_MESSAGES } from '../../packages/i18n/src/certificate-review.ts';
import { readInventory, inspectInventory, runtimeDigests } from '../ai-act/model.mjs';

const digests = certificateDigests(),
  packet = certificateReview({ digests });
const now = () => Date.UTC(2026, 9, 25, 12);
function temporary(t) {
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-cert-review-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return { dir, database: join(dir, 'test.sqlite') };
}

test('review pack is deterministic, incomplete and includes actual source and coverage gaps', () => {
  assert.deepEqual(certificateReview({ digests }), packet);
  assert.equal(packet.draft, true);
  assert.equal(packet.releaseEligible, false);
  assert.equal(packet.legalApprovalInferred, false);
  assert.equal(packet.profiles.length, 2);
  assert.ok(packet.missing.includes('certificate.draftOnly'));
  assert.ok(packet.missing.includes('aiAct.certificates.review.real-written-assessment'));
  for (const p of packet.profiles) {
    assert.equal(p.samples.length, 3);
    assert.equal(p.thresholdPercent, 80);
    assert.ok(p.uncoveredUnits.length > 0, 'A partial profile must expose omissions');
    const units = catalogue.units.filter((u) =>
      catalogue.levels.some((l) => l.id === u.levelId && l.number === p.stage),
    );
    assert.deepEqual(
      new Set([...p.lessons.map((l) => l.unitId), ...p.uncoveredUnits.map((u) => u.id)]),
      new Set(units.map((u) => u.id)),
    );
    for (const sample of p.samples) {
      assert.ok(REVIEW_SEEDS.includes(sample.seed));
      assert.equal(sample.questions.length, 12);
      assert.equal(sample.questions.filter((q) => q.area === 'aural').length, 4);
      for (const q of sample.questions) {
        assert.ok(p.lessons.some((l) => l.id === q.lessonId));
        assert.ok(q.item.choices.includes(q.correctAnswer));
        assert.equal(typeof q.spec.type, 'string');
      }
    }
  }
});

test('actual grading, content, notation, fonts, dependencies and new modules are bound', () => {
  for (const file of [
    'packages/exercises/src/evaluate.ts',
    'packages/theory/src/interval.ts',
    'packages/content/src/catalogue.json',
    'packages/notation/src/index.ts',
    'tools/certificates/profiles.ts',
    'tools/certificates/pdf.mjs',
    'packages/i18n/src/authored-content.json',
    'pnpm-lock.yaml',
    'packages/exercises/package.json',
    'tools/voice-leading/playback.ts',
    'packages/notation/node_modules/@vexflow-fonts/bravura/bravura.woff2',
  ])
    assert.ok(digests[file], file);
  assert.ok(Object.keys(digests).every((p) => !p.includes('.test.') && !p.includes('-fixture.')));
  const hash = certificateSourceHash(digests);
  assert.equal(certificateSourceHash(Object.fromEntries(Object.entries(digests).reverse())), hash);
  assert.notEqual(
    certificateSourceHash({ ...digests, 'packages/exercises/src/evaluate.ts': 'f'.repeat(64) }),
    hash,
  );
  assert.notEqual(
    certificateSourceHash({ ...digests, 'tools/certificates/new-grading.mjs': 'a'.repeat(64) }),
    hash,
  );
  assert.throws(() => certificateSourceHash({}), /Invalid/);
  assert.throws(() => certificateSourceHash({ bad: 'unknown' }), /Invalid/);
});

test('a code change after restart blocks ongoing grading and new PDFs; erase and revocation remain possible', async (t) => {
  const { database } = temporary(t);
  let service = createCertificateService(database, { now, sourceHash: 'a'.repeat(64) });
  t.after(() => service.close());
  const active = service.start('active', { profile: 'certificate-draft-1', locale: 'de' });
  let finished = service.start('finished', { profile: 'certificate-draft-2', locale: 'de' });
  for (const [index, expected] of fixtureAnswers(database, finished.id).entries())
    finished = service.answer('finished', {
      id: finished.id,
      index,
      answer: expected.right,
      locale: 'de',
    });
  const receipt = service.receipt('finished', finished.id);
  assert.equal(receipt.sourceHash, 'a'.repeat(64));
  assert.ok((await sampleCertificatePdf(receipt, 'de')).length > 1000);
  await assert.rejects(
    sampleCertificatePdf({ ...receipt, status: 'valid' }, 'de'),
    /Sample receipt/,
  );
  await assert.rejects(
    sampleCertificatePdf({ ...receipt, sourceHash: null }, 'de'),
    /Sample receipt/,
  );
  service.close();
  service = createCertificateService(database, { now, sourceHash: 'b'.repeat(64) });
  for (const [owner, id] of [
    ['active', active.id],
    ['finished', finished.id],
  ]) {
    const row = service.state(owner, 'de').attempts[0];
    assert.equal(row.phase, 'outdated');
    assert.ok(!('question' in row) && !('result' in row));
    assert.throws(() => service.finish(owner, { id, locale: 'de' }), /outdated/);
    assert.throws(
      () => service.answer(owner, { id, index: 0, answer: 'anything', locale: 'de' }),
      /outdated/,
    );
    assert.throws(() => service.receipt(owner, id), /outdated/);
  }
  service.revoke('finished', { id: finished.id });
  assert.equal(service.verify({ code: receipt.code }).status, 'revoked');
  service.erase('active');
  assert.equal(
    service.start('active', { profile: 'certificate-draft-1', locale: 'de' }).phase,
    'active',
  );
});

test('additive migration preserves legacy attempts while denying unbound continuation', (t) => {
  const { database } = temporary(t);
  let service = createCertificateService(database, { now });
  service.start('legacy', { profile: 'certificate-draft-1', locale: 'de' });
  service.close();
  const db = new DatabaseSync(database);
  db.exec('alter table certificate_drafts drop column source_hash');
  db.close();
  service = createCertificateService(database, { now });
  t.after(() => service.close());
  const rows = service.state('legacy', 'de').attempts;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].phase, 'outdated');
  assert.throws(() => service.finish('legacy', { id: rows[0].id, locale: 'de' }), /outdated/);
  service.erase('legacy');
  assert.equal(
    service.start('legacy', { profile: 'certificate-draft-1', locale: 'de' }).phase,
    'active',
  );
});

for (const locale of ['de', 'en-US', 'en-GB'])
  test(`${locale}: private report contains 72 answer samples, embedded notation font and draft limits`, () => {
    const html = certificateReviewHtml(packet, locale);
    const messages = CERTIFICATE_REVIEW_MESSAGES[locale];
    assert.equal((html.match(/<article>/g) ?? []).length, 72);
    assert.ok(html.includes(messages.draft));
    assert.ok(html.includes(messages.coverageLimit));
    assert.ok(html.includes(messages.sampleLimit));
    assert.ok(html.includes('data:font/woff2;base64,'));
    assert.ok(
      !html.includes('<script') && !html.includes('<iframe') && !html.includes('undefined'),
    );
    assert.ok(html.includes('SIL OPEN FONT LICENSE'));
    assert.deepEqual(Object.keys(messages), Object.keys(CERTIFICATE_REVIEW_MESSAGES.de));
    const malicious = structuredClone(packet);
    malicious.profiles[0].samples[0].questions[0].lessonId = '</p><script>alert(1)</script>';
    assert.ok(!certificateReviewHtml(malicious, locale).includes('<script>'));
  });

test('P4.17 inventories the actual certificate service and keeps written review pending', () => {
  const inventory = readInventory(),
    files = runtimeDigests(inventory);
  const component = inventory.components.find((c) => c.id === 'certificates');
  assert.equal(component.deployment, 'internal-draft');
  assert.equal(component.technology, 'rules');
  for (const file of [
    'tools/certificates/service.mjs',
    'tools/certificates/profiles.ts',
    'tools/certificates/review.mjs',
    'packages/theory/src/index.ts',
    'packages/i18n/src/certificate-draft.ts',
  ])
    assert.ok(files[file], file);
  assert.ok(
    inspectInventory(inventory).scopes.certificates.missing.includes('certificates.classification'),
  );
  assert.equal(inventory.reviews.certificates.status, 'pending');
});

test('preparation passes; release and malformed CLI calls fail closed', () => {
  const run = (args) =>
    spawnSync(process.execPath, ['tools/certificates/check.mjs', ...args], { encoding: 'utf8' });
  const prepared = run(['--json']);
  assert.equal(prepared.status, 0, prepared.stderr);
  assert.equal(JSON.parse(prepared.stdout).releaseEligible, false);
  const release = run(['--release']);
  assert.equal(release.status, 1);
  assert.match(release.stderr, /certificate.draftOnly/);
  assert.match(release.stderr, /aiAct.certificates/);
  assert.equal(run(['--production']).status, 1);
  assert.equal(run(['--json', '--json']).status, 1);
});

test('actual exam HTTP server never serves private review packs or answer endpoints', async (t) => {
  const { database } = temporary(t),
    app = await createCertificateServer({ database, now });
  t.after(() => app.close());
  const home = await fetch(app.origin),
    cookie = home.headers.get('set-cookie').split(';')[0];
  for (const path of [
    '/artifacts/certificates/review/snapshot.json',
    '/review/de.html',
    '/api/review',
    '/api/answers',
  ]) {
    const response = await fetch(app.origin + path, { headers: { Cookie: cookie } });
    assert.equal(response.status, 404, path);
    assert.ok(!(await response.text()).includes('correctAnswer'));
  }
});

test('production bundle guard rejects solution report text', (t) => {
  const { dir } = temporary(t);
  writeFileSync(
    join(dir, 'poison.js'),
    'globalThis.review = ' + JSON.stringify(CERTIFICATE_REVIEW_MESSAGES.de.sampleLimit),
  );
  const result = spawnSync(process.execPath, ['tools/check-public-bundle.mjs', dir], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr + result.stdout, /P4.18 review/);
});
