// Rhythmus: Notenwerte, Punktierungen, N-tolen, Taktarten, Taktfüllung, Umrechnung in Sekunden.
// Alle Dauern sind exakte Brüche der ganzen Note (Viertel = 1/4, punktierte Achtel = 3/16, Triolenachtel = 1/12).

import type { Fraction } from './fraction.ts';
import {
  compareFractions,
  divideFractions,
  fraction,
  fractionToNumber,
  multiplyFractions,
  subtractFractions,
  sumFractions,
} from './fraction.ts';

/** Grundnotenwerte von der doppelganzen Note (Brevis) bis zur Vierundsechzigstel. */
export type NoteValue =
  'breve' | 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | 'thirtySecond' | 'sixtyFourth';

export const NOTE_VALUES: readonly NoteValue[] = [
  'breve',
  'whole',
  'half',
  'quarter',
  'eighth',
  'sixteenth',
  'thirtySecond',
  'sixtyFourth',
];

const BASE_VALUES: Readonly<Record<NoteValue, Fraction>> = {
  breve: fraction(2),
  whole: fraction(1),
  half: fraction(1, 2),
  quarter: fraction(1, 4),
  eighth: fraction(1, 8),
  sixteenth: fraction(1, 16),
  thirtySecond: fraction(1, 32),
  sixtyFourth: fraction(1, 64),
};

/** N-tole: `actual` Noten in der Zeit von `normal` Noten. Triole = 3 : 2, Quintole = 5 : 4, Duole = 2 : 3. */
export interface Tuplet {
  readonly actual: number;
  readonly normal: number;
}

export const TRIPLET: Tuplet = { actual: 3, normal: 2 };

export const MAX_DOTS = 3;

export interface Duration {
  readonly value: NoteValue;
  /** Punkte 0–3: jeder Punkt verlängert um die Hälfte des vorherigen Zuwachses. */
  readonly dots: number;
  readonly tuplet?: Tuplet;
}

/** Erzeugt eine geprüfte Dauer. Wirft einen RangeError bei mehr als drei Punkten oder ungültiger N-tole. */
export function duration(value: NoteValue, dots = 0, tuplet?: Tuplet): Duration {
  if (!NOTE_VALUES.includes(value)) {
    throw new RangeError(`Unbekannter Notenwert: ${value}`);
  }
  if (!Number.isInteger(dots) || dots < 0 || dots > MAX_DOTS) {
    throw new RangeError(`Punkte außerhalb von 0…${String(MAX_DOTS)}: ${String(dots)}`);
  }
  if (tuplet === undefined) {
    return { value, dots };
  }
  const valid = (n: number): boolean => Number.isInteger(n) && n >= 1;
  if (!valid(tuplet.actual) || !valid(tuplet.normal) || tuplet.actual === tuplet.normal) {
    throw new RangeError(`Ungültige N-tole: ${String(tuplet.actual)}:${String(tuplet.normal)}`);
  }
  return { value, dots, tuplet: { actual: tuplet.actual, normal: tuplet.normal } };
}

/**
 * Dauer als Bruch der ganzen Note.
 * Punktierung: Wert · (2 − 1/2^Punkte), also 1,5 / 1,75 / 1,875. N-tole: Wert · normal/actual.
 */
export function durationValue(d: Duration): Fraction {
  const dotted = multiplyFractions(
    BASE_VALUES[d.value],
    fraction(2 ** (d.dots + 1) - 1, 2 ** d.dots),
  );
  return d.tuplet ? multiplyFractions(dotted, fraction(d.tuplet.normal, d.tuplet.actual)) : dotted;
}

export function totalDuration(durations: readonly Duration[]): Fraction {
  return sumFractions(durations.map(durationValue));
}

// ---------------------------------------------------------------------------
// Taktarten

export interface TimeSignature {
  readonly numerator: number;
  /** Notenwert der Zählzeit als Zahl: 2 = Halbe, 4 = Viertel, 8 = Achtel … */
  readonly denominator: number;
  /** Gruppierung in Einheiten des Nenners, Summe = Zähler: 6/8 = [3, 3], 7/8 = [2, 2, 3], 4/4 = [1, 1, 1, 1]. */
  readonly grouping: readonly number[];
}

const DENOMINATORS = [1, 2, 4, 8, 16, 32, 64];

/**
 * Erzeugt eine geprüfte Taktart. Ohne Gruppierung gilt:
 * - Zähler 6, 9, 12: Dreiergruppen (6/8 = 3+3)
 * - Zähler 1–4 und alle Taktarten mit Halben oder Vierteln als Nenner: jede Zählzeit einzeln (5/4 = 1+1+1+1+1)
 * - 5 und 7 mit Achteln oder kleiner: 5/8 = 2+3, 7/8 = 2+2+3
 * - sonst (z. B. 8/8, 11/8) ist die Gruppierung Pflicht, weil die Praxis keinen einheitlichen Standard hat.
 */
export function timeSignature(
  numerator: number,
  denominator: number,
  grouping?: readonly number[],
): TimeSignature {
  if (!Number.isInteger(numerator) || numerator < 1) {
    throw new RangeError(`Ungültiger Zähler: ${String(numerator)}`);
  }
  if (!DENOMINATORS.includes(denominator)) {
    throw new RangeError(`Nenner muss eine Zweierpotenz von 1 bis 64 sein: ${String(denominator)}`);
  }
  const groups = grouping ?? defaultGrouping(numerator, denominator);
  if (
    groups.length === 0 ||
    groups.some((g) => !Number.isInteger(g) || g < 1) ||
    groups.reduce((sum, g) => sum + g, 0) !== numerator
  ) {
    throw new RangeError(
      `Gruppierung ${groups.join('+')} passt nicht zum Zähler ${String(numerator)}`,
    );
  }
  return { numerator, denominator, grouping: [...groups] };
}

