import { describe, expect, it } from 'vitest';
import { duelRequestSchema, duelViewSchema, rateDuelPair } from './duel.ts';

const players = [
  { userId: 'a', rating: 1500, deviation: 350, volatility: 0.06, matches: 0, score: 80 },
  { userId: 'b', rating: 1500, deviation: 350, volatility: 0.06, matches: 0, score: 20 },
] as const;
describe('duel result', () => {
  it('updates both live players from the same pre-game Glicko-2 snapshot', () => {
    const [winner, loser] = rateDuelPair(players, 1000);
    expect(winner?.rating).toBeGreaterThan(1500);
    expect(loser?.rating).toBeLessThan(1500);
    expect((winner?.rating ?? 0) + (loser?.rating ?? 0)).toBeCloseTo(3000, 5);
    expect(winner?.attempts).toBe(1);
    expect(loser?.attempts).toBe(1);
    expect(winner?.updatedAt).toBe(1000);
  });
  it('keeps equal ratings on a draw and rejects duplicate participants', () => {
    const [left, right] = rateDuelPair([{ ...players[0], score: 20 }, players[1]], 1000);
    expect(left?.rating).toBeCloseTo(1500, 5);
    expect(right?.rating).toBeCloseTo(1500, 5);
    expect(() => rateDuelPair([players[0], { ...players[1], userId: 'a' }], 1000)).toThrow();
  });
  it('rejects client-supplied correctness, points, seed and score', () => {
    const answer = {
      action: 'answer',
      game: '11111111-1111-4111-8111-111111111111',
      index: 0,
      answer: 'C',
    };
    expect(duelRequestSchema.safeParse(answer).success).toBe(true);
    expect(duelRequestSchema.safeParse({ ...answer, correct: true }).success).toBe(false);
    expect(duelRequestSchema.safeParse({ ...answer, points: 50 }).success).toBe(false);
    expect(duelRequestSchema.safeParse({ ...answer, seed: 'forged' }).success).toBe(false);
    expect(
      duelViewSchema.safeParse({ phase: 'queue', joinedAt: 1000, userId: 'other' }).success,
    ).toBe(false);
  });
});
