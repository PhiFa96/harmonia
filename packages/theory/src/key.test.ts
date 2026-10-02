import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { chordSymbol } from './chord-naming.ts';
import { formatInterval, intervalBetween, simplify } from './interval.ts';
import type { DiatonicTriad, Key, Mode } from './key.ts';
import {
  ALL_KEYS,
  circleOfFifths,
  diatonicTriads,
  fifthsFromC,
  FLAT_ORDER,
  key,
  keyEquals,
  keyFifths,
  keyFromFifths,
  keyName,
  keyScale,
  keysByFifths,
  keySignature,
  parallelKey,
  relativeKey,
  SHARP_ORDER,
  signatureAlter,
} from './key.ts';
import { germanName, pitchName } from './naming.ts';
import type { NoteName } from './pitch.ts';
import { formatPitch, LETTERS, parseNoteName, withOctave } from './pitch.ts';
import { keyArbitrary } from './testing/arbitraries.ts';

const k = (tonic: string, mode: Mode = 'major'): Key => key(parseNoteName(tonic), mode);

const de = (notes: readonly NoteName[]): string =>
  notes.map((n) => germanName(n.letter, n.alter)).join(' ');

/** Kurzschrift nur für diese Tests: Dur groß, Moll klein, ° vermindert, + übermäßig. */
function triadSymbol(t: DiatonicTriad): string {
  const root = germanName(t.notes[0].letter, t.notes[0].alter);
  switch (t.quality) {
    case 'major':
      return root;
    case 'minor':
      return root.toLowerCase();
    case 'diminished':
      return `${root.toLowerCase()}°`;
    case 'augmented':
      return `${root}+`;
  }
}

const triads = (key: Key, minorForm?: 'natural' | 'harmonic' | 'melodic'): string =>
  diatonicTriads(key, minorForm ? { minorForm } : {})
    .map(triadSymbol)
    .join(' ');

/** Alle 30 Tonarten: Grundton, Tongeschlecht, Vorzeichenzahl, Vorzeichnung, Namen DE/EN. */
const KEY_TABLE: readonly (readonly [string, Mode, number, string, string, string])[] = [
  ['Cb', 'major', -7, 'B Es As Des Ges Ces Fes', 'Ces-Dur', 'C♭ major'],
  ['Gb', 'major', -6, 'B Es As Des Ges Ces', 'Ges-Dur', 'G♭ major'],
  ['Db', 'major', -5, 'B Es As Des Ges', 'Des-Dur', 'D♭ major'],
  ['Ab', 'major', -4, 'B Es As Des', 'As-Dur', 'A♭ major'],
  ['Eb', 'major', -3, 'B Es As', 'Es-Dur', 'E♭ major'],
  ['Bb', 'major', -2, 'B Es', 'B-Dur', 'B♭ major'],
  ['F', 'major', -1, 'B', 'F-Dur', 'F major'],
  ['C', 'major', 0, '', 'C-Dur', 'C major'],
  ['G', 'major', 1, 'Fis', 'G-Dur', 'G major'],
  ['D', 'major', 2, 'Fis Cis', 'D-Dur', 'D major'],
  ['A', 'major', 3, 'Fis Cis Gis', 'A-Dur', 'A major'],
  ['E', 'major', 4, 'Fis Cis Gis Dis', 'E-Dur', 'E major'],
  ['B', 'major', 5, 'Fis Cis Gis Dis Ais', 'H-Dur', 'B major'],
  ['F#', 'major', 6, 'Fis Cis Gis Dis Ais Eis', 'Fis-Dur', 'F♯ major'],
  ['C#', 'major', 7, 'Fis Cis Gis Dis Ais Eis His', 'Cis-Dur', 'C♯ major'],
  ['Ab', 'minor', -7, 'B Es As Des Ges Ces Fes', 'as-Moll', 'A♭ minor'],
  ['Eb', 'minor', -6, 'B Es As Des Ges Ces', 'es-Moll', 'E♭ minor'],
  ['Bb', 'minor', -5, 'B Es As Des Ges', 'b-Moll', 'B♭ minor'],
  ['F', 'minor', -4, 'B Es As Des', 'f-Moll', 'F minor'],
  ['C', 'minor', -3, 'B Es As', 'c-Moll', 'C minor'],
  ['G', 'minor', -2, 'B Es', 'g-Moll', 'G minor'],
  ['D', 'minor', -1, 'B', 'd-Moll', 'D minor'],
  ['A', 'minor', 0, '', 'a-Moll', 'A minor'],
  ['E', 'minor', 1, 'Fis', 'e-Moll', 'E minor'],
  ['B', 'minor', 2, 'Fis Cis', 'h-Moll', 'B minor'],
  ['F#', 'minor', 3, 'Fis Cis Gis', 'fis-Moll', 'F♯ minor'],
  ['C#', 'minor', 4, 'Fis Cis Gis Dis', 'cis-Moll', 'C♯ minor'],
  ['G#', 'minor', 5, 'Fis Cis Gis Dis Ais', 'gis-Moll', 'G♯ minor'],
  ['D#', 'minor', 6, 'Fis Cis Gis Dis Ais Eis', 'dis-Moll', 'D♯ minor'],
  ['A#', 'minor', 7, 'Fis Cis Gis Dis Ais Eis His', 'ais-Moll', 'A♯ minor'],
];

