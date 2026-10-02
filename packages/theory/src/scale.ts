// Tonleitern, immer korrekt buchstabiert: Jede siebenstufige Tonleiter enthält jeden Stammton genau einmal.

import type { Interval } from './interval.ts';
import { parseInterval, transposeBy } from './interval.ts';
import type { Pitch } from './pitch.ts';
import { formatPitch, midi, transpose } from './pitch.ts';

export type ScaleType =
  | 'major'
  | 'naturalMinor'
  | 'harmonicMinor'
  | 'melodicMinor'
  | 'ionian'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'aeolian'
  | 'locrian'
  | 'majorPentatonic'
  | 'minorPentatonic'
  | 'blues'
  | 'majorBlues'
  | 'wholeTone'
  | 'chromatic';

/** Intervalle vom Grundton aus. Die chromatische Tonleiter wird gesondert gebildet. */
const SCALE_INTERVALS: Readonly<Record<Exclude<ScaleType, 'chromatic'>, readonly string[]>> = {
  major: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'M7'],
  naturalMinor: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'm7'],
  harmonicMinor: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'M7'],
  // Aufwärts-Form. Abwärts wird melodisches Moll klassisch wie natürliches Moll gespielt.
  melodicMinor: ['P1', 'M2', 'm3', 'P4', 'P5', 'M6', 'M7'],
  ionian: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'M7'],
  dorian: ['P1', 'M2', 'm3', 'P4', 'P5', 'M6', 'm7'],
  phrygian: ['P1', 'm2', 'm3', 'P4', 'P5', 'm6', 'm7'],
  lydian: ['P1', 'M2', 'M3', 'A4', 'P5', 'M6', 'M7'],
  mixolydian: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'm7'],
  aeolian: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'm7'],
  locrian: ['P1', 'm2', 'm3', 'P4', 'd5', 'm6', 'm7'],
  majorPentatonic: ['P1', 'M2', 'M3', 'P5', 'M6'],
  minorPentatonic: ['P1', 'm3', 'P4', 'P5', 'm7'],
  // Moll-Pentatonik plus verminderte Quinte (Blue Note): C Es F Ges G B
  blues: ['P1', 'm3', 'P4', 'd5', 'P5', 'm7'],
  // Dur-Pentatonik plus kleine Terz: C D Es E G A
  majorBlues: ['P1', 'M2', 'm3', 'M3', 'P5', 'M6'],
  // Sechs Ganztöne; die verminderte Terz liegt vor der Oktave: C D E Fis Gis Ais (C), Des Es F G A H (Des)
  wholeTone: ['P1', 'M2', 'M3', 'A4', 'A5', 'A6'],
};

export const SCALE_TYPES: readonly ScaleType[] = [
  ...(Object.keys(SCALE_INTERVALS) as Exclude<ScaleType, 'chromatic'>[]),
  'chromatic',
];

/** Intervalle einer Tonleiter vom Grundton aus (nicht für die chromatische Tonleiter). */
export function scaleIntervals(type: Exclude<ScaleType, 'chromatic'>): Interval[] {
  return SCALE_INTERVALS[type].map((text) => parseInterval(text));
}

export interface BuildScaleOptions {
  /** Standard: aufwärts. Melodisches Moll abwärts = natürliches Moll (klassische Lehre). */
  readonly direction?: 'ascending' | 'descending';
  /** Grundton eine Oktave höher (aufwärts) bzw. tiefer (abwärts) anhängen. Standard: nein. */
  readonly includeOctave?: boolean;
}

/**
 * Bildet eine Tonleiter vom Grundton aus.
 * Aufwärts: Grundton zuerst. Abwärts: vom Grundton nach unten (C-Dur abwärts: C, H, A, G, F, E, D).
 * Wirft einen RangeError, wenn ein Ton mehr als zwei Vorzeichen bräuchte (Gisis-Dur bräuchte Fisisis).
 */
export function buildScale(
  tonic: Pitch,
  type: ScaleType,
  options: BuildScaleOptions = {},
): Pitch[] {
  const descending = options.direction === 'descending';
  const notes =
    type === 'chromatic'
      ? chromaticScale(tonic, descending)
      : diatonicScale(
          tonic,
          descending && type === 'melodicMinor' ? 'naturalMinor' : type,
          descending,
        );
  if (options.includeOctave) {
    notes.push(transpose(tonic, descending ? -7 : 7, descending ? -12 : 12));
  }
  return notes;
}

