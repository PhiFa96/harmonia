import { lessonDay } from '../packages/content/src/calendar.ts';

/** Current Berlin day at 20:59:30; a fixed UTC hour would change at DST boundaries. */
export function lateBerlinReminderInstant(reference: number): number {
  const day = lessonDay(reference, 'Europe/Berlin');
  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  for (const hour of [18, 19]) {
    const candidate = Date.parse(`${day}T${String(hour)}:59:30Z`);
    if (clock.format(candidate) === '20:59:30') return candidate;
  }
  throw new Error('Berlin reminder fixture time unavailable');
}
