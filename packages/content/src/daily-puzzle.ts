import { z } from 'zod';
import { createRng } from '@harmonia/exercises';
import { lessonDay, timeZoneSchema } from './calendar.ts';
import { exerciseSpecSchema } from './schema.ts';
import type { RushPool } from './rush.ts';

export const puzzleDaySchema = z.iso.date();
export const puzzleRequestSchema = z
  .object({
    action: z.literal('answer'),
    day: puzzleDaySchema,
    timeZone: timeZoneSchema,
    answer: z.string().min(1).max(4096),
  })
  .strict();
export type PuzzleRequest = z.infer<typeof puzzleRequestSchema>;
const questionSchema = z
  .object({ spec: exerciseSpecSchema, seed: z.string().min(1).max(128) })
  .strict();
export const puzzleViewSchema = z
  .object({
    day: puzzleDaySchema,
    resetAt: z.number().int().nonnegative(),
    available: z.boolean(),
    difficulty: z.number().int().min(1).max(5).nullable(),
    streak: z.number().int().nonnegative(),
    completed: z.boolean(),
    correct: z.boolean().nullable(),
    question: questionSchema.nullable(),
  })
  .strict()
  .superRefine((view, context) => {
    if (
      view.completed !== (view.correct !== null) ||
      (view.completed && view.question !== null) ||
      (!view.available && (view.completed || view.question !== null || view.difficulty !== null)) ||
      (view.available && !view.completed && (view.question === null || view.difficulty === null))
    )
      context.addIssue({ code: 'custom', message: 'Invalid puzzle view' });
  });
export type PuzzleView = z.infer<typeof puzzleViewSchema>;

export function addPuzzleDays(day: string, count: number) {
  puzzleDaySchema.parse(day);
  if (!Number.isSafeInteger(count) || Math.abs(count) > 3660)
    throw new RangeError('Invalid day offset');
  const date = new Date(day + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

/** Published catalogue entries are the curated source; every date freezes one deterministic task. */
export function dailyPuzzleForDay(pool: RushPool, bank: string, day: string) {
  puzzleDaySchema.parse(day);
  if (!/^[a-f0-9]{64}$/.test(bank)) throw new RangeError('Invalid puzzle bank');
  const weekday = (new Date(day + 'T12:00:00Z').getUTCDay() + 6) % 7;
  const target = 1 + Math.floor((weekday * 4) / 6);
  const eligible = pool.filter((entry) => entry.difficulty <= target);
  if (!eligible.length) return null;
  const difficulty = Math.max(...eligible.map((entry) => entry.difficulty));
  const candidates = eligible.filter((entry) => entry.difficulty === difficulty);
  const selected = createRng(bank + ':' + day).pick(candidates);
  return { day, bank, spec: selected.spec, seed: bank + ':' + day, difficulty };
}

/** Binary search finds the next local date boundary, including 23/25-hour DST days. */
export function nextPuzzleReset(now: number, timeZone: string) {
  timeZoneSchema.parse(timeZone);
  if (!Number.isSafeInteger(now) || now < 0) throw new RangeError('Invalid clock');
  const today = lessonDay(now, timeZone);
  let low = now,
    high = now + 48 * 60 * 60 * 1000;
  while (high - low > 1) {
    const middle = low + Math.floor((high - low) / 2);
    if (lessonDay(middle, timeZone) === today) low = middle;
    else high = middle;
  }
  return high;
}
