// Dur- und Molltonarten: Vorzeichnung, Quintenzirkel, Parallel- und Varianttonart, leitereigene Dreiklänge.
//
// Achtung, falsche Freunde: Die deutsche „Paralleltonart“ (C-Dur ↔ a-Moll) heißt englisch „relative key“,
// die deutsche „Varianttonart“ (C-Dur ↔ c-Moll) heißt englisch „parallel key“.

import { intervalBetween } from './interval.ts';
import { germanName, internationalName } from './naming.ts';
import type { AccidentalStyle, Letter, NoteName, Pitch } from './pitch.ts';
import { formatNoteName, noteName, transpose, withOctave } from './pitch.ts';
import type { ScaleType } from './scale.ts';
import { buildScale } from './scale.ts';

export type Mode = 'major' | 'minor';

export interface Key {
  readonly tonic: NoteName;
  readonly mode: Mode;
}

/** Gebräuchliche Tonarten haben höchstens sieben Vorzeichen; darüber beginnen theoretische Tonarten wie Gis-Dur. */
export const MAX_KEY_ACCIDENTALS = 7;

/** Lage der Stammtöne auf der Quintenreihe, C = 0. */
const LETTER_FIFTHS: Readonly<Record<Letter, number>> = {
  F: -1,
  C: 0,
  G: 1,
  D: 2,
  A: 3,
  E: 4,
  B: 5,
};

/** Stammtöne in Quintenfolge, beginnend bei F (Quintenreihe −1). */
const LETTERS_BY_FIFTHS: readonly Letter[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];

/** Eine Molltonart liegt drei Quinten über ihrer Paralleltonart in Dur (a = 3, C = 0). */
const MINOR_OFFSET = 3;

/** Reihenfolge der Kreuze: Fis, Cis, Gis, Dis, Ais, Eis, His. */
export const SHARP_ORDER: readonly NoteName[] = LETTERS_BY_FIFTHS.map((l) => noteName(l, 1));

/** Reihenfolge der b: B, Es, As, Des, Ges, Ces, Fes. */
export const FLAT_ORDER: readonly NoteName[] = [...LETTERS_BY_FIFTHS]
  .reverse()
  .map((l) => noteName(l, -1));

/** Lage eines Tons auf der Quintenreihe: C = 0, G = 1, F = −1, Fis = 6, Ces = −7. */
export function fifthsFromC(n: NoteName): number {
  return LETTER_FIFTHS[n.letter] + 7 * n.alter;
}

/** Ton an einer Stelle der Quintenreihe (Umkehrung von `fifthsFromC`). */
function noteAtFifths(fifths: number): NoteName {
  const index = fifths + 1; // F liegt bei −1
  const letter = LETTERS_BY_FIFTHS[mod(index, 7)];
  if (letter === undefined) {
    throw new RangeError(`Ungültige Quintenposition: ${String(fifths)}`);
  }
  return noteName(letter, Math.floor(index / 7));
}

/**
 * Vorzeichenzahl einer Tonart: positiv = Kreuze, negativ = b (D-Dur = 2, Es-Dur = −3, a-Moll = 0).
 * Entspricht der Position auf dem Quintenzirkel.
 */
export function keyFifths(k: Key): number {
  return fifthsFromC(k.tonic) - (k.mode === 'minor' ? MINOR_OFFSET : 0);
}

/** Erzeugt eine geprüfte Tonart. Wirft einen RangeError bei mehr als sieben Vorzeichen (theoretische Tonart). */
export function key(tonic: NoteName, mode: Mode = 'major'): Key {
  const k: Key = { tonic: noteName(tonic.letter, tonic.alter), mode };
  checkedFifths(k);
  return k;
}

