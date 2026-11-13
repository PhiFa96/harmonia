import test from 'node:test';
import assert from 'node:assert/strict';
import { appendFileSync, cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { readInventory, runtimeDigests, snapshotHash } from './ai-act/model.mjs';
import { assessmentTemplate, inspectAssessment } from './ai-act/handoff.mjs';
import { certificateDigests, certificateSourceHash } from './certificates/binding.mjs';
import { createCertificateService } from './certificates/service.mjs';
import { startFixture, fixtureAnswers } from './certificates/test-fixture.mjs';

const repository = fileURLToPath(new URL('..', import.meta.url));
const inventory = readInventory();
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'harmonia-import-binding-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const path of [
    'tools',
    'packages',
    'apps/mobile/src',
    'apps/mobile/assets',
    'apps/mobile/package.json',
    'apps/mobile/tsconfig.json',
    'apps/mobile/app.config.ts',
    'apps/mobile/metro.config.js',
    'apps/mobile/legal-readiness.json',
    'supabase/functions',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'package.json',
    '.nvmrc',
    ...inventory.components.flatMap((c) => c.files),
    ...Object.keys(certificateDigests()).filter((p) => p.includes('/node_modules/')),
  ]) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    cpSync(join(repository, path), join(root, path), {
      recursive: true,
      filter: (path) => !['node_modules', 'dist', '.expo', 'artifacts'].includes(basename(path)),
    });
  }
  return root;
}

for (const path of [
  'apps/mobile/src/components/tutor-answer.tsx',
  'apps/mobile/src/state/settings.ts',
  'packages/ui/src/native/button.tsx',
  'tools/beta/study.mjs',
])
  test(`AI review becomes outdated after a transitive source edit: ${path}`, (t) => {
    const root = fixture(t);
    const before = runtimeDigests(inventory, { root });
    const worksheet = assessmentTemplate(inventory, 'certificates', { digests: before });
    appendFileSync(join(root, path), '\n// Synthetic isolated binding change.\n');
    const after = runtimeDigests(inventory, { root });
    assert.notEqual(snapshotHash(inventory, after), snapshotHash(inventory, before));
    assert.throws(() => inspectAssessment(inventory, worksheet, { digests: after }), /Outdated/);
  });

test('an actual AI model edit invalidates a saved certificate after restart', (t) => {
  const root = fixture(t);
  const database = join(root, 'test.sqlite');
  const now = () => Date.UTC(2026, 10, 13, 12);
  const before = certificateSourceHash(certificateDigests({ root }));
  let service = createCertificateService(database, { now, sourceHash: before });
  t.after(() => service.close());
  let run = startFixture(service, 'owner', { profile: 'certificate-draft-1', locale: 'de' });
  for (const [index, answer] of fixtureAnswers(database, run.id).entries())
    run = service.answer('owner', { id: run.id, index, answer: answer.right, locale: 'de' });
  const receipt = service.receipt('owner', run.id);
  service.close();
  appendFileSync(
    join(root, 'tools/ai-act/model.mjs'),
    '\n// Synthetic isolated legal-logic change.\n',
  );
  const after = certificateSourceHash(certificateDigests({ root }));
  service = createCertificateService(database, { now, sourceHash: after });
  assert.throws(() => service.receipt('owner', run.id), /outdated/);
  assert.equal(service.verify({ code: receipt.code }).status, 'outdatedCode');
  service.erase('owner');
  assert.equal(service.state('owner', 'de').attempts.length, 0);
});
