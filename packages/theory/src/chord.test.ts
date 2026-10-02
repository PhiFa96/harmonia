import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { Chord, ChordMatch, ChordType } from './chord.ts';
import {
  chord,
  CHORD_TYPES,
  chordBass,
  chordEquals,
  chordFactors,
  chordIntervals,
  chordPitches,
  chordTones,
  identifyChord,
  identifyChordFromMidi,
} from './chord.ts';
import { formatInterval } from './interval.ts';
import { germanName } from './naming.ts';
import type { NoteName, Pitch } from './pitch.ts';
import {
  formatNoteName,
  formatPitch,
  LETTERS,
  midi,
  noteName,
  parseNoteName,
  parsePitch,
  withOctave,
} from './pitch.ts';
import { chordArbitrary } from './testing/arbitraries.ts';

const c = (root: string, type: ChordType = 'major', inversion = 0): Chord =>
  chord(parseNoteName(root), type, inversion);

const pitches = (text: string): Pitch[] => text.split(' ').map((t) => parsePitch(t));

const de = (notes: readonly NoteName[]): string =>
  notes.map((n) => germanName(n.letter, n.alter)).join(' ');

/** Kurzform nur für diese Tests: „C major 1“ (Grundton, Typ, Umkehrung) plus fehlende Töne. */
const describeMatch = (m: ChordMatch): string =>
  `${formatNoteName(m.chord.root)} ${m.chord.type} ${String(m.chord.inversion)}${
    m.omitted.length > 0 ? ` ohne ${m.omitted.join(',')}` : ''
  }`;

/** Alle 35 Grundtöne mit bis zu zwei Vorzeichen. */
const ROOTS: NoteName[] = LETTERS.flatMap((letter) =>
  [-2, -1, 0, 1, 2].map((alter) => noteName(letter, alter)),
);