describe('alle 30 Tonarten', () => {
  it.each(KEY_TABLE)('%s %s: %i Vorzeichen', (tonic, mode, fifths, signature, german, english) => {
    const actual = k(tonic, mode);
    expect(keyFifths(actual)).toBe(fifths);
    expect(de(keySignature(actual))).toBe(signature);
    expect(keyName(actual)).toBe(german);
    expect(keyName(actual, { language: 'en' })).toBe(english);
    expect(keyEquals(keyFromFifths(fifths, mode), actual)).toBe(true);
  });

  it('ALL_KEYS enthält genau diese 30 Tonarten in derselben Reihenfolge', () => {
    expect(ALL_KEYS.map((x) => keyName(x))).toEqual(KEY_TABLE.map((row) => row[4]));
  });

  it('Reihenfolge der Vorzeichen', () => {
    expect(de(SHARP_ORDER)).toBe('Fis Cis Gis Dis Ais Eis His');
    expect(de(FLAT_ORDER)).toBe('B Es As Des Ges Ces Fes');
  });

  it('Vorzeichnung passt zur Tonleiter (Dur und natürliches Moll)', () => {
    for (const x of ALL_KEYS) {
      for (const n of keyScale(x)) {
        expect(n.alter, `${keyName(x)}: ${germanName(n.letter, n.alter)}`).toBe(
          signatureAlter(x, n.letter),
        );
      }
    }
  });

  it('signatureAlter für jeden Stammton', () => {
    const aMajor = k('A');
    expect(LETTERS.map((l) => signatureAlter(aMajor, l))).toEqual([1, 0, 0, 1, 1, 0, 0]);
    expect(signatureAlter(k('F', 'minor'), 'D')).toBe(-1);
    expect(signatureAlter(k('F', 'minor'), 'G')).toBe(0);
  });
});

describe('Quintenreihe und Quintenzirkel', () => {
  it.each([
    ['C', 0],
    ['G', 1],
    ['F', -1],
    ['B', 5],
    ['Bb', -2],
    ['F#', 6],
    ['Cb', -7],
    ['C##', 14],
    ['Fbb', -15],
  ] as const)('%s liegt bei %i', (tonic, expected) => {
    expect(fifthsFromC(parseNoteName(tonic))).toBe(expected);
  });

  it('keysByFifths: von sieben b bis sieben Kreuzen', () => {
    expect(keysByFifths().map((x) => keyFifths(x))).toEqual([
      -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7,
    ]);
    expect(keysByFifths('minor').every((x) => x.mode === 'minor')).toBe(true);
  });

  it('Dur-Quintenzirkel im Uhrzeigersinn mit enharmonischen Paaren', () => {
    expect(circleOfFifths().map((keys) => keys.map((x) => keyName(x)).join('/'))).toEqual([
      'C-Dur',
      'G-Dur',
      'D-Dur',
      'A-Dur',
      'E-Dur',
      'H-Dur/Ces-Dur',
      'Fis-Dur/Ges-Dur',
      'Des-Dur/Cis-Dur',
      'As-Dur',
      'Es-Dur',
      'B-Dur',
      'F-Dur',
    ]);
  });

  it('Moll-Quintenzirkel', () => {
    expect(circleOfFifths('minor').map((keys) => keys.map((x) => keyName(x)).join('/'))).toEqual([
      'a-Moll',
      'e-Moll',
      'h-Moll',
      'fis-Moll',
      'cis-Moll',
      'gis-Moll/as-Moll',
      'dis-Moll/es-Moll',
      'b-Moll/ais-Moll',
      'f-Moll',
      'c-Moll',
      'g-Moll',
      'd-Moll',
    ]);
  });

  it('Rundreise Vorzeichenzahl ↔ Tonart', () => {
    fc.assert(
      fc.property(keyArbitrary, (x) => {
        expect(keyEquals(keyFromFifths(keyFifths(x), x.mode), x)).toBe(true);
        expect(keySignature(x)).toHaveLength(Math.abs(keyFifths(x)));
      }),
    );
  });
});

