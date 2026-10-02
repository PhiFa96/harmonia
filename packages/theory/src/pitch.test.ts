import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { Letter, Pitch } from './pitch.ts';
import {
  chroma,
  comparePitches,
  diatonicIndex,
  enharmonicSpellings,
  equals,
  formatPitch,
  frequency,
  fromMidi,
  isEnharmonic,
  midi,
  parsePitch,
  pitch,
  transpose,
} from './pitch.ts';
import { pitchArbitrary } from './testing/arbitraries.ts';

const p = (text: string): Pitch => parsePitch(text);

describe('parsePitch', () => {
  it.each([
    ['C4', 'C', 0, 4],
    ['F#3', 'F', 1, 3],
    ['Bb2', 'B', -1, 2],
    ['C##5', 'C', 2, 5],
    ['Cx5', 'C', 2, 5],
    ['Dbb4', 'D', -2, 4],
    ['F♯3', 'F', 1, 3],
    ['B♭2', 'B', -1, 2],
    ['C𝄪4', 'C', 2, 4],
    ['D𝄫4', 'D', -2, 4],
    ['B♮4', 'B', 0, 4],
    ['C-1', 'C', 0, -1],
    ['G9', 'G', 0, 9],
    [' E4 ', 'E', 0, 4],
  ] as const)('liest %s', (text, letter, alter, octave) => {
    expect(parsePitch(text)).toEqual({ letter, alter, octave });
  });

  it.each(['H4', 'c4', 'C', '4C', 'C4.5', 'C#b4', 'B♮#4', ''])('lehnt „%s“ ab', (text) => {
    expect(() => parsePitch(text)).toThrow(SyntaxError);
  });

  it('lehnt mehr als zwei Vorzeichen ab', () => {
    expect(() => parsePitch('C###4')).toThrow(RangeError);
    expect(() => parsePitch('Dbbb4')).toThrow(RangeError);
  });
});

describe('pitch', () => {
  it('prüft die Eingaben', () => {
    expect(() => pitch('H' as Letter)).toThrow(RangeError);
    expect(() => pitch('C', 3)).toThrow(RangeError);
    expect(() => pitch('C', 0.5)).toThrow(RangeError);
    expect(() => pitch('C', 0, 4.5)).toThrow(RangeError);
  });
});

describe('midi', () => {
  it.each([
    ['C-1', 0],
    ['C4', 60],
    ['A4', 69],
    ['B#3', 60],
    ['Cb4', 59],
    ['C##4', 62],
    ['Dbb4', 60],
    ['E#4', 65],
    ['Fb4', 64],
    ['G9', 127],
  ])('%s → %i', (text, expected) => {
    expect(midi(p(text))).toBe(expected);
  });
});

describe('frequency', () => {
  it('nutzt A4 = 440 Hz als Bezug', () => {
    expect(frequency(p('A4'))).toBe(440);
    expect(frequency(p('A3'))).toBe(220);
    expect(frequency(p('A5'))).toBe(880);
    expect(frequency(p('C4'))).toBeCloseTo(261.625565, 5);
  });

  it('erlaubt einen anderen Kammerton', () => {
    expect(frequency(p('A4'), 442)).toBe(442);
  });
});

describe('chroma und diatonicIndex', () => {
  it('berechnet Tonhöhenklasse und diatonische Position', () => {
    expect(chroma(p('Cb4'))).toBe(11);
    expect(chroma(p('B#3'))).toBe(0);
    expect(diatonicIndex(p('C0'))).toBe(0);
    expect(diatonicIndex(p('B3'))).toBe(27);
    expect(diatonicIndex(p('C4'))).toBe(28);
  });
});

