// Vergleichstest gegen die unabhängige Bibliothek tonal (ADR 0004): nur das Bauen von Dreiklängen.
// Die Akkorderkennung von tonal berücksichtigt die Schreibweise nicht und dient deshalb nicht als Orakel.

import { Chord as TonalChord } from 'tonal';
import { describe, expect, it } from 'vitest';

import type { ChordType } from './chord.ts';
import { CHORD_TYPES, chordTones } from './chord.ts';
import type { NoteName } from './pitch.ts';
import { formatNoteName, LETTERS, noteName } from './pitch.ts';

const TONAL_TYPES: Readonly<Record<ChordType, string>> = {
  major: 'M',
  minor: 'm',
  diminished: 'dim',
  augmented: 'aug',
};

const ROOTS: NoteName[] = LETTERS.flatMap((letter) =>
  [-2, -1, 0, 1, 2].map((alter) => noteName(letter, alter)),
);

describe('Vergleich mit tonal', () => {
  it('gleiche Akkordtöne für alle vier Dreiklangstypen auf allen 35 Grundtönen', () => {
    let compared = 0;
    for (const root of ROOTS) {
      for (const type of CHORD_TYPES) {
        const name = formatNoteName(root);
        const expected = TonalChord.getChord(TONAL_TYPES[type], name).notes;
        let ours: string[];
        try {
          ours = chordTones({ root, type }).map((n) => formatNoteName(n));
        } catch {
          // Bei uns nur dann nicht darstellbar, wenn tonal drei Vorzeichen braucht.
          expect(
            expected.some((n) => /###|bbb/.test(n)),
            `${name} ${type}: ${expected.join(' ')}`,
          ).toBe(true);
          continue;
        }
        expect(ours, `${name} ${type}`).toEqual(expected);
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(110);
  });
});
