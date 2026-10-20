import { createEmptyCard, fsrs, Rating, State } from 'ts-fsrs';
import type { Card, Grade } from 'ts-fsrs';
import { z } from 'zod';
import type { ContentCatalogue } from './catalogue-schema.ts';
import { lessonExerciseSources } from './catalogue.ts';
import { lessonPlan } from './lesson-flow.ts';
import { learningRowEventSchema, validateLearningEvent } from './learning-evidence.ts';
import type { LearningRowEvent } from './learning-evidence.ts';

/** Pin engine and parameters together. A change needs an explicit migration/calibration. */
export const REVIEW_ALGORITHM = 'fsrs-6/ts-fsrs-5.4.2/v1';
export const REVIEW_PARAMETERS = {
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzz: false,
  enable_short_term: true,
  learning_steps: ['1m', '10m'] as const,
  relearning_steps: ['10m'] as const,
};
const scheduler = fsrs(REVIEW_PARAMETERS);
const time = z.number().int().min(0).max(8_640_000_000_000_000);
const count = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const reviewCardSchema = z
  .object({
    due: time,
    stability: z.number().min(0).max(1_000_000),
    difficulty: z.number().min(0).max(10),
    elapsed_days: count,
    scheduled_days: count,
    learning_steps: count,
    reps: count,
    lapses: count,
    state: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
    last_review: time.optional(),
  })
  .strict()
  .refine(
    (c) =>
      c.lapses <= c.reps &&
      (c.reps === 0 ? c.state === 0 && c.last_review === undefined : c.last_review !== undefined),
  );
export type ReviewCard = z.infer<typeof reviewCardSchema>;
export const reviewStateSchema = z
  .object({
    skills: z.record(z.string().min(1).max(128), reviewCardSchema),
    cards: z.record(z.string().min(1).max(160), reviewCardSchema),
  })
  .strict();
export type ReviewState = z.infer<typeof reviewStateSchema>;
export const reviewCacheSchema = reviewStateSchema
  .extend({
    throughSequence: count,
    throughPosition: count.default(0),
  })
  .strict();