/** Tonart aus ihrer Vorzeichenzahl (positiv = Kreuze, negativ = b), z. B. (−3, Moll) → c-Moll. */
export function keyFromFifths(fifths: number, mode: Mode = 'major'): Key {
  if (!Number.isInteger(fifths) || Math.abs(fifths) > MAX_KEY_ACCIDENTALS) {
    throw new RangeError(
      `Vorzeichenzahl außerhalb von −${String(MAX_KEY_ACCIDENTALS)}…${String(MAX_KEY_ACCIDENTALS)}: ${String(fifths)}`,
    );
  }
  return { tonic: noteAtFifths(fifths + (mode === 'minor' ? MINOR_OFFSET : 0)), mode };
}

export function keyEquals(a: Key, b: Key): boolean {
  return a.mode === b.mode && a.tonic.letter === b.tonic.letter && a.tonic.alter === b.tonic.alter;
}

/** Vorzeichnung in Notationsreihenfolge, z. B. D-Dur → [Fis, Cis], f-Moll → [B, Es, As, Des]. */
export function keySignature(k: Key): NoteName[] {
  const fifths = checkedFifths(k);
  return fifths >= 0 ? SHARP_ORDER.slice(0, fifths) : FLAT_ORDER.slice(0, -fifths);
}

/** Vorzeichen, das die Vorzeichnung einem Stammton gibt (A-Dur: F → +1, D → 0). */
export function signatureAlter(k: Key, letter: Letter): number {
  return keySignature(k).find((n) => n.letter === letter)?.alter ?? 0;
}

/** Alle 15 Tonarten eines Tongeschlechts von sieben b bis sieben Kreuzen. */
export function keysByFifths(mode: Mode = 'major'): Key[] {
  const keys: Key[] = [];
  for (let fifths = -MAX_KEY_ACCIDENTALS; fifths <= MAX_KEY_ACCIDENTALS; fifths++) {
    keys.push(keyFromFifths(fifths, mode));
  }
  return keys;
}

/** Alle 30 Dur- und Molltonarten bis sieben Vorzeichen (erst Dur, dann Moll, jeweils von sieben b bis sieben Kreuzen). */
export const ALL_KEYS: readonly Key[] = [...keysByFifths('major'), ...keysByFifths('minor')];

/**
 * Quintenzirkel mit zwölf Positionen im Uhrzeigersinn: Index 0 = C-Dur bzw. a-Moll, 1 = G-Dur bzw. e-Moll … 11 = F-Dur bzw. d-Moll.
 * Enharmonisch gleiche Tonarten teilen sich eine Position (H/Ces, Fis/Ges, Cis/Des);
 * die Tonart mit weniger Vorzeichen steht zuerst, bei Gleichstand die Kreuz-Tonart.
 */
export function circleOfFifths(mode: Mode = 'major'): Key[][] {
  const positions: Key[][] = Array.from({ length: 12 }, () => []);
  for (const k of keysByFifths(mode)) {
    positions[mod(keyFifths(k), 12)]?.push(k);
  }
  for (const keys of positions) {
    keys.sort(
      (a, b) => Math.abs(keyFifths(a)) - Math.abs(keyFifths(b)) || keyFifths(b) - keyFifths(a),
    );
  }
  return positions;
}

/** Paralleltonart (engl. relative key): gleiche Vorzeichnung, anderes Tongeschlecht. C-Dur ↔ a-Moll. */
export function relativeKey(k: Key): Key {
  return keyFromFifths(checkedFifths(k), otherMode(k.mode));
}

/**
 * Varianttonart (engl. parallel key): gleicher Grundton, anderes Tongeschlecht. C-Dur ↔ c-Moll.
 * Wirft einen RangeError, wenn die Varianttonart theoretisch wäre (Ces-Dur → ces-Moll mit zehn b).
 */
export function parallelKey(k: Key): Key {
  return key(k.tonic, otherMode(k.mode));
}

export type MinorForm = 'natural' | 'harmonic' | 'melodic';

const MINOR_SCALES: Readonly<Record<MinorForm, ScaleType>> = {
  natural: 'naturalMinor',
  harmonic: 'harmonicMinor',
  melodic: 'melodicMinor',
};

export interface KeyScaleOptions {
  /** Nur für Moll: natürlich (Standard), harmonisch oder melodisch (aufwärts). */
  readonly minorForm?: MinorForm;
  /** Oktave des Grundtons in wissenschaftlicher Notation. Standard: 4 (c¹). */
  readonly octave?: number;
}

