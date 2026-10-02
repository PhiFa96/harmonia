import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { Fraction } from './fraction.ts';
import {
  addFractions,
  compareFractions,
  divideFractions,
  formatFraction,
  fraction,
  fractionEquals,
  fractionToNumber,
  multiplyFractions,
  subtractFractions,
  sumFractions,
  ZERO,
} from './fraction.ts';

const f = (num: number, den = 1): Fraction => fraction(num, den);

const fractionArbitrary: fc.Arbitrary<Fraction> = fc
  .record({ num: fc.integer({ min: -1000, max: 1000 }), den: fc.integer({ min: 1, max: 1000 }) })
  .map(({ num, den }) => fraction(num, den));

describe('fraction', () => {
  it.each([
    [2, 4, '1/2'],
    [-1, -2, '1/2'],
    [1, -2, '-1/2'],
    [0, 5, '0'],
    [6, 3, '2'],
    [3, 16, '3/16'],
  ])('%i/%i → %s', (num, den, expected) => {
    expect(formatFraction(fraction(num, den))).toBe(expected);
  });

  it('null ist immer 0/1, auch aus -0', () => {
    expect(fraction(-0, 3)).toEqual({ num: 0, den: 1 });
    expect(ZERO).toEqual({ num: 0, den: 1 });
  });

  it('wirft bei Nenner 0 und Nicht-Ganzzahlen', () => {
    expect(() => fraction(1, 0)).toThrow(RangeError);
    expect(() => fraction(0.5, 2)).toThrow(RangeError);
    expect(() => fraction(1, Number.NaN)).toThrow(RangeError);
  });
});

describe('Rechnen', () => {
  it('Grundrechenarten', () => {
    expect(addFractions(f(1, 4), f(1, 8))).toEqual(f(3, 8));
    expect(subtractFractions(f(1, 4), f(1, 2))).toEqual(f(-1, 4));
    expect(multiplyFractions(f(1, 8), f(2, 3))).toEqual(f(1, 12));
    expect(divideFractions(f(3, 8), f(1, 4))).toEqual(f(3, 2));
    expect(sumFractions([f(1, 12), f(1, 12), f(1, 12)])).toEqual(f(1, 4));
    expect(sumFractions([])).toEqual(ZERO);
  });

  it('Division durch null wirft', () => {
    expect(() => divideFractions(f(1, 4), ZERO)).toThrow(RangeError);
  });

  it('Vergleich und Ausgabe', () => {
    expect(compareFractions(f(1, 3), f(1, 4))).toBeGreaterThan(0);
    expect(compareFractions(f(1, 4), f(2, 8))).toBe(0);
    expect(fractionEquals(f(2, 8), f(1, 4))).toBe(true);
    expect(fractionToNumber(f(3, 8))).toBe(0.375);
  });

  it('Eigenschaften: Addition kommutativ, Subtraktion kehrt Addition um, Ergebnis immer gekürzt', () => {
    fc.assert(
      fc.property(fractionArbitrary, fractionArbitrary, (a, b) => {
        const sum = addFractions(a, b);
        expect(fractionEquals(sum, addFractions(b, a))).toBe(true);
        expect(subtractFractions(sum, b)).toEqual(a);
        expect(sum.den).toBeGreaterThan(0);
        expect(fraction(sum.num, sum.den)).toEqual(sum);
      }),
    );
  });
});