/** Diese Tonarten haben keine Varianttonart mit höchstens sieben Vorzeichen (ces-Moll hätte zehn b). */
const THEORETICAL_PARALLEL = new Set([
  'Ces-Dur',
  'Ges-Dur',
  'Des-Dur',
  'gis-Moll',
  'dis-Moll',
  'ais-Moll',
]);

describe('Parallel- und Varianttonart', () => {
  it.each([
    ['C', 'major', 'a-Moll'],
    ['Eb', 'major', 'c-Moll'],
    ['F#', 'major', 'dis-Moll'],
    ['Cb', 'major', 'as-Moll'],
    ['B', 'minor', 'D-Dur'],
    ['A#', 'minor', 'Cis-Dur'],
  ] as const)('Paralleltonart von %s %s: %s', (tonic, mode, expected) => {
    expect(keyName(relativeKey(k(tonic, mode)))).toBe(expected);
  });

  it.each([
    ['C', 'major', 'c-Moll'],
    ['D', 'major', 'd-Moll'],
    ['Ab', 'major', 'as-Moll'],
    ['F#', 'minor', 'Fis-Dur'],
    ['Eb', 'minor', 'Es-Dur'],
  ] as const)('Varianttonart von %s %s: %s', (tonic, mode, expected) => {
    expect(keyName(parallelKey(k(tonic, mode)))).toBe(expected);
  });

  it('Varianttonart wirft, wenn sie theoretisch wäre', () => {
    const theoretical = ALL_KEYS.filter((x) => {
      try {
        parallelKey(x);
        return false;
      } catch (error) {
        expect(error).toBeInstanceOf(RangeError);
        return true;
      }
    });
    expect(theoretical.map((x) => keyName(x))).toEqual([...THEORETICAL_PARALLEL]);
  });

  it('Paralleltonart: gleiche Vorzeichnung, Dur-Grundton eine kleine Terz über dem Moll-Grundton', () => {
    fc.assert(
      fc.property(keyArbitrary, (x) => {
        const relative = relativeKey(x);
        expect(relative.mode).not.toBe(x.mode);
        expect(keyFifths(relative)).toBe(keyFifths(x));
        expect(keyEquals(relativeKey(relative), x)).toBe(true);
        const [major, minor] = x.mode === 'major' ? [x, relative] : [relative, x];
        const up = intervalBetween(withOctave(minor.tonic, 4), withOctave(major.tonic, 5));
        expect(formatInterval(simplify(up))).toBe('m3');
      }),
    );
  });

  it('Varianttonart: gleicher Grundton, drei Vorzeichen Unterschied', () => {
    for (const x of ALL_KEYS.filter((y) => !THEORETICAL_PARALLEL.has(keyName(y)))) {
      const parallel = parallelKey(x);
      expect(parallel.tonic).toEqual(x.tonic);
      expect(keyEquals(parallelKey(parallel), x)).toBe(true);
      expect(keyFifths(parallel) - keyFifths(x)).toBe(x.mode === 'major' ? -3 : 3);
    }
  });
});

describe('Tonleiter einer Tonart', () => {
  it('Dur und alle Mollformen', () => {
    expect(de(keyScale(k('E', 'minor')))).toBe('E Fis G A H C D');
    expect(de(keyScale(k('E', 'minor'), { minorForm: 'harmonic' }))).toBe('E Fis G A H C Dis');
    expect(de(keyScale(k('E', 'minor'), { minorForm: 'melodic' }))).toBe('E Fis G A H Cis Dis');
    // Für Dur spielt die Mollform keine Rolle.
    expect(de(keyScale(k('Ab'), { minorForm: 'harmonic' }))).toBe('As B C Des Es F G');
  });

  it('in wählbarer Oktave', () => {
    expect(keyScale(k('C'), { octave: 3 }).map((n) => formatPitch(n))).toEqual([
      'C3',
      'D3',
      'E3',
      'F3',
      'G3',
      'A3',
      'B3',
    ]);
    expect(pitchName(keyScale(k('Bb', 'minor'))[0] ?? withOctave(parseNoteName('C'), 0))).toBe(
      'B♭4',
    );
  });
});

