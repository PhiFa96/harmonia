import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { missingDeviceEvidence } from './release.mjs';
const input = JSON.parse(readFileSync(new URL('./device-readiness.json', import.meta.url), 'utf8'));
const ready = () => ({
  devices: input.devices.map((device, i) => ({
    ...device,
    deviceModel: 'synthetic-' + i,
    osVersion: 'test-only',
    testedAt: '2026-10-15',
    reviewer: 'fixture',
    evidenceReference: 'own-synthetic-evidence',
    startupMs: 1000,
    lessonOpenMs: 500,
    audibleLatencyMs: 20,
    checks: Object.fromEntries(Object.keys(device.checks).map((key) => [key, true])),
  })),
});
test('unexecuted device slots keep release evidence open', () => {
  assert.ok(missingDeviceEvidence(input).length > 0);
});
test('synthetic complete fields can exercise only the validator', () => {
  assert.deepEqual(missingDeviceEvidence(ready()), []);
});
test('exact budget limits and invalid numbers do not pass', () => {
  for (const [field, values] of [
    ['startupMs', [3000, NaN]],
    ['lessonOpenMs', [1000, Infinity]],
    ['audibleLatencyMs', [50, -1]],
  ])
    for (const value of values) {
      const sample = ready();
      sample.devices[0][field] = value;
      assert.ok(missingDeviceEvidence(sample).includes('devices[0].' + field));
    }
});
test('duplicates and a missing reader check cannot claim a four-device test', () => {
  const sample = ready();
  sample.devices[1].deviceModel = sample.devices[0].deviceModel;
  sample.devices[3].checks.screenReader = false;
  const missing = missingDeviceEvidence(sample);
  assert.ok(missing.includes('four distinct physical device models'));
  assert.ok(missing.includes('devices[3].checks.screenReader'));
});
