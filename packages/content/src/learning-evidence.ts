import { z } from 'zod';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  isAuralExercise,
  nextLessonExercise,
  revealLessonHint,
  skipLessonAural,
  startLessonReview,
  placementEstimates,
  replayPlacement,
} from '@harmonia/exercises';
import type { LessonSession } from '@harmonia/exercises';
import type { ContentCatalogue } from './catalogue-schema.ts';
import { resolveLesson } from './catalogue.ts';
import { placementBankForKey, placementRecommendations } from './placement.ts';
import { lessonPlan, timeZoneSchema, isPracticeLesson } from './lesson-flow.ts';

export const PASS_PERCENT = 80;
const time = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const answerRecord = z
  .object({
    index: z.number().int().min(0).max(199),
    answer: z.string().min(1).max(4096),
    hintLevel: z.number().int().min(0).max(3),
  })
  .strict();
const round = z
  .object({
    answers: z.array(answerRecord).max(200),
    skipped: z.array(z.number().int().min(0).max(199)).max(200),
  })
  .strict();
const base = { id: z.string().min(1).max(256), startedAt: time, finishedAt: time };
const action = z.discriminatedUnion('type', [
  z.object({ type: z.literal('answer'), answer: z.string().min(1).max(4096) }).strict(),
  ...(['hint', 'next', 'skip', 'finish'] as const).map((type) =>
    z.object({ type: z.literal(type) }).strict(),
  ),
]);
export const learningEventSchema = z.discriminatedUnion('kind', [
  z
    .object({
      ...base,
      kind: z.literal('lesson'),
      lessonId: z.string().min(1).max(128),
      contentVersion: z.number().int().positive(),
      seed: z.union([z.string().min(1).max(128), time]),
      planKey: z.string().min(1).max(4096).optional(),
      timeZone: timeZoneSchema.optional(),
      initial: round,
      review: round.nullable(),
    })
    .strict(),
  z
    .object({
      ...base,
      kind: z.literal('placement'),
      bankKey: z.string().min(1).max(64),
      seed: z.string().min(1).max(128),
      actions: z.array(action).max(150),
    })
    .strict(),
  z
    .object({
      ...base,
      kind: z.literal('card-review'),
      cardId: z.string().min(1).max(128),
      contentVersion: z.number().int().positive(),
      rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
      timeZone: timeZoneSchema,
    })
    .strict(),
]);
export type LearningEvent = z.infer<typeof learningEventSchema>;
const retainedBase = {
  kind: z.literal('retained'),
  id: z.string().min(1).max(256),
  finishedAt: time,
  timeZone: timeZoneSchema.optional(),
};
export const retainedLearningEventSchema = z.discriminatedUnion('sourceKind', [
  z.object({ ...retainedBase, sourceKind: z.literal('practice') }).strict(),
  z
    .object({
      ...retainedBase,
      sourceKind: z.literal('lesson'),
      lessonId: z.string().max(128),
      contentVersion: z.number().int().positive(),
      planKey: z.string().max(4096).optional(),
      progress: z
        .object({
          lessonId: z.string().max(128),
          contentVersion: z.number().int().positive(),
          passed: z.boolean(),
          eligibleCorrect: z.number().int().nonnegative(),
          total: z.number().int().positive().max(200),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...retainedBase,
      sourceKind: z.literal('placement'),
      bankKey: z.string().max(64),
      testedUnitIds: z.array(z.string().max(128)).max(200),
    })
    .strict(),
  z
    .object({
      ...retainedBase,
      sourceKind: z.literal('unavailable'),
      lessonId: z.string().max(128).optional(),
      contentVersion: z.number().int().positive().optional(),
      bankKey: z.string().max(64).optional(),
    })
    .strict(),
]);
export type RetainedLearningEvent = z.infer<typeof retainedLearningEventSchema>;
export const learningRowEventSchema = z.union([learningEventSchema, retainedLearningEventSchema]);
export type LearningRowEvent = z.infer<typeof learningRowEventSchema>;
export const learningViewSchema = z
  .object({
    areaId: z.string().max(128).nullable(),
    level: z.union([z.literal(1), z.literal(2)]).nullable(),
    expanded: z.array(z.string().max(128)).max(200),
  })
  .strict();
export const learningRowSchema = z
  .object({
    sequence: z.number().int().positive(),
    event: learningRowEventSchema,
    reward: z
      .object({
        amount: z.number().int().min(0).max(3000),
        ruleVersion: z.number().int().positive().optional(),
        qualified: z.boolean().optional(),
        coins: z.number().int().min(0).max(1000).optional(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .strict()
      .optional(),
  })
  .strict();
export const learningSyncRequestSchema = z
  .object({
    rewardFormat: z.literal(2).optional(),
    rowFormat: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
    since: time,
    events: z.array(learningEventSchema).max(50),
  })
  .strict();
export const learningSyncResponseSchema = z
  .object({
    accepted: z.array(z.string().max(256)).max(50),
    rows: z.array(learningRowSchema).max(200),
    cursor: time,
    more: z.boolean(),
  })
  .strict();
export type LearningSyncResponse = z.infer<typeof learningSyncResponseSchema>;
export class EvidenceError extends Error {
  readonly reason: 'changed' | 'invalid';
  constructor(reason: 'changed' | 'invalid') {
    super(`Lernnachweis: ${reason}`);
    this.reason = reason;
  }
}
export interface LessonProgress {
  readonly lessonId: string;
  readonly contentVersion: number;
  readonly passed: boolean;
  readonly eligibleCorrect: number;
  readonly total: number;
}
/** Die Wiederholungsrunde verändert niemals die Bestehensquote des Erstversuchs. */
export function lessonProgress(session: LessonSession): LessonProgress {
  const eligibleCorrect = session.initial.records.filter(
    (r) => r.result.correct && r.hintLevel < 3,
  ).length;
  return {
    lessonId: session.lesson.id,
    contentVersion: session.lesson.contentVersion,
    passed:
      session.phase === 'complete' &&
      eligibleCorrect * 100 >= PASS_PERCENT * session.initial.items.length,
    eligibleCorrect,
    total: session.initial.items.length,
  };
}
function restoreRound(
  state: LessonSession,
  evidence: z.infer<typeof round>,
  phase: 'initial' | 'review',
) {
  const seen: number[] = [];
  for (let guard = 0; state.phase === phase && guard < 201; guard++) {
    const session = activeLessonSession(state),
      item = session && currentItem(session);
    if (!session || !item) throw new EvidenceError('invalid');
    if (evidence.skipped.includes(session.index)) {
      if (!isAuralExercise(item)) throw new EvidenceError('invalid');
      state = skipLessonAural(state);
    } else {
      const record = evidence.answers[seen.length];
      if (record?.index !== session.index) throw new EvidenceError('invalid');
      for (let n = 0; n < record.hintLevel; n++) state = revealLessonHint(state);
      const answered = answerLesson(state, record.answer);
      if (!activeLessonSession(answered)?.result) throw new EvidenceError('invalid');
      seen.push(record.index);
      state = nextLessonExercise(answered);
    }
  }
  const restored = phase === 'initial' ? state.initial : state.review;
  if (
    !restored ||
    seen.length !== evidence.answers.length ||
    JSON.stringify(restored.skipped) !== JSON.stringify(evidence.skipped)
  )
    throw new EvidenceError('invalid');
  return state;
}
export function validateLearningEvent(catalogue: ContentCatalogue, input: unknown) {
  const event = learningRowEventSchema.parse(input);
  if (event.kind === 'retained') {
    if (event.sourceKind === 'practice')
      return { event, lesson: null, testedUnitIds: [] as string[] };
    if (event.sourceKind === 'unavailable') throw new EvidenceError('changed');
    if (event.sourceKind === 'placement') {
      const bank = placementBankForKey(catalogue, event.bankKey);
      if (
        !bank ||
        event.testedUnitIds.some((id) => !catalogue.units.some((unit) => unit.id === id))
      )
        throw new EvidenceError('changed');
      return { event, lesson: null, testedUnitIds: event.testedUnitIds };
    }
    const lesson =
      event.planKey === undefined
        ? resolveLesson(catalogue, event.lessonId)
        : lessonPlan(catalogue, event.lessonId, event.planKey);
    if (
      lesson?.contentVersion !== event.contentVersion ||
      (event.planKey !== undefined && (!('planKey' in lesson) || lesson.planKey !== event.planKey))
    )
      throw new EvidenceError('changed');
    const p = event.progress;
    if (
      p.lessonId !== event.lessonId ||
      p.contentVersion !== event.contentVersion ||
      p.total !== lesson.exercises.length ||
      p.eligibleCorrect > p.total ||
      p.passed !== p.eligibleCorrect * 100 >= p.total * PASS_PERCENT
    )
      throw new EvidenceError('invalid');
    return { event, lesson: p, testedUnitIds: [] as string[] };
  }

  if (event.finishedAt < event.startedAt) throw new EvidenceError('invalid');
  if (event.kind === 'card-review') {
    const card = catalogue.knowledgeCards.find((c) => c.id === event.cardId);
    if (card?.contentVersion !== event.contentVersion) throw new EvidenceError('changed');
    return { event, lesson: null, testedUnitIds: [] as string[] };
  }
  if (event.kind === 'placement') {
    const bank = placementBankForKey(catalogue, event.bankKey);
    if (!bank?.areas.length) throw new EvidenceError('changed');
    const session = replayPlacement(bank, event.seed, event.actions);
    if (!session.ended) throw new EvidenceError('invalid');
    const estimates = placementEstimates(bank, session);
    const testedUnitIds = placementRecommendations(
      catalogue,
      bank,
      estimates,
      session.ended === 'complete',
    ).flatMap((r) => r.testedUnitIds);
    return { event, lesson: null, testedUnitIds, placement: session };
  }
  const lesson =
    event.planKey === undefined
      ? resolveLesson(catalogue, event.lessonId)
      : lessonPlan(catalogue, event.lessonId, event.planKey);
  if (lesson?.contentVersion !== event.contentVersion) throw new EvidenceError('changed');
  if (event.planKey !== undefined && (!('planKey' in lesson) || lesson.planKey !== event.planKey))
    throw new EvidenceError('changed');
  let session = restoreRound(createLessonSession(lesson, event.seed), event.initial, 'initial');
  if (session.phase === 'review-intro') session = startLessonReview(session);
  if (session.review) {
    if (!event.review) throw new EvidenceError('invalid');
    session = restoreRound(session, event.review, 'review');
  } else if (event.review) throw new EvidenceError('invalid');
  if (session.phase !== 'complete') throw new EvidenceError('invalid');
  return {
    event,
    lesson: isPracticeLesson(event.lessonId) ? null : lessonProgress(session),
    session,
    testedUnitIds: [] as string[],
  };
}
export function lessonEvent(
  id: string,
  session: LessonSession,
  startedAt: number,
  finishedAt: number,
  timeZone?: string,
): LearningEvent {
  if (session.phase !== 'complete') throw new EvidenceError('invalid');
  const evidence = (s: LessonSession['initial']) => ({
    answers: s.records.map((r) => ({
      index: r.index,
      answer: r.result.answer,
      hintLevel: r.hintLevel,
    })),
    skipped: [...s.skipped],
  });
  return learningEventSchema.parse({
    kind: 'lesson',
    id,
    lessonId: session.lesson.id,
    contentVersion: session.lesson.contentVersion,
    seed: session.seed,
    ...(session.lesson.planKey ? { planKey: session.lesson.planKey } : {}),
    ...(timeZone ? { timeZone } : {}),
    startedAt,
    finishedAt: Math.max(startedAt, finishedAt),
    initial: evidence(session.initial),
    review: session.review ? evidence(session.review) : null,
  });
}
const legacyRound = z.object({
  records: z.array(
    z.object({
      index: z.number(),
      hintLevel: z.number(),
      result: z.object({ answer: z.string() }),
    }),
  ),
  skipped: z.array(z.number()),
});
const legacy = z.object({
  id: z.string(),
  schemaVersion: z.literal(1),
  startedAt: z.string(),
  finishedAt: z.string(),
  timeZone: timeZoneSchema.optional(),
  session: z.object({
    phase: z.literal('complete'),
    lesson: z.object({
      id: z.string(),
      contentVersion: z.number(),
      planKey: z.string().optional(),
    }),
    seed: z.union([z.string(), z.number()]),
    initial: legacyRound,
    review: legacyRound.optional(),
  }),
});
/** Alte lokale Payloads liefern nur Antworten; Item-/Expected-/Summary-Flags werden ignoriert. */
export function legacyLessonEvent(input: unknown): LearningEvent {
  const old = legacy.parse(input),
    s = old.session;
  const evidence = (r: z.infer<typeof legacyRound>) => ({
    answers: r.records.map((record) => ({
      index: record.index,
      answer: record.result.answer,
      hintLevel: record.hintLevel,
    })),
    skipped: r.skipped,
  });
  return learningEventSchema.parse({
    kind: 'lesson',
    id: old.id,
    lessonId: s.lesson.id,
    contentVersion: s.lesson.contentVersion,
    seed: s.seed,
    ...(s.lesson.planKey ? { planKey: s.lesson.planKey } : {}),
    ...(old.timeZone ? { timeZone: old.timeZone } : {}),
    startedAt: Date.parse(old.startedAt),
    finishedAt: Math.max(Date.parse(old.startedAt), Date.parse(old.finishedAt)),
    initial: evidence(s.initial),
    review: s.review ? evidence(s.review) : null,
  });
}

/** Only trusted server responses/local compaction may use these summaries; uploads stay raw. */
export function retainLearningEvent(
  catalogue: ContentCatalogue,
  input: LearningEvent,
): RetainedLearningEvent {
  const proof = validateLearningEvent(catalogue, input),
    base = {
      kind: 'retained' as const,
      id: input.id,
      finishedAt: input.finishedAt,
      ...(input.kind === 'lesson' && input.timeZone ? { timeZone: input.timeZone } : {}),
    };
  if (input.kind === 'lesson' && proof.lesson)
    return retainedLearningEventSchema.parse({
      ...base,
      sourceKind: 'lesson',
      lessonId: input.lessonId,
      contentVersion: input.contentVersion,
      ...(input.planKey ? { planKey: input.planKey } : {}),
      progress: proof.lesson,
    });
  if (input.kind === 'placement')
    return retainedLearningEventSchema.parse({
      ...base,
      sourceKind: 'placement',
      bankKey: input.bankKey,
      testedUnitIds: proof.testedUnitIds,
    });
  if (input.kind === 'card-review' || isPracticeLesson(input.lessonId))
    return retainedLearningEventSchema.parse({ ...base, sourceKind: 'practice' });
  throw new EvidenceError('invalid');
}
export function unavailableRetainedEvent(input: LearningEvent): RetainedLearningEvent {
  return retainedLearningEventSchema.parse({
    kind: 'retained',
    sourceKind: 'unavailable',
    id: input.id,
    finishedAt: input.finishedAt,
    ...(input.kind === 'lesson'
      ? {
          lessonId: input.lessonId,
          contentVersion: input.contentVersion,
          ...(input.timeZone ? { timeZone: input.timeZone } : {}),
        }
      : input.kind === 'placement'
        ? { bankKey: input.bankKey }
        : {}),
  });
}
