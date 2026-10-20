import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { expectedAnswer } from './evaluate.ts';
import { currentItem } from './session.ts';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  itemVariantKey,
  lessonSummary,
  nextLessonExercise,
  revealLessonHint,
  skipLessonAural,
  startLessonReview,
} from './lesson.ts';
import type { LessonDefinition, LessonSession } from './lesson.ts';
const definition: LessonDefinition = {
  id: 'test',
  contentVersion: 1,
  exercises: [
    { type: 'NOTE_NAME', params: { clefs: ['treble'] } },
    { type: 'INTERVAL_IDENTIFY_VISUAL', params: { intervals: ['m3', 'M3', 'P4', 'P5'] } },
    { type: 'INTERVAL_IDENTIFY_AURAL', params: { intervals: ['m3', 'M3', 'P4', 'P5'] } },
  ],
};
function answer(state: LessonSession, correct = true) {
  const session = activeLessonSession(state);
  const item = session && currentItem(session);
  if (!item) throw new Error('Aufgabe fehlt');
  const solution = expectedAnswer(item);
  const choice = correct ? solution : item.choices.find((value) => value !== solution);
  if (!choice) throw new Error('Antwort fehlt');
  return answerLesson(state, choice);
}
function finishInitial(state: LessonSession, wrong: readonly number[] = []) {
  while (state.phase === 'initial') {
    state = nextLessonExercise(answer(state, !wrong.includes(state.initial.index)));
  }
  return state;
}
describe('Lektion und Wiederholungsrunde', () => {
  it('beendet einen fehlerfreien Durchgang direkt; ungültige Übergänge bleiben wirkungslos', () => {
    const start = createLessonSession(definition, 1);
    expect(createLessonSession(definition, start.seed).initial.items).toEqual(start.initial.items);
    expect(nextLessonExercise(start)).toBe(start);
    expect(startLessonReview(start)).toBe(start);
    expect(answerLesson(start, 'unbekannt').initial.records).toEqual([]);
    const done = finishInitial(start);
    expect(done.phase).toBe('complete');
    expect(lessonSummary(done)).toMatchObject({ correct: 3, accuracy: 1, reviewTotal: 0 });
    expect(answerLesson(done, 'C:0')).toBe(done);
  });
  it('behält die erste Antwort, Hinweise und ursprüngliche Genauigkeit trotz erfolgreicher Wiederholung', () => {
    let state = createLessonSession(definition, 2);
    state = revealLessonHint(state);
    state = answer(state, false);
    expect(answer(state).initial.records).toEqual(state.initial.records);
    state = finishInitial(nextLessonExercise(state));
    expect(state.phase).toBe('review-intro');
    expect(state.reviewOrigins).toEqual([0]);
    expect(state.initial.records[0]?.hintLevel).toBe(1);
    state = startLessonReview(state);
    state = nextLessonExercise(answer(state));
    expect(lessonSummary(state)).toMatchObject({
      correct: 2,
      answered: 3,
      accuracy: 2 / 3,
      reviewCorrect: 1,
      unresolved: 0,
    });
    expect(state.phase).toBe('complete');
  });
  it('wiederholt jeden Fehler genau einmal in neuer, reproduzierbarer Variante', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const first = finishInitial(createLessonSession(definition, seed), [0, 1, 2]);
        const second = finishInitial(createLessonSession(definition, seed), [0, 1, 2]);
        expect(first.review).toEqual(second.review);
        first.review?.items.forEach((item, index) => {
          expect(itemVariantKey(item)).not.toBe(
            itemVariantKey(required(first.initial.items[index])),
          );
          expect(item.type).toBe(first.initial.items[index]?.type);
        });
        let state = startLessonReview(first);
        while (state.phase === 'review') state = nextLessonExercise(answer(state, false));
        expect(lessonSummary(state)).toMatchObject({
          reviewAnswered: 3,
          reviewCorrect: 0,
          unresolved: 3,
        });
        expect(state.phase).toBe('complete');
      }),
      { numRuns: 300 },
    );
  });
  it('Kadenz- und Stufenaufgaben wechseln beim Fehlerdurchgang die fachliche Antwort', () => {
    const harmony: LessonDefinition = {
      id: 'harmony',
      contentVersion: 1,
      exercises: [
        { type: 'CADENCE_IDENTIFY', params: { types: ['authentic', 'plagal'] } },
        { type: 'CADENCE_IDENTIFY', params: {} },
        { type: 'FUNCTION_ANALYSIS', params: { degrees: [1, 4, 5], notation: 'roman' } },
        { type: 'FUNCTION_ANALYSIS', params: { notation: 'function' } },
      ],
    };
    for (let seed = 0; seed < 150; seed++) {
      const first = finishInitial(createLessonSession(harmony, seed), [0, 1, 2, 3]);
      expect(first.review?.items).toHaveLength(4);
      first.review?.items.forEach((item, index) => {
        expect(expectedAnswer(item), `Seed ${String(seed)} Aufgabe ${String(index)}`).not.toBe(
          expectedAnswer(required(first.initial.items[index])),
        );
      });
    }
  });
  it('Aufgaben mit nur einer möglichen Antwort bleiben wiederholbar', () => {
    const single: LessonDefinition = {
      id: 'single',
      contentVersion: 1,
      exercises: [
        { type: 'CADENCE_IDENTIFY', params: { types: ['authentic'] } },
        { type: 'FUNCTION_ANALYSIS', params: { degrees: [5] } },
      ],
    };
    const state = finishInitial(createLessonSession(single, 3), [0]);
    expect(state.phase).toBe('review-intro');
    expect(state.review?.items).toHaveLength(1);
    // Die Stufenaufgabe hat nur eine Antwort; ein Fehlerdurchgang ist hier nicht möglich,
    // die Lektion darf dafür aber nicht scheitern.
    expect(createLessonSession(single, 4).initial.items).toHaveLength(2);
  });
  it('Hör-Pause schließt künftige Hörfragen einschließlich früherer Hörfehler in der Wiederholung aus', () => {
    const expanded = {
      ...definition,
      exercises: [...definition.exercises, ...definition.exercises],
    };
    let state = createLessonSession(expanded, 3);
    for (let index = 0; index < 3; index++) state = nextLessonExercise(answer(state, index !== 2));
    state = skipLessonAural(state);
    state = finishInitial(state);
    expect(state.phase).toBe('complete');
    expect(lessonSummary(state)).toMatchObject({
      answered: 5,
      correct: 4,
      skipped: 1,
      reviewSkipped: 1,
      unresolved: 1,
    });
  });
  it('Hör-Pause mitten in der Wiederholung überspringt deren Hörfragen und bleibt nur im aktuellen Durchgang', () => {
    let state = startLessonReview(finishInitial(createLessonSession(definition, 4), [0, 1, 2]));
    state = nextLessonExercise(answer(state));
    state = skipLessonAural(state);
    state = nextLessonExercise(answer(state));
    expect(state.phase).toBe('complete');
    expect(lessonSummary(state)).toMatchObject({
      reviewAnswered: 2,
      reviewCorrect: 2,
      reviewSkipped: 1,
    });
    expect(createLessonSession(definition, 5).initial.skipAural).toBe(false);
  });
  it('leere Lektionen werden zurückgewiesen', () => {
    expect(() => createLessonSession({ ...definition, exercises: [] }, 1)).toThrow(RangeError);
  });
});

function required<T>(value: T | undefined | null): T {
  if (value == null) throw new Error('Erwarteter Testwert fehlt');
  return value;
}
