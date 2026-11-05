import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  chmodSync,
  symlinkSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  readInventory,
  validateInventory,
  runtimeDigests,
  snapshotHash,
  releaseProblems,
  SCOPES,
} from './model.mjs';
import { inspectDocument, reviewDocuments } from './evidence.mjs';
import { assessmentTemplate, inspectAssessment, writeHandoff } from './handoff.mjs';
import { writePrivate } from './private-files.mjs';
import { reviewHtml } from './report.mjs';
import { AI_REVIEW_MESSAGES } from '../../packages/i18n/src/ai-act-review.ts';

const inventory = readInventory(),
  digests = runtimeDigests(inventory),
  now = Date.UTC(2026, 10, 2, 12);
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'harmonia-ai-complete-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const directory = join(root, 'artifacts/ai-act/evidence');
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const path = 'artifacts/ai-act/evidence/synthetic-only.txt',
    absolute = join(root, path);
  // Only a synthetic local fixture to test file/field validation, never a legal opinion.
  const bytes = 'Synthetic test document. Not an actual legal assessment.';
  writeFileSync(absolute, bytes, { mode: 0o600 });
  return {
    root,
    path,
    absolute,
    document: { path, sha256: createHash('sha256').update(bytes).digest('hex') },
  };
}

test('a known component cannot silently leave its school scope', () => {
  const data = readInventory();
  data.components.find((c) => c.id === 'school-assessment').scopes = ['general'];
  assert.throws(() => validateInventory(data), /scope/i);
});

test('the direct legal text source cannot be replaced by a different source ID', () => {
  const data = readInventory();
  data.sources.find((s) => s.id === 'eur-lex-consolidated').id = 'replacement-source';
  assert.throws(() => validateInventory(data), /source/i);
});

test('the AI snapshot also binds payment, sessions, dependency versions and playback imports', () => {
  for (const path of [
    'tools/certificates/purchases.mjs',
    'tools/certificates/sessions.mjs',
    'tools/ai-act/evidence.mjs',
    'tools/ai-act/handoff.mjs',
    'pnpm-lock.yaml',
    'tools/voice-leading/workbench-model.ts',
    'tools/voice-leading/report.ts',
  ])
    assert.ok(digests[path], path);
});

test('written evidence requires a private, unchanged, regular document inside its own directory', (t) => {
  const f = fixture(t);
  assert.equal(inspectDocument(f.document, { root: f.root }).valid, true);
  writeFileSync(f.absolute, 'changed');
  assert.equal(inspectDocument(f.document, { root: f.root }).reason, 'changed');
  chmodSync(f.absolute, 0o644);
  assert.equal(inspectDocument(f.document, { root: f.root }).valid, false);
  rmSync(f.absolute);
  symlinkSync(join(f.root, 'outside.txt'), f.absolute);
  writeFileSync(join(f.root, 'outside.txt'), 'outside', { mode: 0o600 });
  assert.equal(inspectDocument(f.document, { root: f.root }).valid, false);
  for (const path of [
    '/etc/passwd',
    'artifacts/ai-act/evidence/../../outside.txt',
    'https://example.test/review.pdf',
  ])
    assert.equal(inspectDocument({ ...f.document, path }, { root: f.root }).valid, false);
  rmSync(f.absolute);
  mkdirSync(f.absolute);
  assert.equal(inspectDocument(f.document, { root: f.root }).valid, false);
});

function prepared(document) {
  const data = readInventory();
  for (const s of data.sources) s.retrieval = 'retrieved';
  for (const c of data.components)
    c.assessment = { aiSystem: 'yes', annexIII: 'no', profiling: 'no', outcome: 'not-high-risk' };
  for (const c of data.controls) {
    c.status = 'verified';
    c.evidenceReference = 'synthetic-only/control';
  }
  const hash = snapshotHash(data, digests);
  for (const scope of SCOPES)
    data.reviews[scope] = {
      status: 'approved',
      dataKind: 'real',
      reviewer: 'synthetic fixture',
      evidenceReference: 'synthetic-only/not-a-legal-opinion',
      reviewedAt: '2026-11-02T10:00:00Z',
      validUntil: '2026-12-02T10:00:00Z',
      snapshotHash: hash,
      document,
      revokedAt: null,
      revocationReason: null,
    };
  return data;
}
test('each scope fails closed for missing, changed or revoked documentary evidence', (t) => {
  const f = fixture(t),
    data = prepared(f.document),
    hash = snapshotHash(data, digests);
  for (const scope of SCOPES) {
    assert.deepEqual(
      releaseProblems(data, scope, hash, {
        now,
        documents: reviewDocuments(data, { root: f.root }),
      }),
      [],
    );
    data.reviews[scope].revokedAt = '2026-11-02T11:00:00Z';
    data.reviews[scope].revocationReason = 'Synthetic revocation';
    assert.ok(
      releaseProblems(data, scope, hash, {
        now,
        documents: reviewDocuments(data, { root: f.root }),
      }).includes('review.revoked'),
    );
    data.reviews[scope].revokedAt = null;
    data.reviews[scope].revocationReason = null;
  }
  writeFileSync(f.absolute, 'modified evidence');
  for (const scope of SCOPES)
    assert.ok(
      releaseProblems(data, scope, hash, {
        now,
        documents: reviewDocuments(data, { root: f.root }),
      }).includes('review.private-written-document'),
    );
  rmSync(f.absolute);
  assert.ok(
    releaseProblems(data, 'certificates', hash, {
      now,
      documents: reviewDocuments(data, { root: f.root }),
    }).includes('review.private-written-document'),
  );
});

