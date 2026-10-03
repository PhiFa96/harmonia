// Unabhängiges Orakel nur im Test; Produktionsaufgaben benutzen ausschließlich die eigene Engine.
import { formatPitch } from '@harmonia/theory';
import { Interval as TonalInterval } from 'tonal';
import { expect, it } from 'vitest';
import { createRng, expectedAnswer, generateVisualInterval } from './index.ts';

it('500 erzeugte auf- und absteigende Intervalle stimmen mit tonal überein', () => {
  const rng = createRng('p1.19-independent-oracle');
  for (let index = 0; index < 500; index++) {
    const item = generateVisualInterval(
      {
        clefs: ['treble', 'bass'],
        direction: 'both',
        intervals: ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'd5', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'],
      },
      rng,
    );
    const oracle = TonalInterval.distance(formatPitch(item.from), formatPitch(item.to));
    const match = /^-?(\d+)(dd|d|m|M|P|A|AA)$/.exec(oracle);
    expect(match, oracle).not.toBeNull();
    expect(expectedAnswer(item)).toBe(`${match?.[2] ?? ''}${match?.[1] ?? ''}`);
  }
});
