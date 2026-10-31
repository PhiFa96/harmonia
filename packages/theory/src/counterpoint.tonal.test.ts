// Independent interval/pitch-class oracle, not independent specialist acceptance.
import { Interval, Pcset } from 'tonal';
import { describe, expect, it } from 'vitest';
import { isCounterpointConsonance } from './counterpoint.ts';
import { parsePitch } from './pitch.ts';
import { pitchClassSet } from './analysis.ts';
describe('P4.19 independent tonal comparisons', () => {
  it.each([
    ['C4', 'Eb4', '3m', true],
    ['C4', 'D#4', '2A', false],
    ['C4', 'G5', '12P', true],
    ['C4', 'Bbb4', '7d', false],
    ['F#3', 'A#3', '3M', true],
    ['F#3', 'B3', '4P', false],
  ] as const)('%s/%s spelling', (low, high, interval, consonant) => {
    expect(Interval.distance(low, high)).toBe(interval);
    expect(isCounterpointConsonance(parsePitch(low), parsePitch(high))).toBe(consonant);
  });
  it('agrees with a pitch-class bitset including enharmonic/octave duplicates', () => {
    const oracle = Pcset.get(['C4', 'E4', 'G4', 'B#3', 'C5']);
    expect(oracle.chroma).toBe('100010010000');
    expect(pitchClassSet([60, 64, 67, 60, 72])).toEqual(
      Array.from(oracle.chroma).flatMap((v, i) => (v === '1' ? [i] : [])),
    );
  });
});
