// Vergleichstest gegen die unabhängige Bibliothek tonal (ADR 0004).
// tonal ist nur Test-Orakel, keine Laufzeit-Abhängigkeit.

import fc from 'fast-check';
import { Note } from 'tonal';
import { describe, expect, it } from 'vitest';

import { formatPitch, frequency, isEnharmonic, midi } from './pitch.ts';
import { pitchArbitrary } from './testing/arbitraries.ts';

// tonal liefert außerhalb des MIDI-Bereichs (0–127) keine MIDI-Nummer; dort vergleichen wir nicht.
const inMidiRange = pitchArbitrary.filter((x) => midi(x) >= 0 && midi(x) <= 127);

describe('Vergleich mit tonal', () => {
  it('gleiche MIDI-Nummer für alle Tonhöhen', () => {
    fc.assert(
      fc.property(inMidiRange, (x) => {
        expect(Note.get(formatPitch(x)).midi).toBe(midi(x));
      }),
      { numRuns: 2000 },
    );
  });

  it('gleiche Frequenz für alle Tonhöhen', () => {
    fc.assert(
      fc.property(inMidiRange, (x) => {
        expect(frequency(x)).toBeCloseTo(Note.freq(formatPitch(x)) ?? Number.NaN, 6);
      }),
      { numRuns: 2000 },
    );
  });

  it('gleiche Einschätzung der Enharmonik', () => {
    fc.assert(
      fc.property(inMidiRange, inMidiRange, (a, b) => {
        const tonalSays = Note.get(formatPitch(a)).midi === Note.get(formatPitch(b)).midi;
        expect(isEnharmonic(a, b)).toBe(tonalSays);
      }),
      { numRuns: 2000 },
    );
  });
});