export type ReviewCache = z.infer<typeof reviewCacheSchema>;
export const emptyReviewState = (): ReviewState => ({ skills: {}, cards: {} });
export const reviewCardKey = (id: string, version: number) => `${id}@${String(version)}`;
export function serializeReviewCard(card: Card): ReviewCard {
  const { last_review, ...rest } = card;
  return reviewCardSchema.parse({
    ...rest,
    due: card.due.getTime(),
    ...(last_review ? { last_review: last_review.getTime() } : {}),
  });
}
export function newReviewCard(at: number): ReviewCard {
  return serializeReviewCard(createEmptyCard(new Date(time.parse(at))));
}
export type ReviewGrade = 1 | 2 | 3 | 4;
export function reviewGrade(rating: ReviewGrade): Grade {
  switch (rating) {
    case 1:
      return Rating.Again;
    case 2:
      return Rating.Hard;
    case 3:
      return Rating.Good;
    case 4:
      return Rating.Easy;
  }
}
export function scheduleReview(
  previous: ReviewCard | undefined,
  rating: ReviewGrade,
  at: number,
): ReviewCard {
  const card = previous ?? newReviewCard(at);
  const now = Math.max(time.parse(at), card.last_review ?? 0);
  const { last_review, state, ...rest } = card;
  const input: Card = {
    ...rest,
    due: new Date(card.due),
    state: [State.New, State.Learning, State.Review, State.Relearning][state] ?? State.New,
    ...(last_review === undefined ? {} : { last_review: new Date(last_review) }),
  };
  return serializeReviewCard(scheduler.next(input, new Date(now), reviewGrade(rating)).card);
}
/** One conservative grade per skill and original attempt. Correction rounds/skips never inflate memory. */
export function reviewEvidence(catalogue: ContentCatalogue, input: unknown) {
  const event = learningRowEventSchema.parse(input);
  const skills: Record<string, ReviewGrade> = {};
  const enroll: string[] = [];
  if (event.kind === 'retained') return { skills, enroll, card: null };
  const proof = validateLearningEvent(catalogue, event);
  if (event.kind === 'card-review')
    return {
      skills,
      enroll,
      card: { key: reviewCardKey(event.cardId, event.contentVersion), rating: event.rating },
    };
  const observe = (ids: readonly string[], correct: boolean, hint: number) => {
    const grade: ReviewGrade = !correct || hint === 3 ? 1 : hint > 0 ? 2 : 3;
    for (const id of ids) skills[id] = Math.min(skills[id] ?? 4, grade) as ReviewGrade;
  };
  if (event.kind === 'lesson' && 'session' in proof) {
    const sources = event.planKey
      ? lessonPlan(catalogue, event.lessonId, event.planKey)?.exerciseSources
      : lessonExerciseSources(catalogue, event.lessonId);
    for (const record of proof.session.initial.records) {
      const origin = sources?.[record.index];
      if (!origin) throw new Error('Missing review provenance');
      observe(origin.skillIds, record.result.correct, record.hintLevel);
    }
    // Introduction was seen before any answered task. Cards start due, not "remembered".
    if (proof.session.initial.records.length) {
      const lesson = catalogue.lessons.find((l) => l.id === event.lessonId);
      for (const id of lesson?.introductionCardIds ?? []) {
        const card = catalogue.knowledgeCards.find((c) => c.id === id);
        if (card) enroll.push(reviewCardKey(card.id, card.contentVersion));
      }
    }
  }
  if (event.kind === 'placement' && 'placement' in proof) {
    for (const task of proof.placement.tasks) {
      const result = task.session.result;
      const spec = task.checkpoint.specs[task.specIndex];
      const origin = lessonExerciseSources(catalogue, task.checkpoint.lessonId)?.find(
        (s) => s.spec === spec,
      );
      if (result && origin) observe(origin.skillIds, result.correct, task.session.hintLevel);
    }
  }
  return { skills, enroll, card: null };
}
export function applyReviewEvent(
  catalogue: ContentCatalogue,
  previous: ReviewState,
  event: LearningRowEvent,
  at = event.finishedAt,
): ReviewState {
  const evidence = reviewEvidence(catalogue, event);
  const skills = { ...previous.skills },
    cards = { ...previous.cards };
  for (const [id, grade] of Object.entries(evidence.skills))
    skills[id] = scheduleReview(skills[id], grade, at);
  for (const key of evidence.enroll) cards[key] ??= newReviewCard(at);
  // A self-rating cannot enrol unrelated, unseen material or change a course skill.
  if (evidence.card && cards[evidence.card.key])
    cards[evidence.card.key] = scheduleReview(cards[evidence.card.key], evidence.card.rating, at);
  return { skills, cards };
}
export interface ReviewRow {
  readonly event: LearningRowEvent;
  readonly sequence: number | null;
  readonly position: number;
  readonly pending: boolean;
}
/** Stable receipt order; acknowledged retries without a sequence never apply twice. */
export function localReviewState(
  catalogue: ContentCatalogue,
  rows: readonly ReviewRow[],
  cache: ReviewCache | null = null,
): ReviewState {
  let state: ReviewState = cache
    ? { skills: cache.skills, cards: cache.cards }
    : emptyReviewState();
  const seen = new Set<string>();
  const ordered = [...rows].sort(
    (a, b) =>
      (a.sequence ?? Number.MAX_SAFE_INTEGER) - (b.sequence ?? Number.MAX_SAFE_INTEGER) ||
      a.position - b.position,
  );
  for (const row of ordered) {
    if (seen.has(row.event.id)) continue;
    seen.add(row.event.id);
    if (
      cache &&
      (row.sequence === null
        ? row.position <= cache.throughPosition || !row.pending
        : row.sequence <= cache.throughSequence)
    )
      continue;
    try {
      state = applyReviewEvent(catalogue, state, row.event);
    } catch {
      /* Obsolete/invalid evidence cannot invent memory; other intact rows remain usable. */
    }
  }
  return state;
}
/** Only learned, still available content is listed, in due-time order. */
export function dueReviews(
  catalogue: ContentCatalogue,
  state: ReviewState,
  at: number,
  lessonIds: readonly string[],
) {
  const allowed = new Set(
    lessonIds.flatMap((id) => catalogue.lessons.find((l) => l.id === id)?.skillIds ?? []),
  );
  const skills = catalogue.skills
    .filter((s) => allowed.has(s.id) && (state.skills[s.id]?.due ?? Infinity) <= at)
    .sort(
      (a, b) =>
        (state.skills[a.id]?.due ?? 0) - (state.skills[b.id]?.due ?? 0) || a.id.localeCompare(b.id),
    );
  const cards = catalogue.knowledgeCards
    .filter(
      (c) =>
        c.skillIds.every((id) => allowed.has(id)) &&
        (state.cards[reviewCardKey(c.id, c.contentVersion)]?.due ?? Infinity) <= at,
    )
    .sort(
      (a, b) =>
        (state.cards[reviewCardKey(a.id, a.contentVersion)]?.due ?? 0) -
          (state.cards[reviewCardKey(b.id, b.contentVersion)]?.due ?? 0) ||
        a.id.localeCompare(b.id),
    );
  const nextDue = Math.min(
    ...Object.entries(state.skills)
      .filter(([id]) => allowed.has(id))
      .map(([, c]) => c.due),
    ...catalogue.knowledgeCards
      .filter((c) => c.skillIds.every((id) => allowed.has(id)))
      .map((c) => state.cards[reviewCardKey(c.id, c.contentVersion)]?.due ?? Infinity),
  );
  return { skills, cards, nextDue: Number.isFinite(nextDue) ? nextDue : null };
}
