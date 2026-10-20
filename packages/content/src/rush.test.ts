import { describe, expect, it } from 'vitest';
import { catalogue } from './authoring.ts';
import { catalogue as published } from './published.ts';
import {
  rushPool,
  rushQuestion,
  gradeRush,
  rushRequestSchema,
  rushLeaderboardSchema,
  rushBankIdentity,
  DEFAULT_RUSH_POLICY,
} from './rush.ts';
import { createRng, generateExercise, expectedAnswer } from '@harmonia/exercises';
describe('Theory Rush engine protocol', () => {
  const pool = rushPool(catalogue);
  it('preserves records when only daily quotas or the XP cap change', () => {
    const original = rushBankIdentity(pool, DEFAULT_RUSH_POLICY);
    expect(
      rushBankIdentity(pool, { ...DEFAULT_RUSH_POLICY, freeDaily: 2, paidDaily: 50, xpCap: 20 }),
    ).toBe(original);
    expect(rushBankIdentity(pool, { ...DEFAULT_RUSH_POLICY, difficultyEvery: 6 })).not.toBe(
      original,
    );
    expect(rushBankIdentity(pool, { ...DEFAULT_RUSH_POLICY, minAnswerMs: 500 })).not.toBe(original);
  });
  it('uses no unpublished production source and has a bounded diverse preview bank', () => {
    expect(rushPool(published)).toEqual([]);
    expect(pool.length).toBeGreaterThan(20);
    expect(pool.length).toBeLessThanOrEqual(256);
    expect(new Set(pool.map((p) => p.spec.type)).size).toBeGreaterThan(5);
    expect(
      pool.some((p) => p.spec.type === 'CHORD_IDENTIFY' && p.spec.params.presentation === 'aural'),
    ).toBe(false);
  });
  it('reproduces a server seed and ordinal exactly, with nondecreasing stages', () => {
    let previous = 0;
    for (let i = 0; i < 100; i++) {
      const q = rushQuestion(pool, 'server-seed', i);
      expect(q).toEqual(rushQuestion(pool, 'server-seed', i));
      expect(q.difficulty).toBeGreaterThanOrEqual(previous);
      previous = q.difficulty;
      const item = generateExercise(q.spec, createRng(q.seed));
      expect(gradeRush(q, expectedAnswer(item))).toMatchObject({
        correct: true,
        validAnswer: true,
      });
      expect(gradeRush(q, 'forged-answer')).toMatchObject({ validAnswer: false });
    }
    expect(previous).toBeGreaterThan(1);
    expect(rushQuestion(pool, 'different-seed', 0).seed).not.toBe(
      rushQuestion(pool, 'server-seed', 0).seed,
    );
  });
  it('rejects client seeds, correctness flags, score claims, timestamps and invalid indexes', () => {
    const b = {
      action: 'answer',
      id: 'b3010000-0000-4000-8000-000000000001',
      index: 0,
      answer: 'C',
    };
    expect(rushRequestSchema.safeParse(b).success).toBe(true);
    for (const extra of [
      { seed: 'fake' },
      { correct: true },
      { score: 9999 },
      { finishedAt: 1 },
      { index: -1 },
      { index: 0.5 },
    ])
      expect(rushRequestSchema.safeParse({ ...b, ...extra }).success).toBe(false);
  });
  it('rejects profile fields or identifiers in minimal leaderboards', () => {
    const b = {
      mode: 'three',
      scope: 'day',
      bank: 'a'.repeat(64),
      available: true,
      entries: [{ rank: 1, score: 10, isYou: false }],
    };
    expect(rushLeaderboardSchema.safeParse(b).success).toBe(true);
    for (const extra of [
      { user_id: 'private' },
      { name: 'private' },
      { email: 'private@example.invalid' },
    ])
      expect(
        rushLeaderboardSchema.safeParse({ ...b, entries: [{ ...b.entries[0], ...extra }] }).success,
      ).toBe(false);
  });
});
