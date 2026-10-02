// Vergleichstest gegen die unabhängige Bibliothek tonal (ADR 0004): Werte und Namen der Notenwerte.
// Nicht verglichen: die Einteilung der Taktarten. tonal nennt 3/8 „compound“ und 6/4 „simple“,
// Lehrbücher sehen das umgekehrt (3/8 einfach, 6/4 zusammengesetzt im Sinne von compound meter).

import { DurationValue } from 'tonal';
import { describe, expect, it } from 'vitest';

import type { NoteValue } from './rhythm.ts';
import { duration, durationValue, NOTE_VALUES } from './rhythm.ts';
import { durationName } from './rhythm-naming.ts';

const SHORTHANDS: Readonly<Record<NoteValue, string>> = {
  breve: 'd',
  whole: 'w',
  half: 'h',
  quarter: 'q',
  eighth: 'e',
  sixteenth: 's',
  thirtySecond: 't',
  sixtyFourth: 'sf',
};

describe('Vergleich mit tonal', () => {
  it.each(NOTE_VALUES)('%s mit 0 bis 3 Punkten', (value) => {
    for (const dots of [0, 1, 2, 3]) {
      const expected = DurationValue.get(SHORTHANDS[value] + '.'.repeat(dots));
      const ours = durationValue(duration(value, dots));
      expect([ours.num, ours.den], `${value} ${String(dots)}`).toEqual(expected.fraction);
    }
  });

  it.each(NOTE_VALUES)('Namen US und UK für %s', (value) => {
    const names = DurationValue.get(SHORTHANDS[value]).names;
    const us = durationName(duration(value), { language: 'en' }).replace(/ note$/, '');
    const uk = durationName(duration(value), { language: 'en', variant: 'uk' });
    expect(names[0]).toBe(us);
    expect(names.at(-1)).toBe(uk);
  });
});
