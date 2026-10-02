// Zufallsgeneratoren für eigenschaftsbasierte Tests (fast-check). Nicht Teil der öffentlichen Schnittstelle.

import fc from 'fast-check';

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