describe('transpose', () => {
  it.each([
    ['C4', 2, 4, 'E4'], // große Terz
    ['C4', 3, 4, 'Fb4'], // verminderte Quarte – klingt wie E4, ist aber eine Quarte
    ['B#3', 2, 4, 'D##4'],
    ['C4', -2, -3, 'A3'], // kleine Terz abwärts
    ['E4', 7, 12, 'E5'], // Oktave
    ['C4', 1, 0, 'Dbb4'], // verminderte Sekunde
    ['B3', 1, 1, 'C4'], // kleine Sekunde über die Oktavgrenze
  ] as const)('%s um %i Schritte / %i Halbtöne → %s', (from, steps, semitones, expected) => {
    expect(transpose(p(from), steps, semitones)).toEqual(p(expected));
  });

  it('wirft, wenn mehr als zwei Vorzeichen nötig wären', () => {
    expect(() => transpose(p('Fb4'), 3, 4)).toThrow(RangeError); // wäre Bbbb4
  });

  it('Oktave aufwärts erhöht MIDI um 12 und behält den Stammton', () => {
    fc.assert(
      fc.property(pitchArbitrary, (x) => {
        const up = transpose(x, 7, 12);
        return midi(up) === midi(x) + 12 && up.letter === x.letter && up.alter === x.alter;
      }),
    );
  });

  it('Hin- und Rücktransposition ergibt den Ausgangston', () => {
    fc.assert(
      fc.property(
        pitchArbitrary,
        fc.integer({ min: -14, max: 14 }),
        fc.integer({ min: -24, max: 24 }),
        (x, steps, semitones) => {
          let there: Pitch;
          try {
            there = transpose(x, steps, semitones);
          } catch {
            return true; // Ergebnis nicht darstellbar – kein Gegenbeispiel
          }
          return equals(transpose(there, -steps, -semitones), x);
        },
      ),
    );
  });
});

describe('Enharmonik', () => {
  it('kennt alle Schreibweisen mit höchstens zwei Vorzeichen', () => {
    expect(enharmonicSpellings(p('C4')).map((x) => formatPitch(x))).toEqual(['B#3', 'C4', 'Dbb4']);
    expect(enharmonicSpellings(p('C#4')).map((x) => formatPitch(x))).toEqual([
      'B##3',
      'C#4',
      'Db4',
    ]);
    expect(enharmonicSpellings(p('G#4')).map((x) => formatPitch(x))).toEqual(['G#4', 'Ab4']);
  });

  it('jede Schreibweise klingt gleich, die eigene ist dabei, es gibt 2 oder 3', () => {
    fc.assert(
      fc.property(pitchArbitrary, (x) => {
        const spellings = enharmonicSpellings(x);
        return (
          spellings.some((s) => equals(s, x)) &&
          spellings.every((s) => isEnharmonic(s, x)) &&
          (spellings.length === 2 || spellings.length === 3)
        );
      }),
    );
  });

  it('Cis und Des klingen gleich, sind aber verschieden', () => {
    expect(isEnharmonic(p('C#4'), p('Db4'))).toBe(true);
    expect(equals(p('C#4'), p('Db4'))).toBe(false);
  });
});

describe('fromMidi', () => {
  it.each([
    [60, 'sharp', 'C4'],
    [61, 'sharp', 'C#4'],
    [61, 'flat', 'Db4'],
    [70, 'sharp', 'A#4'],
    [70, 'flat', 'Bb4'],
    [59, 'flat', 'B3'],
    [0, 'sharp', 'C-1'],
  ] as const)('%i (%s) → %s', (value, prefer, expected) => {
    expect(fromMidi(value, prefer)).toEqual(p(expected));
  });

  it('liefert für jede MIDI-Nummer eine passende Schreibweise mit höchstens einem Vorzeichen', () => {
    for (let value = 0; value <= 127; value++) {
      for (const prefer of ['sharp', 'flat'] as const) {
        const result = fromMidi(value, prefer);
        expect(midi(result)).toBe(value);
        expect(Math.abs(result.alter)).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('formatPitch', () => {
  it('schreibt ASCII und Unicode', () => {
    expect(formatPitch(p('C##5'))).toBe('C##5');
    expect(formatPitch(p('C##5'), 'unicode')).toBe('C𝄪5');
    expect(formatPitch(p('Bb2'), 'unicode')).toBe('B♭2');
    expect(formatPitch(p('Dbb-1'), 'unicode')).toBe('D𝄫-1');
  });

  it('Rundreise: Lesen und Schreiben ergeben dieselbe Tonhöhe', () => {
    fc.assert(
      fc.property(pitchArbitrary, (x) => {
        return (
          equals(parsePitch(formatPitch(x, 'ascii')), x) &&
          equals(parsePitch(formatPitch(x, 'unicode')), x)
        );
      }),
    );
  });
});

describe('comparePitches', () => {
  it('sortiert nach Klang, bei Gleichklang nach Schreibweise', () => {
    const sorted = ['Dbb4', 'E4', 'B#3', 'C4', 'A3'].map(p).sort(comparePitches);
    expect(sorted.map((x) => formatPitch(x))).toEqual(['A3', 'B#3', 'C4', 'Dbb4', 'E4']);
  });
});
