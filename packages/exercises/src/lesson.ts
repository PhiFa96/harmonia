import { createRng } from '@harmonia/theory';
import { generateExercise } from './generate.ts';
import {
  answerSession,
  createSession,
  currentItem,
  nextExercise,
  revealHint,
  sessionSummary,
  skipAuralExercises,
} from './session.ts';
import type { ExerciseSession } from './session.ts';
import type { ExerciseItem, ExerciseSpec } from './types.ts';

export interface LessonDefinition {
  readonly id: string;
  readonly contentVersion: number;
  readonly exercises: readonly ExerciseSpec[];
}
export interface LessonSession {
  readonly lesson: LessonDefinition;
  readonly seed: string | number;
  readonly phase: 'initial' | 'review-intro' | 'review' | 'complete';
  readonly initial: ExerciseSession;
  readonly review?: ExerciseSession;
  /** Wiederholungsindex → ursprünglicher Aufgabenindex. */
  readonly reviewOrigins: readonly number[];
}
export function createLessonSession(
  lesson: LessonDefinition,
  seed: string | number,
): LessonSession {
  const rng = createRng(seed);
  return {
    lesson,
    seed,
    phase: 'initial',
    reviewOrigins: [],
    initial: createSession(lesson.exercises.map((spec) => generateExercise(spec, rng))),
  };
}
export function activeLessonSession(lesson: LessonSession): ExerciseSession | undefined {
  if (lesson.phase === 'initial') return lesson.initial;
  if (lesson.phase === 'review') return lesson.review;
  return undefined;
}
function updateActive(lesson: LessonSession, session: ExerciseSession): LessonSession {
  if (lesson.phase === 'initial') return { ...lesson, initial: session };
  if (lesson.phase === 'review') return { ...lesson, review: session };
  return lesson;
}
export function answerLesson(lesson: LessonSession, answer: string): LessonSession {
  const session = activeLessonSession(lesson);
  return session ? updateActive(lesson, answerSession(session, answer)) : lesson;
}
export function revealLessonHint(lesson: LessonSession): LessonSession {
  const session = activeLessonSession(lesson);
  return session ? updateActive(lesson, revealHint(session)) : lesson;
}
/** Die Tonhöhen müssen sich ändern; bloßes Mischen der Antworten ist keine neue Variante. */
export function itemVariantKey(item: ExerciseItem): string {
  return JSON.stringify(
    item.type === 'NOTE_NAME'
      ? [item.type, item.clef, item.pitch]
      : [item.type, item.clef, item.from, item.to, item.playback],
  );
}
function newVariant(lesson: LessonSession, index: number): ExerciseItem {
  const spec = lesson.lesson.exercises[index];
  const original = lesson.initial.items[index];
  if (!spec || !original) throw new RangeError('Wiederholungsaufgabe fehlt');
  const rng = createRng(`${String(lesson.seed)}:review:${String(index)}`);
  for (let attempt = 0; attempt < 256; attempt++) {
    const item = generateExercise(spec, rng);
    if (itemVariantKey(item) !== itemVariantKey(original)) return item;
  }
  throw new RangeError('Die Parameter müssen mindestens zwei Notenbeispiele erlauben');
}
function finishInitial(lesson: LessonSession): LessonSession {
  const reviewOrigins = lesson.initial.records
    .filter((record) => !record.result.correct)
    .map((record) => record.index);
  if (reviewOrigins.length === 0) return { ...lesson, phase: 'complete' };
  let review = createSession(reviewOrigins.map((index) => newVariant(lesson, index)));
  if (lesson.initial.skipAural) review = skipAuralExercises(review);
  return {
    ...lesson,
    reviewOrigins,
    review,
    phase: currentItem(review) ? 'review-intro' : 'complete',
  };
}
export function nextLessonExercise(lesson: LessonSession): LessonSession {
  const session = activeLessonSession(lesson);
  if (!session?.result) return lesson;
  const next = nextExercise(session);
  const updated = updateActive(lesson, next);
  if (currentItem(next)) return updated;
  return lesson.phase === 'initial' ? finishInitial(updated) : { ...updated, phase: 'complete' };
}
export function startLessonReview(lesson: LessonSession): LessonSession {
  return lesson.phase === 'review-intro' ? { ...lesson, phase: 'review' } : lesson;
}
export function skipLessonAural(lesson: LessonSession): LessonSession {
  const session = activeLessonSession(lesson);
  if (!session) return lesson;
  const next = skipAuralExercises(session);
  const updated = updateActive(lesson, next);
  if (currentItem(next)) return updated;
  return lesson.phase === 'initial' ? finishInitial(updated) : { ...updated, phase: 'complete' };
}
export function lessonSummary(lesson: LessonSession) {
  const initial = sessionSummary(lesson.initial);
  const review = lesson.review ? sessionSummary(lesson.review) : undefined;
  return {
    ...initial,
    accuracy: initial.answered === 0 ? null : initial.correct / initial.answered,
    reviewTotal: lesson.reviewOrigins.length,
    reviewAnswered: review?.answered ?? 0,
    reviewCorrect: review?.correct ?? 0,
    reviewAssisted: review?.assisted ?? 0,
    reviewSkipped: review?.skipped ?? 0,
    unresolved: initial.answered - initial.correct - (review?.correct ?? 0),
  };
}
