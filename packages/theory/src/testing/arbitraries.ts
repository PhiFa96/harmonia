// Zufallsgeneratoren für eigenschaftsbasierte Tests (fast-check). Nicht Teil der öffentlichen Schnittstelle.

import fc from 'fast-check';

import type { Chord } from '../chord.ts';
import { CHORD_TYPES, chordTones } from '../chord.ts';
import type { Interval } from '../interval.ts';
import { interval, isValidInterval } from '../interval.ts';
import type { Key } from '../key.ts';
import { ALL_KEYS } from '../key.ts';
import type { NoteName, Pitch } from '../pitch.ts';
import { LETTERS, noteName, pitch } from '../pitch.ts';

/** Beliebige Tonhöhe mit höchstens zwei Vorzeichen im MIDI-Bereich (Oktave -1 bis 9). */
export const pitchArbitrary: fc.Arbitrary<Pitch> = fc
  .record({
    letter: fc.constantFrom(...LETTERS),
    alter: fc.integer({ min: -2, max: 2 }),
    octave: fc.integer({ min: -1, max: 9 }),
  })
  .map(({ letter, alter, octave }) => pitch(letter, alter, octave));

/** Beliebiger Ton ohne Oktave mit höchstens zwei Vorzeichen. */
export const noteNameArbitrary: fc.Arbitrary<NoteName> = fc
  .record({
    letter: fc.constantFrom(...LETTERS),
    alter: fc.integer({ min: -2, max: 2 }),
  })
  .map(({ letter, alter }) => noteName(letter, alter));

/** Eine der 30 Dur- und Molltonarten bis sieben Vorzeichen. */
export const keyArbitrary: fc.Arbitrary<Key> = fc.constantFrom(...ALL_KEYS);

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

/** Beliebiger darstellbarer Dreiklang (alle Töne mit höchstens zwei Vorzeichen) in beliebiger Umkehrung. */
export const chordArbitrary: fc.Arbitrary<Chord> = fc
  .record({
    root: noteNameArbitrary,
    type: fc.constantFrom(...CHORD_TYPES),
    inversion: fc.integer({ min: 0, max: 2 }),
  })
  .filter(({ root, type }) => {
    try {
      chordTones({ root, type });
      return true;
    } catch {
      return false;
    }
  });
