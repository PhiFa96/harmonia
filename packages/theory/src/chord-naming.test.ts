import { describe, expect, it } from 'vitest';

import type { Chord, ChordType } from './chord.ts';
import { chord } from './chord.ts';
import { chordName, chordSymbol, inversionName } from './chord-naming.ts';
import { parseNoteName } from './pitch.ts';

const c = (root: string, type: ChordType = 'major', inversion = 0): Chord =>
  chord(parseNoteName(root), type, inversion);

describe('Namen der Umkehrungen', () => {
  it('Dreiklänge', () => {
    expect([0, 1, 2].map((i) => inversionName(i))).toEqual([
      'Grundstellung',
      'Sextakkord',
      'Quartsextakkord',
    ]);
    expect([0, 1, 2].map((i) => inversionName(i, 'en'))).toEqual([
      'root position',
      'first inversion',
      'second inversion',
    ]);
  });

  it('Vierklänge (für Septakkorde vorbereitet)', () => {
    expect([0, 1, 2, 3].map((i) => inversionName(i, 'de', 4))).toEqual([
      'Grundstellung',
      'Quintsextakkord',
      'Terzquartakkord',
      'Sekundakkord',
    ]);
    expect(inversionName(3, 'en', 4)).toBe('third inversion');
  });

  it('wirft bei unmöglicher Umkehrung', () => {
    expect(() => inversionName(3)).toThrow(RangeError);
  });
});

describe('ausgeschriebene Namen', () => {
  it.each([
    [c('C'), 'C-Dur-Dreiklang', 'C major triad'],
    [c('C', 'major', 1), 'C-Dur-Sextakkord', 'C major triad, first inversion'],
    [c('C', 'major', 2), 'C-Dur-Quartsextakkord', 'C major triad, second inversion'],
    [c('A', 'minor'), 'a-Moll-Dreiklang', 'A minor triad'],
    [c('Eb', 'minor', 1), 'es-Moll-Sextakkord', 'E♭ minor triad, first inversion'],
    [c('B', 'minor', 2), 'h-Moll-Quartsextakkord', 'B minor triad, second inversion'],
    [c('Bb'), 'B-Dur-Dreiklang', 'B♭ major triad'],
    [c('F#'), 'Fis-Dur-Dreiklang', 'F♯ major triad'],
    [c('B', 'diminished'), 'verminderter Dreiklang auf H', 'B diminished triad'],
    [
      c('B', 'diminished', 1),
      'verminderter Dreiklang auf H als Sextakkord',
      'B diminished triad, first inversion',
    ],
    [
      c('C', 'augmented', 2),
      'übermäßiger Dreiklang auf C als Quartsextakkord',
      'C augmented triad, second inversion',
    ],
    [c('G#', 'diminished'), 'verminderter Dreiklang auf Gis', 'G♯ diminished triad'],
  ])('%j', (x, german, english) => {
    expect(chordName(x)).toBe(german);
    expect(chordName(x, { language: 'en' })).toBe(english);
  });

  it('nie „übermäßiger Sextakkord“ (das ist ein Akkord mit übermäßiger Sexte)', () => {
    expect(chordName(c('C', 'augmented', 1))).not.toContain('übermäßiger Sextakkord');
  });
});

describe('Akkordsymbole', () => {
  it.each([
    [c('C'), 'C'],
    [c('C', 'minor'), 'Cm'],
    [c('B', 'diminished'), 'B°'],
    [c('C', 'augmented'), 'C+'],
    [c('F#', 'minor'), 'F♯m'],
    [c('Bb'), 'B♭'],
    [c('Eb', 'augmented'), 'E♭+'],
    [c('C', 'major', 1), 'C/E'],
    [c('A', 'minor', 2), 'Am/E'],
    [c('G#', 'diminished', 1), 'G♯°/B'],
  ])('international: %j → %s', (x, expected) => {
    expect(chordSymbol(x)).toBe(expected);
  });

  it.each([
    [c('B', 'diminished'), 'H°'],
    [c('Bb'), 'B'],
    [c('Bb', 'minor'), 'Bm'],
    [c('B'), 'H'],
    [c('G', 'major', 1), 'G/H'],
    [c('B', 'major', 1), 'H/D♯'],
    [c('F#', 'minor'), 'F♯m'],
    [c('Bbb'), 'H𝄫'],
  ])('deutsch (H und B): %j → %s', (x, expected) => {
    expect(chordSymbol(x, { system: 'de' })).toBe(expected);
  });

  it('Textstil und ASCII', () => {
    expect(chordSymbol(c('B', 'diminished'), { style: 'text' })).toBe('Bdim');
    expect(chordSymbol(c('C', 'augmented'), { style: 'text' })).toBe('Caug');
    expect(chordSymbol(c('F#', 'minor', 1), { accidentals: 'ascii' })).toBe('F#m/A');
    expect(chordSymbol(c('Bb', 'major', 2), { accidentals: 'ascii' })).toBe('Bb/F');
  });

  it('ohne Schrägstrich', () => {
    expect(chordSymbol(c('C', 'major', 1), { slashBass: false })).toBe('C');
  });
});
