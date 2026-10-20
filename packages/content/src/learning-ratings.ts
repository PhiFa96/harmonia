import { z } from 'zod';
import { ratingBucket, itemVariantKey } from '@harmonia/exercises';
import type { RatingObservation } from '@harmonia/exercises';
import type { ContentCatalogue } from './catalogue-schema.ts';
import { lessonExerciseSources } from './catalogue.ts';
import { lessonPlan } from './lesson-flow.ts';
import {
  EvidenceError,
  learningRowEventSchema,
  validateLearningEvent,
} from './learning-evidence.ts';

export type RatingOutcome =
  'rated' | 'no_evidence' | 'placement' | 'retained' | 'unavailable' | 'invalid';
export interface LearningRatingEvidence {
  readonly outcome: RatingOutcome;
  readonly observations: readonly RatingObservation[];
}
/** Recompute from canonical original answers. Reviews and assisted answers are not evidence. */
export function learningRatingEvidence(
  catalogue: ContentCatalogue,
  input: unknown,
): LearningRatingEvidence {
  const parsed = learningRowEventSchema.safeParse(input);
  if (!parsed.success) return { outcome: 'invalid', observations: [] };
  const event = parsed.data;
  if (event.kind === 'retained') return { outcome: 'retained', observations: [] };
  if (event.kind === 'card-review') return { outcome: 'no_evidence', observations: [] };
  let proof: ReturnType<typeof validateLearningEvent>;
  try {
    proof = validateLearningEvent(catalogue, event);
  } catch (error) {
    if (error instanceof EvidenceError)
      return { outcome: error.reason === 'changed' ? 'unavailable' : 'invalid', observations: [] };
    if (error instanceof z.ZodError) return { outcome: 'invalid', observations: [] };
    throw error;
  }
  if (event.kind === 'placement') {
    if (!('placement' in proof)) throw new Error('Missing placement replay');
    const seen = new Set<string>();
    const observations: RatingObservation[] = [];
    for (const task of proof.placement.tasks) {
      const item = task.session.items[0];
      if (!item || !task.session.result || task.session.hintLevel !== 0) continue;
      const key = itemVariantKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      const spec = task.checkpoint.specs[task.specIndex];
      const origin = lessonExerciseSources(catalogue, task.checkpoint.lessonId)?.find(
        (source) => source.spec === spec,
      );
      if (!origin) throw new Error('Missing placement provenance');
      observations.push({
        bucketId: ratingBucket(origin.spec, origin.contentVersion),
        skillIds: origin.skillIds,
        correct: task.session.result.correct,
      });
    }
    return { outcome: observations.length ? 'rated' : 'no_evidence', observations };
  }
  if (!('session' in proof)) throw new Error('Missing original lesson session');
  const origins =
    event.planKey === undefined
      ? lessonExerciseSources(catalogue, event.lessonId)
      : lessonPlan(catalogue, event.lessonId, event.planKey)?.exerciseSources;
  if (origins?.length !== proof.session.initial.items.length)
    throw new Error('Missing rating provenance');
  const observations = proof.session.initial.records
    .filter((record) => record.hintLevel === 0)
    .map((record) => {
      const origin = origins[record.index];
      if (!origin?.skillIds.length) throw new Error('Missing rating skill');
      return {
        bucketId: ratingBucket(origin.spec, origin.contentVersion),
        skillIds: origin.skillIds,
        correct: record.result.correct,
      };
    });
  return { outcome: observations.length ? 'rated' : 'no_evidence', observations };
}
