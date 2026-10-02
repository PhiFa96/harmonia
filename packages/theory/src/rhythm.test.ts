import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { Fraction } from './fraction.ts';
import {
  addFractions,
  formatFraction,
  fraction,
  fractionEquals,
  subtractFractions,
} from './fraction.ts';
import type { Duration, NoteValue, TimeSignature } from './rhythm.ts';
import {
  beats,
  checkMeasure,
  duration,
  durationSeconds,
  durationValue,
  formatTimeSignature,
  measureLength,
  meterType,
  parseTimeSignature,
  timeSignature,
  totalDuration,
  TRIPLET,
} from './rhythm.ts';
import { durationArbitrary } from './testing/arbitraries.ts';

const d = (value: NoteValue, dots = 0, tuplet?: { actual: number; normal: number }): Duration =>
  duration(value, dots, tuplet);
const ts = (text: string): TimeSignature => parseTimeSignature(text);
const show = (x: Fraction): string => formatFraction(x);

describe('Notenwerte', () => {
  it.each([
    [d('breve'), '2'],
    [d('whole'), '1'],
    [d('half'), '1/2'],
    [d('quarter'), '1/4'],
    [d('sixtyFourth'), '1/64'],
    [d('quarter', 1), '3/8'],
    [d('eighth', 1), '3/16'],
    [d('quarter', 2), '7/16'],
    [d('half', 3), '15/16'],
    [d('eighth', 0, TRIPLET), '1/12'],
    [d('quarter', 0, TRIPLET), '1/6'],
    [d('sixteenth', 0, { actual: 5, normal: 4 }), '1/20'],
    [d('eighth', 0, { actual: 2, normal: 3 }), '3/16'],
    [d('quarter', 1, TRIPLET), '1/4'],
  ])('%j = %s', (x, expected) => {
    expect(show(durationValue(x))).toBe(expected);
  });

  it('drei Triolenachtel = eine Viertel', () => {
    const triplet = d('eighth', 0, TRIPLET);
    expect(totalDuration([triplet, triplet, triplet])).toEqual(fraction(1, 4));
  });

  it('jeder Punkt verlängert um die Hälfte des vorherigen Zuwachses', () => {
    fc.assert(
      fc.property(
        durationArbitrary.filter((x) => x.dots < 3),
        (x) => {
          const more = duration(x.value, x.dots + 1, x.tuplet);
          const undotted = durationValue(duration(x.value, 0, x.tuplet));
          const step = fraction(1, 2 ** (x.dots + 1));
          expect(
            fractionEquals(
              subtractFractions(durationValue(more), durationValue(x)),
              fraction(undotted.num * step.num, undotted.den * step.den),
            ),
          ).toBe(true);
        },
      ),
    );
  });

  it('prüft die Eingaben', () => {
    expect(() => d('quarter', 4)).toThrow(RangeError);
    expect(() => d('quarter', -1)).toThrow(RangeError);
    expect(() => d('quarter', 1.5)).toThrow(RangeError);
    expect(() => d('quarter', 0, { actual: 3, normal: 3 })).toThrow(RangeError);
    expect(() => d('quarter', 0, { actual: 0, normal: 2 })).toThrow(RangeError);
    expect(() => d('crotchet' as NoteValue)).toThrow(RangeError);
  });
});