test('worksheets are scoped, snapshot-bound and complete; proposed decisions do not mutate the inventory', () => {
  for (const scope of SCOPES) {
    const before = JSON.stringify(inventory),
      form = assessmentTemplate(inventory, scope, { digests });
    assert.deepEqual(
      form.components.map((c) => c.id),
      inventory.components.filter((c) => c.scopes.includes(scope)).map((c) => c.id),
    );
    const inspection = inspectAssessment(inventory, form, { digests, now });
    assert.equal(inspection.legalApprovalInferred, false);
    assert.ok(inspection.missing.includes('review.real-written-assessment'));
    assert.ok(inspection.missing.includes('review.private-written-document'));
    assert.equal(JSON.stringify(inventory), before);
    const incomplete = structuredClone(form);
    incomplete.components.pop();
    assert.throws(() => inspectAssessment(inventory, incomplete, { digests, now }), /coverage/);
    const duplicate = structuredClone(form);
    duplicate.controls.push(duplicate.controls[0]);
    assert.throws(() => inspectAssessment(inventory, duplicate, { digests, now }), /coverage/);
    assert.throws(
      () =>
        inspectAssessment(inventory, form, {
          digests: { ...digests, 'new-module.mjs': 'f'.repeat(64) },
          now,
        }),
      /Outdated/,
    );
    assert.throws(() =>
      inspectAssessment(inventory, { ...form, approved: true }, { digests, now }),
    );
  }
});

test('a completed classification needs a rationale/reference and a newly bound written assessment', () => {
  const form = assessmentTemplate(inventory, 'certificates', { digests });
  form.components[0].assessment = {
    aiSystem: 'yes',
    annexIII: 'no',
    profiling: 'no',
    outcome: 'not-high-risk',
  };
  const result = inspectAssessment(inventory, form, { digests, now });
  assert.ok(
    result.preparationProblems.includes(
      'components.' + form.components[0].id + '.reason-and-evidence',
    ),
  );
  assert.notEqual(result.projectedSnapshotHash, form.baseSnapshotHash);
  assert.equal(result.inventory.reviews.certificates.status, 'pending');
});

test('versioned handoffs preserve annotations and enforce private output, including on repeat', (t) => {
  const f = fixture(t),
    options = { digests, now, root: f.root };
  const packet = writeHandoff(inventory, 'school', options);
  const annotated = JSON.parse(readFileSync(packet.path, 'utf8'));
  annotated.components[0].rationale = 'Human draft note';
  writeFileSync(packet.path, JSON.stringify(annotated));
  chmodSync(packet.path, 0o644);
  assert.equal(writeHandoff(inventory, 'school', options).path, packet.path);
  assert.equal(
    JSON.parse(readFileSync(packet.path, 'utf8')).components[0].rationale,
    'Human draft note',
  );
  assert.equal(statSync(packet.path).mode & 0o777, 0o600);
  const directory = 'artifacts/ai-act/output';
  mkdirSync(join(f.root, directory), { recursive: true });
  const outside = join(f.root, 'outside.txt');
  writeFileSync(outside, 'unchanged');
  symlinkSync(outside, join(f.root, directory, 'report.txt'));
  assert.throws(() => writePrivate(directory, 'report.txt', 'changed', { root: f.root }), /Unsafe/);
  assert.equal(readFileSync(outside, 'utf8'), 'unchanged');
  assert.throws(
    () => writePrivate('artifacts/ai-act/../other', 'report.txt', 'data', { root: f.root }),
    /Unsafe/,
  );
});

test('handoff CLI rejects malformed, duplicate and mismatched arguments; inspecting never activates approval', () => {
  const run = (args) =>
    spawnSync(process.execPath, ['tools/ai-act/handoff.mjs', ...args], { encoding: 'utf8' });
  for (const args of [
    ['--scope', 'unknown'],
    ['--write'],
    ['--release'],
    ['--scope', 'general', '--scope', 'school'],
    ['--inspect'],
  ])
    assert.equal(run(args).status, 1);
  const before = readFileSync(new URL('./inventory.json', import.meta.url), 'utf8');
  const generated = run(['--scope', 'certificates']);
  assert.equal(generated.status, 0, generated.stderr);
  const packet = JSON.parse(generated.stdout.trim());
  const inspected = run(['--inspect', packet.path, '--write']);
  assert.equal(inspected.status, 0, inspected.stderr);
  const result = JSON.parse(inspected.stdout);
  assert.equal(result.legalApprovalInferred, false);
  assert.ok(result.missing.includes('review.private-written-document'));
  assert.equal(run(['--scope', 'school', '--inspect', packet.path]).status, 1);
  assert.equal(readFileSync(new URL('./inventory.json', import.meta.url), 'utf8'), before);
});

for (const locale of ['de', 'en-US', 'en-GB'])
  test(`${locale}: report explicitly shows missing documents and safely renders a revocation`, () => {
    const data = readInventory();
    data.reviews.general.revokedAt = '2026-11-02T11:00:00Z';
    data.reviews.general.revocationReason = '<script>untrusted</script>';
    const inspection = inspectAssessment(data, assessmentTemplate(data, 'general', { digests }), {
      digests,
      now,
    }).inspection;
    const html = reviewHtml(data, inspection, locale);
    assert.ok(html.includes(AI_REVIEW_MESSAGES[locale].documentMissing));
    assert.ok(html.includes(AI_REVIEW_MESSAGES[locale].reviewRevoked));
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
  });

test('implemented components cannot be labelled planned to bypass assessment', () => {
  const data = readInventory();
  data.components.find((c) => c.id === 'tutor').deployment = 'planned';
  assert.throws(() => validateInventory(data), /deployment/i);
});
