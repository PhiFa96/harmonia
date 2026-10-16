import { decayGlicko2, expectedRatingScore, INITIAL_RATING } from './glicko2.ts';
import type { Glicko2Rating } from './glicko2.ts';
import type { RatedState, RatingSnapshot } from './rating-period.ts';

export const ADAPTIVE_TARGET = { min: 0.7, max: 0.85, center: 0.775 } as const;
export interface AdaptiveCandidate {
  readonly bucketId: string;
  readonly skillIds: readonly string[];
}
const own = (states: Readonly<Record<string, RatedState>>, id: string) =>
  Object.hasOwn(states, id) ? states[id] : undefined;
function current(state: RatedState | undefined, at: number): Glicko2Rating {
  return state
    ? decayGlicko2(state, Math.max(0, Math.floor((at - state.updatedAt) / 86_400_000) - 1))
    : INITIAL_RATING;
}
/** Same conservative multi-skill model as ratePeriod. Unknown skills are not weaknesses. */
export function candidateProbability(
  snapshot: RatingSnapshot,
  candidate: AdaptiveCandidate,
  at: number,
): number | null {
  if (!Number.isSafeInteger(at) || at < 0) throw new RangeError('Invalid selection time');
  const ids = [...new Set(candidate.skillIds)];
  if (!ids.length || !ids.every((id) => (own(snapshot.skills, id)?.attempts ?? 0) > 0)) return null;
  const skills = ids.map((id) => current(own(snapshot.skills, id), at));
  return expectedRatingScore(
    {
      rating: skills.reduce((sum, skill) => sum + skill.rating, 0) / skills.length,
      deviation: Math.max(...skills.map((skill) => skill.deviation)),
      volatility: 0.06,
    },
    current(own(snapshot.buckets, candidate.bucketId), at),
  );
}
/** Prefer the target interval, then its midpoint. Stable input order breaks ties. */
export function adaptiveOrder<T extends AdaptiveCandidate>(
  candidates: readonly T[],
  snapshot: RatingSnapshot,
  at: number,
): T[] {
  const distance = (p: number | null) =>
    p === null ? Infinity : Math.max(ADAPTIVE_TARGET.min - p, p - ADAPTIVE_TARGET.max, 0);
  return candidates
    .map((candidate, index) => ({
      candidate,
      index,
      p: candidateProbability(snapshot, candidate, at),
    }))
    .sort((a, b) => {
      if (a.p === null && b.p === null) return a.index - b.index;
      return (
        distance(a.p) - distance(b.p) ||
        Math.abs((a.p ?? -1) - ADAPTIVE_TARGET.center) -
          Math.abs((b.p ?? -1) - ADAPTIVE_TARGET.center) ||
        a.index - b.index
      );
    })
    .map(({ candidate }) => candidate);
}
