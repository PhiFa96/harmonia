import { describe, expect, it } from 'vitest';
import { adaptiveOrder, candidateProbability } from './adaptive.ts';
import type { RatedState, RatingSnapshot } from './rating-period.ts';
const rated = (rating: number, updatedAt = 0): RatedState => ({
  rating,
  deviation: 40,
  volatility: 0.06,
  attempts: 20,
  updatedAt,
});
const candidates = ['easy', 'target', 'hard'].map((bucketId) => ({
  bucketId,
  skillIds: ['skill'],
}));
const snapshot: RatingSnapshot = {
  skills: { skill: rated(1700) },
  buckets: {
    easy: rated(900),
    target: rated(1480),
    hard: rated(2100),
  },
};
describe('rating-based selection', () => {
  it('selects the 70–85% candidate before an easy win or an overwhelming question', () => {
    const target = candidates[1];
    if (!target) throw new Error('Missing candidate');
    const p = candidateProbability(snapshot, target, 0);
    expect(p).toBeGreaterThanOrEqual(0.7);
    expect(p).toBeLessThanOrEqual(0.85);
    expect(adaptiveOrder(candidates, snapshot, 0)[0]?.bucketId).toBe('target');
    expect(candidates.map((c) => c.bucketId)).toEqual(['easy', 'target', 'hard']);
  });
  it('chooses the closest available option when the target is unreachable', () => {
    const pool = [
      { bucketId: 'hard', skillIds: ['skill'] },
      { bucketId: 'target', skillIds: ['skill'] },
    ];
    expect(
      adaptiveOrder(pool, { ...snapshot, skills: { skill: rated(700) } }, 0)[0]?.bucketId,
    ).toBe('target');
    expect(
      adaptiveOrder(pool, { ...snapshot, skills: { skill: rated(2500) } }, 0)[0]?.bucketId,
    ).toBe('hard');
  });
  it('preserves stable order with unknown skills and tied predictions', () => {
    expect(adaptiveOrder(candidates, { skills: {}, buckets: {} }, 0)).toEqual(candidates);
    expect(
      candidateProbability(snapshot, { bucketId: 'target', skillIds: ['missing'] }, 0),
    ).toBeNull();
    expect(candidateProbability(snapshot, { bucketId: 'target', skillIds: [] }, 0)).toBeNull();
    expect(adaptiveOrder(candidates, { skills: snapshot.skills, buckets: {} }, 0)).toEqual(
      candidates,
    );
  });
  it('uses all mapped skills conservatively and grows idle uncertainty', () => {
    const candidate = { bucketId: 'target', skillIds: ['skill', 'second', 'skill'] };
    const mixed = { ...snapshot, skills: { ...snapshot.skills, second: rated(1200) } };
    const target = candidates[1];
    if (!target) throw new Error('Missing candidate');
    const original = candidateProbability(snapshot, target, 0);
    const combined = candidateProbability(mixed, candidate, 0);
    if (original === null || combined === null) throw new Error('Missing prediction');
    expect(combined).toBeLessThan(original);
    expect(candidateProbability(snapshot, target, 365 * 86400000)).toBeLessThan(original);
    expect(() => adaptiveOrder(candidates, snapshot, -1)).toThrow();
  });
});
