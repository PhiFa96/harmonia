// Vergleichstest gegen die unabhängige Bibliothek tonal (ADR 0004): Vorzeichnung, Paralleltonart,
// Tonleitern und leitereigene Dreiklänge aller 30 Tonarten.

import { Key as TonalKey } from 'tonal';
import { describe, expect, it } from 'vitest';

import type { DiatonicTriad, Key, MinorForm } from './key.ts';
import { diatonicTriads, keyFifths, keyName, keyScale, keysByFifths, relativeKey } from './key.ts';
import { formatNoteName } from './pitch.ts';

/** Dreiklang in der Schreibweise von tonal: „C“, „Dm“, „Bdim“, „Ebaug“. */
const SUFFIX: Readonly<Record<DiatonicTriad['quality'], string>> = {
  major: '',
  minor: 'm',
  diminished: 'dim',
  augmented: 'aug',
};

const tonalTriads = (k: Key, minorForm?: MinorForm): string[] =>
  diatonicTriads(k, minorForm ? { minorForm } : {}).map(
    (t) => formatNoteName(t.notes[0]) + SUFFIX[t.quality],
  );

const tonalSignature = (fifths: number): string =>
  (fifths >= 0 ? '#' : 'b').repeat(Math.abs(fifths));

const names = (k: Key, minorForm?: MinorForm): string[] =>
  keyScale(k, minorForm ? { minorForm } : {}).map((n) => formatNoteName(n));

describe('Vergleich mit tonal', () => {
  it.each(keysByFifths('major').map((k) => [keyName(k), k] as const))('%s', (_, k) => {
    const expected = TonalKey.majorKey(formatNoteName(k.tonic));
    expect(keyFifths(k)).toBe(expected.alteration);
    expect(tonalSignature(keyFifths(k))).toBe(expected.keySignature);
    expect(formatNoteName(relativeKey(k).tonic)).toBe(expected.minorRelative);
    expect(names(k)).toEqual(expected.scale);
    expect(tonalTriads(k)).toEqual(expected.triads);
  });

  it.each(keysByFifths('minor').map((k) => [keyName(k), k] as const))('%s', (_, k) => {
    const expected = TonalKey.minorKey(formatNoteName(k.tonic));
    expect(keyFifths(k)).toBe(expected.alteration);
    expect(tonalSignature(keyFifths(k))).toBe(expected.keySignature);
    expect(formatNoteName(relativeKey(k).tonic)).toBe(expected.relativeMajor);
    for (const form of ['natural', 'harmonic', 'melodic'] as const) {
      expect(names(k, form), form).toEqual(expected[form].scale);
      expect(tonalTriads(k, form), form).toEqual(expected[form].triads);
    }
  });
});
