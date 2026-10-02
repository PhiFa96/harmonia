// Akkorde: bauen und bestimmen, immer mit korrekter Schreibweise.
// Phase 1: Dreiklänge mit Umkehrungen. Das Datenmodell ist für Septakkorde vorbereitet
// (weitere Akkordtypen mit vier Tönen, Akkordton „seventh“, dritte Umkehrung).

import { parseInterval, transposeBy } from './interval.ts';
import type { Interval } from './interval.ts';
import type { NoteName, Pitch } from './pitch.ts';
import {
  chroma,
  comparePitches,
  formatNoteName,
  LETTERS,
  noteName,
  sameNoteName,
  spellMidi,
  transpose,
  withOctave,
} from './pitch.ts';

export type TriadType = 'major' | 'minor' | 'diminished' | 'augmented';

/** Akkordtypen. Septakkorde kommen in Phase 2 dazu. */
export type ChordType = TriadType;

/** Akkordtöne in Terzschichtung. */
export type ChordFactor = 'root' | 'third' | 'fifth' | 'seventh';

const FACTORS: readonly ChordFactor[] = ['root', 'third', 'fifth', 'seventh'];

/** Intervalle vom Grundton aus, in Terzschichtung. */
const CHORD_STRUCTURE: Readonly<Record<ChordType, readonly string[]>> = {
  major: ['P1', 'M3', 'P5'],
  minor: ['P1', 'm3', 'P5'],
  diminished: ['P1', 'm3', 'd5'],
  augmented: ['P1', 'M3', 'A5'],
};

/** Alle Akkordtypen, häufigste zuerst (diese Reihenfolge entscheidet auch bei gleichwertigen Kandidaten). */
export const CHORD_TYPES: readonly ChordType[] = ['major', 'minor', 'diminished', 'augmented'];

/** Akkordtöne, die beim Bestimmen fehlen dürfen. Im vierstimmigen Satz wird oft die Quinte weggelassen. */
const OPTIONAL_FACTORS: readonly ChordFactor[] = ['fifth'];

export interface Chord {
  readonly root: NoteName;
  readonly type: ChordType;
  /** 0 = Grundstellung, 1 = erste Umkehrung (Sextakkord), 2 = zweite Umkehrung (Quartsextakkord), 3 = dritte (Septakkorde) */
  readonly inversion: number;
}

/** Intervalle eines Akkordtyps vom Grundton aus, z. B. Dur: P1, M3, P5. */
export function chordIntervals(type: ChordType): Interval[] {
  return CHORD_STRUCTURE[type].map((text) => parseInterval(text));
}

/** Akkordtöne des Typs in Terzschichtung: root, third, fifth (, seventh). */
export function chordFactors(type: ChordType): ChordFactor[] {
  return FACTORS.slice(0, CHORD_STRUCTURE[type].length);
}

/**
 * Erzeugt einen geprüften Akkord.
 * Wirft einen RangeError bei ungültiger Umkehrung oder wenn ein Akkordton mehr als zwei Vorzeichen bräuchte
 * (z. B. Ceses-Moll mit Esese).
 */
export function chord(root: NoteName, type: ChordType = 'major', inversion = 0): Chord {
  const size = CHORD_STRUCTURE[type].length;
  if (!Number.isInteger(inversion) || inversion < 0 || inversion >= size) {
    throw new RangeError(`Umkehrung außerhalb von 0…${String(size - 1)}: ${String(inversion)}`);
  }
  const c: Chord = { root: noteName(root.letter, root.alter), type, inversion };
  chordTones(c);
  return c;
}

export function chordEquals(a: Chord, b: Chord): boolean {
  return a.type === b.type && a.inversion === b.inversion && sameNoteName(a.root, b.root);
}

/** Akkordtöne in Terzschichtung ab dem Grundton, unabhängig von der Umkehrung: C-Dur → C, E, G. */
export function chordTones(c: Pick<Chord, 'root' | 'type'>): NoteName[] {
  const root = withOctave(c.root, 4);
  try {
    return chordIntervals(c.type).map((i) => withoutOctave(transposeBy(root, i)));
  } catch {
    throw new RangeError(
      `${formatNoteName(c.root)} ${c.type} ist nicht darstellbar: ein Akkordton bräuchte mehr als zwei Vorzeichen`,
    );
  }
}

