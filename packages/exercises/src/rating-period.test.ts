import { describe, expect, it } from 'vitest';
import { expectedRatingScore, INITIAL_RATING } from './glicko2.ts';
import { createRng } from '@harmonia/theory';
import { ratingBucket, RATING_PARAMETERS } from './rating-buckets.ts';
import { ratePeriod } from './rating-period.ts';
import type { RatedState } from './rating-period.ts';

describe('parameter profiles', () => {
  it('covers all 26 types and is stable across property order and set ordering', () => {
    expect(Object.keys(RATING_PARAMETERS)).toHaveLength(26);
    const a = ratingBucket(
      {
        type: 'CHORD_BUILD',
        params: { types: ['major', 'minor'], inversions: [0, 1], clefs: ['treble'] },
      },
      13,
    );
    const b = ratingBucket(
      {
        type: 'CHORD_BUILD',
        params: { clefs: ['treble'], inversions: [1, 0], types: ['minor', 'major'] },
      },
      13,
    );
    expect(a).toBe(b);
    expect(a).not.toBe(
      ratingBucket(
        {
          type: 'CHORD_BUILD',
          params: { clefs: ['treble'], inversions: [1, 0, 0], types: ['minor', 'major'] },
        },
        13,
      ),
    );
    expect(a).not.toBe(
      ratingBucket(
        {
          type: 'CHORD_BUILD',
          params: { types: ['major', 'minor'], inversions: [0, 1], clefs: ['treble'] },
        },
        14,
      ),
    );
    expect(a).not.toBe(
      ratingBucket(
        {
          type: 'CHORD_BUILD',
          params: { types: ['major', 'minor'], inversions: [0, 2], clefs: ['treble'] },
        },
        13,
      ),
    );
  });
  it('rejects silently added fields and invalid versions', () => {
    expect(() =>
      ratingBucket({ type: 'NOTE_NAME', params: { locale: 'de' } } as never, 1),
    ).toThrow();
    expect(() => ratingBucket({ type: 'NOTE_NAME', params: {} }, NaN)).toThrow();
  });
});
describe('lesson rating periods', () => {
  it('learns relative abilities and item difficulties together in seeded simulations', () => {
    const rng = createRng('joint-rating-convergence');
    const abilities = [1100, 1300, 1500, 1700, 1900],
      difficulties = [1100, 1500, 1900];
    const learners: Record<string, RatedState>[] = abilities.map(() => ({}));
    let buckets: Record<string, RatedState> = {};
    for (let period = 0; period < 150; period++) {
      for (const index of rng.shuffle([0, 1, 2, 3, 4])) {
        const ability = abilities[index];
        if (ability === undefined) throw new Error('Simulation ability missing');
        const observations = difficulties.flatMap((difficulty, bucket) =>
          Array.from({ length: 10 }, () => ({
            bucketId: String(bucket),
            skillIds: ['skill'],
            correct: rng.next() < 1 / (1 + Math.exp(-(ability - difficulty) / 173.7178)),
          })),
        );
        const next = ratePeriod(
          { skills: learners[index] ?? {}, buckets },
          observations,
          period * 86400000,
        );
        learners[index] = { ...learners[index], ...next.skills };
        buckets = { ...buckets, ...next.buckets };
      }
    }
    const estimates = learners.map((states) => states['skill']?.rating ?? 0);
    expect(estimates).toEqual([...estimates].sort((a, b) => a - b));
    expect((buckets['2']?.rating ?? 0) - (buckets['0']?.rating ?? 0)).toBeGreaterThan(600);
    const errors = abilities.flatMap((ability, index) =>
      difficulties.map((difficulty, bucket) => {
        const player = learners[index]?.['skill'],
          item = buckets[String(bucket)];
        if (!player || !item) throw new Error('Simulation result missing');
        return Math.abs(
          expectedRatingScore(player, item) -
            1 / (1 + Math.exp(-(ability - difficulty) / 173.7178)),
        );
      }),
    );
    expect(errors.reduce((sum, value) => sum + value, 0) / errors.length).toBeLessThan(0.08);
  });
  it('treats dictionary keys as data even when a skill name matches an object prototype', () => {
    const result = ratePeriod(
      { skills: {}, buckets: {} },
      [{ bucketId: 'x', skillIds: ['constructor'], correct: true }],
      1,
    );
    expect(Object.hasOwn(result.skills, 'constructor')).toBe(true);
    const key = 'constructor';
    expect(result.skills[key]?.attempts).toBe(1);
  });
  it('uses pre-period opponents for both sides, counts a multi-skill question once for difficulty', () => {
    const snapshot = { skills: {}, buckets: {} };
    const observations = Array.from({ length: 10 }, () => ({
      bucketId: 'notes',
      skillIds: ['read', 'name', 'read'],
      correct: true,
    }));
    const result = ratePeriod(snapshot, observations, 1000);
    expect(result.skills['read']?.rating).toBeGreaterThan(1500);
    expect(result.skills['read']).toEqual(result.skills['name']);
    expect(result.skills['read']?.attempts).toBe(10);
    expect(result.buckets['notes']?.attempts).toBe(10);
    expect(
      (result.skills['read']?.rating ?? 0) + (result.buckets['notes']?.rating ?? 0),
    ).toBeCloseTo(3000, 10);
    expect(snapshot).toEqual({ skills: {}, buckets: {} });
  });
  it('leaves all unrelated skills untouched and does not create states for an empty period', () => {
    const state = { ...INITIAL_RATING, attempts: 10, updatedAt: 1000 };
    const snapshot = { skills: { unrelated: state }, buckets: {} };
    expect(ratePeriod(snapshot, [], 2000)).toEqual({ skills: {}, buckets: {} });
    expect(
      ratePeriod(snapshot, [{ bucketId: 'notes', skillIds: ['read'], correct: false }], 2000)
        .skills['unrelated'],
    ).toBeUndefined();
    expect(snapshot.skills.unrelated).toBe(state);
  });
  it('uses server receipt time, increases idle uncertainty and never moves timestamps backward', () => {
    const at = Date.UTC(2026, 9, 1);
    const state: RatedState = { ...INITIAL_RATING, deviation: 40, attempts: 100, updatedAt: at };
    const observation = [{ bucketId: 'notes', skillIds: ['read'], correct: true }];
    const snapshot = { skills: { read: state }, buckets: {} };
    const active = ratePeriod(snapshot, observation, at + 1000).skills['read'];
    const afterPause = ratePeriod(snapshot, observation, at + 90 * 86400000).skills['read'];
    expect(afterPause?.deviation).toBeGreaterThan(active?.deviation ?? Infinity);
    expect(ratePeriod(snapshot, observation, at - 1000).skills['read']?.updatedAt).toBe(at);
    expect(afterPause?.attempts).toBe(101);
  });
  it('keeps the weakest confidence in a composite opponent instead of inventing independent skills', () => {
    const state = (deviation: number) => ({
      ...INITIAL_RATING,
      deviation,
      attempts: 1,
      updatedAt: 100,
    });
    const single = ratePeriod(
      { skills: { a: state(350) }, buckets: {} },
      [{ bucketId: 'x', skillIds: ['a'], correct: true }],
      100,
    );
    const composite = ratePeriod(
      { skills: { a: state(350), b: state(30) }, buckets: {} },
      [{ bucketId: 'x', skillIds: ['a', 'b'], correct: true }],
      100,
    );
    expect(composite.buckets['x']).toEqual(single.buckets['x']);
  });
  it('rejects malformed evidence and excessive periods', () => {
    expect(() =>
      ratePeriod({ skills: {}, buckets: {} }, [{ bucketId: 'x', skillIds: [], correct: true }], 1),
    ).toThrow();
    expect(() => ratePeriod({ skills: {}, buckets: {} }, [], -1)).toThrow();
    expect(() =>
      ratePeriod(
        { skills: {}, buckets: {} },
        Array.from({ length: 201 }, () => ({ bucketId: 'x', skillIds: ['a'], correct: true })),
        1,
      ),
    ).toThrow();
  });
});
