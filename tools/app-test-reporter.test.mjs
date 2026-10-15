import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { executionAnnotation } = createRequire(
  new URL('../apps/mobile/package.json', import.meta.url),
)('./jest/ci-execution-reporter.js');
test('worker termination is annotated without error contents or credentials', () => {
  const output = executionAnnotation(
    '/repo/apps/mobile/__tests__/flow.test.tsx',
    { message: 'SIGKILL private-fixture-token person@example.test' },
    '/repo',
  );
  assert.match(output, /worker_sigkill/);
  assert.match(output, /file=apps\/mobile\/__tests__\/flow.test.tsx/);
  assert.ok(!output.includes('private-fixture-token') && !output.includes('person@example.test'));
});
test('unknown suite errors remain generic and annotation properties are escaped', () => {
  const output = executionAnnotation(
    '/repo/test,other.js',
    { message: 'private unrecognized details' },
    '/repo',
  );
  assert.match(output, /file=test%2Cother.js/);
  assert.match(output, /suite_execution_error/);
  assert.ok(!output.includes('unrecognized'));
  assert.ok(
    !executionAnnotation('/outside/private.js', { message: 'error' }, '/repo').includes('file='),
  );
});
