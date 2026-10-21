// Unabhängiger Intervallabgleich des eigenen Korpus; kein Stil- oder Fachgutachten.
import { Interval as TonalInterval } from 'tonal';
import { describe, expect, it } from 'vitest';
import { parsePitch } from './pitch.ts';
import { analyzeVoiceLeading } from './voice-leading.ts';

describe('P4.09 – Korpus gegen tonal', () => {
  it.each([
    ['C3', 'G3', 'D3', 'A3', '5P', '5P', true],
    ['C3', 'G4', 'D3', 'A4', '12P', '12P', true],
    ['C3', 'G3', 'D3', 'Bbb3', '5P', '6d', false],
    ['C3', 'G3', 'D3', 'Ab3', '5P', '5d', false],
  ] as const)(
    'Quintpaar %s/%s → %s/%s',
    (bassFrom, sopranoFrom, bassTo, sopranoTo, before, after, parallel) => {
      expect(TonalInterval.distance(bassFrom, sopranoFrom)).toBe(before);
      expect(TonalInterval.distance(bassTo, sopranoTo)).toBe(after);
      const held = { tenor: parsePitch('C4'), alto: parsePitch('E4') };
      expect(
        analyzeVoiceLeading(
          [
            { ...held, bass: parsePitch(bassFrom), soprano: parsePitch(sopranoFrom) },
            { ...held, bass: parsePitch(bassTo), soprano: parsePitch(sopranoTo) },
          ],
          { 'parallel-fifth': 'error' },
        ),
      ).toHaveLength(parallel ? 1 : 0);
    },
  );

  it.each([
    ['Eb4', 'F#4', '2A', true],
    ['F#4', 'Eb4', '-2A', true],
    ['Eb4', 'Gb4', '3m', false],
    ['C4', 'Eb4', '3m', false],
  ] as const)('Melodieintervall %s → %s', (from, to, interval, augmented) => {
    expect(TonalInterval.distance(from, to)).toBe(interval);
    const held = { bass: parsePitch('C3'), tenor: parsePitch('G3'), alto: parsePitch('C4') };
    expect(
      analyzeVoiceLeading(
        [
          { ...held, soprano: parsePitch(from) },
          { ...held, soprano: parsePitch(to) },
        ],
        { 'augmented-second': 'warning' },
      ),
    ).toHaveLength(augmented ? 1 : 0);
  });
});
