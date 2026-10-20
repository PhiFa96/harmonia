// Harmonische Grundanalyse auf buchstabierten Akkorden. Strukturierte Befunde
// erlauben eine spätere Neufassung der vorläufigen Symbole nach F03.

import { chord, chordTones } from './chord.ts';
import type { Chord, ChordType } from './chord.ts';
import { diatonicTriads, keyScale } from './key.ts';
import type { Key, KeyScaleOptions } from './key.ts';
import { sameNoteName, transpose, withOctave } from './pitch.ts';
import type { NoteName, Pitch } from './pitch.ts';

function at<T>(values: readonly T[], index: number): T {
  const value = values[index];
  if (value === undefined) throw new RangeError(`Fehlender Ton auf Index ${String(index)}`);
  return value;
}

export interface DegreeChord {
  readonly degree: number;
  readonly chord: Chord;
  readonly notes: readonly NoteName[];
}

/** Diatonische Vierklänge aus der angegebenen Dur- oder Mollform. */
export function diatonicSevenths(
  tonalKey: Key,
  options: Pick<KeyScaleOptions, 'minorForm'> = {},
): DegreeChord[] {
  const scale = keyScale(tonalKey, options);
  const extended = [...scale, ...scale.map((p) => transpose(p, 7, 12))];
  return scale.map((_, index) => {
    const pitches = [0, 2, 4, 6].map((step) => extended[index + step]);
    if (pitches.some((p) => p === undefined)) throw new RangeError('Unvollständige Tonleiter');
    const actual = pitches as Pitch[];
    const types: ChordType[] = [
      'dominant7',
      'major7',
      'minor7',
      'minorMajor7',
      'halfDiminished7',
      'diminished7',
      'augmented7',
      'augmentedMajor7',
    ];
    const found = types.find((type) => {
      try {
        const tones = chordTones({ root: at(actual, 0), type });
        return tones.every((tone, i) => sameNoteName(tone, at(actual, i)));
      } catch {
        return false;
      }
    });
    if (!found)
      throw new RangeError(`Kein unterstützter Septakkord auf Stufe ${String(index + 1)}`);
    return {
      degree: index + 1,
      chord: chord(at(actual, 0), found),
      notes: actual.map(({ letter, alter }) => ({ letter, alter })),
    };
  });
}

export type HarmonicRole =
  'tonic' | 'subdominant' | 'dominant' | 'secondary-dominant' | 'neapolitan';
export interface HarmonyAnalysis {
  readonly chord: Chord;
  readonly degree: number;
  readonly role: HarmonicRole;
  /** Zielstufe einer Zwischendominante; sonst nicht gesetzt. */
  readonly targetDegree?: number;
  readonly roman: string;
  /** Vorläufiges deutsches Funktionskürzel, unabhängig vom internen Befund. */
  readonly functionSymbol: string;
}

const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;
const MAJOR_FUNCTIONS = ['T', 'Sp', 'Tg', 'S', 'D', 'Tp', 'D'] as const;
const MINOR_FUNCTIONS = ['t', 's', 'tP', 's', 'D', 'sP', 'd'] as const;

function romanFor(degree: number, type: ChordType): string {
  const upper = ROMANS[degree - 1] ?? '?';
  const lower =
    type === 'minor' || type === 'minor7' || type === 'minor9' || type === 'minorMajor7';
  const diminished = type === 'diminished' || type === 'diminished7' || type === 'halfDiminished7';
  const base = lower || diminished ? upper.toLowerCase() : upper;
  const mark =
    type === 'halfDiminished7'
      ? 'ø'
      : diminished
        ? '°'
        : type === 'augmented' || type === 'augmented7' || type === 'augmentedMajor7'
          ? '+'
          : '';
  const extension =
    type === 'major7' || type === 'augmentedMajor7'
      ? 'maj7'
      : type === 'minorMajor7'
        ? '(maj7)'
        : type === 'major9'
          ? 'maj9'
          : type.endsWith('13')
            ? '13'
            : type.endsWith('11')
              ? '11'
              : type.endsWith('9')
                ? '9'
                : type.endsWith('7')
                  ? '7'
                  : '';
  return `${base}${mark}${extension}`;
}