function diatonicScale(
  tonic: Pitch,
  type: Exclude<ScaleType, 'chromatic'>,
  descending: boolean,
): Pitch[] {
  let upward: Pitch[];
  try {
    upward = scaleIntervals(type).map((i) => transposeBy(tonic, i));
  } catch {
    throw new RangeError(
      `${scaleTypeName(type, 'en')} auf ${formatPitch(tonic)} ist nicht darstellbar: ein Ton bräuchte mehr als zwei Vorzeichen`,
    );
  }
  if (!descending) {
    return upward;
  }
  // Abwärts: Grundton, dann die übrigen Stufen eine Oktave tiefer in absteigender Reihenfolge
  const [first, ...rest] = upward;
  const lowered = rest.reverse().map((p) => transpose(p, -7, -12));
  return first ? [first, ...lowered] : lowered;
}

/**
 * Chromatische Tonleiter in vereinfachter Schreibweise: aufwärts mit Kreuzen, abwärts mit b.
 * Bei jedem Halbtonschritt wird die Schreibweise mit den wenigsten Vorzeichen gewählt
 * (C → Cis → D …, abwärts C → H → B → A …).
 */
function chromaticScale(tonic: Pitch, descending: boolean): Pitch[] {
  const notes: Pitch[] = [tonic];
  const step = descending ? -1 : 1;
  for (let i = 1; i < 12; i++) {
    const previous = notes[notes.length - 1] ?? tonic;
    // Kandidaten: gleicher Stammton (übermäßige Prime) oder nächster Stammton (kleine Sekunde)
    const candidates = [
      transposeSafe(previous, 0, step),
      transposeSafe(previous, step, step),
    ].filter((p): p is Pitch => p !== undefined);
    const best = candidates.sort((a, b) => {
      const byAccidentals = Math.abs(a.alter) - Math.abs(b.alter);
      if (byAccidentals !== 0) {
        return byAccidentals;
      }
      // Gleich viele Vorzeichen: aufwärts Kreuz, abwärts b bevorzugen
      return descending ? a.alter - b.alter : b.alter - a.alter;
    })[0];
    if (!best || midi(best) !== midi(previous) + step) {
      throw new RangeError('Chromatische Tonleiter nicht darstellbar');
    }
    notes.push(best);
  }
  return notes;
}

function transposeSafe(p: Pitch, steps: number, semitones: number): Pitch | undefined {
  try {
    return transpose(p, steps, semitones);
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------

const SCALE_NAMES: Readonly<Record<ScaleType, { readonly de: string; readonly en: string }>> = {
  major: { de: 'Dur', en: 'major' },
  naturalMinor: { de: 'natürliches Moll', en: 'natural minor' },
  harmonicMinor: { de: 'harmonisches Moll', en: 'harmonic minor' },
  melodicMinor: { de: 'melodisches Moll', en: 'melodic minor' },
  ionian: { de: 'Ionisch', en: 'Ionian' },
  dorian: { de: 'Dorisch', en: 'Dorian' },
  phrygian: { de: 'Phrygisch', en: 'Phrygian' },
  lydian: { de: 'Lydisch', en: 'Lydian' },
  mixolydian: { de: 'Mixolydisch', en: 'Mixolydian' },
  aeolian: { de: 'Äolisch', en: 'Aeolian' },
  locrian: { de: 'Lokrisch', en: 'Locrian' },
  majorPentatonic: { de: 'Dur-Pentatonik', en: 'major pentatonic' },
  minorPentatonic: { de: 'Moll-Pentatonik', en: 'minor pentatonic' },
  blues: { de: 'Bluestonleiter', en: 'blues scale' },
  majorBlues: { de: 'Dur-Bluestonleiter', en: 'major blues scale' },
  wholeTone: { de: 'Ganztonleiter', en: 'whole-tone scale' },
  chromatic: { de: 'chromatisch', en: 'chromatic' },
};

/** Name eines Tonleitertyps, z. B. „harmonisches Moll“ / „harmonic minor“. */
export function scaleTypeName(type: ScaleType, language: 'de' | 'en' = 'de'): string {
  return SCALE_NAMES[type][language];
}
