// Intervalle aus Stammtonabstand UND Halbtonabstand (nie nur aus Halbtönen).
// Beispiel: C–E = große Terz, C–Fes = verminderte Quarte – gleicher Klang, verschiedene Intervalle.

import type { Pitch } from './pitch.ts';
import { diatonicIndex, midi, transpose } from './pitch.ts';

/** dd = doppelt vermindert, d = vermindert, m = klein, M = groß, P = rein, A = übermäßig, AA = doppelt übermäßig */
export type Quality = 'dd' | 'd' | 'm' | 'M' | 'P' | 'A' | 'AA';

export interface Interval {
  /** Generische Größe: 1 = Prime, 2 = Sekunde, … 8 = Oktave, 9 = None, … */
  readonly number: number;
  readonly quality: Quality;
  /** 1 = aufwärts, -1 = abwärts */
  readonly direction: 1 | -1;
}

/** Halbtöne der reinen bzw. großen einfachen Intervalle (Prime bis Septime). */
const BASE_SEMITONES = [0, 2, 4, 5, 7, 9, 11] as const;

const PERFECT_QUALITIES: readonly Quality[] = ['dd', 'd', 'P', 'A', 'AA'];
const IMPERFECT_QUALITIES: readonly Quality[] = ['dd', 'd', 'm', 'M', 'A', 'AA'];

/** Prime, Quarte, Quinte (und ihre Oktavierungen) sind „rein“, alle anderen „groß/klein“. */
export function isPerfectClass(intervalNumber: number): boolean {
  const simple = (intervalNumber - 1) % 7;
  return simple === 0 || simple === 3 || simple === 4;
}

export function isValidInterval(intervalNumber: number, quality: Quality): boolean {
  if (!Number.isInteger(intervalNumber) || intervalNumber < 1) {
    return false;
  }
  // Keine verminderte Prime: derselbe Fall heißt „übermäßige Prime abwärts“.
  if (intervalNumber === 1 && (quality === 'd' || quality === 'dd')) {
    return false;
  }
  return (isPerfectClass(intervalNumber) ? PERFECT_QUALITIES : IMPERFECT_QUALITIES).includes(
    quality,
  );
}

/** Erzeugt ein geprüftes Intervall. Wirft einen RangeError bei ungültiger Kombination (z. B. „große Quinte“). */
export function interval(
  intervalNumber: number,
  quality: Quality,
  direction: 1 | -1 = 1,
): Interval {
  if (!isValidInterval(intervalNumber, quality)) {
    throw new RangeError(`Ungültiges Intervall: ${quality}${String(intervalNumber)}`);
  }
  // Eine Prime hat keine Richtung, solange sie rein ist.
  const normalizedDirection = intervalNumber === 1 && quality === 'P' ? 1 : direction;
  return { number: intervalNumber, quality, direction: normalizedDirection };
}

/** Halbtöne mit Vorzeichen (abwärts negativ). */
export function semitones(i: Interval): number {
  const steps = i.number - 1;
  const base = (BASE_SEMITONES[steps % 7] ?? 0) + 12 * Math.floor(steps / 7);
  return withoutNegativeZero(i.direction * (base + qualityOffset(i)));
}

/** Diatonische Schritte mit Vorzeichen (große Terz aufwärts = 2, abwärts = -2). */
export function diatonicSteps(i: Interval): number {
  return withoutNegativeZero(i.direction * (i.number - 1));
}

/**
 * Bestimmt das Intervall von `from` nach `to`.
 * Die Richtung folgt dem Stammtonabstand; bei gleichem Stammton dem Klang (C → Ces = übermäßige Prime abwärts).
 * Wirft einen RangeError, wenn das Ergebnis mehr als doppelt übermäßig oder vermindert wäre.
 */
