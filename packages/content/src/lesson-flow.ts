import { z } from 'zod';
import { resolveLesson } from './catalogue.ts';
import type { ContentCatalogue } from './catalogue-schema.ts';
import type { LessonContent } from './schema.ts';
import {
  answerLesson,
  createLessonSession,
  nextLessonExercise,
  revealLessonHint,
  skipLessonAural,
  startLessonReview,
} from '@harmonia/exercises';
import type { LessonSession } from '@harmonia/exercises';

/** Wiederholung ausschließlich aus früheren Lektionen und der Voraussetzungshülle. FSRS folgt in P3.03. */
export function lessonPlan(catalogue: ContentCatalogue, id: string) {
  const content = resolveLesson(catalogue, id);
  const record = catalogue.lessons.find((l) => l.id === id);
  if (!content || !record) return undefined;
  const prerequisites = new Set<string>();
  const visit = (skillId: string) => {
    for (const prior of catalogue.skills.find((s) => s.id === skillId)?.prerequisites ?? []) {
      if (prerequisites.has(prior)) continue;
      prerequisites.add(prior);
      visit(prior);
    }
  };
  record.skillIds.forEach(visit);
  const siblings = catalogue.lessons.filter((l) => l.unitId === record.unitId);
  const earlier = siblings.slice(
    0,
    siblings.findIndex((l) => l.id === id),
  );
  const sources = catalogue.lessons.filter(
    (l) => l.id !== id && (earlier.includes(l) || l.skillIds.every((s) => prerequisites.has(s))),
  );
  const count = Math.max(
    0,
    Math.min(
      15 - content.exercises.length,
      sources.length ? 2 + Math.floor(sources.length / 3) : 0,
      5,
    ),
  );
  const repeats = Array.from({ length: count }, (_, i) => {
    const source = sources[sources.length - 1 - (i % sources.length)];
    if (!source) throw new Error('Wiederholungsquelle fehlt');
    const lesson = resolveLesson(catalogue, source.id);
    const index = i % (lesson?.exercises.length ?? 1);
    const spec = lesson?.exercises[index];
    if (!spec) throw new Error('Wiederholungsaufgabe fehlt');
    return { source, index, spec };
  });
  const exercises: LessonContent['exercises'][number][] = [];
  const repetitionIndices: number[] = [];
  let repeat = 0;
  content.exercises.forEach((spec, index) => {
    exercises.push(spec);
    if (
      repeat < repeats.length &&
      index + 1 >= Math.ceil(((repeat + 1) * content.exercises.length) / (count + 1))
    ) {
      const entry = repeats[repeat++];
      if (entry) {
        repetitionIndices.push(exercises.length);
        exercises.push(entry.spec);
      }
    }
  });
  const planKey = JSON.stringify([
    'flow:1',
    content.id,
    content.contentVersion,
    repeats.map((r) => [r.source.id, r.source.contentVersion, r.index]),
  ]);
  return {
    ...content,
    exercises,
    planKey,
    repetitionIndices,
    newCount: content.exercises.length,
    repetitionCount: count,
  };
}

export const lessonActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('answer'), answer: z.string().min(1).max(4096) }).strict(),
  ...(['hint', 'next', 'skip', 'review'] as const).map((type) =>
    z.object({ type: z.literal(type) }).strict(),
  ),
]);
export type LessonAction = z.infer<typeof lessonActionSchema>;
export const timeZoneSchema = z
  .string()
  .min(1)
  .max(128)
  .refine((zone) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: zone });
      return true;
    } catch {
      return false;
    }
  });
const time = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const lessonDraftSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().min(1).max(256),
    lessonId: z.string().min(1).max(128),
    contentVersion: z.number().int().positive(),
    planKey: z.string().min(1).max(4096),
    seed: z.union([z.string().min(1).max(128), time]),
    startedAt: time,
    finishedAt: time.nullable(),
    timeZone: timeZoneSchema,
    introCard: z.number().int().min(0).max(199),
    started: z.boolean(),
    actions: z.array(lessonActionSchema).max(1600),
    answer: z.string().max(4096).nullable(),
  })
  .strict();
export type LessonDraft = z.infer<typeof lessonDraftSchema>;
export function applyLessonAction(session: LessonSession, action: LessonAction): LessonSession {
  switch (action.type) {
    case 'answer':
      return answerLesson(session, action.answer);
    case 'hint':
      return revealLessonHint(session);
    case 'next':
      return nextLessonExercise(session);
    case 'skip':
      return skipLessonAural(session);
    case 'review':
      return startLessonReview(session);
  }
}
/** Nur beim Laden nachrechnen; laufende Audio-/Rhythmusobjekte bleiben identisch. */
export function restoreLessonDraft(catalogue: ContentCatalogue, input: unknown) {
  const draft = lessonDraftSchema.parse(input);
  const plan = lessonPlan(catalogue, draft.lessonId);
  if (plan?.contentVersion !== draft.contentVersion || plan.planKey !== draft.planKey)
    throw new Error('Lektionsinhalt wurde geändert');
  if (
    draft.introCard >= Math.max(1, plan.introduction.length) ||
    (!draft.started && draft.actions.length)
  )
    throw new Error('Ungültige Einführung');
  let session = createLessonSession(plan, draft.seed);
  for (const action of draft.actions) {
    const next = applyLessonAction(session, action);
    if (next === session) throw new Error('Ungültiger Lektionsübergang');
    session = next;
  }
  if (
    (session.phase === 'complete') !== (draft.finishedAt !== null) ||
    (draft.finishedAt !== null && draft.finishedAt < draft.startedAt)
  )
    throw new Error('Ungültiger Abschluss');
  return { draft, session: draft.started ? session : null, plan };
}
