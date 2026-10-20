import { ratePeriod } from '@harmonia/exercises';
import type { RatingSnapshot } from '@harmonia/exercises';
import { z } from 'zod';
import type { ContentCatalogue } from './catalogue-schema.ts';
import type { LearningRowEvent } from './learning-evidence.ts';
import { learningRatingEvidence } from './learning-ratings.ts';

const state = z
  .object({
    rating: z.number().min(-1_000_000).max(1_000_000),
    deviation: z.number().positive().max(350),
    volatility: z.number().positive().max(10),
    attempts: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    updatedAt: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  })
  .strict();
export const learnerRatingsSchema = z
  .object({
    skills: z.record(z.string().max(128), state),
    buckets: z.record(z.string().max(2048), state),
  })
  .strict();
export const learnerRatingCacheSchema = learnerRatingsSchema
  .extend({
    throughSequence: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  })
  .strict();
export type LearnerRatingCache = z.infer<typeof learnerRatingCacheSchema>;
/** Guest/offline fallback. A local estimate never writes authoritative server ratings. */
export function localLearningRatings(
  catalogue: ContentCatalogue,
  events: readonly LearningRowEvent[],
  base: RatingSnapshot = { skills: {}, buckets: {} },
): RatingSnapshot {
  let snapshot = base;
  const seen = new Set<string>();
  for (const event of events) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    const evidence = learningRatingEvidence(catalogue, event);
    const update = ratePeriod(snapshot, evidence.observations, event.finishedAt);
    snapshot = {
      skills: { ...snapshot.skills, ...update.skills },
      buckets: { ...snapshot.buckets, ...update.buckets },
    };
  }
  return snapshot;
}
