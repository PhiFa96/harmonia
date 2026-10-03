import { describe, expect, it } from 'vitest';
import {
  answerSession,
  createRng,
  createSession,
  currentItem,
  expectedAnswer,
  generateAuralInterval,
  generateNote,
  nextExercise,
  revealHint,
  sessionSummary,
  skipAuralExercises,
} from './index.ts';

const rng = createRng('session');
const note = () => generateNote({}, rng);
const hearing = () => generateAuralInterval({ intervals: ['m3', 'M3'] }, rng);

describe('Aufgabenablauf', () => {
  it('Prüfen verbucht genau eine Antwort; Weiter braucht eine Bewertung', () => {
    const state = createSession([note(), note()]);
    expect(nextExercise(state)).toBe(state);
    expect(answerSession(state, 'invalid')).toBe(state);
    const item = currentItem(state);
    if (!item) throw new Error('Aufgabe fehlt');
    const wrong = item.choices.find((choice) => choice !== expectedAnswer(item)) ?? '';
    const checked = answerSession(state, wrong);
    expect(checked.records).toHaveLength(1);
    expect(checked.result?.correct).toBe(false);
    expect(answerSession(checked, expectedAnswer(item))).toBe(checked);
    expect(state.records).toHaveLength(0);
    expect(nextExercise(checked)).toMatchObject({ index: 1, hintLevel: 0 });
    expect(nextExercise(checked).result).toBeUndefined();
  });
  it('Hinweise bleiben verfügbar, Lösungshilfe wird gesondert gezählt', () => {
    let state = createSession([note()]);
    state = revealHint(revealHint(revealHint(state)));
    expect(state.hintLevel).toBe(3);
    expect(revealHint(state)).toBe(state);
    const item = currentItem(state);
    if (!item) throw new Error('Aufgabe fehlt');
    state = answerSession(state, expectedAnswer(item));
    expect(revealHint(state)).toBe(state);
    state = nextExercise(state);
    expect(currentItem(state)).toBeUndefined();
    expect(sessionSummary(state)).toMatchObject({
      answered: 1,
      correct: 1,
      assisted: 1,
      independentCorrect: 0,
    });
  });
  it('Hör-Pause überspringt die aktuelle und alle künftigen Hörfragen, ohne sie als Fehler zu zählen', () => {
    let state = createSession([note(), hearing(), note(), hearing(), hearing()]);
    const first = currentItem(state);
    if (!first) throw new Error('Aufgabe fehlt');
    state = nextExercise(answerSession(state, expectedAnswer(first)));
    state = skipAuralExercises(state);
    expect(state).toMatchObject({ index: 2, skipAural: true, skipped: [1, 3, 4] });
    expect(skipAuralExercises(state).skipped).toEqual([1, 3, 4]);
    const last = currentItem(state);
    if (!last) throw new Error('Aufgabe fehlt');
    state = nextExercise(answerSession(state, expectedAnswer(last)));
    expect(currentItem(state)).toBeUndefined();
    expect(sessionSummary(state)).toEqual({
      total: 5,
      answered: 2,
      correct: 2,
      independentCorrect: 2,
      assisted: 0,
      skipped: 3,
    });
  });
  it('bereits beantwortete Hörfragen bleiben gewertet, ein neuer Satz setzt die Hör-Pause zurück', () => {
    const items = [hearing(), hearing()];
    let state = createSession(items);
    const item = items[0];
    if (!item) throw new Error('Aufgabe fehlt');
    state = answerSession(state, expectedAnswer(item));
    state = skipAuralExercises(state);
    expect(state.skipped).toEqual([1]);
    expect(sessionSummary(state).answered).toBe(1);
    expect(createSession(items).skipAural).toBe(false);
  });
  it('ein reiner Hörsatz kann ohne falsche Antworten vollständig übersprungen werden', () => {
    const state = skipAuralExercises(createSession([hearing(), hearing()]));
    expect(currentItem(state)).toBeUndefined();
    expect(sessionSummary(state)).toMatchObject({ answered: 0, correct: 0, skipped: 2 });
    expect(() => createSession([])).toThrow(RangeError);
  });
});
