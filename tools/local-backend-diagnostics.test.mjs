import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startupFailureKinds } from './local-backend-diagnostics.mjs';
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
