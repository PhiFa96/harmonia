// Vergleichstest gegen die unabhängige Bibliothek tonal (ADR 0004).
//
// Bewusst nicht verglichen: die Schreibweise der chromatischen Tonleiter. tonal schreibt sie
// aufwärts mit b (C, D♭, D …), wir aufwärts mit Kreuzen und abwärts mit b. Verglichen werden dort
// nur die Tonhöhenklassen.

import { Note, Scale } from 'tonal';
import { describe, expect, it } from 'vitest';

import type { NoteName } from './pitch.ts';
import { chroma, formatNoteName, LETTERS, noteName, withOctave } from './pitch.ts';
import type { ScaleType } from './scale.ts';
import { buildScale } from './scale.ts';

const TONAL_NAMES: Readonly<Record<Exclude<ScaleType, 'chromatic'>, string>> = {
  major: 'major',
  naturalMinor: 'minor',
  harmonicMinor: 'harmonic minor',
  melodicMinor: 'melodic minor',
  ionian: 'ionian',
  dorian: 'dorian',
  phrygian: 'phrygian',
  lydian: 'lydian',
  mixolydian: 'mixolydian',
  aeolian: 'aeolian',
  locrian: 'locrian',
  majorPentatonic: 'major pentatonic',
  minorPentatonic: 'minor pentatonic',
  blues: 'blues',
  majorBlues: 'major blues',
  wholeTone: 'whole tone',
};

/** Alle 35 Grundtöne mit bis zu zwei Vorzeichen. */
const TONICS: NoteName[] = LETTERS.flatMap((letter) =>
  [-2, -1, 0, 1, 2].map((alter) => noteName(letter, alter)),
);

describe('Vergleich mit tonal', () => {
  it('gleiche Schreibweise für alle 16 Tonleitertypen auf allen 35 Grundtönen', () => {
    let compared = 0;
    for (const tonic of TONICS) {
      for (const [type, tonalName] of Object.entries(TONAL_NAMES) as [ScaleType, string][]) {
        const name = formatNoteName(tonic);
        const expected = Scale.get(`${name} ${tonalName}`).notes;
        expect(expected.length, `${name} ${tonalName}`).toBeGreaterThan(0);
        let ours: string[];
        try {
          ours = buildScale(withOctave(tonic, 4), type).map((n) => formatNoteName(n));
        } catch {
          // Bei uns nur dann nicht darstellbar, wenn tonal drei Vorzeichen braucht.
          expect(
            expected.some((n) => /###|bbb/.test(n)),
            `${name} ${tonalName}: ${expected.join(' ')}`,
          ).toBe(true);
          continue;
        }
        expect(ours, `${name} ${tonalName}`).toEqual(expected);
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(400);
  });

  it('chromatische Tonleiter: gleiche Tonhöhenklassen', () => {
    for (const tonic of TONICS.filter((t) => Math.abs(t.alter) <= 1)) {
      const name = formatNoteName(tonic);
      const ours = buildScale(withOctave(tonic, 4), 'chromatic').map((n) => chroma(n));
      expect(ours, name).toEqual(Scale.get(`${name} chromatic`).notes.map((n) => Note.chroma(n)));
    }
  });
});