export function intervalBetween(from: Pitch, to: Pitch): Interval {
  const steps = diatonicIndex(to) - diatonicIndex(from);
  const halfSteps = midi(to) - midi(from);
  const direction: 1 | -1 = steps > 0 || (steps === 0 && halfSteps >= 0) ? 1 : -1;
  const absSteps = Math.abs(steps);
  const normalizedHalfSteps = halfSteps * direction;
  const expected = (BASE_SEMITONES[absSteps % 7] ?? 0) + 12 * Math.floor(absSteps / 7);
  const quality = qualityFromOffset(absSteps + 1, normalizedHalfSteps - expected);
  return interval(absSteps + 1, quality, direction);
}

/** Bildet ein Intervall von einem Ton aus (aufwärts oder abwärts, je nach Richtung des Intervalls). */
export function transposeBy(p: Pitch, i: Interval): Pitch {
  return transpose(p, diatonicSteps(i), semitones(i));
}

/** Zusammengesetzte Intervalle auf den einfachen Anteil zurückführen: None → Sekunde, Doppeloktave → Oktave. */
export function simplify(i: Interval): Interval {
  if (i.number <= 8) {
    return i;
  }
  return interval(((i.number - 2) % 7) + 2, i.quality, i.direction);
}

const INVERTED_QUALITY: Readonly<Record<Quality, Quality>> = {
  dd: 'AA',
  d: 'A',
  m: 'M',
  M: 'm',
  P: 'P',
  A: 'd',
  AA: 'dd',
};

/**
 * Umkehrung eines Intervalls (Prime ↔ Oktave, Terz ↔ Sexte, groß ↔ klein, übermäßig ↔ vermindert).
 * Zusammengesetzte Intervalle werden vorher vereinfacht (None → Sekunde → Septime).
 * Wirft einen RangeError, wenn die Umkehrung nicht existiert (übermäßige Oktave → verminderte Prime).
 */
export function invert(i: Interval): Interval {
  const simple = simplify(i);
  return interval(9 - simple.number, INVERTED_QUALITY[simple.quality], simple.direction);
}

// ---------------------------------------------------------------------------
// Kurzschreibweise: „M3“, „P5“, „d4“, „AA6“, „m9“, „-m3“ (abwärts)

const INTERVAL_PATTERN = /^(-?)(dd|d|m|M|P|A|AA)(\d+)$/;

export function parseInterval(text: string): Interval {
  const match = INTERVAL_PATTERN.exec(text.trim());
  if (!match) {
    throw new SyntaxError(`Keine gültige Intervall-Kurzschreibweise: „${text}“`);
  }
  const [, sign = '', quality = '', digits = ''] = match;
  return interval(Number.parseInt(digits, 10), quality as Quality, sign === '-' ? -1 : 1);
}

export function formatInterval(i: Interval): string {
  return `${i.direction < 0 ? '-' : ''}${i.quality}${String(i.number)}`;
}

export function intervalEquals(a: Interval, b: Interval): boolean {
  return a.number === b.number && a.quality === b.quality && a.direction === b.direction;
}

// ---------------------------------------------------------------------------

function qualityOffset(i: Interval): number {
  const perfect = isPerfectClass(i.number);
  switch (i.quality) {
    case 'P':
    case 'M':
      return 0;
    case 'm':
      return -1;
    case 'A':
      return 1;
    case 'AA':
      return 2;
    case 'd':
      return perfect ? -1 : -2;
    case 'dd':
      return perfect ? -2 : -3;
  }
}

function qualityFromOffset(intervalNumber: number, offset: number): Quality {
  const perfect = isPerfectClass(intervalNumber);
  const table: Readonly<Record<number, Quality>> = perfect
    ? { [-2]: 'dd', [-1]: 'd', 0: 'P', 1: 'A', 2: 'AA' }
    : { [-3]: 'dd', [-2]: 'd', [-1]: 'm', 0: 'M', 1: 'A', 2: 'AA' };
  const quality = table[offset];
  if (quality === undefined) {
    throw new RangeError(
      `Intervall mehr als doppelt übermäßig oder vermindert (Größe ${String(intervalNumber)}, Abweichung ${String(offset)})`,
    );
  }
  return quality;
}

/** Abwärts gerichtete Primen und verminderte Sekunden ergäben sonst -0. */
function withoutNegativeZero(value: number): number {
  return value === 0 ? 0 : value;
}