/** Mögliche Stufen/Funktionen eines Akkords in einer Tonart; uneindeutige Befunde bleiben getrennt. */
export function analyzeHarmony(
  candidate: Chord,
  tonalKey: Key,
  options: Pick<KeyScaleOptions, 'minorForm'> = {},
): HarmonyAnalysis[] {
  const scale = keyScale(tonalKey, options);
  // Aus Terzen der gewählten Leiter geschichtet (key.ts, gegen tonal geprüft), auch für melodisches Moll.
  const triads: ChordType[] = diatonicTriads(tonalKey, options).map((triad) => triad.quality);
  const sevenths = diatonicSevenths(tonalKey, options);
  const analyses: HarmonyAnalysis[] = [];
  const functions = tonalKey.mode === 'major' ? MAJOR_FUNCTIONS : MINOR_FUNCTIONS;
  scale.forEach((root, index) => {
    const degree = index + 1;
    const triad = at(triads, index);
    const seventh = at(sevenths, index).chord.type;
    const ninth =
      seventh === 'dominant7'
        ? 'dominant9'
        : seventh === 'major7'
          ? 'major9'
          : seventh === 'minor7'
            ? 'minor9'
            : undefined;
    const extensions = seventh === 'dominant7' ? ['dominant11', 'dominant13'] : [];
    if (
      sameNoteName(root, candidate.root) &&
      [triad, seventh, ninth, ...extensions].includes(candidate.type)
    ) {
      const role: HarmonicRole =
        degree === 1 || degree === 6
          ? 'tonic'
          : degree === 4 || degree === 2
            ? 'subdominant'
            : 'dominant';
      const roman = romanFor(degree, candidate.type);
      const extension = candidate.type.endsWith('13')
        ? '13'
        : candidate.type.endsWith('11')
          ? '11'
          : candidate.type.endsWith('9')
            ? '9'
            : candidate.type.endsWith('7')
              ? '7'
              : '';
      analyses.push({
        chord: candidate,
        degree,
        role,
        roman,
        functionSymbol: `${at(functions, index)}${extension}`,
      });
    }
  });
  // Zwischendominanten: V oder V7 einer diatonischen Zielstufe, deren Grundton
  // tatsächlich eine reine Quinte über dem jeweiligen Ziel liegt.
  if (candidate.type === 'major' || candidate.type === 'dominant7') {
    scale.forEach((target, index) => {
      if (index === 0) return; // reguläre Dominante zur Tonika
      const fifth = transpose(withOctave(target, 4), 4, 7);
      if (sameNoteName(fifth, candidate.root)) {
        const extension = candidate.type === 'dominant7' ? '7' : '';
        analyses.push({
          chord: candidate,
          degree: 5,
          role: 'secondary-dominant',
          targetDegree: index + 1,
          roman: `V${extension}/${at(ROMANS, index)}`,
          functionSymbol: `D${extension}/${at(functions, index)}`,
        });
      }
    });
  }
  if (candidate.type === 'major') {
    const second = at(scale, 1);
    const lowered = { ...second, alter: second.alter - 1 };
    if (sameNoteName(candidate.root, lowered)) {
      analyses.push({
        chord: candidate,
        degree: 2,
        role: 'neapolitan',
        roman: '♭II',
        functionSymbol: 'N',
      });
    }
  }
  return analyses;
}

export type CadenceType = 'authentic' | 'plagal' | 'half' | 'deceptive';

/** Klassifiziert die letzten beiden Akkorde, bei Halbschluss auch einen einzelnen Schlussakkord. */
export function classifyCadence(
  progression: readonly Chord[],
  tonalKey: Key,
): CadenceType | undefined {
  const last = progression.at(-1);
  if (!last) return undefined;
  const roles = (c: Chord) =>
    analyzeHarmony(c, tonalKey, { minorForm: tonalKey.mode === 'minor' ? 'harmonic' : 'natural' });
  const has = (c: Chord, degree: number) =>
    roles(c).some((a) => a.degree === degree && a.role !== 'secondary-dominant');
  const before = progression.at(-2);
  if (before && has(before, 5) && has(last, 1)) return 'authentic';
  if (before && has(before, 4) && has(last, 1)) return 'plagal';
  if (before && has(before, 5) && has(last, 6)) return 'deceptive';
  if (has(last, 5)) return 'half';
  return undefined;
}

export interface Modulation {
  readonly pivotIndex: number;
  readonly dominantIndex: number;
  readonly tonicIndex: number;
  readonly fromDegree: number;
  readonly toDegree: number;
}

/** Erkennt eine einfache diatonische Pivotmodulation mit V(7)–I in der Zieltonart. */
export function findPivotModulation(
  progression: readonly Chord[],
  from: Key,
  to: Key,
): Modulation | undefined {
  if (sameNoteName(from.tonic, to.tonic) && from.mode === to.mode) return undefined;
  // Pivotakkorde müssen in beiden Tonarten diatonisch sein (kein Neapolitaner, keine
  // Zwischendominante). Moll prüft dafür natürliche und harmonische Form, damit auch Pivots wie
  // F in d-Moll gelten. Dominante und Tonika der Zieltonart verwenden wie bisher nur harmonisches Moll.
  const forms = (tonalKey: Key) =>
    tonalKey.mode === 'minor' ? (['natural', 'harmonic'] as const) : (['natural'] as const);
  const pivotRole = (c: Chord, tonalKey: Key) =>
    forms(tonalKey)
      .flatMap((minorForm) => analyzeHarmony(c, tonalKey, { minorForm }))
      .find((a) => a.role !== 'secondary-dominant' && a.role !== 'neapolitan');
  const functional = (c: Chord, tonalKey: Key) =>
    analyzeHarmony(c, tonalKey, {
      minorForm: tonalKey.mode === 'minor' ? 'harmonic' : 'natural',
    }).filter((a) => a.role !== 'secondary-dominant');
  for (let i = 0; i < progression.length - 2; i++) {
    const pivot = at(progression, i);
    const dominant = at(progression, i + 1);
    const tonic = at(progression, i + 2);
    const old = pivotRole(pivot, from);
    const next = pivotRole(pivot, to);
    if (
      !old ||
      !next ||
      !functional(dominant, to).some((a) => a.degree === 5) ||
      !functional(tonic, to).some((a) => a.degree === 1)
    )
      continue;
    // Die neue Dominante muss in der alten Tonart einen neuen Bezug schaffen.
    if (functional(dominant, from).some((a) => a.degree === 5)) continue;
    return {
      pivotIndex: i,
      dominantIndex: i + 1,
      tonicIndex: i + 2,
      fromDegree: old.degree,
      toDegree: next.degree,
    };
  }
  return undefined;
}
