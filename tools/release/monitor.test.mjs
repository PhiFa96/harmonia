import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOperations } from './monitor.mjs';
const now = Date.parse('2026-10-15T12:00:00.000Z');
const snapshot = () => ({
  version: 1,
  asOf: new Date(now).toISOString(),
  windowStart: '2026-10-15T11:00:00.000Z',
  services: [],
  ai: { spentNanoUsd: '0', reservedNanoUsd: '0', failedRequestsHour: 0 },
  billingPendingOverHour: 0,
  privacyPendingOverDay: 0,
});
test('no observations and no budget remain unknown instead of a healthy zero', () => {
  const result = evaluateOperations(snapshot(), {}, now);
  assert.equal(result.serverSignalsHealthy, false);
  assert.deepEqual(
    result.alerts.map((row) => row.signal),
    ['cost_budget_unconfigured', 'sync_sample_missing'],
  );
});
test('sync threshold uses observed accepted/server-failure responses, with rejected requests separate', () => {
  const input = snapshot();
  input.services = [
    { service: 'learning-sync', requests: 100, failures: 1, rejected: 0, max_response_ms: 15 },
  ];
  assert.equal(
    evaluateOperations(input, { dailyTutorBudgetNanoUsd: '1000000000' }, now).serverSignalsHealthy,
    true,
  );
  input.services[0].failures = 2;
  const result = evaluateOperations(input, { dailyTutorBudgetNanoUsd: '1000000000' }, now);
  assert.equal(result.alerts[0].signal, 'sync_failure_rate');
  assert.equal(result.alerts[0].denominator, 100);
  input.services[0].rejected = 1;
  assert.ok(
    evaluateOperations(input, { dailyTutorBudgetNanoUsd: '1000000000' }, now).alerts.some(
      (row) => row.signal === 'sync_sample_missing',
    ),
  );
});
test('cost alarms include reservations with exact integer arithmetic and queue deadlines', () => {
  const input = snapshot();
  input.ai.spentNanoUsd = '9007199254740993';
  input.ai.reservedNanoUsd = '1';
  input.billingPendingOverHour = 1;
  input.privacyPendingOverDay = 2;
  const result = evaluateOperations(input, { dailyTutorBudgetNanoUsd: '9007199254740993' }, now);
  for (const signal of ['tutor_budget', 'billing_backlog', 'privacy_backlog'])
    assert.ok(result.alerts.some((row) => row.signal === signal));
});
test('stale, contradictory, duplicate or identity-bearing operational inputs are rejected', () => {
  assert.throws(
    () => evaluateOperations({ ...snapshot(), asOf: '2026-10-14T12:00:00.000Z' }, {}, now),
    /stale/,
  );
  assert.throws(
    () => evaluateOperations({ ...snapshot(), email: 'must never be included' }, {}, now),
    /Unexpected/,
  );
  const input = snapshot();
  input.services = [
    { service: 'learning-sync', requests: 1, failures: 2, rejected: 0, max_response_ms: 1 },
  ];
  assert.throws(() => evaluateOperations(input, {}, now), /Contradictory/);
  input.services[0].failures = 0;
  input.services.push({ ...input.services[0] });
  assert.throws(() => evaluateOperations(input, {}, now), /aggregation/);
});
