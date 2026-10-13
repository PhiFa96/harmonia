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
import { placementBank, placementRecommendations } from './placement.ts';

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
]);
export type LearningEvent = z.infer<typeof learningEventSchema>;
export const learningViewSchema = z
  .object({
    areaId: z.string().max(128).nullable(),
    level: z.union([z.literal(1), z.literal(2)]).nullable(),
    expanded: z.array(z.string().max(128)).max(200),
  })
  .strict();
export const learningRowSchema = z
  .object({ sequence: z.number().int().positive(), event: learningEventSchema })
  .strict();
export const learningSyncRequestSchema = z
  .object({ since: time, events: z.array(learningEventSchema).max(50) })
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
  const event = learningEventSchema.parse(input);
  if (event.finishedAt < event.startedAt) throw new EvidenceError('invalid');
  if (event.kind === 'placement') {
    const bank = placementBank(catalogue);
    if (!bank.areas.length || event.bankKey !== bank.key) throw new EvidenceError('changed');
    const session = replayPlacement(bank, event.seed, event.actions);
    if (!session.ended) throw new EvidenceError('invalid');
    const estimates = placementEstimates(bank, session);
    const testedUnitIds = placementRecommendations(
      catalogue,
      bank,
      estimates,
      session.ended === 'complete',
    ).flatMap((r) => r.testedUnitIds);
    return { event, lesson: null, testedUnitIds };
  }
  const lesson = resolveLesson(catalogue, event.lessonId);
  if (lesson?.contentVersion !== event.contentVersion) throw new EvidenceError('changed');
  let session = restoreRound(createLessonSession(lesson, event.seed), event.initial, 'initial');
  if (session.phase === 'review-intro') session = startLessonReview(session);
  if (session.review) {
    if (!event.review) throw new EvidenceError('invalid');
    session = restoreRound(session, event.review, 'review');
  } else if (event.review) throw new EvidenceError('invalid');
  if (session.phase !== 'complete') throw new EvidenceError('invalid');
  return { event, lesson: lessonProgress(session), testedUnitIds: [] as string[] };
}
export function lessonEvent(
  id: string,
  session: LessonSession,
  startedAt: number,
  finishedAt: number,
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
  session: z.object({
    phase: z.literal('complete'),
    lesson: z.object({ id: z.string(), contentVersion: z.number() }),
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
    startedAt: Date.parse(old.startedAt),
    finishedAt: Math.max(Date.parse(old.startedAt), Date.parse(old.finishedAt)),
    initial: evidence(s.initial),
    review: s.review ? evidence(s.review) : null,
  });
}
