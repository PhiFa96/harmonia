import { z } from 'zod';
import { lessonDay } from './calendar.ts';
import type { MotivationPreferences } from './motivation.ts';
export function localClock(at: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(at);
  return `${parts.find((p) => p.type === 'hour')?.value ?? ''}:${parts.find((p) => p.type === 'minute')?.value ?? ''}`;
}
/** Alle angebotenen Zeiten liegen außerhalb der Ruhezeit 21–08 Uhr. */
export function reminderDue(now: number, prefs: MotivationPreferences, practiced: boolean) {
  const clock = localClock(now, prefs.timeZone);
  return prefs.reminderConsent && !practiced && clock >= prefs.reminderTime && clock < '21:00';
}
function localInstant(date: string, time: string, timeZone: string) {
  const wanted = Date.parse(`${date}T${time}:00Z`);
  let result = wanted;
  for (let n = 0; n < 4; n++) {
    const rendered = Date.parse(
      `${lessonDay(result, timeZone)}T${localClock(result, timeZone)}:00Z`,
    );
    const next = result + wanted - rendered;
    if (next === result) break;
    result = next;
  }
  return lessonDay(result, timeZone) === date && localClock(result, timeZone) === time
    ? result
    : null;
}
/** Verspätete Push-Nachrichten verfallen spätestens zum Beginn der Ruhezeit. */
export function reminderTTL(now: number, timeZone: string) {
  const end = localInstant(lessonDay(now, timeZone), '21:00', timeZone);
  return end === null ? 0 : Math.max(0, Math.min(1800, Math.floor((end - now) / 1000)));
}
export function reminderTimes(
  now: number,
  prefs: MotivationPreferences,
  practiced: boolean,
  lastRemindedAt = 0,
) {
  if (!prefs.reminderConsent) return [];
  const today = lessonDay(now, prefs.timeZone),
    output: { at: number; date: string }[] = [];
  for (let n = 0; n < 8 && output.length < 7; n++) {
    const date = new Date(Date.parse(`${today}T12:00:00Z`) + n * 86400000)
      .toISOString()
      .slice(0, 10);
    if (
      n === 0 &&
      (practiced || (lastRemindedAt > 0 && lessonDay(lastRemindedAt, prefs.timeZone) === today))
    )
      continue;
    const at = localInstant(date, prefs.reminderTime, prefs.timeZone);
    if (at !== null && at > now && at - lastRemindedAt >= 23 * 3600000) output.push({ at, date });
  }
  return output;
}
export const reminderPlanSchema = z
  .object({
    lastRemindedAt: z.number().int().nonnegative(),
    entries: z
      .object({
        id: z.string(),
        at: z.number().int().nonnegative(),
        owner: z.string(),
        date: z.string(),
      })
      .strict()
      .array()
      .max(7),
  })
  .strict();
export type ReminderPlan = z.infer<typeof reminderPlanSchema>;