/** Basston: Grundton, Terz, Quinte (oder Septime) je nach Umkehrung. */
export function chordBass(c: Chord): NoteName {
  const bass = chordTones(c)[c.inversion];
  if (bass === undefined) {
    throw new RangeError(`Umkehrung ${String(c.inversion)} passt nicht zu ${c.type}`);
  }
  return bass;
}

export interface ChordPitchesOptions {
  /** Oktave des Basstons in wissenschaftlicher Notation. Standard: 4 (c¹). */
  readonly octave?: number;
}

/**
 * Akkord in enger Lage vom Basston aufwärts.
 * C-Dur: C4 E4 G4 · Sextakkord: E4 G4 C5 · Quartsextakkord: G4 C5 E5.
 */
export function chordPitches(c: Chord, options: ChordPitchesOptions = {}): Pitch[] {
  chordTones(c); // verständliche Fehlermeldung, falls nicht darstellbar
  const rootPosition = chordIntervals(c.type).map((i) => transposeBy(withOctave(c.root, 4), i));
  const rotated = [
    ...rootPosition.slice(c.inversion),
    ...rootPosition.slice(0, c.inversion).map((p) => transpose(p, 7, 12)),
  ];
  const shift = (options.octave ?? 4) - (rotated[0]?.octave ?? 4);
  return rotated.map((p) => transpose(p, 7 * shift, 12 * shift));
}

// ---------------------------------------------------------------------------
// Bestimmen

export interface ChordMatch {
  readonly chord: Chord;
  /** Akkordtöne, die in der Eingabe fehlen (nur die Quinte darf fehlen). */
  readonly omitted: readonly ChordFactor[];
}

/**
 * Bestimmt Akkorde aus geschriebenen Tönen in beliebiger Lage und Verdopplung.
 * Der tiefste Ton ist der Bass und entscheidet über die Umkehrung.
 * Die Schreibweise zählt: E–G–C ist ein C-Dur-Sextakkord, E–G–His dagegen kein Dreiklang.
 * Fehlt die Quinte, ist das Ergebnis mehrdeutig (C–E: C-Dur oder C-übermäßig); die Kandidaten sind sortiert,
 * der wahrscheinlichste zuerst. Liefert eine leere Liste, wenn kein Akkord passt.
 */
export function identifyChord(notes: readonly Pitch[]): ChordMatch[] {
  const bass = [...notes].sort(comparePitches)[0];
  if (bass === undefined) {
    return [];
  }
  const names = distinct(notes.map(withoutOctave), sameNoteName);
  return sortMatches(
    names.flatMap((root) =>
      matchRoot(root, names, bass, sameNoteName, 2).map(({ match }) => match),
    ),
  );
}

export interface MidiChordMatch extends ChordMatch {
  /** Die Eingabe, passend zum Akkord geschrieben (in derselben Reihenfolge). */
  readonly pitches: readonly Pitch[];
}

export interface IdentifyMidiOptions {
  /** Höchstzahl an Vorzeichen je Akkordton (0–2). Standard: 1, also kein Doppelkreuz und kein Doppel-b. */
  readonly maxAccidentals?: number;
}

/**
 * Bestimmt Akkorde aus MIDI-Nummern, also ohne Schreibweise (z. B. Eingabe über eine Klaviatur).
 * Jede passende Schreibweise ist ein eigener Kandidat: C–E–Gis klingt wie As-übermäßig und E-übermäßig.
 * Sortiert nach fehlenden Tönen, dann nach der Zahl der Vorzeichen, dann nach Akkordtyp und Umkehrung.
 */
