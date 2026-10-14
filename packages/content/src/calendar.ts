import { z } from 'zod';
export const timeZoneSchema = z
  .string()
  .min(1)
  .max(128)
  .refine((zone) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: zone });
      return true;
    } catch {
      return false;
    }
  });
const formatters = new Map<string, Intl.DateTimeFormat>();
export function lessonDay(time: number, timeZone: string) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    if (formatters.size >= 128) formatters.clear();
    formatter = new Intl.DateTimeFormat('en', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    formatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(time);
  const value = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}
