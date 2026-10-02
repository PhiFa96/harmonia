// Zufallsgeneratoren für eigenschaftsbasierte Tests (fast-check). Nicht Teil der öffentlichen Schnittstelle.

import fc from 'fast-check';

import type { Interval } from '../interval.ts';
import { interval, isValidInterval } from '../interval.ts';
import type { Pitch } from '../pitch.ts';
import { LETTERS, pitch } from '../pitch.ts';

/** Beliebige Tonhöhe mit höchstens zwei Vorzeichen im MIDI-Bereich (Oktave -1 bis 9). */
export const pitchArbitrary: fc.Arbitrary<Pitch> = fc
  .record({
    letter: fc.constantFrom(...LETTERS),
    alter: fc.integer({ min: -2, max: 2 }),
    octave: fc.integer({ min: -1, max: 9 }),
  })
  .map(({ letter, alter, octave }) => pitch(letter, alter, octave));

const QUALITIES = ['dd', 'd', 'm', 'M', 'P', 'A', 'AA'] as const;

/** Beliebiges gültiges Intervall bis zur Doppeloktave, auf- oder abwärts. */
export const intervalArbitrary: fc.Arbitrary<Interval> = fc
  .record({
    number: fc.integer({ min: 1, max: 15 }),
    quality: fc.constantFrom(...QUALITIES),
    direction: fc.constantFrom(1 as const, -1 as const),
  })
  .filter(({ number, quality }) => isValidInterval(number, quality))
  .map(({ number, quality, direction }) => interval(number, quality, direction));