export function identifyChordFromMidi(
  midiNumbers: readonly number[],
  options: IdentifyMidiOptions = {},
): MidiChordMatch[] {
  const invalid = midiNumbers.find((m) => !Number.isInteger(m));
  if (invalid !== undefined) {
    throw new RangeError(`MIDI-Nummer muss ganzzahlig sein: ${String(invalid)}`);
  }
  if (midiNumbers.length === 0) {
    return [];
  }
  const lowest = Math.min(...midiNumbers);
  const maxAccidentals = Math.min(options.maxAccidentals ?? 1, 2);
  const alters = [-2, -1, 0, 1, 2].filter((a) => Math.abs(a) <= maxAccidentals);
  const classes = distinct(midiNumbers.map(pitchClass), (a, b) => a === b);
  const sameClass = (tone: NoteName, pc: number): boolean => chroma(withOctave(tone, 4)) === pc;
  const roots = LETTERS.flatMap((letter) => alters.map((alter) => noteName(letter, alter))).filter(
    (n) => classes.some((pc) => sameClass(n, pc)),
  );
  const matches = roots.flatMap((root) =>
    matchRoot(root, classes, pitchClass(lowest), sameClass, maxAccidentals).map(
      ({ match, tones }) => ({
        ...match,
        pitches: midiNumbers.map((m) => {
          const tone = tones.find((t) => sameClass(t, pitchClass(m)));
          if (tone === undefined) {
            throw new RangeError(`MIDI ${String(m)} gehört nicht zum Akkord`);
          }
          return spellMidi(m, tone);
        }),
      }),
    ),
  );
  return sortMatches(matches);
}

/** Prüft alle Akkordtypen auf einem Grundton gegen die Eingabe. */
function matchRoot<T>(
  root: NoteName,
  inputs: readonly T[],
  bass: T,
  matches: (tone: NoteName, input: T) => boolean,
  maxAccidentals: number,
): { match: ChordMatch; tones: NoteName[] }[] {
  const result: { match: ChordMatch; tones: NoteName[] }[] = [];
  for (const type of CHORD_TYPES) {
    const tones = tryChordTones(root, type);
    if (!tones || tones.some((t) => Math.abs(t.alter) > maxAccidentals)) {
      continue;
    }
    // Jeder Eingabeton muss ein Akkordton sein.
    if (!inputs.every((input) => tones.some((t) => matches(t, input)))) {
      continue;
    }
    const factors = chordFactors(type);
    // Fehlen darf nur, was optional ist (die Quinte); Grundton und Terz müssen vorkommen.
    const omitted = factors.filter(
      (_, i) => !inputs.some((input) => matches(tones[i] ?? root, input)),
    );
    if (!omitted.every((f) => OPTIONAL_FACTORS.includes(f))) {
      continue;
    }
    const inversion = tones.findIndex((t) => matches(t, bass));
    result.push({ match: { chord: { root, type, inversion }, omitted }, tones });
  }
  return result;
}

function tryChordTones(root: NoteName, type: ChordType): NoteName[] | undefined {
  try {
    return chordTones({ root, type });
  } catch {
    return undefined;
  }
}

function sortMatches<T extends ChordMatch>(matches: T[]): T[] {
  // Nur vorhandene Töne zählen: Bei fehlender Quinte darf deren Schreibweise nicht entscheiden.
  const factors = (m: ChordMatch): ChordFactor[] => chordFactors(m.chord.type);
  const accidentals = (m: ChordMatch): number =>
    chordTones(m.chord)
      .filter((_, i) => !m.omitted.includes(factors(m)[i] ?? 'root'))
      .reduce((sum, t) => sum + Math.abs(t.alter), 0);
  return matches.sort(
    (a, b) =>
      a.omitted.length - b.omitted.length ||
      accidentals(a) - accidentals(b) ||
      CHORD_TYPES.indexOf(a.chord.type) - CHORD_TYPES.indexOf(b.chord.type) ||
      a.chord.inversion - b.chord.inversion ||
      LETTERS.indexOf(a.chord.root.letter) - LETTERS.indexOf(b.chord.root.letter),
  );
}

function distinct<T>(values: readonly T[], same: (a: T, b: T) => boolean): T[] {
  return values.filter((v, i) => values.findIndex((w) => same(v, w)) === i);
}

function pitchClass(midiNumber: number): number {
  return ((midiNumber % 12) + 12) % 12;
}

function withoutOctave(p: NoteName): NoteName {
  return { letter: p.letter, alter: p.alter };
}
