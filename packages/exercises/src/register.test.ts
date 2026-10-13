import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { parsePitch } from '@harmonia/theory';
import { validateScore } from '@harmonia/notation';
import type { NoteNameParams } from './index.ts';
import {
  choiceLabel,
  createRng,
  evaluateExercise,
  exerciseFeedback,
  exerciseHints,
  exercisePrompt,
  expectedAnswer,
  generateKeyFind,
  generateNote,
  hintText,
} from './index.ts';

const offsets = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
describe('Oktavgenaue Antworten und Lesen vor der Tasteneingabe', () => {
  it.each([
    [64, 77, 0],
    [57, 84, 0],
    [21, 108, 2],
  ] as const)(
    '%s–%s mit Vorzeichenumfang %s: 150 Seeds prüfen vollständige Namen und eine echte Oktavverwechslung',
    (minMidi, maxMidi, maxAccidentals) => {
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const params = {
            range: { minMidi, maxMidi },
            maxAccidentals,
            includeOctave: true,
          } as const;
          const item = generateNote(params, createRng(seed));
          expect(item).toEqual(generateNote(params, createRng(seed)));
          expect(item.includeOctave).toBe(true);
          expect(validateScore(item.score)).toEqual([]);
          const number =
            12 * (item.pitch.octave + 1) + offsets[item.pitch.letter] + item.pitch.alter;
          expect(number).toBeGreaterThanOrEqual(minMidi);
          expect(number).toBeLessThanOrEqual(maxMidi);
          const expected = `${item.pitch.letter}${item.pitch.alter < 0 ? 'b'.repeat(-item.pitch.alter) : '#'.repeat(item.pitch.alter)}${String(item.pitch.octave)}`;
          expect(expectedAnswer(item)).toBe(expected);
          expect(evaluateExercise(item, expected)).toMatchObject({
            validAnswer: true,
            correct: true,
          });
          const wrong = item.choices.find((value) => {
            const pitch = parsePitch(value);
            return (
              pitch.letter === item.pitch.letter &&
              pitch.alter === item.pitch.alter &&
              Math.abs(pitch.octave - item.pitch.octave) === 1
            );
          });
          expect(wrong).toBeDefined();
          expect(evaluateExercise(item, wrong ?? '')).toMatchObject({
            validAnswer: true,
            correct: false,
          });
          expect(item.choices).toHaveLength(4);
          for (const locale of ['de', 'en-US', 'en-GB'] as const) {
            expect(
              new Set(item.choices.map((value) => choiceLabel(item, value, locale))).size,
            ).toBe(4);
            expect(
              exerciseFeedback(item, evaluateExercise(item, expected), locale).message,
            ).toContain(choiceLabel(item, expected, locale));
            expect(hintText(item, exerciseHints(item, 3), locale)).toContain(
              choiceLabel(item, expected, locale),
            );
          }
          expect(evaluateExercise(item, `${item.pitch.letter}:0`).validAnswer).toBe(false);
        }),
        { numRuns: 150, seed: 20751 },
      );
    },
  );
  it('bewahrt den alten Namenmodus und lokalisiert h, h¹, h² und c³ eindeutig', () => {
    expect(generateNote({}, createRng(1))).toEqual(
      generateNote({ includeOctave: false }, createRng(1)),
    );
    expect(generateNote({}, createRng(1)).includeOctave).toBeUndefined();
    const item = {
      ...generateNote({ includeOctave: true }, createRng(1)),
      pitch: parsePitch('B4'),
      choices: ['B3', 'B4', 'B5', 'C6'],
    };
    expect(item.choices.map((value) => choiceLabel(item, value, 'de'))).toEqual([
      'h',
      'h¹',
      'h²',
      'c³',
    ]);
    expect(item.choices.map((value) => choiceLabel(item, value, 'en-US'))).toEqual([
      'B3',
      'B4',
      'B5',
      'C6',
    ]);
    expect(evaluateExercise(item, 'B5')).toMatchObject({
      expected: 'B4',
      correct: false,
      validAnswer: true,
    });
  });
  it('lehnt ungültige und nicht für jede Zielnote wiederholbare Oktavvorgaben ab', () => {
    for (const params of [
      { includeOctave: 'true' },
      { includeOctave: true, range: { minMidi: 60, maxMidi: 71 } },
      { includeOctave: true, range: { minMidi: 21, maxMidi: 26 } },
    ])
      for (let seed = 0; seed < 10; seed++)
        expect(() => generateNote(params as NoteNameParams, createRng(seed))).toThrow();
  });
  it('gibt beim Score-Tastenmodus den Zielton nicht vor, hält A3–C6 fest und weist eine andere Oktave zurück', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const item = generateKeyFind(
          { presentation: 'score', range: { minMidi: 57, maxMidi: 84 }, maxAccidentals: 0 },
          createRng(seed),
        );
        expect(item.presentation).toBe('score');
        expect(item.keyboardRange).toEqual({ first: 57, last: 84 });
        const target = 12 * (item.pitch.octave + 1) + offsets[item.pitch.letter];
        const other = target <= 72 ? target + 12 : target - 12;
        expect(other).toBeGreaterThanOrEqual(57);
        expect(other).toBeLessThanOrEqual(84);
        expect(evaluateExercise(item, `key:${String(other)}`)).toMatchObject({
          validAnswer: true,
          correct: false,
        });
        expect(evaluateExercise(item, `key:${String(target)}`).correct).toBe(true);
        for (const locale of ['de', 'en-US', 'en-GB'] as const)
          expect(exercisePrompt(item, locale)).not.toMatch(/[0-9¹²³⁴⁵]/);
      }),
      { numRuns: 150, seed: 20752 },
    );
  });
});
