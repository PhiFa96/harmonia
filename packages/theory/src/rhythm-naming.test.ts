import { describe, expect, it } from 'vitest';

import type { Duration } from './rhythm.ts';
import { duration, TRIPLET } from './rhythm.ts';
import { durationName } from './rhythm-naming.ts';

describe('Namen der Notenwerte', () => {
  it.each([
    [duration('breve'), 'doppelganze Note', 'double whole note', 'breve'],
    [duration('whole'), 'ganze Note', 'whole note', 'semibreve'],
    [duration('half'), 'halbe Note', 'half note', 'minim'],
    [duration('quarter'), 'Viertelnote', 'quarter note', 'crotchet'],
    [duration('eighth'), 'Achtelnote', 'eighth note', 'quaver'],
    [duration('sixteenth'), 'Sechzehntelnote', 'sixteenth note', 'semiquaver'],
    [duration('thirtySecond'), 'Zweiunddreißigstelnote', 'thirty-second note', 'demisemiquaver'],
    [duration('sixtyFourth'), 'Vierundsechzigstelnote', 'sixty-fourth note', 'hemidemisemiquaver'],
    [duration('quarter', 1), 'punktierte Viertelnote', 'dotted quarter note', 'dotted crotchet'],
    [
      duration('half', 2),
      'doppelt punktierte halbe Note',
      'double-dotted half note',
      'double-dotted minim',
    ],
    [
      duration('eighth', 3),
      'dreifach punktierte Achtelnote',
      'triple-dotted eighth note',
      'triple-dotted quaver',
    ],
    [
      duration('eighth', 0, TRIPLET),
      'Achtelnote (Triole)',
      'triplet eighth note',
      'triplet quaver',
    ],
  ] as [Duration, string, string, string][])('%j', (x, german, us, uk) => {
    expect(durationName(x)).toBe(german);
    expect(durationName(x, { language: 'en' })).toBe(us);
    expect(durationName(x, { language: 'en', variant: 'uk' })).toBe(uk);
  });

  it.each([
    [duration('whole'), 'ganze Pause', 'whole rest', 'semibreve rest'],
    [duration('half', 1), 'punktierte halbe Pause', 'dotted half rest', 'dotted minim rest'],
    [duration('quarter'), 'Viertelpause', 'quarter rest', 'crotchet rest'],
    [duration('sixteenth'), 'Sechzehntelpause', 'sixteenth rest', 'semiquaver rest'],
  ] as [Duration, string, string, string][])('Pause %j', (x, german, us, uk) => {
    expect(durationName(x, { kind: 'rest' })).toBe(german);
    expect(durationName(x, { language: 'en', kind: 'rest' })).toBe(us);
    expect(durationName(x, { language: 'en', variant: 'uk', kind: 'rest' })).toBe(uk);
  });

  it('weitere N-tolen', () => {
    const quintuplet = duration('sixteenth', 0, { actual: 5, normal: 4 });
    expect(durationName(quintuplet)).toBe('Sechzehntelnote (Quintole)');
    expect(durationName(quintuplet, { language: 'en' })).toBe('quintuplet sixteenth note');
    const duplet = duration('eighth', 0, { actual: 2, normal: 3 });
    expect(durationName(duplet)).toBe('Achtelnote (Duole)');
    const unusual = duration('eighth', 0, { actual: 5, normal: 6 });
    expect(durationName(unusual)).toBe('Achtelnote (Quintole 5:6)');
    expect(durationName(unusual, { language: 'en', variant: 'uk' })).toBe('quintuplet 5:6 quaver');
    const nine = duration('sixteenth', 0, { actual: 9, normal: 8 });
    expect(durationName(nine)).toBe('Sechzehntelnote (N-tole 9:8)');
    expect(durationName(nine, { language: 'en' })).toBe('9:8 tuplet sixteenth note');
  });
});
