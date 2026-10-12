import {
  note,
  singleStaffScore,
  validateScore,
  keyboardLayout,
  parseScore,
} from '@harmonia/notation';
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
  hintText,
  intervalReadingKeyboardRange,
  intervalReadingSemitones,
} from './index.ts';
import type { IntervalItem, VisualIntervalParams } from './index.ts';
const positions = ['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'];
const heights = [64, 65, 67, 69, 71, 72, 74, 76, 77];
const perfectDistances: Readonly<Record<number, number>> = { 4: 5, 5: 7, 8: 12 };
const qualities: Readonly<Record<number, Readonly<Record<number, string>>>> = {
  1: { 0: 'P1' },
  2: { 1: 'm2', 2: 'M2' },
  3: { 3: 'm3', 4: 'M3' },
  4: { 5: 'P4', 6: 'A4' },
  5: { 6: 'd5', 7: 'P5' },
  6: { 8: 'm6', 9: 'M6' },
  7: { 10: 'm7', 11: 'M7' },
  8: { 12: 'P8' },
};
const all = ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'A4', 'd5', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];
const questions = ['semitones', 'quality', 'perfect'] as const;
function params(question: (typeof questions)[number]): VisualIntervalParams {
  return {
    question,
    intervals:
      question === 'perfect'
        ? ['P4', 'P5', 'P8', 'A4', 'd5']
        : question === 'quality'
          ? ['m3', 'M3', 'P4', 'P5', 'P8']
          : all,
    clefs: ['treble'],
    direction: 'both',
    range: { minMidi: 64, maxMidi: 77 },
    maxAccidentals: 0,
  };
}
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Fehlt');
  return value;
}
describe('Halbtonabstände und erste Intervallqualitäten', () => {
  it.each(questions)(
    '%s stimmt für alle einfachen natürlichen Tonpaare mit einer unabhängigen MIDI-/Qualitätstabelle überein',
    (question) => {
      const template = generateVisualInterval(params(question), createRng(0));
      for (const [a, from] of positions.entries())
        for (const [b, to] of positions.entries()) {
          const number = Math.abs(b - a) + 1,
            distance = Math.abs(required(heights[b]) - required(heights[a]));
          if (number > 8 || (question === 'perfect' && ![4, 5, 8].includes(number))) continue;
          const expected =
            question === 'semitones'
              ? `interval-semitones:${String(distance)}`
              : question === 'quality'
                ? required(qualities[number]?.[distance])
                : perfectDistances[number] === distance
                  ? 'interval-perfect:yes'
                  : 'interval-perfect:no';
          const choices =
            question === 'semitones'
              ? Array.from({ length: 13 }, (_, i) => `interval-semitones:${String(i)}`)
              : question === 'quality'
                ? all
                : ['interval-perfect:yes', 'interval-perfect:no'];
          const item: IntervalItem = {
            ...template,
            choices,
            score: singleStaffScore([
              [note(parsePitch(from), duration('half')), note(parsePitch(to), duration('half'))],
            ]),
          };
          expect(validateScore(item.score, { allowPickup: false })).toEqual([]);
          expect(expectedAnswer(item)).toBe(expected);
          expect(intervalReadingSemitones(item)).toBe(distance);
          expect(item.choices.filter((answer) => evaluateExercise(item, answer).correct)).toEqual([
            expected,
          ]);
          expect(expectedAnswer({ ...item, from: parsePitch('C1'), to: parsePitch('C8') })).toBe(
            expected,
          );
          if (question === 'semitones') {
            const range = intervalReadingKeyboardRange(item);
            expect(range).toEqual({
              first: Math.min(required(heights[a]), required(heights[b])),
              last: Math.max(required(heights[a]), required(heights[b])),
            });
            expect(keyboardLayout(range).keys).toHaveLength(distance + 1);
          }
        }
    },
  );
  it.each(questions)(
    '%s: 150 Seeds mit reproduzierbaren Quellen, eindeutigen Antworten und vollständiger Klassenabdeckung',
    (question) => {
      const seen = new Set<string>();
      for (let seed = 0; seed < 150; seed++) {
        const item = generateVisualInterval(params(question), createRng(seed));
        expect(item).toEqual(generateVisualInterval(params(question), createRng(seed)));
        expect(validateScore(item.score, { allowPickup: false })).toEqual([]);
        expect(new Set(item.choices).size).toBe(item.choices.length);
        expect(item.choices.filter((answer) => evaluateExercise(item, answer).correct)).toEqual([
          expectedAnswer(item),
        ]);
        expect(evaluateExercise(item, 'interval-semitones:01').validAnswer).toBe(false);
        seen.add(expectedAnswer(item));
      }
      expect(seen).toEqual(
        new Set(
          question === 'semitones'
            ? Array.from({ length: 13 }, (_, i) => `interval-semitones:${String(i)}`)
            : question === 'quality'
              ? ['m3', 'M3', 'P4', 'P5', 'P8']
              : ['interval-perfect:yes', 'interval-perfect:no'],
        ),
      );
    },
  );
  it.each(['de', 'en-US', 'en-GB'] as const)(
    '%s hat vollständige Fragen, Antworten und Hinweise',
    (locale) => {
      for (const question of questions) {
        const item = generateVisualInterval(params(question), createRng(17));
        for (const text of [
          exercisePrompt(item, locale),
          exerciseDescription(item, locale),
          exerciseFeedback(item, evaluateExercise(item, expectedAnswer(item)), locale).message,
          ...item.choices.map((a) => choiceLabel(item, a, locale)),
          ...([1, 2, 3] as const).map((level) =>
            hintText(item, exerciseHints(item, level), locale),
          ),
        ]) {
          expect(text.trim().length).toBeGreaterThan(0);
          expect(text).not.toMatch(/\$t\(|glossary:|exercise\.|\{\{/);
        }
        if (question === 'semitones')
          expect(choiceLabel(item, expectedAnswer(item), locale)).toMatch(
            locale === 'de' ? /Halbton|Halbtöne/ : locale === 'en-GB' ? /semitone/ : /half step/,
          );
      }
    },
  );
  it('zwei gleiche Töne liefern 0, beide Tritonus-Schreibweisen 6 und kein reines Intervall', () => {
    const template = generateVisualInterval(params('semitones'), createRng(3));
    for (const [score, answer] of [
      ['treble | 4/4 | G4/2 G4/2', 'interval-semitones:0'],
      ['treble | 4/4 | F4/2 B4/2', 'interval-semitones:6'],
      ['treble | 4/4 | B4/2 F5/2', 'interval-semitones:6'],
    ] as const) {
      const source = parseScore(score);
      expect(expectedAnswer({ ...template, score: source })).toBe(answer);
      if (answer === 'interval-semitones:6')
        expect(expectedAnswer({ ...template, question: 'perfect', score: source })).toBe(
          'interval-perfect:no',
        );
    }
  });
  it('unzulässige Reinheitsnummern und einzelne Antwortklassen werden zurückgewiesen', () => {
    for (const value of [
      { ...params('perfect'), intervals: ['M3', 'P4'] },
      { ...params('perfect'), intervals: ['P4', 'P5', 'P8'] },
      { ...params('semitones'), intervals: ['A4', 'd5'] },
      { ...params('quality'), intervals: ['m3'] },
      { ...params('quality'), maxAccidentals: 1 },
    ])
      expect(() => generateVisualInterval(value as VisualIntervalParams, createRng(4))).toThrow();
  });
});