function defaultGrouping(numerator: number, denominator: number): number[] {
  if (numerator === 6 || numerator === 9 || numerator === 12) {
    return Array.from({ length: numerator / 3 }, () => 3);
  }
  if (numerator <= 4 || denominator <= 4) {
    return Array.from({ length: numerator }, () => 1);
  }
  if (numerator === 5) {
    return [2, 3];
  }
  if (numerator === 7) {
    return [2, 2, 3];
  }
  throw new RangeError(
    `Für ${String(numerator)}/${String(denominator)} gibt es keine Standardgruppierung – bitte angeben (z. B. 3+3+2)`,
  );
}

/** Liest „4/4“, „6/8“ oder „3+2+2/8“. */
export function parseTimeSignature(text: string): TimeSignature {
  const match = /^\s*(\d+(?:\+\d+)*)\s*\/\s*(\d+)\s*$/.exec(text);
  if (!match) {
    throw new SyntaxError(`Keine gültige Taktart: „${text}“`);
  }
  const [, top = '', bottom = ''] = match;
  const parts = top.split('+').map((part) => Number.parseInt(part, 10));
  const numerator = parts.reduce((sum, part) => sum + part, 0);
  return timeSignature(
    numerator,
    Number.parseInt(bottom, 10),
    parts.length > 1 ? parts : undefined,
  );
}

/** „6/8“, mit abweichender Gruppierung „3+2+2/8“. */
export function formatTimeSignature(
  ts: TimeSignature,
  options: { grouping?: boolean } = {},
): string {
  const top = options.grouping ? ts.grouping.join('+') : String(ts.numerator);
  return `${top}/${String(ts.denominator)}`;
}

/** Länge eines vollen Takts, z. B. 6/8 → 3/4 der ganzen Note. */
export function measureLength(ts: TimeSignature): Fraction {
  return fraction(ts.numerator, ts.denominator);
}

/**
 * Zählzeiten (Schläge) als Dauern: 4/4 → vier Viertel, 6/8 → zwei punktierte Viertel, 7/8 (2+2+3) → 1/4, 1/4, 3/8.
 * Bei Einzelzählzeiten (Gruppen der Größe 1) ist jede Einheit des Nenners ein Schlag.
 */
export function beats(ts: TimeSignature): Fraction[] {
  return ts.grouping.map((g) => fraction(g, ts.denominator));
}

/**
 * Taktart nach der Teilung der Zählzeit, wie in englischsprachigen Lehrbüchern:
 * - `simple`: 2, 3 oder 4 Zählzeiten, jede zweigeteilt (2/4, 3/4, 4/4, 2/2, 3/8)
 * - `compound`: 2, 3 oder 4 Zählzeiten, jede dreigeteilt (6/8, 9/8, 12/8, 6/4)
 * - `irregular`: alles andere, z. B. ungleiche Gruppen (5/8 = 2+3, 7/8) oder 5/4
 * Achtung: Die deutsche Musiklehre nennt „zusammengesetzt“ auch Takte aus mehreren einfachen (4/4 = 2+2).
 * Diese Einteilung entspricht deshalb nicht „einfacher/zusammengesetzter Takt“.
 */
export function meterType(ts: TimeSignature): 'simple' | 'compound' | 'irregular' {
  const [first] = ts.grouping;
  const uniform = ts.grouping.every((g) => g === first);
  const count = ts.grouping.length;
  if (!uniform || first === undefined || count < 2 || count > 4) {
    return 'irregular';
  }
  if (first === 3) {
    return 'compound';
  }
  return first <= 2 ? 'simple' : 'irregular';
}

export type MeasureStatus = 'complete' | 'incomplete' | 'overfull';

export interface MeasureCheck {
  readonly status: MeasureStatus;
  /** Fehlende Dauer (`incomplete`) bzw. Überschuss (`overfull`); bei `complete` null. */
  readonly difference: Fraction;
}

/** Prüft, ob die Dauern einen Takt genau füllen (Noten und Pausen zählen gleich). */
export function checkMeasure(durations: readonly Duration[], ts: TimeSignature): MeasureCheck {
  const difference = subtractFractions(measureLength(ts), totalDuration(durations));
  const sign = Math.sign(compareFractions(difference, fraction(0)));
  if (sign === 0) {
    return { status: 'complete', difference };
  }
  return sign > 0
    ? { status: 'incomplete', difference }
    : { status: 'overfull', difference: fraction(-difference.num, difference.den) };
}

// ---------------------------------------------------------------------------
// Tempo

export interface Tempo {
  /** Schläge pro Minute */
  readonly bpm: number;
  /** Notenwert eines Schlags, Standard: Viertel. Im 6/8-Takt oft die punktierte Viertel. */
  readonly beat?: Duration;
}

const QUARTER: Duration = { value: 'quarter', dots: 0 };

/** Dauer in Sekunden, z. B. Viertel bei ♩ = 120 → 0,5 s. */
export function durationSeconds(d: Duration | Fraction, tempo: Tempo): number {
  if (!Number.isFinite(tempo.bpm) || tempo.bpm <= 0) {
    throw new RangeError(`Tempo muss positiv sein: ${String(tempo.bpm)}`);
  }
  const value = 'value' in d ? durationValue(d) : d;
  const beatsCount = divideFractions(value, durationValue(tempo.beat ?? QUARTER));
  return (fractionToNumber(beatsCount) * 60) / tempo.bpm;
}
