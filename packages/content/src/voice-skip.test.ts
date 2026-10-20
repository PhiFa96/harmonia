import { describe, expect, it } from 'vitest';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
  isVoiceItem,
  nextLessonExercise,
  skipLessonVoice,
} from '@harmonia/exercises';
import { catalogue } from './authoring.ts';
import { countedTotal, lessonProgress, PASS_PERCENT } from './learning-evidence.ts';
import { resolveLesson } from './index.ts';

function required<T>(v: T | undefined): T {
  if (v === undefined) throw new Error('Fehlt');
  return v;
}

/** Spielt eine Lektion ohne Mikrofon: Gesangsaufgaben überspringen, alles andere richtig lösen. */
function playWithoutMicrophone(lessonId: string, seed: number) {
  let state = createLessonSession(required(resolveLesson(catalogue, lessonId)), seed);
  for (let guard = 0; state.phase === 'initial' && guard < 100; guard++) {
    const item = required(currentItem(required(activeLessonSession(state))));
    state = isVoiceItem(item)
      ? skipLessonVoice(state)
      : nextLessonExercise(answerLesson(state, expectedAnswer(item)));
  }
  return state;
}

describe('Mikrofonaufgaben ohne Mikrofon', () => {
  it.each(['aural.l1.pitch-intervals.intervals', 'aural.l2.melody.foundation'])(
    '%s: Überspringen schadet der Bestehensquote nicht',
    (lessonId) => {
      for (const seed of [1, 2, 3]) {
        const state = playWithoutMicrophone(lessonId, seed);
        const progress = lessonProgress(state);
        const items = state.initial.items.length;
        expect(state.phase).toBe('complete');
        expect(progress.voiceSkipped ?? 0).toBeGreaterThan(0);
        expect(countedTotal(progress)).toBe(items - required(progress.voiceSkipped));
        // Ohne die Regel läge die Quote unter der Schwelle (Befund der Fachprüfung P3.10).
        expect(progress.eligibleCorrect * 100).toBeLessThan(PASS_PERCENT * items);
        expect(progress.passed).toBe(true);
      }
    },
  );

  it('verlangt weiterhin mindestens eine beantwortete Aufgabe', () => {
    const lesson = required(resolveLesson(catalogue, 'aural.l1.pitch-intervals.intervals'));
    let state = createLessonSession(lesson, 5);
    for (let guard = 0; state.phase === 'initial' && guard < 100; guard++) {
      const item = required(currentItem(required(activeLessonSession(state))));
      state = isVoiceItem(item)
        ? skipLessonVoice(state)
        : nextLessonExercise(answerLesson(state, 'listening:garbage'));
    }
    expect(lessonProgress(state).passed).toBe(false);
  });
});
