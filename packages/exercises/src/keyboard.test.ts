import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { KeyFindParams, KnowledgeParams } from './index.ts';
import {
  createRng,
  evaluateExercise,
  exercisePrompt,
  exerciseFeedback,
  exerciseHints,
  hintText,
  expectedAnswer,
  generateKeyFind,
  generateKnowledge,
  generateMatch,
  knowledgeFactId,
  knowledgeFactLabel,
} from './index.ts';

const offsets = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
describe('Klaviaturgrundlagen ohne vorgezogene Oktavfragen', () => {
  it.each([0, 1] as const)(
    'Namenmodus mit Vorzeichenumfang %s: 150 Seeds bleiben bei eindeutigen Tasten und erreichbaren Stammtönen',
    (maxAccidentals) => {
      const params: KeyFindParams = {
        presentation: 'name',
        range: { minMidi: 60, maxMidi: 71 },
        maxAccidentals,
      };
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const item = generateKeyFind(params, createRng(seed));
          expect(item).toEqual(generateKeyFind(params, createRng(seed)));
          expect(item).toMatchObject({
            presentation: 'name',
            keyboardRange: { first: 60, last: 71 },
          });
          expect(item.pitch.octave).toBe(4);
          expect(Math.abs(item.pitch.alter)).toBeLessThanOrEqual(maxAccidentals);
          const target = 60 + offsets[item.pitch.letter] + item.pitch.alter;
          expect(target).toBeGreaterThanOrEqual(60);
          expect(target).toBeLessThanOrEqual(71);
          expect(expectedAnswer(item)).toBe(`key:${String(target)}`);
          expect(evaluateExercise(item, `key:${String(target)}`).correct).toBe(true);
          expect(
            evaluateExercise(item, `key:${String(target === 71 ? 60 : target + 1)}`).correct,
          ).toBe(false);
          for (const locale of ['de', 'en-US', 'en-GB'] as const) {
            expect(exercisePrompt(item, locale)).not.toMatch(/[0-9¹²³⁴⁵]/);
            const evaluation = evaluateExercise(item, expectedAnswer(item));
            for (const text of [
              exercisePrompt(item, locale),
              exerciseFeedback(item, evaluation, locale).message,
              ...([1, 2, 3] as const).map((level) =>
                hintText(item, exerciseHints(item, level), locale),
              ),
            ])
              expect(text).not.toMatch(/Oktav|octave/);
          }
        }),
        { numRuns: 150, seed: 20721 },
      );
    },
  );
  it('erhält den bisherigen Notenmodus und lehnt mehrdeutige oder unerreichbare Namensbereiche ab', () => {
    expect(generateKeyFind({}, createRng(1))).toEqual(
      generateKeyFind({ presentation: 'notation' }, createRng(1)),
    );
    expect(generateKeyFind({}, createRng(1)).presentation).toBeUndefined();
    for (const params of [
      { presentation: 'unknown' },
      { presentation: 'name', range: { minMidi: 60, maxMidi: 72 } },
      { presentation: 'name', range: { minMidi: 61, maxMidi: 61 }, maxAccidentals: 1 },
      { presentation: 'name', range: { minMidi: 72, maxMidi: 60 } },
    ])
      expect(() => generateKeyFind(params as KeyFindParams, createRng(1))).toThrow();
  });
  it('beschränkt einfache Vorzeichen samt Ablenkantworten und Zuordnungen auf Be, Auflösung und Kreuz', () => {
    const allowed = ['accidental:-1', 'accidental:0', 'accidental:1'];
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const params: KnowledgeParams = { topics: ['accidentals'], maxAccidentals: 1 };
        const item = generateKnowledge(params, createRng(seed));
        expect([...item.choices].sort()).toEqual(allowed);
        expect(allowed).toContain(knowledgeFactId(item.fact));
        expect(evaluateExercise(item, 'accidental:2').validAnswer).toBe(false);
        const match = generateMatch({ ...params, count: 2 }, createRng(seed));
        expect(match.facts).toHaveLength(2);
        expect(match.choices.every((id) => allowed.includes(id))).toBe(true);
      }),
      { numRuns: 150, seed: 20722 },
    );
    expect(() =>
      generateMatch({ topics: ['accidentals'], maxAccidentals: 1, count: 3 }, createRng(1)),
    ).toThrow();
    expect(generateKnowledge({ topics: ['accidentals'] }, createRng(1)).choices).toHaveLength(4);
    for (const maxAccidentals of [0, 3, NaN])
      expect(() =>
        generateKnowledge(
          { topics: ['keyboard'], maxAccidentals } as KnowledgeParams,
          createRng(1),
        ),
      ).toThrow();
  });
  it('verwendet eigene Begriffe für US und UK sowie alle vier eindeutigen Klaviaturkonzepte', () => {
    const half = { topic: 'keyboard', kind: 'semitone' } as const;
    const whole = { topic: 'keyboard', kind: 'wholeTone' } as const;
    expect(knowledgeFactLabel(half, 'de')).toBe('Halbton');
    expect(knowledgeFactLabel(half, 'en-US')).toBe('half step');
    expect(knowledgeFactLabel(half, 'en-GB')).toBe('semitone');
    expect(knowledgeFactLabel(whole, 'en-US')).toBe('whole step');
    expect(knowledgeFactLabel(whole, 'en-GB')).toBe('tone');
    const found = new Set(
      Array.from({ length: 100 }, (_, seed) =>
        knowledgeFactId(generateKnowledge({ topics: ['keyboard'] }, createRng(seed)).fact),
      ),
    );
    expect(found).toEqual(
      new Set([
        'keyboard:semitone',
        'keyboard:wholeTone',
        'keyboard:twoBlackKeys',
        'keyboard:threeBlackKeys',
      ]),
    );
  });
});