describe('Taktarten', () => {
  it.each([
    ['4/4', '1+1+1+1'],
    ['3/4', '1+1+1'],
    ['2/2', '1+1'],
    ['3/8', '1+1+1'],
    ['6/8', '3+3'],
    ['9/8', '3+3+3'],
    ['12/8', '3+3+3+3'],
    ['6/4', '3+3'],
    ['5/8', '2+3'],
    ['7/8', '2+2+3'],
    ['5/4', '1+1+1+1+1'],
    ['3+2+2/8', '3+2+2'],
    ['3+3+2/8', '3+3+2'],
  ])('%s gruppiert als %s', (text, expected) => {
    expect(ts(text).grouping.join('+')).toBe(expected);
  });

  it('ohne Standard muss die Gruppierung angegeben werden', () => {
    expect(() => timeSignature(8, 8)).toThrow(/gruppierung/i);
    expect(() => timeSignature(11, 8)).toThrow(RangeError);
    expect(timeSignature(8, 8, [3, 3, 2]).grouping).toEqual([3, 3, 2]);
  });

  it('prüft Zähler, Nenner und Gruppierung', () => {
    expect(() => timeSignature(0, 4)).toThrow(RangeError);
    expect(() => timeSignature(4, 3)).toThrow(RangeError);
    expect(() => timeSignature(4, 0)).toThrow(RangeError);
    expect(() => timeSignature(7, 8, [3, 3])).toThrow(RangeError);
    expect(() => timeSignature(4, 4, [])).toThrow(RangeError);
    expect(() => timeSignature(4, 4, [2, 0, 2])).toThrow(RangeError);
  });

  it('liest und schreibt', () => {
    expect(ts(' 6 / 8 ')).toEqual(timeSignature(6, 8));
    expect(formatTimeSignature(ts('7/8'))).toBe('7/8');
    expect(formatTimeSignature(ts('3+2+2/8'), { grouping: true })).toBe('3+2+2/8');
    expect(() => ts('4/')).toThrow(SyntaxError);
    expect(() => ts('a/4')).toThrow(SyntaxError);
    expect(() => ts('4/3')).toThrow(RangeError);
  });

  it('Taktlänge und Zählzeiten', () => {
    expect(show(measureLength(ts('6/8')))).toBe('3/4');
    expect(show(measureLength(ts('2/2')))).toBe('1');
    expect(beats(ts('6/8')).map(show)).toEqual(['3/8', '3/8']);
    expect(beats(ts('7/8')).map(show)).toEqual(['1/4', '1/4', '3/8']);
    expect(beats(ts('4/4')).map(show)).toEqual(['1/4', '1/4', '1/4', '1/4']);
  });

  it.each([
    ['2/4', 'simple'],
    ['3/4', 'simple'],
    ['4/4', 'simple'],
    ['2/2', 'simple'],
    ['3/2', 'simple'],
    ['3/8', 'simple'],
    ['2+2/8', 'simple'],
    ['6/8', 'compound'],
    ['9/8', 'compound'],
    ['12/8', 'compound'],
    ['6/4', 'compound'],
    ['12/16', 'compound'],
    ['5/8', 'irregular'],
    ['7/8', 'irregular'],
    ['5/4', 'irregular'],
    ['7/4', 'irregular'],
    ['3+3+2/8', 'irregular'],
    ['1/4', 'irregular'],
  ])('%s ist %s', (text, expected) => {
    expect(meterType(ts(text))).toBe(expected);
  });
});

describe('Takt voll?', () => {
  it.each([
    ['4/4', [d('quarter'), d('quarter'), d('quarter'), d('quarter')], 'complete', '0'],
    ['4/4', [d('quarter'), d('half')], 'incomplete', '1/4'],
    ['6/8', [d('quarter', 1), d('eighth'), d('eighth'), d('eighth')], 'complete', '0'],
    ['3/4', [d('half'), d('half')], 'overfull', '1/4'],
    [
      '2/4',
      [d('quarter', 0, TRIPLET), d('quarter', 0, TRIPLET), d('quarter', 0, TRIPLET)],
      'complete',
      '0',
    ],
    ['3/8', [], 'incomplete', '3/8'],
    ['2/2', [d('whole')], 'complete', '0'],
  ] as const)('%s mit %j: %s', (text, durations, status, difference) => {
    const result = checkMeasure(durations, ts(text));
    expect(result.status).toBe(status);
    expect(show(result.difference)).toBe(difference);
  });

  it('Differenz und Status passen immer zur Summe', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('2/4', '3/4', '4/4', '6/8', '7/8', '2/2', '12/8'),
        fc.array(durationArbitrary, { maxLength: 8 }),
        (text, durations) => {
          const signature = ts(text);
          const { status, difference } = checkMeasure(durations, signature);
          const total = totalDuration(durations);
          const expected =
            status === 'overfull'
              ? subtractFractions(total, difference)
              : addFractions(total, difference);
          expect(fractionEquals(expected, measureLength(signature))).toBe(true);
          expect(difference.num >= 0).toBe(true);
          expect(difference.num === 0).toBe(status === 'complete');
        },
      ),
    );
  });
});

describe('Sekunden', () => {
  it('bei Viertel als Schlag', () => {
    expect(durationSeconds(d('quarter'), { bpm: 120 })).toBe(0.5);
    expect(durationSeconds(d('half'), { bpm: 60 })).toBe(2);
    expect(durationSeconds(fraction(1, 4), { bpm: 120 })).toBe(0.5);
    expect(durationSeconds(d('eighth', 0, TRIPLET), { bpm: 120 })).toBeCloseTo(1 / 6, 12);
  });

  it('bei punktierter Viertel als Schlag (6/8)', () => {
    const tempo = { bpm: 60, beat: d('quarter', 1) };
    expect(durationSeconds(d('quarter', 1), tempo)).toBe(1);
    expect(durationSeconds(d('eighth'), tempo)).toBeCloseTo(1 / 3, 12);
    expect(durationSeconds(measureLength(ts('6/8')), tempo)).toBe(2);
  });

  it('wirft bei ungültigem Tempo', () => {
    expect(() => durationSeconds(d('quarter'), { bpm: 0 })).toThrow(RangeError);
    expect(() => durationSeconds(d('quarter'), { bpm: Number.NaN })).toThrow(RangeError);
  });
});
