import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { formatInterval, intervalBetween } from './interval.ts';
import { pitchName } from './naming.ts';
import type { Pitch } from './pitch.ts';
import { chroma, formatPitch, LETTERS, midi, parsePitch, sameNoteName } from './pitch.ts';
import type { ScaleType } from './scale.ts';
import { buildScale, SCALE_TYPES, scaleIntervals, scaleTypeName } from './scale.ts';
import { pitchArbitrary } from './testing/arbitraries.ts';

const p = (text: string): Pitch => parsePitch(text);

/** Deutsche Namen ohne Oktave, z. B. „C D E F G A H“. */
const de = (notes: Pitch[]): string =>
  notes.map((n) => pitchName(n, { system: 'de', octave: 'none' })).join(' ');

const sci = (notes: Pitch[]): string => notes.map((n) => formatPitch(n)).join(' ');

const HEPTATONIC: readonly Exclude<ScaleType, 'chromatic'>[] = [
  'major',
  'naturalMinor',
  'harmonicMinor',
  'melodicMinor',
  'ionian',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'aeolian',
  'locrian',
];

/** Baut die Tonleiter oder liefert undefined, wenn ein Ton mehr als zwei Vorzeichen bräuchte. */
function tryBuild(tonic: Pitch, type: ScaleType, descending = false): Pitch[] | undefined {
  try {
    return buildScale(tonic, type, { direction: descending ? 'descending' : 'ascending' });
  } catch (error) {
    expect(error).toBeInstanceOf(RangeError);
    return undefined;
  }
}

