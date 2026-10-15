import { describe, expect, it } from 'vitest';
import { decayGlicko2, expectedRatingScore, INITIAL_RATING, updateGlicko2 } from './glicko2.ts';
import { createRng } from '@harmonia/theory';
import reference from './testing/glicko2-reference.json' with { type: 'json' };

describe('Glicko-2', () => {
  it.each(reference.cases)(
    'matches independent full-precision vectors for tau=$tau, rating=$player.rating',
    ({ tau, player, results, expected }) => {
      const actual = updateGlicko2(player, results, { tau });
      expect(actual.rating).toBeCloseTo(expected.rating, 7);
      expect(actual.deviation).toBeCloseTo(expected.deviation, 7);
      // The independent implementation stops at 1e-7 in log variance; ours uses 1e-8.
      expect(Math.abs(actual.volatility - expected.volatility)).toBeLessThan(1e-8);
    },
  );
  it('matches Glickman’s three-opponent worked example', () => {
    const result = updateGlicko2({ rating: 1500, deviation: 200, volatility: 0.06 }, [
      { opponent: { rating: 1400, deviation: 30, volatility: 0.06 }, score: 1 },
      { opponent: { rating: 1550, deviation: 100, volatility: 0.06 }, score: 0 },
      { opponent: { rating: 1700, deviation: 300, volatility: 0.06 }, score: 0 },
    ]);
    // The paper rounds intermediate values; full precision yields 1464.05067… .
    expect(Math.abs(result.rating - 1464.06)).toBeLessThan(0.01);
    expect(result.rating).toBeCloseTo(1464.0506705393013, 8);
    expect(result.deviation).toBeCloseTo(151.52, 2);
    expect(result.volatility).toBeCloseTo(0.059995984286488495, 9);
  });
  it('updates a whole period from immutable pre-period opponents, independent of order', () => {
    const results = [0, 0.5, 1].map((score) => ({ opponent: INITIAL_RATING, score }));
    const before = JSON.stringify(results);
    expect(updateGlicko2(INITIAL_RATING, results).rating).toBeCloseTo(1500, 10);
    expect(updateGlicko2(INITIAL_RATING, [...results].reverse())).toEqual(
      updateGlicko2(INITIAL_RATING, results),
    );
    expect(JSON.stringify(results)).toBe(before);
  });
  it('grows inactive uncertainty up to the configured cap without drifting rating', () => {
    const state = { rating: 1800, deviation: 40, volatility: 0.06 };
    expect(updateGlicko2(state, [])).toEqual(decayGlicko2(state, 1));
    expect(decayGlicko2(state, 100000)).toEqual({ ...state, deviation: 350 });
    expect(decayGlicko2(state, 0)).toEqual(state);
    expect(decayGlicko2(decayGlicko2(state, 5), 7).deviation).toBeCloseTo(
      decayGlicko2(state, 12).deviation,
      10,
    );
  });
  it('predicts symmetric, bounded probabilities with greater uncertainty tending toward 50%', () => {
    const high = { ...INITIAL_RATING, rating: 1800, deviation: 30 };
    const low = { ...INITIAL_RATING, rating: 1200, deviation: 30 };
    expect(expectedRatingScore(high, low) + expectedRatingScore(low, high)).toBeCloseTo(1, 12);
    expect(expectedRatingScore({ ...high, deviation: 350 }, low)).toBeLessThan(
      expectedRatingScore(high, low),
    );
    expect(expectedRatingScore(high, high)).toBe(0.5);
  });
  it('converges toward stable latent abilities over seeded simulated periods', () => {
    const rng = createRng('glicko-convergence');
    for (const ability of [1100, 1500, 1900]) {
      let state = INITIAL_RATING;
      const opponent = { ...INITIAL_RATING, deviation: 40 };
      const probability = 1 / (1 + Math.exp(-(ability - 1500) / 173.7178));
      for (let period = 0; period < 150; period++) {
        const results = Array.from({ length: 15 }, () => ({
          opponent,
          score: rng.next() < probability ? 1 : 0,
        }));
        state = updateGlicko2(state, results);
      }
      expect(Math.abs(state.rating - ability)).toBeLessThan(120);
      expect(state.deviation).toBeLessThan(100);
    }
  });
  it.each([NaN, Infinity, -1, 0])('rejects invalid deviation %s', (deviation) => {
    expect(() => updateGlicko2({ ...INITIAL_RATING, deviation }, [])).toThrow(RangeError);
  });
  it('rejects invalid scores, configuration and periods', () => {
    for (const score of [NaN, Infinity, -0.1, 1.1])
      expect(() => updateGlicko2(INITIAL_RATING, [{ opponent: INITIAL_RATING, score }])).toThrow();
    expect(() => updateGlicko2(INITIAL_RATING, [], { tau: 0 })).toThrow();
    expect(() => decayGlicko2(INITIAL_RATING, -1)).toThrow();
    expect(() => decayGlicko2(INITIAL_RATING, 0.5)).toThrow();
  });
});
