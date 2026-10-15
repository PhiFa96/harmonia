import { decayGlicko2, INITIAL_RATING, updateGlicko2, validateRating } from './glicko2.ts';
import type { Glicko2Rating, Glicko2Result } from './glicko2.ts';

export interface RatedState extends Glicko2Rating {
  readonly attempts: number;
  readonly updatedAt: number;
}
export interface RatingObservation {
  readonly bucketId: string;
  readonly skillIds: readonly string[];
  readonly correct: boolean;
}
export interface RatingSnapshot {
  readonly skills: Readonly<Record<string, RatedState>>;
  readonly buckets: Readonly<Record<string, RatedState>>;
}
export interface RatingUpdates {
  readonly skills: Readonly<Record<string, RatedState>>;
  readonly buckets: Readonly<Record<string, RatedState>>;
}
const own = (states: Readonly<Record<string, RatedState>>, id: string) =>
  Object.hasOwn(states, id) ? states[id] : undefined;
function before(state: RatedState | undefined, at: number): Glicko2Rating {
  if (!state) return INITIAL_RATING;
  validateRating(state);
  if (
    !Number.isSafeInteger(state.attempts) ||
    state.attempts < 0 ||
    !Number.isSafeInteger(state.updatedAt) ||
    state.updatedAt < 0
  )
    throw new RangeError('Invalid stored rating');
  // A lesson is one active period; complete additional idle days grow uncertainty.
  return decayGlicko2(state, Math.max(0, Math.floor((at - state.updatedAt) / 86_400_000) - 1));
}
/** Both sides use the SAME pre-lesson snapshot, including all skill updates. */
export function ratePeriod(
  snapshot: RatingSnapshot,
  observations: readonly RatingObservation[],
  at: number,
  tau = 0.5,
): RatingUpdates {
  if (!Number.isSafeInteger(at) || at < 0 || observations.length > 200)
    throw new RangeError('Invalid rating period');
  const skills = new Map<string, Glicko2Result[]>(),
    buckets = new Map<string, Glicko2Result[]>();
  for (const observation of observations) {
    const ids = [...new Set(observation.skillIds)];
    if (
      !observation.bucketId ||
      ids.length === 0 ||
      ids.some((id) => !id) ||
      typeof observation.correct !== 'boolean'
    )
      throw new RangeError('Invalid rating observation');
    const opponent = before(own(snapshot.buckets, observation.bucketId), at);
    const players = ids.map((id) => before(own(snapshot.skills, id), at));
    for (const id of ids) {
      const results = skills.get(id) ?? [];
      results.push({ opponent, score: observation.correct ? 1 : 0 });
      skills.set(id, results);
    }
    // One question is ONE difficulty observation, even if several skills are mapped.
    const player = {
      rating: players.reduce((sum, p) => sum + p.rating, 0) / players.length,
      deviation: Math.max(...players.map((p) => p.deviation)),
      volatility: 0.06,
    };
    const results = buckets.get(observation.bucketId) ?? [];
    results.push({ opponent: player, score: observation.correct ? 0 : 1 });
    buckets.set(observation.bucketId, results);
  }
  const update = (
    previous: Readonly<Record<string, RatedState>>,
    groups: Map<string, Glicko2Result[]>,
  ) =>
    Object.fromEntries(
      [...groups].map(([id, matches]) => [
        id,
        {
          ...updateGlicko2(before(own(previous, id), at), matches, { tau }),
          attempts: (own(previous, id)?.attempts ?? 0) + matches.length,
          updatedAt: Math.max(own(previous, id)?.updatedAt ?? 0, at),
        },
      ]),
    );
  return { skills: update(snapshot.skills, skills), buckets: update(snapshot.buckets, buckets) };
}
