import { validateScore } from '@harmonia/notation';
import { formatPitch, midi } from '@harmonia/theory';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  createRng,
  evaluateExercise,
  expectedAnswer,
  generateExercise,
  generateNote,
  generateVisualInterval,
  generateAuralInterval,
} from './index.ts';
import type { ExerciseSpec, NoteParams } from './types.ts';

const SPECS: readonly Extract<
  ExerciseSpec,
  { readonly type: 'NOTE_NAME' | 'INTERVAL_IDENTIFY_VISUAL' | 'INTERVAL_IDENTIFY_AURAL' }
>[] = [
  { type: 'NOTE_NAME', params: { clefs: ['treble', 'bass'] } },
  { type: 'NOTE_NAME', params: { range: { minMidi: 21, maxMidi: 108 }, maxAccidentals: 2 } },
  {
    type: 'INTERVAL_IDENTIFY_VISUAL',
    params: {
      intervals: ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'd5', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'],
      clefs: ['treble', 'bass'],
      direction: 'both',
    },
  },
  {
    type: 'INTERVAL_IDENTIFY_VISUAL',
    params: {
      intervals: ['P1', 'A1', 'd2', 'AA4', 'dd7', 'M9', 'P15'],
      range: { minMidi: 21, maxMidi: 108 },
      maxAccidentals: 2,
      direction: 'both',
    },
  },
  ...(['melodic-up', 'melodic-down', 'harmonic'] as const).map((playback) => ({
    type: 'INTERVAL_IDENTIFY_AURAL' as const,
    params: {
      intervals: ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'],
      playback,
    },
  })),
];

describe('Seedbare Übungsgeneratoren', () => {
  it.each(SPECS.map((spec, index) => [index, spec] as const))(
    'Parametersatz %i: 300 Seeds liefern gültige Aufgaben und eindeutige Bewertung',
    (_index, spec) => {
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const item = generateExercise(spec, createRng(seed));
          expect(item).toEqual(generateExercise(spec, createRng(seed)));
          if (!('score' in item)) throw new Error('Notenaufgabe erwartet');
          expect(validateScore(item.score, { allowPickup: false })).toEqual([]);
          expect(new Set(item.choices).size).toBe(item.choices.length);
          expect(item.choices.length).toBeGreaterThan(0);
          expect(item.choices.length).toBeLessThanOrEqual(4);
          if (!('pitch' in item) && !('from' in item))
            throw new Error('Noten-/Intervallaufgabe erwartet');
          const pitches = 'pitch' in item ? [item.pitch] : [item.from, item.to];
          for (const pitch of pitches) {
            expect(midi(pitch), formatPitch(pitch)).toBeGreaterThanOrEqual(
              spec.params.range?.minMidi ?? (item.clef === 'treble' ? 60 : 36),
            );
            expect(midi(pitch), formatPitch(pitch)).toBeLessThanOrEqual(
              spec.params.range?.maxMidi ?? (item.clef === 'treble' ? 84 : 60),
            );
            expect(Math.abs(pitch.alter)).toBeLessThanOrEqual(
              spec.params.maxAccidentals ?? (item.type === 'NOTE_NAME' ? 0 : 1),
            );
          }
          expect(item.choices.filter((answer) => evaluateExercise(item, answer).correct)).toEqual([
            expectedAnswer(item),
          ]);
          expect(evaluateExercise(item, 'not-an-answer')).toMatchObject({
            correct: false,
            validAnswer: false,
          });
        }),
        { numRuns: 300, seed: 1819 },
      );
    },
    15000,
  );

  it('kleiner Tonbereich und wiederholte erlaubte Intervalle bleiben eindeutig', () => {
    const item = generateVisualInterval(
      { intervals: ['m3', 'M3', 'm3'], range: { minMidi: 60, maxMidi: 65 }, maxAccidentals: 0 },
      createRng(1),
    );
    expect([...item.choices].sort()).toEqual(['M3', 'm3']);
  });

  it.each([
    { clefs: [] },
    { maxAccidentals: -1 },
    { maxAccidentals: 3 },
    { range: { minMidi: 20, maxMidi: 60 } },
    { range: { minMidi: 60, maxMidi: 109 } },
    { range: { minMidi: 60.5, maxMidi: 72 } },
    { range: { minMidi: 70, maxMidi: 60 } },
    { range: { minMidi: 61, maxMidi: 61 }, maxAccidentals: 0 },
  ])('fehlerhafte / unmögliche Notenparameter werden abgewiesen: %j', (params) => {
    expect(() => generateNote(params as NoteParams, createRng(0))).toThrow(RangeError);
  });
  it('ungültige oder nicht darstellbare Intervallparameter scheitern vor der Zufallsauswahl', () => {
    for (const intervals of [[], ['M3', 'P15'], ['-m3'], ['M5'], ['M16']]) {
      expect(() =>
        generateVisualInterval({ intervals, range: { minMidi: 60, maxMidi: 72 } }, createRng(0)),
      ).toThrow();
    }
  });
  it.each([
    ['A4', 'd5'],
    ['P1', 'd2'],
    ['M3', 'd4'],
  ])('gleich klingende Hör-Antworten %j sind unzulässig', (...intervals) => {
    expect(() => generateAuralInterval({ intervals }, createRng(0))).toThrow(
      /nicht unterscheidbar/,
    );
    expect(() => generateVisualInterval({ intervals }, createRng(0))).not.toThrow();
  });
});
