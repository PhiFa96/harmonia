import { z } from 'zod';
import type { ExerciseItem } from '@harmonia/exercises';
import {
  createLessonSession,
  activeLessonSession,
  currentItem,
  evaluateExercise,
  matchAnswerValues,
  orderAnswerValues,
} from '@harmonia/exercises';
import { resolveLesson } from './catalogue.ts';
import type { ContentCatalogue } from './catalogue-schema.ts';
import { applyLessonAction, lessonActionSchema } from './lesson-flow.ts';
import type { LessonAction } from './lesson-flow.ts';

function validSelection(item: ExerciseItem, answer: string) {
  return item.type === 'MATCH'
    ? matchAnswerValues(item, answer) !== undefined
    : item.type === 'ORDER'
      ? orderAnswerValues(item, answer) !== undefined
      : item.choices.includes(answer);
}

export const LEVEL_FIVE_PREVIEW_TTL = 7 * 86400000;
const time = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const levelFivePreviewSchema = z
  .object({
    schemaVersion: z.literal(1),
    engineVersion: z.literal(1),
    id: z.string().min(1).max(128),
    lessonId: z.string().min(1).max(128),
    catalogueVersion: z.number().int().positive(),
    sourceKey: z.string().min(1).max(250000),
    seed: z.string().min(1).max(128),
    createdAt: time,
    updatedAt: time,
    started: z.boolean(),
    introCard: z.number().int().min(0).max(199),
    actions: z.array(lessonActionSchema).max(200),
    answer: z.string().max(4096).nullable(),
  })
  .strict();
export type LevelFivePreview = z.infer<typeof levelFivePreviewSchema>;

function source(catalogue: ContentCatalogue, id: string) {
  const record = catalogue.lessons.find((l) => l.id === id);
  const lesson =
    record?.status === 'entwurf' &&
    /^(counterpoint|forms|analysis|contemporary|world)\.l5\./.test(id)
      ? resolveLesson(catalogue, id)
      : undefined;
  if (!lesson) throw Error('Preview source unavailable');
  return lesson;
}
export function createLevelFivePreview(
  catalogue: ContentCatalogue,
  lessonId: string,
  id: string,
  now: number,
): LevelFivePreview {
  const lesson = source(catalogue, lessonId);
  return levelFivePreviewSchema.parse({
    schemaVersion: 1,
    engineVersion: 1,
    id,
    lessonId,
    catalogueVersion: catalogue.contentVersion,
    sourceKey: JSON.stringify(lesson),
    seed: id,
    createdAt: now,
    updatedAt: now,
    started: false,
    introCard: 0,
    actions: [],
    answer: null,
  });
}
/** Recompute from sources and actions. Stored scores, items and completion claims are rejected. */
export function restoreLevelFivePreview(catalogue: ContentCatalogue, input: unknown, now: number) {
  const draft = levelFivePreviewSchema.parse(input),
    lesson = source(catalogue, draft.lessonId);
  if (
    !Number.isFinite(now) ||
    draft.createdAt > draft.updatedAt ||
    draft.updatedAt > now ||
    now - draft.createdAt >= LEVEL_FIVE_PREVIEW_TTL
  )
    throw Error('Preview time unavailable');
  if (
    draft.catalogueVersion !== catalogue.contentVersion ||
    draft.sourceKey !== JSON.stringify(lesson)
  )
    throw Error('Preview source changed');
  if (
    draft.introCard >= Math.max(1, lesson.introduction.length) ||
    (!draft.started && (draft.actions.length || draft.answer !== null))
  )
    throw Error('Preview introduction invalid');
  let session = createLessonSession(lesson, draft.seed);
  for (const action of draft.actions) {
    const item = currentItem(activeLessonSession(session) ?? session.initial);
    if (action.type === 'answer' && (!item || !evaluateExercise(item, action.answer).validAnswer))
      throw Error('Preview answer invalid');
    const next = applyLessonAction(session, action);
    if (next === session) throw Error('Preview transition invalid');
    session = next;
  }
  const active = activeLessonSession(session),
    item = active && currentItem(active);
  if (draft.answer !== null && (!item || !validSelection(item, draft.answer)))
    throw Error('Preview selection invalid');
  return { draft, lesson, session: draft.started ? session : null };
}
export type LevelFivePreviewState = ReturnType<typeof restoreLevelFivePreview>;

export function changeLevelFivePreview(
  state: LevelFivePreviewState,
  change:
    | { type: 'start' }
    | { type: 'card'; index: number }
    | { type: 'select'; answer: string | null }
    | { type: 'act'; action: LessonAction },
  now: number,
): LevelFivePreviewState {
  const draft = { ...state.draft, updatedAt: now };
  if (
    !Number.isSafeInteger(now) ||
    now < state.draft.updatedAt ||
    now < draft.createdAt ||
    now - draft.createdAt >= LEVEL_FIVE_PREVIEW_TTL
  )
    throw Error('Preview time unavailable');
  let session = state.session;
  if (change.type === 'start') {
    if (session || draft.started) throw Error('Preview already started');
    draft.started = true;
    session = createLessonSession(state.lesson, draft.seed);
  } else if (change.type === 'card') {
    if (
      session ||
      !Number.isInteger(change.index) ||
      change.index < 0 ||
      change.index >= state.lesson.introduction.length
    )
      throw Error('Preview introduction invalid');
    draft.introCard = change.index;
  } else if (change.type === 'select') {
    const active = session && activeLessonSession(session),
      item = active && currentItem(active);
    if (!item || (change.answer !== null && !validSelection(item, change.answer)))
      throw Error('Preview selection invalid');
    draft.answer = change.answer;
  } else {
    if (!session) throw Error('Preview not started');
    const active = activeLessonSession(session),
      item = active && currentItem(active);
    if (
      change.action.type === 'answer' &&
      (!item || !evaluateExercise(item, change.action.answer).validAnswer)
    )
      throw Error('Preview answer invalid');
    const next = applyLessonAction(session, change.action);
    if (next === session) throw Error('Preview transition invalid');
    session = next;
    draft.actions = [...draft.actions, change.action];
    if (change.action.type === 'answer') draft.answer = change.action.answer;
    else if (change.action.type !== 'hint') draft.answer = null;
  }
  return { ...state, draft: levelFivePreviewSchema.parse(draft), session };
}
