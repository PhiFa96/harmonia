import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { germanName, internationalName, pitchName } from './naming.ts';
import type { Letter } from './pitch.ts';
import { LETTERS, parsePitch } from './pitch.ts';
import { pitchArbitrary } from './testing/arbitraries.ts';

// Benennungstabelle aller 35 Töne (7 Stammtöne × 5 Vorzeichen).
// Spalten: Doppel-b, b, ohne, Kreuz, Doppelkreuz. Diese Tabelle ist die fachliche Referenz.
const GERMAN_TABLE: Record<Letter, readonly string[]> = {
  C: ['Ceses', 'Ces', 'C', 'Cis', 'Cisis'],
  D: ['Deses', 'Des', 'D', 'Dis', 'Disis'],
  E: ['Eses', 'Es', 'E', 'Eis', 'Eisis'],
  F: ['Feses', 'Fes', 'F', 'Fis', 'Fisis'],
  G: ['Geses', 'Ges', 'G', 'Gis', 'Gisis'],
  A: ['Asas', 'As', 'A', 'Ais', 'Aisis'],
  B: ['Heses', 'B', 'H', 'His', 'Hisis'],
};

const INTERNATIONAL_TABLE: Record<Letter, readonly string[]> = {
  C: ['C𝄫', 'C♭', 'C', 'C♯', 'C𝄪'],
  D: ['D𝄫', 'D♭', 'D', 'D♯', 'D𝄪'],
  E: ['E𝄫', 'E♭', 'E', 'E♯', 'E𝄪'],
  F: ['F𝄫', 'F♭', 'F', 'F♯', 'F𝄪'],
  G: ['G𝄫', 'G♭', 'G', 'G♯', 'G𝄪'],
  A: ['A𝄫', 'A♭', 'A', 'A♯', 'A𝄪'],
  B: ['B𝄫', 'B♭', 'B', 'B♯', 'B𝄪'],
};

const ALTERS = [-2, -1, 0, 1, 2] as const;

describe('Benennungstabelle (35 Töne)', () => {
  for (const letter of LETTERS) {
    ALTERS.forEach((alter, column) => {
      const german = GERMAN_TABLE[letter][column] ?? '';
      const international = INTERNATIONAL_TABLE[letter][column] ?? '';
      it(`${international} heißt auf Deutsch ${german}`, () => {
        expect(germanName(letter, alter)).toBe(german);
        expect(internationalName(letter, alter)).toBe(international);
      });
    });
  }

  it('ASCII-Schreibweise international', () => {
    expect(internationalName('F', 1, 'ascii')).toBe('F#');
    expect(internationalName('B', -1, 'ascii')).toBe('Bb');
    expect(internationalName('C', 2, 'ascii')).toBe('C##');
    expect(internationalName('D', -2, 'ascii')).toBe('Dbb');
  });

  it('lehnt mehr als zwei Vorzeichen ab', () => {
    expect(() => germanName('C', 3)).toThrow(RangeError);
    expect(() => internationalName('C', -3)).toThrow(RangeError);
  });
});

describe('Helmholtz-Oktaven', () => {
  it.each([
    ['A0', 'A₂'], // Subkontra-A, tiefste Klaviertaste
    ['C1', 'C₁'], // Kontra-C
    ['Bb1', 'B₁'],
    ['C2', 'C'], // große Oktave
    ['F#2', 'Fis'],
    ['Bb2', 'B'],
    ['B2', 'H'],
    ['C3', 'c'], // kleine Oktave
    ['Eb3', 'es'],
    ['Bb3', 'b'],
    ['B3', 'h'],
    ['C4', 'c′'], // eingestrichene Oktave
    ['F#4', 'fis′'],
    ['A4', 'a′'],
    ['Eb5', 'es″'],
    ['C6', 'c‴'],
    ['C7', 'c⁗'],
    ['C8', 'c′′′′′'], // fünfgestrichenes c, höchste Klaviertaste
  ])('%s → %s (deutsch)', (scientific, expected) => {
    expect(pitchName(parsePitch(scientific), { system: 'de', octave: 'helmholtz' })).toBe(expected);
  });

  it('funktioniert auch international', () => {
    expect(pitchName(parsePitch('C4'), { octave: 'helmholtz' })).toBe('c′');
    expect(pitchName(parsePitch('Bb3'), { octave: 'helmholtz' })).toBe('b♭');
    expect(pitchName(parsePitch('F#4'), { octave: 'helmholtz' })).toBe('f♯′');
    expect(pitchName(parsePitch('B2'), { octave: 'helmholtz' })).toBe('B');
  });
});

describe('pitchName', () => {
  it('nutzt standardmäßig internationale Namen mit wissenschaftlicher Oktave', () => {
    expect(pitchName(parsePitch('F#3'))).toBe('F♯3');
  });

  it('kombiniert System und Oktavschreibweise', () => {
    const fis = parsePitch('F#4');
    expect(pitchName(fis, { system: 'de', octave: 'none' })).toBe('Fis');
    expect(pitchName(fis, { system: 'de', octave: 'scientific' })).toBe('Fis4');
    expect(pitchName(fis, { octave: 'none', accidentals: 'ascii' })).toBe('F#');
    expect(pitchName(parsePitch('Bb3'), { system: 'de', octave: 'scientific' })).toBe('B3');
    expect(pitchName(parsePitch('B3'), { system: 'de', octave: 'scientific' })).toBe('H3');
  });

  it('jeder Ton hat einen Namen; ab der kleinen Oktave Helmholtz klein geschrieben', () => {
    fc.assert(
      fc.property(pitchArbitrary, (x) => {
        const name = pitchName(x, { system: 'de', octave: 'helmholtz' });
        const isLower = name === name.toLowerCase();
        return name.length > 0 && (x.octave >= 3 ? isLower : !isLower);
      }),
    );
  });
});
