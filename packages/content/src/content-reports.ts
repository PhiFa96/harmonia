import { z } from 'zod';
import {
  PRACTICE_CONTENT_VERSION,
  PRACTICE_SETS,
  createFreePracticeSession,
  createLessonSession,
  lessonReviewItem,
  currentPlacementTask,
  replayPlacement,
  evaluateExercise,
} from '@harmonia/exercises';
import type { ContentCatalogue } from './catalogue-schema.ts';
import { resolveLesson } from './catalogue.ts';
import { lessonPlan } from './lesson-flow.ts';
import { placementBankForKey } from './placement.ts';
import { learningEventSchema, EvidenceError } from './learning-evidence.ts';

const time = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const seed = z.union([time, z.string().min(1).max(128)]);
export const REPORT_CATEGORIES = [
  'question',
  'answer',
  'feedback',
  'notation',
  'audio',
  'translation',
  'other',
] as const;
export const reportSourceSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('practice'),
      set: z.enum(PRACTICE_SETS),
      contentVersion: z.literal(PRACTICE_CONTENT_VERSION),
      seed,
      index: z.number().int().min(0).max(11),
    })
    .strict(),
  z
    .object({
      kind: z.literal('lesson'),
      lessonId: z.string().min(1).max(128),
      contentVersion: z.number().int().positive(),
      planKey: z.string().min(1).max(4096).optional(),
      seed,
      round: z.enum(['initial', 'review']),
      index: z.number().int().min(0).max(199),
    })
    .strict(),
  z
    .object({
      kind: z.literal('placement'),
      bankKey: z.string().min(1).max(64),
      seed: z.string().min(1).max(128),
      actions: learningEventSchema.options[1].shape.actions,
    })
    .strict(),
]);
export const contentReportSchema = z
  .object({
    id: z.uuid(),
    createdAt: time,
    locale: z.enum(['de', 'en-US', 'en-GB']),
    category: z.enum(REPORT_CATEGORIES),
    message: z.string().trim().max(2000),
    source: reportSourceSchema,
    answer: z.string().max(4096).nullable(),
    hintLevel: z.number().int().min(0).max(3),
    checked: z.boolean(),
  })
  .strict();
export type ReportSource = z.infer<typeof reportSourceSchema>;
export type ContentReport = z.infer<typeof contentReportSchema>;
export const contentReportsRequestSchema = z
  .object({ reports: contentReportSchema.array().min(1).max(10) })
  .strict()
  .refine((v) => new Set(v.reports.map((r) => r.id)).size === v.reports.length);
export const contentReportsResponseSchema = z
  .object({ accepted: z.uuid().array().max(10), unavailable: z.uuid().array().max(10) })
  .strict();

/** Quelle und Bewertung kommen von denselben versionierten Generatoren wie die Aufgabe. */
export function resolveReportSource(catalogue: ContentCatalogue, input: unknown) {
  const source = reportSourceSchema.parse(input);
  if (source.kind === 'practice') {
    const item = createFreePracticeSession(source.set, source.seed).items[source.index];
    if (!item) throw new EvidenceError('invalid');
    return { item, contentId: `practice:${source.set}`, contentVersion: PRACTICE_CONTENT_VERSION };
  }
  if (source.kind === 'lesson') {
    const lesson =
      source.planKey === undefined
        ? resolveLesson(catalogue, source.lessonId)
        : lessonPlan(catalogue, source.lessonId, source.planKey);
    if (
      lesson?.contentVersion !== source.contentVersion ||
      (source.planKey !== undefined &&
        (!('planKey' in lesson) || lesson.planKey !== source.planKey))
    )
      throw new EvidenceError('changed');
    const item =
      source.round === 'review'
        ? lessonReviewItem(lesson, source.seed, source.index)
        : createLessonSession(lesson, source.seed).initial.items[source.index];
    if (!item) throw new EvidenceError('invalid');
    return { item, contentId: lesson.id, contentVersion: lesson.contentVersion };
  }
  const bank = placementBankForKey(catalogue, source.bankKey);
  if (!bank?.areas.length) throw new EvidenceError('changed');
  const task = currentPlacementTask(replayPlacement(bank, source.seed, source.actions));
  const item = task?.session.items[0],
    lesson = task && resolveLesson(catalogue, task.checkpoint.lessonId);
  if (!item || !lesson) throw new EvidenceError('invalid');
  return { item, contentId: lesson.id, contentVersion: lesson.contentVersion };
}
export function validateContentReport(catalogue: ContentCatalogue, input: unknown) {
  const report = contentReportSchema.parse(input),
    resolved = resolveReportSource(catalogue, report.source);
  // Fehlerhafte/ungültige Eingaben sind gerade ein Meldungsgrund; nie als Lernnachweis verwenden.
  return {
    ...resolved,
    report,
    evaluation:
      report.checked && report.answer !== null
        ? evaluateExercise(resolved.item, report.answer)
        : null,
  };
}

export const storedContentReportSchema = z
  .object({ report: contentReportSchema, status: z.enum(['pending', 'sent', 'unavailable']) })
  .strict();
export type StoredContentReport = z.infer<typeof storedContentReportSchema>;
