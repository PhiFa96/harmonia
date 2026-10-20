import { describe, expect, it } from 'vitest';
import { catalogue } from './authoring.ts';
import { catalogue as published } from './published.ts';
import { rushPool } from './rush.ts';
import { createRng, generateExercise } from '@harmonia/exercises';
import {
  addPuzzleDays,
  dailyPuzzleForDay,
  nextPuzzleReset,
  puzzleViewSchema,
} from './daily-puzzle.ts';

const bank = 'a'.repeat(64);
describe('daily puzzles', () => {
  it('uses only released material in production and freezes a deterministic preview task', () => {
    expect(rushPool(published)).toEqual([]);
    const pool = rushPool(catalogue);
    const first = dailyPuzzleForDay(pool, bank, '2026-10-19');
    expect(first).toEqual(dailyPuzzleForDay(pool, bank, '2026-10-19'));
    expect(first?.difficulty).toBe(1);
    const week = Array.from(
      { length: 7 },
      (_, index) =>
        dailyPuzzleForDay(pool, bank, addPuzzleDays('2026-10-19', index))?.difficulty ?? 0,
    );
    expect(week).toEqual([...week].sort((a, b) => a - b));
    expect(week.at(-1)).toBeGreaterThan(week[0] ?? 0);
    for (let index = 0; index < 42; index++) {
      const entry = dailyPuzzleForDay(pool, bank, addPuzzleDays('2026-10-19', index));
      expect(entry).not.toBeNull();
      if (entry) expect(generateExercise(entry.spec, createRng(entry.seed))).toBeDefined();
    }
  });
  it.each([
    ['2026-03-28T12:00:00Z', '2026-03-28T23:00:00Z'],
    ['2026-03-29T12:00:00Z', '2026-03-29T22:00:00Z'],
    ['2026-10-24T12:00:00Z', '2026-10-24T22:00:00Z'],
    ['2026-10-25T12:00:00Z', '2026-10-25T23:00:00Z'],
  ])('finds Berlin midnight across DST from %s', (now, next) => {
    expect(nextPuzzleReset(Date.parse(now), 'Europe/Berlin')).toBe(Date.parse(next));
  });
  it('rejects a completed view that still exposes the question', () => {
    const task = dailyPuzzleForDay(rushPool(catalogue), bank, '2026-10-19');
    expect(
      puzzleViewSchema.safeParse({
        day: '2026-10-19',
        resetAt: 1,
        available: true,
        difficulty: 1,
        streak: 1,
        completed: true,
        correct: true,
        question: { spec: task?.spec, seed: task?.seed },
      }).success,
    ).toBe(false);
  });
});
