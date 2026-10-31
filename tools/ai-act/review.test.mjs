import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
  readInventory,
  validateInventory,
  runtimeDigests,
  snapshotHash,
  releaseProblems,
  inspectInventory,
  SCOPES,
} from './model.mjs';
import { reviewHtml } from './report.mjs';
import { AI_REVIEW_MESSAGES } from '../../packages/i18n/src/ai-act-review.ts';
import { actualReleaseProblems } from '../storefront/check.mjs';
import { actualBetaProblems } from '../beta/readiness.mjs';
import { actualProblems } from '../release/check.mjs';
const now = Date.parse('2026-10-24T12:00:00.000Z'),
  inventory = readInventory(),
  digests = runtimeDigests(inventory);
function prepared() {
  // Synthetic metadata simulates field checks; it is never an actual legal assessment.
  const data = structuredClone(inventory);
  for (const source of data.sources) source.retrieval = 'retrieved';
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
      evidenceReference: 'synthetic-only/legal-review',
      reviewedAt: '2026-10-24T10:00:00.000Z',
      validUntil: '2026-11-24T10:00:00.000Z',
      snapshotHash: hash,
    };
  return data;
}
for (const scope of SCOPES)
  test(`${scope}: current draft, missing references and synthetic review cannot release`, () => {
    const missing = releaseProblems(inventory, scope, snapshotHash(inventory, digests), { now });
    assert.ok(missing.includes('review.real-written-assessment'));
    assert.ok(missing.includes('sources.direct-legal-text-review'));
    assert.ok(missing.includes('controls.classification'));
    const fixture = prepared();
    assert.deepEqual(releaseProblems(fixture, scope, snapshotHash(fixture, digests), { now }), []); // field validation only, not an opinion
    fixture.reviews[scope].dataKind = 'synthetic';
    assert.ok(
      releaseProblems(fixture, scope, snapshotHash(fixture, digests), { now }).includes(
        'review.real-written-assessment',
      ),
    );
    fixture.reviews[scope].dataKind = 'real';
    fixture.reviews[scope].evidenceReference = null;
    assert.ok(
      releaseProblems(fixture, scope, snapshotHash(fixture, digests), { now }).includes(
        'review.reviewer-and-reference',
      ),
    );
  });
