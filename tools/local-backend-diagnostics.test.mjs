import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startupFailureKinds, startupMigrationDetails } from './local-backend-diagnostics.mjs';
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
