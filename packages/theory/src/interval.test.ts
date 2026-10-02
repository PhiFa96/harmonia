import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { Interval, Quality } from './interval.ts';
import {
  diatonicSteps,
  formatInterval,
  interval,
  intervalBetween,
  intervalEquals,
  invert,
  isValidInterval,
  parseInterval,
  semitones,
  simplify,
  transposeBy,
} from './interval.ts';
import type { Pitch } from './pitch.ts';
import { diatonicIndex, formatPitch, LETTERS, midi, parsePitch, pitch } from './pitch.ts';
import { intervalArbitrary, pitchArbitrary } from './testing/arbitraries.ts';

const p = (text: string): Pitch => parsePitch(text);
const iv = (text: string): Interval => parseInterval(text);
const between = (a: string, b: string): string => formatInterval(intervalBetween(p(a), p(b)));

describe('intervalBetween', () => {
  it.each([
    ['C4', 'E4', 'M3'],
    ['C4', 'Fb4', 'd4'], // klingt wie E4, ist aber eine Quarte
    ['C4', 'E#4', 'A3'], // klingt wie F4, ist aber eine Terz
    ['E4', 'G4', 'm3'],
    ['C4', 'G4', 'P5'],
    ['C4', 'Gb4', 'd5'],
    ['C4', 'F#4', 'A4'],
    ['B3', 'F4', 'd5'],
    ['F4', 'B4', 'A4'],
    ['D4', 'C5', 'm7'],
    ['C4', 'C5', 'P8'],
    ['C4', 'D5', 'M9'],
    ['C4', 'Eb5', 'm10'],
    ['C4', 'C6', 'P15'],
    ['C4', 'C#4', 'A1'],
    ['C4', 'C4', 'P1'],
    ['C4', 'Dbb4', 'd2'],
    ['E4', 'Fb4', 'd2'],
    ['G#4', 'Ab4', 'd2'],
    ['Cb4', 'B#4', 'AA7'],
    ['C4', 'B##4', 'AA7'],
    ['C4', 'Ebb4', 'd3'], // C–Eses: verminderte Terz
    ['C4', 'A3', '-m3'],
    ['C4', 'C3', '-P8'],
    ['C4', 'Cb4', '-A1'], // gleicher Stammton, tiefer: übermäßige Prime abwärts
    ['C4', 'B#3', '-d2'], // Stammton tiefer, gleicher Klang: verminderte Sekunde abwärts
    ['B#3', 'C4', 'd2'],
    ['G4', 'C4', '-P5'],
  ])('%s → %s = %s', (from, to, expected) => {
    expect(between(from, to)).toBe(expected);
  });

  it('wirft bei mehr als doppelt übermäßigen Intervallen', () => {
    expect(() => intervalBetween(p('Cbb4'), p('C##4'))).toThrow(RangeError); // vierfach übermäßige Prime
  });

  it('stimmt mit Stammton- und Halbtonabstand überein', () => {
    fc.assert(
      fc.property(pitchArbitrary, pitchArbitrary, (a, b) => {
        let result: Interval;
        try {
          result = intervalBetween(a, b);
        } catch {
          return true; // mehr als doppelt übermäßig/vermindert – nicht darstellbar
        }
        return (
          semitones(result) === midi(b) - midi(a) &&
          diatonicSteps(result) === diatonicIndex(b) - diatonicIndex(a)
        );
      }),
      { numRuns: 3000 },
    );
  });
});

describe('semitones', () => {
  it.each([
    ['P1', 0],
    ['A1', 1],
    ['d2', 0],
    ['m2', 1],
    ['M2', 2],
    ['A2', 3],
    ['dd3', 1],
    ['d3', 2],
    ['m3', 3],
    ['M3', 4],
    ['d4', 4],
    ['P4', 5],
    ['A4', 6],
    ['AA4', 7],
    ['d5', 6],
    ['dd5', 5],
    ['P5', 7],
    ['m6', 8],
    ['M6', 9],
    ['m7', 10],
    ['M7', 11],
    ['P8', 12],
    ['m9', 13],
    ['M9', 14],
    ['m10', 15],
    ['M10', 16],
    ['P11', 17],
    ['A11', 18],
    ['P12', 19],
    ['m13', 20],
    ['M13', 21],
    ['P15', 24],
    ['-m3', -3],
    ['-P8', -12],
  ])('%s = %i Halbtöne', (text, expected) => {
    expect(semitones(iv(text))).toBe(expected);
  });
});

describe('Gültigkeit', () => {
  it.each([
    [5, 'M'],
    [3, 'P'],
    [4, 'm'],
    [8, 'M'],
    [1, 'd'], // keine verminderte Prime – heißt „übermäßige Prime abwärts“
    [1, 'dd'],
    [0, 'P'],
    [2.5, 'M'],
  ] as [number, Quality][])('%i %s ist ungültig', (intervalNumber, quality) => {
    expect(isValidInterval(intervalNumber, quality)).toBe(false);
    expect(() => interval(intervalNumber, quality)).toThrow(RangeError);
  });

  it('reine Prime hat immer die Richtung aufwärts', () => {
    expect(interval(1, 'P', -1).direction).toBe(1);
  });
});