describe('Aufbau', () => {
  it('Intervalle und Akkordtöne der vier Dreiklangstypen', () => {
    expect(
      CHORD_TYPES.map((t) =>
        chordIntervals(t)
          .map((i) => formatInterval(i))
          .join(' '),
      ),
    ).toEqual(['P1 M3 P5', 'P1 m3 P5', 'P1 m3 d5', 'P1 M3 A5']);
    expect(chordFactors('major')).toEqual(['root', 'third', 'fifth']);
  });

  it.each([
    ['C', 'major', 'C E G'],
    ['C', 'minor', 'C Es G'],
    ['B', 'diminished', 'H D F'],
    ['C', 'augmented', 'C E Gis'],
    ['F#', 'major', 'Fis Ais Cis'],
    ['Eb', 'minor', 'Es Ges B'],
    ['G#', 'diminished', 'Gis H D'],
    ['Db', 'augmented', 'Des F A'],
    ['B', 'major', 'H Dis Fis'],
    ['Bb', 'minor', 'B Des F'],
    ['E', 'augmented', 'E Gis His'],
    ['C##', 'major', 'Cisis Eisis Gisis'],
    ['Cbb', 'major', 'Ceses Eses Geses'],
    ['Fb', 'diminished', 'Fes Asas Ceses'],
    ['A#', 'minor', 'Ais Cis Eis'],
  ] as const)('%s %s: %s', (root, type, expected) => {
    expect(de(chordTones(c(root, type)))).toBe(expected);
  });

  it('wirft, wenn ein Akkordton drei Vorzeichen bräuchte', () => {
    expect(() => c('Cbb', 'minor')).toThrow(RangeError); // Esese
    expect(() => c('B#', 'augmented')).toThrow(/B# augmented/); // Fisisis
    expect(() => chordTones({ root: parseNoteName('Fbb'), type: 'diminished' })).toThrow(
      RangeError,
    );
  });

  it('prüft die Umkehrung', () => {
    expect(() => c('C', 'major', 3)).toThrow(RangeError);
    expect(() => c('C', 'major', -1)).toThrow(RangeError);
    expect(() => c('C', 'major', 1.5)).toThrow(RangeError);
    expect(c('C').inversion).toBe(0);
  });

  it('Basston je nach Umkehrung', () => {
    expect(
      de([
        chordBass(c('A', 'minor')),
        chordBass(c('A', 'minor', 1)),
        chordBass(c('A', 'minor', 2)),
      ]),
    ).toBe('A C E');
  });

  it.each([
    [c('C'), {}, 'C4 E4 G4'],
    [c('C', 'major', 1), {}, 'E4 G4 C5'],
    [c('C', 'major', 2), {}, 'G4 C5 E5'],
    [c('C', 'major', 2), { octave: 3 }, 'G3 C4 E4'],
    [c('A', 'minor', 1), { octave: 2 }, 'C2 E2 A2'],
    [c('B', 'diminished'), {}, 'B4 D5 F5'],
    [c('G#', 'augmented', 1), { octave: 3 }, 'B#3 D##4 G#4'],
  ] as const)('enge Lage: %j → %s', (x, options, expected) => {
    expect(
      chordPitches(x, options)
        .map((p) => formatPitch(p))
        .join(' '),
    ).toBe(expected);
  });

  it('vergleicht Akkorde', () => {
    expect(chordEquals(c('C'), chord(noteName('C'), 'major', 0))).toBe(true);
    expect(chordEquals(c('C'), c('C', 'major', 1))).toBe(false);
    expect(chordEquals(c('C'), c('C', 'minor'))).toBe(false);
    expect(chordEquals(c('C#'), c('Db'))).toBe(false);
  });
});

describe('Bestimmen aus geschriebenen Tönen', () => {
  it('alle Dreiklänge auf allen 35 Grundtönen in allen Umkehrungen', () => {
    let checked = 0;
    for (const root of ROOTS) {
      for (const type of CHORD_TYPES) {
        let base: Chord;
        try {
          base = chord(root, type);
        } catch {
          continue;
        }
        for (const inversion of [0, 1, 2]) {
          const x = { ...base, inversion };
          const matches = identifyChord(chordPitches(x));
          expect(matches.map(describeMatch), describeMatch({ chord: x, omitted: [] })).toEqual([
            describeMatch({ chord: x, omitted: [] }),
          ]);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(300);
  });

  it.each([
    ['E3 G4 C5 E5', ['C major 1']],
    ['G2 E4 C5 G5', ['C major 2']],
    ['A3 C4 E4 A4 C5', ['A minor 0']],
    ['D4 F4 B4', ['B diminished 1']],
    ['C4 E4', ['C major 0 ohne fifth', 'C augmented 0 ohne fifth']],
    ['E3 C4 C5', ['C major 1 ohne fifth', 'C augmented 1 ohne fifth']],
    ['C4 Eb4 C5', ['C minor 0 ohne fifth', 'C diminished 0 ohne fifth']],
    // Die Schreibweise der fehlenden Quinte (Ges bzw. G) darf die Reihenfolge nicht bestimmen.
    ['Cb4 Eb4', ['Cb major 0 ohne fifth', 'Cb augmented 0 ohne fifth']],
  ])('%s', (text, expected) => {
    expect(identifyChord(pitches(text)).map(describeMatch)).toEqual(expected);
  });

  it.each([
    ['E4 G4 B#4', 'kein Terzaufbau: E–G kl. 3, E–His üb. 5'],
    ['C4 G4', 'leere Quinte ohne Terz'],
    ['C4', 'Einzelton'],
    ['C4 E4 G4 Bb4', 'Septakkord (kommt in Phase 2)'],
    ['C4 E4 G4 A4', 'Fremdton'],
    ['B#3 C4 E4', 'C und His gleichzeitig'],
  ])('kein Dreiklang: %s (%s)', (text) => {
    expect(identifyChord(pitches(text))).toEqual([]);
  });

  it('leere Eingabe', () => {
    expect(identifyChord([])).toEqual([]);
  });

  it('beliebige Lage und Verdopplung: der Bass bestimmt die Umkehrung', () => {
    fc.assert(
      fc.property(
        chordArbitrary,
        fc.array(fc.tuple(fc.integer({ min: 0, max: 2 }), fc.integer({ min: 3, max: 5 })), {
          maxLength: 4,
        }),
        fc.boolean(),
        (x, doublings, omitFifth) => {
          const tones = chordTones(x);
          const bassIndex = omitFifth && x.inversion === 2 ? 0 : x.inversion;
          const expected = { ...x, inversion: bassIndex };
          const upper = [0, 1, 2]
            .filter((i) => !(omitFifth && i === 2))
            .map((i) => [i, 3 + i] as const);
          const voicing = [
            withOctave(tones[bassIndex] ?? x.root, 1),
            ...[...upper, ...doublings.filter(([i]) => !(omitFifth && i === 2))].map(
              ([i, octave]) => withOctave(tones[i] ?? x.root, octave),
            ),
          ];
          const matches = identifyChord(voicing);
          if (omitFifth) {
            // Ohne Quinte mehrdeutig (Dur/übermäßig bzw. Moll/vermindert): Der Akkord ist einer der Kandidaten.
            const found = matches.find((m) => chordEquals(m.chord, expected));
            expect(found?.omitted).toEqual(['fifth']);
          } else {
            expect(matches).toHaveLength(1);
            expect(matches[0] && chordEquals(matches[0].chord, expected)).toBe(true);
          }
        },
      ),
    );
  });
});

describe('Bestimmen aus MIDI-Nummern', () => {
  const describeMidi = (text: number[], options = {}): string[] =>
    identifyChordFromMidi(text, options).map(
      (m) => `${describeMatch(m)}: ${m.pitches.map((p) => formatPitch(p)).join(' ')}`,
    );

  it('eindeutige Fälle', () => {
    expect(describeMidi([60, 64, 67])).toEqual(['C major 0: C4 E4 G4']);
    expect(describeMidi([52, 60, 67, 72])).toEqual(['C major 1: E3 C4 G4 C5']);
    expect(describeMidi([62, 65, 71])).toEqual(['B diminished 1: D4 F4 B4']);
  });

  it('übermäßiger Dreiklang: jede Schreibweise ein Kandidat, einfache zuerst', () => {
    expect(describeMidi([60, 64, 68])).toEqual([
      'C augmented 0: C4 E4 G#4',
      'Ab augmented 1: C4 E4 Ab4',
      'E augmented 2: B#3 E4 G#4',
      'Fb augmented 2: C4 Fb4 Ab4',
    ]);
    expect(describeMidi([60, 64, 68], { maxAccidentals: 2 })).toContain(
      'G# augmented 1: B#3 D##4 G#4',
    );
  });

  it('enharmonische Tonarten: weniger Vorzeichen zuerst', () => {
    expect(describeMidi([61, 65, 68])).toEqual([
      'Db major 0: Db4 F4 Ab4',
      'C# major 0: C#4 E#4 G#4',
    ]);
    expect(describeMidi([66, 70, 73])).toEqual([
      'F# major 0: F#4 A#4 C#5',
      'Gb major 0: Gb4 Bb4 Db5',
    ]);
  });

  it('ohne Quinte mehrdeutig', () => {
    expect(describeMidi([60, 63])).toEqual([
      'C minor 0 ohne fifth: C4 Eb4',
      'C diminished 0 ohne fifth: C4 Eb4',
      'B# diminished 0 ohne fifth: B#3 D#4',
    ]);
  });

  it('nur natürliche Töne mit maxAccidentals 0', () => {
    expect(describeMidi([60, 64, 68], { maxAccidentals: 0 })).toEqual([]);
    expect(describeMidi([57, 60, 64], { maxAccidentals: 0 })).toEqual(['A minor 0: A3 C4 E4']);
  });

  it('wirft bei ungültigen MIDI-Nummern', () => {
    expect(() => identifyChordFromMidi([60, 64.5])).toThrow(RangeError);
  });

  it('kein Dreiklang', () => {
    expect(identifyChordFromMidi([])).toEqual([]);
    expect(identifyChordFromMidi([60])).toEqual([]);
    expect(identifyChordFromMidi([60, 61, 62])).toEqual([]);
  });

  it('findet jeden Dreiklang (Töne mit höchstens einem Vorzeichen) wieder', () => {
    fc.assert(
      fc.property(
        chordArbitrary.filter((x) => chordTones(x).every((t) => Math.abs(t.alter) <= 1)),
        (x) => {
          const voicing = chordPitches(x, { octave: 3 });
          const found = identifyChordFromMidi(voicing.map((p) => midi(p))).find((m) =>
            chordEquals(m.chord, x),
          );
          expect(found?.pitches.map((p) => formatPitch(p))).toEqual(
            voicing.map((p) => formatPitch(p)),
          );
        },
      ),
    );
  });
});