test('runtime edits, additional modules, purpose changes and source updates invalidate a previous review', () => {
  const data = prepared(),
    old = snapshotHash(data, digests);
  const first = Object.keys(digests)[0];
  assert.notEqual(snapshotHash(data, { ...digests, [first]: 'f'.repeat(64) }), old);
  const added = { ...digests, 'supabase/functions/_shared/new-ai-feature.ts': 'a'.repeat(64) };
  const hash = snapshotHash(data, added);
  assert.ok(releaseProblems(data, 'school', hash, { now }).includes('review.current-snapshot'));
  data.components[0].purpose.de += ' Geänderter Verwendungszweck.';
  assert.notEqual(snapshotHash(data, digests), old);
  const source = prepared();
  source.sources[0].note.de += ' updated';
  assert.notEqual(snapshotHash(source, digests), old);
});
test('Annex III profiling cannot use a non-high-risk exemption; unknown profiling also blocks it', () => {
  for (const profiling of ['yes', 'unreviewed']) {
    const data = prepared();
    data.components.find((c) => c.id === 'learner-planner').assessment = {
      aiSystem: 'yes',
      annexIII: 'yes',
      profiling,
      outcome: 'annex-iii-exemption',
    };
    assert.ok(
      releaseProblems(data, 'school', snapshotHash(data, digests), { now }).includes(
        'learner-planner.exemption-not-supported',
      ),
    );
  }
  const data = prepared();
  data.components.find((c) => c.id === 'learner-planner').assessment.annexIII = 'yes';
  assert.ok(
    releaseProblems(data, 'school', snapshotHash(data, digests), { now }).includes(
      'learner-planner.annex-iii',
    ),
  );
});
test('high-risk systems require verified high-risk controls; general controls cannot be waived', () => {
  const data = prepared();
  data.components[0].assessment = {
    aiSystem: 'yes',
    annexIII: 'yes',
    profiling: 'yes',
    outcome: 'high-risk',
  };
  const control = data.controls.find((c) => c.id === 'high-risk-controls');
  control.status = 'not-applicable';
  control.rationale = 'Synthetic exemption claim';
  assert.ok(
    releaseProblems(data, 'school', snapshotHash(data, digests), { now }).includes(
      'controls.high-risk-controls',
    ),
  );
  data.controls.find((c) => c.id === 'classification').waivable = true;
  assert.throws(() => validateInventory(data), /waiver/);
});
test('expired/future reviews, stale/future source checks and unresolved AI definitions block', () => {
  const data = prepared(),
    r = data.reviews.general;
  r.validUntil = '2026-10-24T11:00:00.000Z';
  assert.ok(
    releaseProblems(data, 'general', snapshotHash(data, digests), { now }).includes(
      'review.validity',
    ),
  );
  r.reviewedAt = '2027-01-01T00:00:00.000Z';
  r.validUntil = '2027-02-01T00:00:00.000Z';
  assert.ok(
    releaseProblems(data, 'general', snapshotHash(data, digests), { now }).includes(
      'review.validity',
    ),
  );
  for (const date of ['2026-01-01', '2027-01-01']) {
    data.sourcesObservedAt = date;
    assert.ok(
      releaseProblems(data, 'general', snapshotHash(data, digests), { now }).includes(
        'sources.refresh-required',
      ),
    );
  }
  data.components[0].assessment = {
    aiSystem: 'no',
    annexIII: 'no',
    profiling: 'no',
    outcome: 'not-high-risk',
  };
  assert.ok(
    releaseProblems(data, 'general', snapshotHash(data, digests), { now }).includes(
      'tutor.ai-definition',
    ),
  );
});
test('inventory cannot silently drop known components, critical controls, purpose boundaries or path safety', () => {
  const missing = structuredClone(inventory);
  missing.components = missing.components.filter((c) => c.id !== 'learner-planner');
  assert.throws(() => validateInventory(missing), /coverage/);
  const duplicate = structuredClone(inventory);
  duplicate.components.push(duplicate.components[0]);
  assert.throws(() => validateInventory(duplicate), /Duplicate/);
  const path = structuredClone(inventory);
  path.components[0].files = ['../../private'];
  assert.throws(() => validateInventory(path));
  const source = structuredClone(inventory);
  source.sources[0].url = 'https://example.test/unverified';
  assert.throws(() => validateInventory(source));
  const boundary = structuredClone(inventory);
  boundary.excludedPurposes = [];
  assert.throws(() => validateInventory(boundary), /boundaries/);
});
test('current monitored file set includes the actual model, learner tools, grading and disclosure surfaces', () => {
  for (const file of [
    'tools/ai-act/model.mjs',
    'supabase/functions/_shared/tutor-learner.ts',
    'packages/exercises/src/evaluate.ts',
    'apps/mobile/src/components/tutor-screen.tsx',
    'tools/school/quiz-service.mjs',
    'tools/school/license-service.mjs',
    'apps/mobile/src/preview/use-level-five-preview.ts',
    'packages/theory/src/counterpoint.ts',
    'apps/mobile/src/choir/runner.ts',
    'apps/mobile/src/microphone/health.ts',
    'apps/mobile/src/components/lesson-completion-status.tsx',
    'apps/mobile/src/app/lesson.tsx',
    'apps/mobile/src/state/learning.ts',
    'supabase/functions/learning-sync/index.ts',
  ])
    assert.ok(digests[file], file);
  const result = inspectInventory(inventory, { digests, now });
  assert.equal(result.legalApprovalInferred, false);
  assert.equal(result.componentCount, 10);
  assert.ok(result.scopes.certificates.missing.includes('certificates.classification'));
});
test('release, legal, storefront and beta entry points keep AI evidence in the blocking path', async () => {
  assert.ok(actualReleaseProblems('store').some((p) => p.startsWith('aiAct.')));
  assert.ok(actualBetaProblems('web').some((p) => p.startsWith('legal.aiAct.')));
  assert.ok((await actualProblems()).some((p) => p.startsWith('store.aiAct.')));
  const manifest = JSON.parse(
    readFileSync(new URL('../../apps/mobile/legal-readiness.json', import.meta.url), 'utf8'),
  );
  assert.equal(manifest.approvals.aiActReview.approved, false);
  for (const args of [
    ['tools/ai-act/check.mjs', '--release', '--scope', 'school'],
    ['tools/ai-act/check.mjs', '--release', '--scope', 'certificates'],
    ['tools/check-legal-release.mjs', '--release'],
  ]) {
    const r = spawnSync(process.execPath, args, { encoding: 'utf8' });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /blocked/i);
  }
  const invalid = spawnSync(process.execPath, ['tools/ai-act/check.mjs', '--scope', 'typo'], {
    encoding: 'utf8',
  });
  assert.equal(invalid.status, 1);
});
for (const locale of ['de', 'en-US', 'en-GB'])
  test(`${locale}: report marks drafts, escapes text and keeps complete translations`, () => {
    assert.deepEqual(
      Object.keys(AI_REVIEW_MESSAGES[locale]).sort(),
      Object.keys(AI_REVIEW_MESSAGES.de).sort(),
    );
    const data = structuredClone(inventory);
    data.components[0].purpose[locale] = '<script>alert(1)</script>';
    const report = reviewHtml(data, inspectInventory(data, { digests, now }), locale);
    assert.ok(report.includes(AI_REVIEW_MESSAGES[locale].draft));
    assert.ok(!report.includes('<script>'));
    assert.ok(report.includes('&lt;script&gt;'));
    assert.ok(report.includes('default-src'));
    assert.ok(report.includes('learner-planner'));
    assert.ok(report.includes('eur-lex.europa.eu'));
  });
test('bundle gate rejects AI review report text without exposing it in public exports', async (t) => {
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = mkdtempSync(join(tmpdir(), 'harmonia-ai-act-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(
    join(dir, 'app.js'),
    'globalThis.label=' + JSON.stringify(AI_REVIEW_MESSAGES.de.intro) + ';',
  );
  const result = spawnSync(process.execPath, ['tools/check-public-bundle.mjs', dir], {
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /P4.17/);
});
