import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { createRng } from './random.ts';

const take = (seed: number | string, count: number): number[] => {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => rng.next());
};

describe('createRng', () => {
  it('gleicher Seed → gleiche Folge', () => {
    expect(take(42, 20)).toEqual(take(42, 20));
    expect(take('duell-123', 20)).toEqual(take('duell-123', 20));
  });

  it('verschiedene Seeds → verschiedene Folgen', () => {
    expect(take(1, 5)).not.toEqual(take(2, 5));
    expect(take('a', 5)).not.toEqual(take('b', 5));
  });

  it('next liegt in [0, 1)', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => take(seed, 50).every((value) => value >= 0 && value < 1)),
    );
  });

  it('int bleibt im Bereich (beide Grenzen eingeschlossen)', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.integer({ min: -100, max: 100 }),
        fc.integer({ min: 0, max: 50 }),
        (seed, min, width) => {
          const rng = createRng(seed);
          return Array.from({ length: 30 }, () => rng.int(min, min + width)).every(
            (value) => value >= min && value <= min + width && Number.isInteger(value),
          );
        },
      ),
    );
  });

  it('verteilt int grob gleichmäßig', () => {
    const rng = createRng(7);
    const counts = Array.from({ length: 10 }, () => 0);
    for (let i = 0; i < 10_000; i++) {
      const bucket = rng.int(0, 9);
      counts[bucket] = (counts[bucket] ?? 0) + 1;
    }
    for (const count of counts) {
      expect(count).toBeGreaterThan(850);
      expect(count).toBeLessThan(1150);
    }
  });

  it('lehnt ungültige Bereiche und leere Listen ab', () => {
    const rng = createRng(1);
    expect(() => rng.int(5, 4)).toThrow(RangeError);
    expect(() => rng.int(0.5, 4)).toThrow(RangeError);
    expect(() => rng.pick([])).toThrow(RangeError);
  });

  it('shuffle ist eine Permutation und lässt die Eingabe unverändert', () => {
    fc.assert(
      fc.property(fc.integer(), fc.array(fc.integer(), { maxLength: 30 }), (seed, items) => {
        const copy = [...items];
        const shuffled = createRng(seed).shuffle(items);
        const sortNumbers = (list: number[]) => [...list].sort((a, b) => a - b);
        return (
          JSON.stringify(items) === JSON.stringify(copy) &&
          JSON.stringify(sortNumbers(shuffled)) === JSON.stringify(sortNumbers(items))
        );
      }),
    );
  });

  it('pick wählt ein vorhandenes Element', () => {
    const rng = createRng('pick');
    const items = ['C', 'D', 'E'];
    for (let i = 0; i < 50; i++) {
      expect(items).toContain(rng.pick(items));
    }
  });
});