/** Tonleiter einer Tonart aufwärts, z. B. e-Moll harmonisch: E, Fis, G, A, H, C, Dis. */
export function keyScale(k: Key, options: KeyScaleOptions = {}): Pitch[] {
  checkedFifths(k);
  const type = k.mode === 'major' ? 'major' : MINOR_SCALES[options.minorForm ?? 'natural'];
  return buildScale(withOctave(k.tonic, options.octave ?? 4), type);
}

export type TriadQuality = 'major' | 'minor' | 'diminished' | 'augmented';

export interface DiatonicTriad {
  /** Stufe 1–7 */
  readonly degree: number;
  readonly quality: TriadQuality;
  /** Grundton, Terz und Quinte */
  readonly notes: readonly [NoteName, NoteName, NoteName];
}

/** Terz- und Quintqualität → Dreiklangsart. */
const TRIAD_QUALITIES: Readonly<Record<string, TriadQuality>> = {
  MP: 'major',
  mP: 'minor',
  md: 'diminished',
  MA: 'augmented',
};

/**
 * Leitereigene Dreiklänge auf den sieben Stufen, aus Terzen der Tonleiter geschichtet.
 * C-Dur: C, d, e, F, G, a, h° · a-Moll harmonisch: a, h°, C+, d, E, F, gis°.
 */
export function diatonicTriads(
  k: Key,
  options: Pick<KeyScaleOptions, 'minorForm'> = {},
): DiatonicTriad[] {
  const scale = keyScale(k, options);
  const twoOctaves = [...scale, ...scale.map((p) => transpose(p, 7, 12))];
  return scale.map((root, index) => {
    const third = twoOctaves[index + 2] ?? root;
    const fifth = twoOctaves[index + 4] ?? root;
    const thirdQuality = intervalBetween(root, third).quality;
    const fifthQuality = intervalBetween(root, fifth).quality;
    const quality = TRIAD_QUALITIES[thirdQuality + fifthQuality];
    if (quality === undefined) {
      throw new RangeError(
        `Kein Dreiklang aus ${thirdQuality}3 und ${fifthQuality}5 auf Stufe ${String(index + 1)}`,
      );
    }
    return {
      degree: index + 1,
      quality,
      notes: [withoutOctave(root), withoutOctave(third), withoutOctave(fifth)],
    };
  });
}

export interface KeyNameOptions {
  readonly language?: 'de' | 'en';
  /** Nur für Englisch: Unicode-Zeichen (♯ ♭) oder ASCII (# b). */
  readonly accidentals?: AccidentalStyle;
}

/**
 * Name einer Tonart. Deutsch: Dur mit großem, Moll mit kleinem Grundton („Fis-Dur“, „es-Moll“, „h-Moll“).
 * Englisch: „F♯ major“, „E♭ minor“, „B minor“.
 */
export function keyName(k: Key, options: KeyNameOptions = {}): string {
  if (options.language === 'en') {
    return `${internationalName(k.tonic.letter, k.tonic.alter, options.accidentals ?? 'unicode')} ${k.mode}`;
  }
  const tonic = germanName(k.tonic.letter, k.tonic.alter);
  return k.mode === 'major' ? `${tonic}-Dur` : `${tonic.toLowerCase()}-Moll`;
}

// ---------------------------------------------------------------------------

function checkedFifths(k: Key): number {
  const fifths = keyFifths(k);
  if (Math.abs(fifths) > MAX_KEY_ACCIDENTALS) {
    throw new RangeError(
      `${keyName(k)} (${formatNoteName(k.tonic)} ${k.mode}) ist eine theoretische Tonart mit ${String(Math.abs(fifths))} Vorzeichen`,
    );
  }
  return fifths;
}

function otherMode(mode: Mode): Mode {
  return mode === 'major' ? 'minor' : 'major';
}

function withoutOctave(p: NoteName): NoteName {
  return { letter: p.letter, alter: p.alter };
}

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
