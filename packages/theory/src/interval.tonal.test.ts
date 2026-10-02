// Vergleichstest gegen die unabhängige Bibliothek tonal (ADR 0004).
//
// Bekannte Abweichung (bewusst ausgenommen): Wenn Stammton- und Klangrichtung sich widersprechen
// (z. B. C♯3 → D♭♭3: Stammton aufwärts, Klang abwärts), wählt tonal die Klangrichtung und liefert
// ein Intervall in der falschen Oktave („-7AA“ statt „2dd“). Unsere Engine folgt dem Stammton;
// das richtige Verhalten prüfen eigene Tests unten und in interval.test.ts.

import { Interval as TonalInterval } from 'tonal';
import { describe, expect, it } from 'vitest';

import type { Interval } from './interval.ts';
import { intervalBetween, invert, parseInterval, simplify, transposeBy } from './interval.ts';
import type { Pitch } from './pitch.ts';
import { diatonicIndex, formatPitch, LETTERS, midi, parsePitch, pitch } from './pitch.ts';

/** Unser Intervall in der Schreibweise von tonal: „3M“, „-3m“, „7AA“. */
const toTonal = (i: Interval): string =>
  `${i.direction < 0 ? '-' : ''}${String(i.number)}${i.quality}`;

const PITCHES: Pitch[] = [3, 4, 5].flatMap((octave) =>
  LETTERS.flatMap((letter) => [-2, -1, 0, 1, 2].map((alter) => pitch(letter, alter, octave))),
);

/** Richtung widerspricht sich nicht (gleicher Klang zählt bei tonal als aufwärts). */
function directionsAgree(a: Pitch, b: Pitch): boolean {
  const steps = diatonicIndex(b) - diatonicIndex(a);
  const semitoneDirection = Math.sign(midi(b) - midi(a)) || 1;
  return steps === 0 || Math.sign(steps) === semitoneDirection;
}

describe('Vergleich mit tonal', () => {
  it('gleiches Intervall für alle darstellbaren Paare aus drei Oktaven', () => {
    let compared = 0;
    for (const a of PITCHES) {
      for (const b of PITCHES) {
        if (!directionsAgree(a, b)) {
          continue;
        }
        let ours: Interval;
        try {
          ours = intervalBetween(a, b);
        } catch {
          continue; // mehr als doppelt übermäßig/vermindert – bei uns bewusst nicht darstellbar
        }
        expect(toTonal(ours), `${formatPitch(a)} → ${formatPitch(b)}`).toBe(
          TonalInterval.distance(formatPitch(a), formatPitch(b)),
        );
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(8000);
  });

  it('gleiche Umkehrung für einfache Intervalle (ohne Prime und Oktave)', () => {
    // tonal kehrt die Oktave zur Oktave um; wir folgen der Lehrbuchregel Prime ↔ Oktave.
    for (const text of [
      'm2',
      'M2',
      'A2',
      'd3',
      'm3',
      'M3',
      'A3',
      'd4',
      'P4',
      'A4',
      'd5',
      'P5',
      'A5',
      'm6',
      'M6',
      'd7',
      'm7',
      'M7',
    ]) {
      expect(toTonal(invert(parseInterval(text))), text).toBe(
        TonalInterval.invert(toTonal(parseInterval(text))),
      );
    }
  });

  it('gleiche Vereinfachung zusammengesetzter Intervalle (None bis Quartdezime)', () => {
    // Bei der Doppeloktave weichen wir bewusst ab: wir vereinfachen zur Oktave, tonal zur Prime.
    for (const text of [
      'm9',
      'M9',
      'm10',
      'M10',
      'P11',
      'A11',
      'P12',
      'm13',
      'M13',
      'm14',
      'M14',
    ]) {
      expect(toTonal(simplify(parseInterval(text))), text).toBe(
        TonalInterval.simplify(toTonal(parseInterval(text))),
      );
    }
  });
});

describe('Fälle, in denen tonal abweicht – unser Verhalten', () => {
  it.each([
    ['C#3', 'Dbb3', '2dd', '-7AA'],
    ['Dbb3', 'C#3', '-2dd', '7AA'],
    ['C4', 'B#3', '-2d', '7A'],
    ['Cb4', 'B3', '-2d', '7A'],
  ])('%s → %s: wir %s, tonal %s', (from, to, ours, theirs) => {
    const result = intervalBetween(parsePitch(from), parsePitch(to));
    expect(toTonal(result)).toBe(ours);
    expect(TonalInterval.distance(from, to)).toBe(theirs);
    // Unser Ergebnis trifft beim Bilden genau den Zielton
    expect(transposeBy(parsePitch(from), result)).toEqual(parsePitch(to));
  });
});
