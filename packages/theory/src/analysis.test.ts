import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  intervalClassVector,
  isTwelveToneRow,
  matchingMotifTransforms,
  pitchClassSet,
  rotatePattern,
  sectionPattern,
  transformMotif,
} from './analysis.ts';

describe('explicit musical analysis models', () => {
  it('computes independently enumerated unordered pairs, removing octave duplicates', () => {
    expect(pitchClassSet([60, 64, 67, 72, 64])).toEqual([0, 4, 7]);
    expect(intervalClassVector([60, 64, 67, 72])).toEqual([0, 0, 1, 1, 1, 0]);
    expect(intervalClassVector([0, 1, 4, 5])).toEqual([2, 0, 1, 2, 1, 0]);
    expect(intervalClassVector([0, 2, 4, 6])).toEqual([0, 3, 0, 2, 0, 1]);
    expect(intervalClassVector([60, 72])).toEqual([0, 0, 0, 0, 0, 0]);
  });
  it('keeps vector counts and inversion/transposition invariants for arbitrary sets', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -100, max: 100 }), { minLength: 1, maxLength: 30 }),
        fc.integer({ min: -30, max: 30 }),
        (values, n) => {
          const vector = intervalClassVector(values),
            size = pitchClassSet(values).length;
          expect(vector.reduce((a, b) => a + b, 0)).toBe((size * (size - 1)) / 2);
          expect(intervalClassVector(transformMotif(values, 'T', n))).toEqual(vector);
          expect(intervalClassVector(transformMotif(values, 'I', n))).toEqual(vector);
        },
      ),
    );
  });
  it('distinguishes transformations using the complete ordered sequence', () => {
    const source = [60, 62, 65, 64];
    expect(matchingMotifTransforms(source, [67, 69, 72, 71])).toEqual(['T']);
    expect(matchingMotifTransforms(source, [67, 65, 62, 63])).toEqual(['I']);
    expect(matchingMotifTransforms(source, [64, 65, 62, 60])).toEqual(['R']);
    expect(matchingMotifTransforms(source, [63, 62, 65, 67])).toEqual(['RI']);
    expect(matchingMotifTransforms(source, [67, 69, 72, 72])).toEqual([]);
    expect(matchingMotifTransforms([60, 62, 64], [64, 62, 60])).toEqual(['I', 'R']);
  });
  it('separates register-sensitive motives from pitch-class transformations', () => {
    expect(matchingMotifTransforms([0, 1, 4, 2], [11, 0, 3, 1], true)).toEqual(['T']);
    expect(matchingMotifTransforms([0, 1, 4, 2], [11, 0, 3, 1])).toEqual([]);
  });
  it('validates twelve unique classes, not merely twelve events', () => {
    expect(isTwelveToneRow([0, 1, 4, 2, 7, 5, 8, 6, 11, 9, 3, 10])).toBe(true);
    expect(isTwelveToneRow([0, 1, 4, 2, 7, 5, 8, 6, 11, 9, 3, 12])).toBe(false);
    expect(isTwelveToneRow([0, 1, 4])).toBe(false);
  });
  it('rotates without mutation and labels exact sections in first-occurrence order', () => {
    const input = [60, 62, 65, 64];
    expect(rotatePattern(input, 1)).toEqual([62, 65, 64, 60]);
    expect(rotatePattern(input, -1)).toEqual([64, 60, 62, 65]);
    expect(input).toEqual([60, 62, 65, 64]);
    expect(sectionPattern(['m1', 'm2', 'm1', 'm3', 'm1'])).toBe('ABACA');
  });
  it('rejects empty and non-integer material', () => {
    expect(() => intervalClassVector([])).toThrow(RangeError);
    expect(() => pitchClassSet([NaN])).toThrow(RangeError);
    expect(() => transformMotif([1.5], 'T')).toThrow(RangeError);
    expect(() => rotatePattern([], 1)).toThrow(RangeError);
    expect(() => sectionPattern([''])).toThrow(RangeError);
  });
});
