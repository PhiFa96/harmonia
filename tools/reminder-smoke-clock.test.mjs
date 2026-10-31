import test from 'node:test';
import assert from 'node:assert/strict';
import { lateBerlinReminderInstant } from './reminder-smoke-clock.ts';
import { reminderTTL } from '../packages/content/src/reminders.ts';

for (const [reference, expected] of [
  ['2026-01-15T12:00:00Z', '2026-01-15T19:59:30.000Z'],
  ['2026-07-15T12:00:00Z', '2026-07-15T18:59:30.000Z'],
  ['2026-03-28T12:00:00Z', '2026-03-28T19:59:30.000Z'],
  ['2026-03-29T12:00:00Z', '2026-03-29T18:59:30.000Z'],
  ['2026-10-24T12:00:00Z', '2026-10-24T18:59:30.000Z'],
  ['2026-10-25T12:00:00Z', '2026-10-25T19:59:30.000Z'],
  ['2026-10-25T23:30:00Z', '2026-10-26T19:59:30.000Z'],
]) {
  test(`${reference}: the smoke fixture is 30 seconds before Berlin quiet hours`, () => {
    const at = lateBerlinReminderInstant(Date.parse(reference));
    assert.equal(new Date(at).toISOString(), expected);
    assert.equal(reminderTTL(at, 'Europe/Berlin'), 30);
    assert.equal(reminderTTL(at + 30_000, 'Europe/Berlin'), 0);
  });
}
