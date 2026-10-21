// P4.09: rein beschreibende, interne Vorprüfung synchroner SATB-Tonhöhen.
// Welche Funde im jeweiligen Stil als Fehler gelten, entscheidet erst F05.

import { diatonicIndex, midi, type Pitch } from './pitch.ts';

export type Voice = 'bass' | 'tenor' | 'alto' | 'soprano';
export type VoiceLeadingRule =
  | 'parallel-fifth'
  | 'parallel-octave'
  | 'parallel-unison'
  | 'voice-crossing'
  | 'voice-overlap'
  | 'upper-voice-spacing';
export type VoiceLeadingSeverity = 'error' | 'warning' | 'hint';

/** Alle Stimmen erklingen zum selben Zeitpunkt; gehaltene Töne müssen wiederholt werden. */
export type FourPartSlice = Readonly<Record<Voice, Pitch>>;

/** Keine impliziten Lehrbuchurteile: nur explizit eingeschaltete Regeln erzeugen Funde. */
export type VoiceLeadingRules = Readonly<Partial<Record<VoiceLeadingRule, VoiceLeadingSeverity>>>;

export interface VoiceLeadingFinding {
  readonly rule: VoiceLeadingRule;
  readonly severity: VoiceLeadingSeverity;
  /** Index des betroffenen Schnitts; bei Bewegungsregeln das Ziel. */
  readonly at: number;
  /** Stimmen in der festen Reihenfolge Bass, Tenor, Alt, Sopran. */
  readonly voices: readonly [Voice, Voice];
}

const PAIRS: readonly (readonly [Voice, Voice])[] = [
  ['bass', 'tenor'],
  ['bass', 'alto'],
  ['bass', 'soprano'],
  ['tenor', 'alto'],
  ['tenor', 'soprano'],
  ['alto', 'soprano'],
];
const NEIGHBOURS: readonly (readonly [Voice, Voice])[] = [
  ['bass', 'tenor'],
  ['tenor', 'alto'],
  ['alto', 'soprano'],
];
const UPPER_NEIGHBOURS: readonly (readonly [Voice, Voice])[] = [
  ['tenor', 'alto'],
  ['alto', 'soprano'],
];

/**
 * Meldet objektiv berechenbare Muster, ohne einen Satz als gültig/ungültig zu bewerten.
 * Der Aufrufer muss Stil und Schweregrade ausdrücklich wählen. Tonart, Harmonik,
 * metrische Lage und dissonante Durchgänge werden hier noch nicht berücksichtigt.
 */
export function analyzeVoiceLeading(
  slices: readonly FourPartSlice[],
  rules: VoiceLeadingRules,
): VoiceLeadingFinding[] {
  const findings: VoiceLeadingFinding[] = [];

  function add(rule: VoiceLeadingRule, at: number, voices: readonly [Voice, Voice]): void {
    const severity = rules[rule];
    if (severity !== undefined) {
      findings.push({ rule, severity, at, voices });
    }
  }

  for (const [at, current] of slices.entries()) {
    for (const [lower, upper] of NEIGHBOURS) {
      if (midi(current[lower]) > midi(current[upper])) {
        add('voice-crossing', at, [lower, upper]);
      }
    }
    for (const [lower, upper] of UPPER_NEIGHBOURS) {
      if (midi(current[upper]) - midi(current[lower]) > 12) {
        add('upper-voice-spacing', at, [lower, upper]);
      }
    }

    const previous = slices[at - 1];
    if (previous === undefined) continue;

    for (const [lower, upper] of NEIGHBOURS) {
      // Eine Stimmkreuzung ist bereits ein eigener Befund. Bei geordneter
      // Ziel-Lage erkennt Übergreifen die Bewegung über die alte Nachbarposition.
      if (
        midi(previous[lower]) <= midi(previous[upper]) &&
        midi(current[lower]) <= midi(current[upper]) &&
        (midi(current[lower]) > midi(previous[upper]) ||
          midi(current[upper]) < midi(previous[lower]))
      ) {
        add('voice-overlap', at, [lower, upper]);
      }
    }

    for (const [lower, upper] of PAIRS) {
      const lowerMotion = Math.sign(midi(current[lower]) - midi(previous[lower]));
      const upperMotion = Math.sign(midi(current[upper]) - midi(previous[upper]));
      if (lowerMotion === 0 || lowerMotion !== upperMotion) continue;
      // Kreuzungen gehen nicht als scheinbare Parallelen in die Analyse ein.
      if (
        midi(previous[lower]) > midi(previous[upper]) ||
        midi(current[lower]) > midi(current[upper])
      ) {
        continue;
      }
      const before = perfectClass(previous[lower], previous[upper]);
      const after = perfectClass(current[lower], current[upper]);
      if (before !== undefined && before === after) {
        add(before, at, [lower, upper]);
      }
    }
  }

  return findings;
}

function perfectClass(lower: Pitch, upper: Pitch): VoiceLeadingRule | undefined {
  const steps = diatonicIndex(upper) - diatonicIndex(lower);
  const semitones = midi(upper) - midi(lower);
  if (steps < 0 || semitones < 0) return undefined;
  if (steps % 7 === 4 && semitones === 7 + 12 * Math.floor(steps / 7)) {
    return 'parallel-fifth';
  }
  if (steps % 7 === 0 && semitones === 12 * (steps / 7)) {
    return steps === 0 ? 'parallel-unison' : 'parallel-octave';
  }
  return undefined;
}