describe('Alle Intervalle bis zur Doppeloktave von allen 35 Tönen aus', () => {
  const QUALITIES: Quality[] = ['dd', 'd', 'm', 'M', 'P', 'A', 'AA'];
  const starts = LETTERS.flatMap((letter) =>
    [-2, -1, 0, 1, 2].map((alter) => pitch(letter, alter, 4)),
  );

  it('Bilden und Bestimmen passen zusammen (auf- und abwärts)', () => {
    let checked = 0;
    for (const start of starts) {
      for (let size = 1; size <= 15; size++) {
        for (const quality of QUALITIES.filter((q) => isValidInterval(size, q))) {
          for (const direction of [1, -1] as const) {
            const target = interval(size, quality, direction);
            let end: Pitch;
            try {
              end = transposeBy(start, target);
            } catch {
              continue; // Zielton bräuchte mehr als zwei Vorzeichen
            }
            const found = intervalBetween(start, end);
            expect(
              intervalEquals(found, target),
              `${formatPitch(start)} + ${formatInterval(target)} = ${formatPitch(end)}`,
            ).toBe(true);
            expect(midi(end) - midi(start)).toBe(semitones(target));
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(2500);
  });
});

describe('transposeBy', () => {
  it.each([
    ['C4', 'M3', 'E4'],
    ['C4', 'd4', 'Fb4'],
    ['E4', 'm3', 'G4'],
    ['F#4', 'A4', 'B#4'],
    ['Bb3', 'P5', 'F4'],
    ['C4', '-m3', 'A3'],
    ['D4', 'M9', 'E5'],
    ['G4', '-P8', 'G3'],
  ])('%s + %s = %s', (start, step, expected) => {
    expect(transposeBy(p(start), iv(step))).toEqual(p(expected));
  });
});

describe('simplify', () => {
  it.each([
    ['M9', 'M2'],
    ['m10', 'm3'],
    ['P11', 'P4'],
    ['P15', 'P8'],
    ['P8', 'P8'],
    ['M3', 'M3'],
    ['-M9', '-M2'],
  ])('%s → %s', (compound, simple) => {
    expect(formatInterval(simplify(iv(compound)))).toBe(simple);
  });
});

describe('invert (Umkehrung)', () => {
  it.each([
    ['M3', 'm6'],
    ['m3', 'M6'],
    ['P4', 'P5'],
    ['P5', 'P4'],
    ['A4', 'd5'],
    ['d5', 'A4'],
    ['M2', 'm7'],
    ['AA2', 'dd7'],
    ['P1', 'P8'],
    ['P8', 'P1'],
    ['A1', 'd8'],
    ['M9', 'm7'], // zusammengesetzt: erst vereinfachen
  ])('%s ↔ %s', (original, inverted) => {
    expect(formatInterval(invert(iv(original)))).toBe(inverted);
  });

  it('übermäßige Oktave hat keine Umkehrung (wäre verminderte Prime)', () => {
    expect(() => invert(iv('A8'))).toThrow(RangeError);
  });

  it('Intervall und Umkehrung ergeben zusammen eine Oktave', () => {
    fc.assert(
      fc.property(intervalArbitrary, (i) => {
        const up = interval(simplify(i).number, i.quality, 1);
        let inverted: Interval;
        try {
          inverted = invert(up);
        } catch {
          return true; // übermäßige/doppelt übermäßige Oktave
        }
        return (
          up.number + inverted.number === 9 &&
          semitones(up) + semitones(inverted) === 12 &&
          intervalEquals(invert(inverted), up)
        );
      }),
    );
  });
});

describe('parseInterval und formatInterval', () => {
  it('Rundreise', () => {
    fc.assert(
      fc.property(intervalArbitrary, (i) => intervalEquals(parseInterval(formatInterval(i)), i)),
    );
  });

  it.each(['M', '3M', 'X3', 'M-3', '', 'P 5'])('lehnt „%s“ ab', (text) => {
    expect(() => parseInterval(text)).toThrow(SyntaxError);
  });

  it('lehnt ungültige Kombinationen ab', () => {
    expect(() => parseInterval('M5')).toThrow(RangeError);
  });
});

describe('Vorzeichen der Null', () => {
  it('abwärts gerichtete verminderte Sekunde und übermäßige Prime liefern +0, nicht -0', () => {
    expect(Object.is(semitones(iv('-d2')), 0)).toBe(true);
    expect(Object.is(diatonicSteps(iv('-A1')), 0)).toBe(true);
  });
});
