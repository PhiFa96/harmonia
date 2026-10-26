import { contextAnswer, contextVariantKey } from './context.ts';
import { inputTarget } from './pitch-input.ts';
import { octaveNamePitch } from './octave-names.ts';
import { listeningVariantKey, listeningAnswer } from './listening.ts';
import { createRng, keyFifths, midi } from '@harmonia/theory';
import { isKeySignatureItem, isScaleItem } from './tonality.ts';
import { chordReferencePitch, chordTargets, isChordItem } from './chords.ts';
import { isRhythmItem, pickupAnswer, rhythmMeter } from './rhythm.ts';
import { knowledgeFactId, orderValueId } from './knowledge.ts';
import { generateExercise } from './generate.ts';
import { cadenceAnswer, functionAnswer } from './harmony-exercises.ts';
import {
  answerSession,
  createSession,
  currentItem,
  nextExercise,
  revealHint,
  sessionSummary,
  skipAuralExercises,
  skipVoiceExercise,
} from './session.ts';
import type { ExerciseSession } from './session.ts';
import type { ExerciseItem, ExerciseSpec } from './types.ts';
import { isIntervalReadingItem, intervalReadingAnswer } from './interval-reading.ts';

export interface LessonDefinition {
  readonly id: string;
  readonly contentVersion: number;
  readonly exercises: readonly ExerciseSpec[];
  /** Versionierter Mischplan; alte Durchgänge behalten ihren ursprünglichen Aufgabensatz. */
  readonly planKey?: string;
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
  if (activeLessonSession(lesson) === session) return lesson;
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
/** Das Musikbeispiel muss sich ändern; bloßes Mischen der Antworten ist keine neue Variante. */
export function itemVariantKey(item: ExerciseItem): string {
  if (item.type === 'CHOIR_PART')
    return JSON.stringify(
      item.params.fifths === undefined
        ? [item.type, item.params, item.bpm]
        : [item.type, item.params.voice, item.parts[item.params.voice].map(midi)],
    );
  if (item.type === 'VOICE_LEADING') return JSON.stringify([item.type, item.params, item.fifths]);
  if (item.type === 'SIGHT_SING' || item.type === 'SING_INTERVAL' || item.type === 'PLAY_BACK')
    return JSON.stringify([item.type, item.pitches.map(midi)]);
  if (item.type === 'CONTEXT_CHOICE') return contextVariantKey(item);
  if (item.type === 'LISTENING_CHOICE') return listeningVariantKey(item);
  if (isIntervalReadingItem(item))
    return JSON.stringify([item.type, item.question, intervalReadingAnswer(item)]);
  if (item.type === 'KNOWLEDGE_MC')
    return JSON.stringify([item.type, knowledgeFactId(item.fact), ...(item.gap ? [item.gap] : [])]);
  if (item.type === 'MATCH')
    return JSON.stringify([item.type, item.facts.map(knowledgeFactId).sort()]);
  if (item.type === 'ORDER')
    return JSON.stringify([
      item.type,
      item.topic,
      item.direction,
      item.values.map(orderValueId).sort(),
    ]);
  if (item.type === 'METER_IDENTIFY')
    return JSON.stringify([
      item.type,
      item.presentation === 'pickup' ? pickupAnswer(item) : rhythmMeter(item),
    ]);
  if (isRhythmItem(item))
    return JSON.stringify([
      item.type,
      rhythmMeter(item),
      item.score.staves[0]?.measures[0]?.voices[0]?.events.map((event) => [
        event.kind,
        event.duration,
      ]),
    ]);
  if (isChordItem(item))
    return JSON.stringify(
      item.presentation === 'aural'
        ? [
            item.type,
            item.presentation,
            midi(chordReferencePitch(item)),
            chordTargets(item)
              .map(midi)
              .sort((a, b) => a - b),
          ]
        : [item.type, item.presentation, chordTargets(item)],
    );
  if (isScaleItem(item))
    return JSON.stringify([item.type, item.tonic, item.scaleType, item.direction]);
  if (isKeySignatureItem(item))
    return JSON.stringify([item.type, keyFifths(item.key), item.key.mode]);
  if (item.type === 'CADENCE_IDENTIFY' || item.type === 'FUNCTION_ANALYSIS' || 'durations' in item)
    return JSON.stringify([item.type, item.score]);
  if (item.type === 'KEY_FIND') return JSON.stringify([item.type, midi(inputTarget(item))]);
  if (item.type === 'NOTE_NAME' && item.presentation === 'octave-name')
    return JSON.stringify([item.type, octaveNamePitch(item)]);
  return JSON.stringify(
    'pitch' in item
      ? [item.type, item.clef, item.pitch]
      : [item.type, item.clef, item.from, item.to, item.playback],
  );
}
/** Kadenz- und Stufenaufgaben wechseln die Antwort, sofern die Parameter mehrere zulassen. */
function harmonyAnswerMustChange(spec: ExerciseSpec, item: ExerciseItem): boolean {
  if (spec.type === 'CADENCE_IDENTIFY' && item.type === 'CADENCE_IDENTIFY')
    return (spec.params.types?.length ?? 2) > 1;
  if (spec.type === 'FUNCTION_ANALYSIS' && item.type === 'FUNCTION_ANALYSIS')
    return new Set(spec.params.degrees ?? [1, 2, 4, 5, 6]).size > 1;
  return false;
}
function harmonyAnswer(item: ExerciseItem): string | undefined {
  if (item.type === 'CADENCE_IDENTIFY') return cadenceAnswer(item);
  if (item.type === 'FUNCTION_ANALYSIS') return functionAnswer(item);
  return undefined;
}
function newVariant(lesson: LessonSession, index: number): ExerciseItem {
  const spec = lesson.lesson.exercises[index];
  const original = lesson.initial.items[index];
  if (!spec || !original) throw new RangeError('Wiederholungsaufgabe fehlt');
  const rng = createRng(`${String(lesson.seed)}:review:${String(index)}`);
  for (let attempt = 0; attempt < 256; attempt++) {
    // A fixed initial key must still permit a different musical review task.
    // Keep legacy specs on their original generation path for seed replay.
    let variantSpec = spec;
    if (
      spec.type === 'VOICE_LEADING' &&
      spec.params.fifths !== undefined &&
      original.type === 'VOICE_LEADING'
    )
      variantSpec = {
        ...spec,
        params: {
          ...spec.params,
          fifths: rng.pick(([-1, 0, 1] as const).filter((key) => key !== original.fifths)),
        },
      };
    else if (
      spec.type === 'CHOIR_PART' &&
      spec.params.fifths !== undefined &&
      original.type === 'CHOIR_PART'
    )
      variantSpec = {
        ...spec,
        params: {
          ...spec.params,
          fifths: rng.pick(([-2, 0, 2] as const).filter((key) => key !== original.params.fifths)),
        },
      };
    const item = generateExercise(variantSpec, rng);
    if (
      itemVariantKey(item) !== itemVariantKey(original) &&
      (item.type !== 'CONTEXT_CHOICE' ||
        original.type !== 'CONTEXT_CHOICE' ||
        ['scale-pattern', 'triplet-duration'].includes(item.topic) ||
        contextAnswer(item) !== contextAnswer(original)) &&
      (item.type !== 'LISTENING_CHOICE' ||
        original.type !== 'LISTENING_CHOICE' ||
        listeningAnswer(item) !== listeningAnswer(original)) &&
      (!harmonyAnswerMustChange(spec, item) || harmonyAnswer(item) !== harmonyAnswer(original))
    )
      return item;
  }
  throw new RangeError('Die Parameter müssen mindestens zwei Aufgabenvarianten erlauben');
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
export function skipLessonVoice(lesson: LessonSession): LessonSession {
  const session = activeLessonSession(lesson);
  if (!session) return lesson;
  const next = skipVoiceExercise(session);
  if (next === session) return lesson;
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

/** Kanonische Fehlerwiederholung, unabhängig von clientseitigen Item-Snapshots. */
export function lessonReviewItem(
  lesson: LessonDefinition,
  seed: number | string,
  originalIndex: number,
): ExerciseItem {
  return newVariant(createLessonSession(lesson, seed), originalIndex);
}
