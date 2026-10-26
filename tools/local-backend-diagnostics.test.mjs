import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  startupFailureKinds,
  startupMigrationDetails,
  startupRegistrySources,
} from './local-backend-diagnostics.mjs';
test('startup classifications reveal no log data or credentials', () => {
  const secret = 'synthetic-sensitive-fixture',
    email = 'person@example.test';
  const report = startupFailureKinds(
    'toomanyrequests: registry rejected ' +
      secret +
      ' ' +
      email +
      '\nERROR: migration failed SQLSTATE 42P01',
  );
  assert.deepEqual(report, ['registry_rate_limit', 'migration_failed']);
  assert.ok(!JSON.stringify(report).includes(secret));
  assert.ok(!JSON.stringify(report).includes(email));
});
test('migration diagnostics whitelist project filenames and SQLSTATE without copying private errors', () => {
  const detail = startupMigrationDetails(
    'Applying migration 20261020020000_knowledge_search_v2.sql...\n' +
      'ERROR: synthetic-sensitive-fixture person@example.test (SQLSTATE 42P01)\n' +
      'Applying migration private-secret.sql...\nSQLSTATE: 42P01\nSQLSTATE=23505',
    ['20261020020000_knowledge_search_v2.sql'],
  );
  assert.deepEqual(detail, {
    migration: '20261020020000_knowledge_search_v2.sql',
    states: ['42P01', '23505'],
  });
  assert.deepEqual(startupMigrationDetails('arbitrary private output', []), {
    migration: null,
    states: [],
  });
});
test('unknown startup failures stay unknown and template failures remain diagnosable', () => {
  assert.deepEqual(startupFailureKinds('unrecognized private error'), [
    'unclassified_startup_failure',
  ]);
  assert.deepEqual(
    startupFailureKinds(
      'Erwartete eigene E-Mail-Vorlage fehlt; keine anderen Dateien werden geändert.',
    ),
    ['template_verification_failed'],
  );
  assert.deepEqual(
    startupFailureKinds(
      'FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory',
    ),
    ['heap_exhausted'],
  );
});
test('image diagnostics distinguish slim refs from standard registry candidates without copying URLs', () => {
  assert.deepEqual(
    startupRegistrySources(
      'https://ghcr.io/supabase/cli/auth:v1@sha256:private-digest\n' +
        'https://public.ecr.aws/supabase/cli/auth:v1?token=private-token\n' +
        'public.ecr.aws/supabase/kong:private-tag ghcr.io/supabase/kong:private-tag\n' +
        'registry-1.docker.io/v2/supabase/kong/manifests/private-tag\n' +
        'private-registry.example.test/secret-image:v1',
    ),
    ['ghcr_slim', 'ecr_slim', 'ghcr_standard', 'ecr_standard', 'docker_hub'],
  );
  assert.deepEqual(startupRegistrySources('private-registry.example.test/private-image'), []);
  assert.deepEqual(startupFailureKinds('registry ghcr.io: forbidden (403)'), [
    'registry_access_denied',
  ]);
});
test('diagnostic command never emits private startup log lines, including registry credentials', () => {
  const directory = mkdtempSync(join(tmpdir(), 'harmonia-diagnostics-'));
  try {
    const path = join(directory, 'private-start.log');
    writeFileSync(
      path,
      'toomanyrequests: https://synthetic-user:private-password@ghcr.io/supabase/cli/auth:private-tag\n' +
        'Authorization: Bearer private-token\nprivate-person@example.test\n' +
        'public.ecr.aws/supabase/kong:private-tag',
      { mode: 0o600 },
    );
    const result = spawnSync(
      process.execPath,
      [new URL('./local-backend-diagnostics.mjs', import.meta.url).pathname, path],
      { encoding: 'utf8', env: { ...process.env, PATH: '' }, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, '');
    assert.equal(
      result.stderr,
      '::error::Supabase startup diagnostic: registry_rate_limit\n' +
        '::notice::Image sources referenced: ghcr_slim, ecr_standard\n',
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
