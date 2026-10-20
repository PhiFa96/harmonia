import { describe, expect, it } from 'vitest';
import { LEAGUE_LEVELS, leagueOutcome, leagueSnapshotSchema } from './leagues.ts';
describe('weekly leagues', () => {
  it('uses exactly the seven planned dynamics', () => {
    expect(LEAGUE_LEVELS).toEqual(['pp', 'p', 'mp', 'mf', 'f', 'ff', 'fff']);
  });
  it('never overlaps movement zones or exceeds the boundary tiers for every group size', () => {
    for (let tier = 0; tier < 7; tier++)
      for (let size = 1; size <= 100; size++) {
        const results = Array.from({ length: size }, (_, i) => leagueOutcome(i + 1, size, tier, 5));
        expect(results.filter((o) => o === 'promoted')).toHaveLength(
          tier < 6 ? Math.min(5, Math.floor(size / 2)) : 0,
        );
        expect(results.filter((o) => o === 'relegated')).toHaveLength(
          tier > 0 ? Math.min(5, Math.floor(size / 2)) : 0,
        );
      }
  });
  const snapshot = {
    weekStart: '2026-10-12',
    weekEnd: '2026-10-19',
    tier: 0,
    pushConsent: false,
    cohort: { capacity: 30, movement: 5, entries: [{ slot: 1, rank: 1, xp: 20, isYou: true }] },
    result: null,
  };
  it('validates rosters and rejects leaked identifiers, broken weeks and missing owners', () => {
    expect(leagueSnapshotSchema.parse(snapshot)).toEqual(snapshot);
    expect(leagueSnapshotSchema.safeParse({ ...snapshot, weekEnd: '2026-10-18' }).success).toBe(
      false,
    );
    expect(
      leagueSnapshotSchema.safeParse({
        ...snapshot,
        cohort: {
          ...snapshot.cohort,
          entries: [{ ...snapshot.cohort.entries[0], user_id: 'secret' }],
        },
      }).success,
    ).toBe(false);
    expect(
      leagueSnapshotSchema.safeParse({
        ...snapshot,
        cohort: { ...snapshot.cohort, entries: [{ ...snapshot.cohort.entries[0], isYou: false }] },
      }).success,
    ).toBe(false);
    expect(
      leagueSnapshotSchema.safeParse({
        ...snapshot,
        cohort: {
          ...snapshot.cohort,
          entries: [snapshot.cohort.entries[0], snapshot.cohort.entries[0]],
        },
      }).success,
    ).toBe(false);
  });
});
