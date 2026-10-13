import { note, singleStaffScore, validateScore } from '@harmonia/notation';
import { duration, parsePitch } from '@harmonia/theory';
import { describe, expect, it } from 'vitest';
import {
  choiceLabel,
  createRng,
  evaluateExercise,
  exerciseDescription,
  exerciseFeedback,
  exerciseHints,
  exercisePrompt,
  expectedAnswer,
  generateVisualInterval,
  generateIntervalBuild,
  hintText,
  intervalReadingPitches,
  intervalReadingPath,
  itemVariantKey,
} from './index.ts';
import type { IntervalItem, IntervalReadingQuestion, VisualIntervalParams } from './index.ts';
const intervals = ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];
const positions = ['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'];
const questions = ['number', 'direction', 'motion'] as const;
function params(question: IntervalReadingQuestion): VisualIntervalParams {
  return {
    intervals,
    question,
    direction: 'both',
    maxAccidentals: 0,
    range: { minMidi: 64, maxMidi: 77 },
  };
}
function ids(question: IntervalReadingQuestion): string[] {
  return question === 'number'
    ? Array.from({ length: 8 }, (_, i) => `interval-number:${String(i + 1)}`)
    : question === 'direction'
      ? ['interval-direction:up', 'interval-direction:down', 'interval-direction:same']
      : ['interval-motion:repeat', 'interval-motion:step', 'interval-motion:leap'];
}
describe('Intervallnummer, Richtung und Bewegung aus dem Notenbild', () => {
  it.each(questions)(
    '%s stimmt für alle natürlichen Tonpaare im Einführungsbereich mit einer unabhängigen Positionstabelle überein',
    (question) => {
      const source = generateVisualInterval(params(question), createRng(1));
      for (const [a, from] of positions.entries())
        for (const [b, to] of positions.entries()) {
          const number = Math.abs(b - a) + 1;
          if (number > 8) continue;
          const item: IntervalItem = {
            ...source,
            choices: ids(question),
            score: singleStaffScore([
              [note(parsePitch(from), duration('half')), note(parsePitch(to), duration('half'))],
            ]),
          };
          const expected =
            question === 'number'
              ? `interval-number:${String(number)}`
              : question === 'direction'
                ? `interval-direction:${b > a ? 'up' : b < a ? 'down' : 'same'}`
                : `interval-motion:${number === 1 ? 'repeat' : number === 2 ? 'step' : 'leap'}`;
          expect(validateScore(item.score, { allowPickup: false })).toEqual([]);
          expect(expectedAnswer(item)).toBe(expected);
          expect(item.choices.filter((answer) => evaluateExercise(item, answer).correct)).toEqual([
            expected,
          ]);
          const path = intervalReadingPath(item);
          expect(path).toHaveLength(number);
          expect(path[0]).toEqual(parsePitch(from));
          expect(path[number - 1]).toEqual(parsePitch(to));
          expect(expectedAnswer({ ...item, from: parsePitch('C1'), to: parsePitch('C8') })).toBe(
            expected,
          );
          expect(
            exerciseDescription(
              { ...item, clef: 'bass', from: parsePitch('C1'), to: parsePitch('C8') },
              'de',
            ),
          ).toBe(exerciseDescription(item, 'de'));
        }
    },
  );
  it.each(questions)(
    '%s erzeugt über 150 Seeds reproduzierbare, natürliche Quellen und alle Antwortklassen',
    (question) => {
      const seen = new Set<string>();
      for (let seed = 0; seed < 150; seed++) {
        const item = generateVisualInterval(params(question), createRng(seed));
        expect(item).toEqual(generateVisualInterval(params(question), createRng(seed)));
        expect(validateScore(item.score, { allowPickup: false })).toEqual([]);
        expect(intervalReadingPitches(item)).toEqual([item.from, item.to]);
        expect(new Set(item.choices).size).toBe(item.choices.length);
        expect(item.choices.every((answer) => ids(question).includes(answer))).toBe(true);
        expect(evaluateExercise(item, expectedAnswer(item)).correct).toBe(true);
        expect(evaluateExercise(item, 'M3')).toMatchObject({ validAnswer: false, correct: false });
        seen.add(expectedAnswer(item));
      }
      expect(seen).toEqual(new Set(ids(question)));
    },
  );
  it.each(['de', 'en-US', 'en-GB'] as const)(
    '%s bietet Begriffe, Hinweise und Feedback ohne vorgezogene Intervallqualitäten',
    (locale) => {
      for (const question of questions) {
        const item = generateVisualInterval(params(question), createRng(18));
        const texts = [
          exercisePrompt(item, locale),
          exerciseDescription(item, locale),
          exerciseFeedback(item, evaluateExercise(item, expectedAnswer(item)), locale).message,
          ...item.choices.map((answer) => choiceLabel(item, answer, locale)),
          ...([1, 2, 3] as const).map((level) =>
            hintText(item, exerciseHints(item, level), locale),
          ),
        ];
        for (const text of texts) {
          expect(text.trim().length).toBeGreaterThan(0);
          expect(text).not.toMatch(
            /\$t\(|glossary:|exercise\.|\{\{|\b(?:minor|major|perfect|kleine|große|reine|Halbton)\b/,
          );
        }
      }
    },
  );
  it('Wiederholungen unterscheiden die fachliche Antwort statt nur Tonlage oder Schlüssel', () => {
    const source = generateVisualInterval(params('number'), createRng(3));
    const shifted = singleStaffScore([
      [note(parsePitch('C4'), duration('half')), note(parsePitch('E4'), duration('half'))],
    ]);
    const other = singleStaffScore([
      [note(parsePitch('C4'), duration('half')), note(parsePitch('F4'), duration('half'))],
    ]);
    const third = { ...source, score: shifted };
    expect(itemVariantKey({ ...third, clef: 'bass' })).toBe(itemVariantKey(third));
    expect(itemVariantKey({ ...third, score: other })).not.toBe(itemVariantKey(third));
  });
  it('Parameter mit Vorzeichen, zusammengesetzten Intervallen oder nur einer Antwort werden zurückgewiesen', () => {
    for (const value of [
      { ...params('number'), maxAccidentals: 1 },
      { ...params('number'), intervals: ['P1', 'P15'] },
      { ...params('number'), intervals: ['m3', 'M3'] },
      { ...params('direction'), direction: 'up', intervals: ['M2', 'P4'] },
      { ...params('motion'), intervals: ['M3', 'P4'] },
      { ...params('number'), question: 'quality' },
    ])
      expect(() => generateVisualInterval(value as VisualIntervalParams, createRng(0))).toThrow();
    expect(() => generateIntervalBuild(params('number'), createRng(0))).toThrow();
  });
  it('leere, veränderte, gebundene und zu große Score-Quellen werden nicht bewertet', () => {
    const source = generateVisualInterval(params('number'), createRng(2));
    for (const score of [
      singleStaffScore([[]]),
      singleStaffScore([
        [note(parsePitch('F#4'), duration('half')), note(parsePitch('G4'), duration('half'))],
      ]),
      singleStaffScore([
        [note(parsePitch('F4'), duration('half'), true), note(parsePitch('F4'), duration('half'))],
      ]),
      singleStaffScore([
        [note(parsePitch('C4'), duration('half')), note(parsePitch('D5'), duration('half'))],
      ]),
      singleStaffScore([
        [note(parsePitch('F4'), duration('whole')), note(parsePitch('G4'), duration('whole'))],
      ]),
    ])
      expect(() => expectedAnswer({ ...source, score })).toThrow();
  });
});