describe('Dur und Moll', () => {
  it('C-Dur mit Oktaven', () => {
    expect(sci(buildScale(p('C4'), 'major'))).toBe('C4 D4 E4 F4 G4 A4 B4');
    expect(sci(buildScale(p('C4'), 'major', { includeOctave: true }))).toBe(
      'C4 D4 E4 F4 G4 A4 B4 C5',
    );
  });

  it.each([
    ['naturalMinor', 'A H C D E F G'],
    ['harmonicMinor', 'A H C D E F Gis'],
    ['melodicMinor', 'A H C D E Fis Gis'],
  ] as const)('a-Moll %s', (type, expected) => {
    expect(de(buildScale(p('A4'), type))).toBe(expected);
  });

  it.each([
    ['G4', 'major', 'G A H C D E Fis'],
    ['F4', 'major', 'F G A B C D E'],
    ['B3', 'major', 'H Cis Dis E Fis Gis Ais'],
    ['Db4', 'major', 'Des Es F Ges As B C'],
    ['Cb4', 'major', 'Ces Des Es Fes Ges As B'],
    ['C#4', 'major', 'Cis Dis Eis Fis Gis Ais His'],
    ['C4', 'naturalMinor', 'C D Es F G As B'],
    ['C4', 'harmonicMinor', 'C D Es F G As H'],
    ['C4', 'melodicMinor', 'C D Es F G A H'],
    ['E4', 'harmonicMinor', 'E Fis G A H C Dis'],
    ['Eb4', 'naturalMinor', 'Es F Ges As B Ces Des'],
    ['G#4', 'harmonicMinor', 'Gis Ais H Cis Dis E Fisis'],
    ['A#4', 'melodicMinor', 'Ais His Cis Dis Eis Fisis Gisis'],
  ] as const)('%s %s', (tonic, type, expected) => {
    expect(de(buildScale(p(tonic), type))).toBe(expected);
  });

  it('Doppelvorzeichen, solange jeder Ton höchstens zwei braucht', () => {
    expect(de(buildScale(p('B#4'), 'major'))).toBe('His Cisis Disis Eis Fisis Gisis Aisis');
    expect(de(buildScale(p('Fb4'), 'major'))).toBe('Fes Ges As Heses Ces Des Es');
  });

  it('wirft, wenn ein Ton drei Vorzeichen bräuchte', () => {
    // Gisis-Dur bräuchte Fisisis, Feses-Dur bräuchte Heseses.
    expect(() => buildScale(p('G##4'), 'major')).toThrow(RangeError);
    expect(() => buildScale(p('G##4'), 'major')).toThrow(/G##4/);
    expect(() => buildScale(p('Fbb4'), 'major')).toThrow(RangeError);
  });
});

describe('Richtung', () => {
  it('abwärts vom Grundton nach unten', () => {
    expect(sci(buildScale(p('C4'), 'major', { direction: 'descending' }))).toBe(
      'C4 B3 A3 G3 F3 E3 D3',
    );
    expect(
      sci(buildScale(p('C4'), 'major', { direction: 'descending', includeOctave: true })),
    ).toBe('C4 B3 A3 G3 F3 E3 D3 C3');
  });

  it('melodisches Moll abwärts wie natürliches Moll', () => {
    expect(
      de(buildScale(p('A4'), 'melodicMinor', { direction: 'descending', includeOctave: true })),
    ).toBe('A G F E D C H A');
    expect(de(buildScale(p('A4'), 'harmonicMinor', { direction: 'descending' }))).toBe(
      'A Gis F E D C H',
    );
  });

  it('abwärts ergibt dieselben Töne wie aufwärts (außer melodisch Moll)', () => {
    fc.assert(
      fc.property(
        pitchArbitrary,
        fc.constantFrom(...HEPTATONIC.filter((t) => t !== 'melodicMinor')),
        (tonic, type) => {
          const up = tryBuild(tonic, type);
          const down = tryBuild(tonic, type, true);
          expect(down === undefined).toBe(up === undefined);
          if (up && down) {
            const sameSpellings = up.every((n) => down.some((d) => sameNoteName(d, n)));
            const falling = down.every((n, i) => i === 0 || midi(n) < midi(down[i - 1] ?? n));
            expect(sameSpellings && falling).toBe(true);
          }
        },
      ),
    );
  });
});

describe('Kirchentonarten', () => {
  it.each([
    ['C4', 'ionian'],
    ['D4', 'dorian'],
    ['E4', 'phrygian'],
    ['F4', 'lydian'],
    ['G4', 'mixolydian'],
    ['A4', 'aeolian'],
    ['B4', 'locrian'],
  ] as const)('%s %s nur auf weißen Tasten', (tonic, type) => {
    expect(buildScale(p(tonic), type).every((n) => n.alter === 0)).toBe(true);
  });

  it.each([
    ['ionian', 'C D E F G A H'],
    ['dorian', 'C D Es F G A B'],
    ['phrygian', 'C Des Es F G As B'],
    ['lydian', 'C D E Fis G A H'],
    ['mixolydian', 'C D E F G A B'],
    ['aeolian', 'C D Es F G As B'],
    ['locrian', 'C Des Es F Ges As B'],
  ] as const)('auf C: %s', (type, expected) => {
    expect(de(buildScale(p('C4'), type))).toBe(expected);
  });

  it('Ionisch = Dur, Äolisch = natürliches Moll', () => {
    expect(scaleIntervals('ionian')).toEqual(scaleIntervals('major'));
    expect(scaleIntervals('aeolian')).toEqual(scaleIntervals('naturalMinor'));
  });
});

describe('Pentatonik', () => {
  it.each([
    ['C4', 'majorPentatonic', 'C D E G A'],
    ['A4', 'minorPentatonic', 'A C D E G'],
    ['F#4', 'majorPentatonic', 'Fis Gis Ais Cis Dis'],
    ['Eb4', 'minorPentatonic', 'Es Ges As B Des'],
  ] as const)('%s %s', (tonic, type, expected) => {
    expect(de(buildScale(p(tonic), type))).toBe(expected);
  });

  it('Moll-Pentatonik hat dieselben Töne wie die Dur-Pentatonik der Paralleltonart', () => {
    const minor = buildScale(p('A4'), 'minorPentatonic');
    const major = buildScale(p('C4'), 'majorPentatonic');
    expect(major.every((n) => minor.some((m) => sameNoteName(m, n)))).toBe(true);
  });
});

describe('Bluestonleitern', () => {
  it.each([
    ['C4', 'blues', 'C Es F Ges G B'],
    ['A4', 'blues', 'A C D Es E G'],
    ['E4', 'blues', 'E G A B H D'],
    ['F#4', 'blues', 'Fis A H C Cis E'],
    ['C4', 'majorBlues', 'C D Es E G A'],
    ['G4', 'majorBlues', 'G A B H D E'],
    ['Eb4', 'majorBlues', 'Es F Ges G B C'],
  ] as const)('%s %s', (tonic, type, expected) => {
    expect(de(buildScale(p(tonic), type))).toBe(expected);
  });

  it('Blues = Moll-Pentatonik plus verminderte Quinte, Dur-Blues = Dur-Pentatonik plus kleine Terz', () => {
    const intervals = (type: ScaleType): string[] =>
      type === 'chromatic' ? [] : scaleIntervals(type).map((i) => formatInterval(i));
    expect(intervals('blues').filter((i) => i !== 'd5')).toEqual(intervals('minorPentatonic'));
    expect(intervals('majorBlues').filter((i) => i !== 'm3')).toEqual(intervals('majorPentatonic'));
  });

  it('abwärts mit derselben Schreibweise', () => {
    expect(de(buildScale(p('C4'), 'blues', { direction: 'descending', includeOctave: true }))).toBe(
      'C B G Ges F Es C',
    );
  });
});

describe('Ganztonleiter', () => {
  it.each([
    ['C4', 'C D E Fis Gis Ais'],
    ['Db4', 'Des Es F G A H'],
    ['D4', 'D E Fis Gis Ais His'],
    ['Bb4', 'B C D E Fis Gis'],
  ] as const)('auf %s', (tonic, expected) => {
    expect(de(buildScale(p(tonic), 'wholeTone'))).toBe(expected);
  });

  it('nur Ganztonschritte; der letzte zur Oktave ist eine verminderte Terz', () => {
    fc.assert(
      fc.property(pitchArbitrary, (tonic) => {
        let notes: Pitch[];
        try {
          notes = buildScale(tonic, 'wholeTone', { includeOctave: true });
        } catch {
          return;
        }
        const steps = notes
          .slice(1)
          .map((n, i) => formatInterval(intervalBetween(notes[i] ?? n, n)));
        expect(steps).toEqual(['M2', 'M2', 'M2', 'M2', 'M2', 'd3']);
      }),
    );
  });

  it('wirft, wenn ein Ton drei Vorzeichen bräuchte (Ais: Fisisis)', () => {
    expect(() => buildScale(p('A#4'), 'wholeTone')).toThrow(RangeError);
  });
});

describe('chromatische Tonleiter', () => {
  it('aufwärts mit Kreuzen, abwärts mit b', () => {
    expect(de(buildScale(p('C4'), 'chromatic'))).toBe('C Cis D Dis E F Fis G Gis A Ais H');
    expect(de(buildScale(p('C4'), 'chromatic', { direction: 'descending' }))).toBe(
      'C H B A As G Ges F E Es D Des',
    );
  });

  it('mit Oktave', () => {
    const up = buildScale(p('C4'), 'chromatic', { includeOctave: true });
    expect(formatPitch(up.at(-1) ?? p('C0'))).toBe('C5');
    const down = buildScale(p('C4'), 'chromatic', { direction: 'descending', includeOctave: true });
    expect(formatPitch(down.at(-1) ?? p('C0'))).toBe('C3');
  });

  it('beginnt immer mit dem gegebenen Grundton', () => {
    expect(de(buildScale(p('Eb4'), 'chromatic'))).toBe('Es E F Fis G Gis A Ais H C Cis D');
    expect(de(buildScale(p('F#4'), 'chromatic', { direction: 'descending' }))).toBe(
      'Fis F E Es D Des C H B A As G',
    );
  });

  it('zwölf Halbtonschritte, alle Tonhöhenklassen, höchstens ein Vorzeichen', () => {
    fc.assert(
      fc.property(
        pitchArbitrary.filter((t) => Math.abs(t.alter) <= 1),
        fc.boolean(),
        (tonic, descending) => {
          const notes = buildScale(tonic, 'chromatic', {
            direction: descending ? 'descending' : 'ascending',
          });
          const step = descending ? -1 : 1;
          const steps = notes.every(
            (n, i) => i === 0 || midi(n) - midi(notes[i - 1] ?? n) === step,
          );
          const classes = new Set(notes.map((n) => chroma(n)));
          expect(steps && classes.size === 12 && notes.every((n) => Math.abs(n.alter) <= 1)).toBe(
            true,
          );
        },
      ),
    );
  });
});

describe('Eigenschaften siebenstufiger Tonleitern', () => {
  it('jeder Stammton genau einmal, aufsteigend innerhalb einer Oktave', () => {
    fc.assert(
      fc.property(pitchArbitrary, fc.constantFrom(...HEPTATONIC), (tonic, type) => {
        const notes = tryBuild(tonic, type);
        if (notes) {
          const letters = new Set(notes.map((n) => n.letter));
          const rising = notes.every((n, i) => i === 0 || midi(n) > midi(notes[i - 1] ?? n));
          const span = midi(notes.at(-1) ?? tonic) - midi(tonic);
          expect(letters.size === LETTERS.length && rising && span < 12).toBe(true);
        }
      }),
    );
  });

  it('Dur: Ganz-, Ganz-, Halb-, Ganz-, Ganz-, Ganz-, Halbtonschritt', () => {
    fc.assert(
      fc.property(pitchArbitrary, (tonic) => {
        let notes: Pitch[];
        try {
          notes = buildScale(tonic, 'major', { includeOctave: true });
        } catch {
          return;
        }
        const steps = notes
          .slice(1)
          .map((n, i) => formatInterval(intervalBetween(notes[i] ?? n, n)));
        expect(steps).toEqual(['M2', 'M2', 'm2', 'M2', 'M2', 'M2', 'm2']);
      }),
    );
  });

  it('harmonisches Moll hat die übermäßige Sekunde zwischen 6. und 7. Stufe', () => {
    const notes = buildScale(p('D4'), 'harmonicMinor');
    expect(formatInterval(intervalBetween(notes[5] ?? p('C0'), notes[6] ?? p('C0')))).toBe('A2');
  });
});

describe('Tonleitertypen', () => {
  it('alle Typen genau einmal', () => {
    expect(SCALE_TYPES).toHaveLength(17);
    expect(new Set(SCALE_TYPES).size).toBe(17);
    expect(SCALE_TYPES).toContain('chromatic');
  });

  it('Intervalle vom Grundton', () => {
    expect(scaleIntervals('lydian').map((i) => formatInterval(i))).toEqual([
      'P1',
      'M2',
      'M3',
      'A4',
      'P5',
      'M6',
      'M7',
    ]);
  });

  it.each([
    ['major', 'Dur', 'major'],
    ['naturalMinor', 'natürliches Moll', 'natural minor'],
    ['harmonicMinor', 'harmonisches Moll', 'harmonic minor'],
    ['melodicMinor', 'melodisches Moll', 'melodic minor'],
    ['dorian', 'Dorisch', 'Dorian'],
    ['aeolian', 'Äolisch', 'Aeolian'],
    ['majorPentatonic', 'Dur-Pentatonik', 'major pentatonic'],
    ['blues', 'Bluestonleiter', 'blues scale'],
    ['majorBlues', 'Dur-Bluestonleiter', 'major blues scale'],
    ['wholeTone', 'Ganztonleiter', 'whole-tone scale'],
    ['chromatic', 'chromatisch', 'chromatic'],
  ] as const)('Name von %s', (type, german, english) => {
    expect(scaleTypeName(type)).toBe(german);
    expect(scaleTypeName(type, 'en')).toBe(english);
  });

  it('jeder Typ hat Namen in beiden Sprachen', () => {
    for (const type of SCALE_TYPES) {
      expect(scaleTypeName(type, 'de').length).toBeGreaterThan(0);
      expect(scaleTypeName(type, 'en').length).toBeGreaterThan(0);
    }
  });
});