describe('leitereigene Dreiklänge', () => {
  it.each([
    ['C', 'major', undefined, 'C d e F G a h°'],
    ['Eb', 'major', undefined, 'Es f g As B c d°'],
    ['F#', 'major', undefined, 'Fis gis ais H Cis dis eis°'],
    ['A', 'minor', 'natural', 'a h° C d e F G'],
    ['A', 'minor', 'harmonic', 'a h° C+ d E F gis°'],
    ['A', 'minor', 'melodic', 'a h C+ D E fis° gis°'],
    ['C', 'minor', 'harmonic', 'c d° Es+ f G As h°'],
    ['D#', 'minor', 'harmonic', 'dis eis° Fis+ gis Ais H cisis°'],
  ] as const)('%s %s %s', (tonic, mode, minorForm, expected) => {
    expect(triads(k(tonic, mode), minorForm)).toBe(expected);
  });

  it('als Akkordsymbole', () => {
    expect(diatonicTriads(k('C')).map((t) => chordSymbol(t.chord))).toEqual([
      'C',
      'Dm',
      'Em',
      'F',
      'G',
      'Am',
      'B°',
    ]);
    expect(
      diatonicTriads(k('A', 'minor'), { minorForm: 'harmonic' }).map((t) =>
        chordSymbol(t.chord, { system: 'de' }),
      ),
    ).toEqual(['Am', 'H°', 'C+', 'Dm', 'E', 'F', 'G♯°']);
  });

  it('Dreiklangstöne sind Grundton, Terz und Quinte der Tonleiter', () => {
    const [first] = diatonicTriads(k('G'));
    expect(first?.degree).toBe(1);
    expect(de(first?.notes ?? [])).toBe('G H D');
    expect(de(diatonicTriads(k('G')).at(-1)?.notes ?? [])).toBe('Fis A C');
  });

  it.each([
    ['major', undefined, 'major minor minor major major minor diminished'],
    ['minor', 'natural', 'minor diminished major minor minor major major'],
    ['minor', 'harmonic', 'minor diminished augmented minor major major diminished'],
    ['minor', 'melodic', 'minor minor augmented major major diminished diminished'],
  ] as const)('gleiches Muster in allen Tonarten: %s %s', (mode, minorForm, expected) => {
    for (const x of keysByFifths(mode)) {
      const qualities = diatonicTriads(x, minorForm ? { minorForm } : {})
        .map((t) => t.quality)
        .join(' ');
      expect(qualities, keyName(x)).toBe(expected);
    }
  });
});

describe('Fehler und Grenzen', () => {
  it('theoretische Tonarten werden abgelehnt', () => {
    expect(() => k('G#')).toThrow(RangeError);
    expect(() => k('G#')).toThrow(/Gis-Dur .*theoretische Tonart mit 8 Vorzeichen/);
    expect(() => k('Fb')).toThrow(RangeError);
    expect(() => k('Db', 'minor')).toThrow(RangeError);
    expect(() => k('E#', 'minor')).toThrow(RangeError);
  });

  it('ungültige Vorzeichenzahl', () => {
    expect(() => keyFromFifths(8)).toThrow(RangeError);
    expect(() => keyFromFifths(-8, 'minor')).toThrow(RangeError);
    expect(() => keyFromFifths(1.5)).toThrow(RangeError);
  });

  it('auch ungeprüft erzeugte Tonarten werden beim Rechnen geprüft', () => {
    const unchecked: Key = { tonic: parseNoteName('G#'), mode: 'major' };
    expect(() => keySignature(unchecked)).toThrow(RangeError);
    expect(() => keyScale(unchecked)).toThrow(RangeError);
    expect(() => relativeKey(unchecked)).toThrow(RangeError);
  });

  it('Standard: Dur', () => {
    expect(key(parseNoteName('D')).mode).toBe('major');
    expect(keyFromFifths(0).mode).toBe('major');
  });

  it('englische Namen auch in ASCII', () => {
    expect(keyName(k('F#'), { language: 'en', accidentals: 'ascii' })).toBe('F# major');
    expect(keyName(k('Bb', 'minor'), { language: 'en', accidentals: 'ascii' })).toBe('Bb minor');
  });
});
