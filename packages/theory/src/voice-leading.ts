// P4.09: rein beschreibende, interne Vorprüfung synchroner SATB-Tonhöhen.
// Welche Funde im jeweiligen Stil als Fehler gelten, entscheidet erst F05.

import { chordTones, type Chord } from './chord.ts';
import {
  diatonicIndex,
  midi,
  sameNoteName,
  transpose,
  withOctave,
  type NoteName,
  type Pitch,
} from './pitch.ts';

export type Voice = 'bass' | 'tenor' | 'alto' | 'soprano';
export type VoiceLeadingRule =
  | 'parallel-fifth'
  | 'parallel-octave'
  | 'parallel-unison'
  | 'contrary-fifth'
  | 'contrary-octave'
  | 'hidden-fifth'
  | 'hidden-octave'
  | 'voice-crossing'
  | 'voice-overlap'
  | 'upper-voice-spacing'
  | 'voice-range'
  | 'leading-tone-resolution'
  | 'seventh-resolution'
  | 'doubled-leading-tone'
  | 'augmented-second'
  | 'melodic-leap';
export type VoiceLeadingSeverity = 'error' | 'warning' | 'hint';

/** Gleichzeitige Stimmen; gehaltene Töne wiederholen, Pausen ausdrücklich als null angeben. */
export type FourPartSlice = Readonly<Record<Voice, Pitch | null>>;

/** Keine impliziten Lehrbuchurteile: nur explizit eingeschaltete Regeln erzeugen Funde. */
export type VoiceLeadingRules = Readonly<Partial<Record<VoiceLeadingRule, VoiceLeadingSeverity>>>;

export interface VoiceRange {
  readonly min: Pitch;
  readonly max: Pitch;
}

/** Harmonik stammt vom Aufrufer; keine automatische Funktionsanalyse (F03). */
export interface VoiceLeadingHarmonyContext {
  /** Null bedeutet ausdrücklich: keine Tonalität für diesen Schnitt angegeben. */
  readonly tonic: NoteName | null;
  readonly chord: Pick<Chord, 'root' | 'type'> | null;
  /** Nur hier markierte Funktionswechsel verlangen am nächsten Schnitt eine Auflösung. */
  readonly resolveToNext?: {
    readonly leadingTone?: 'up' | 'up-or-frustrated-inner';
    readonly seventh?: 'down';
  };
}

export interface VoiceLeadingOptions {
  /** Keine eingebauten SATB-Umfänge, solange F05 offen ist. Grenzen sind inklusive. */
  readonly ranges?: Readonly<Record<Voice, VoiceRange>>;
  readonly contraryPerfectScope?: 'outer' | 'all';
  readonly hiddenPerfectMotion?: 'soprano-leap' | 'any';
  /** Größtes erlaubtes geschriebenes Melodieintervall: 8 = Oktave. */
  readonly maxMelodicInterval?: number;
  /** Genau ein Kontext pro Schnitt; null-Werte markieren bewusst unbekannte Harmonik. */
  readonly harmonies?: readonly VoiceLeadingHarmonyContext[];
}

export interface VoiceLeadingFinding {
  readonly rule: VoiceLeadingRule;
  readonly severity: VoiceLeadingSeverity;
  /** Index des betroffenen Schnitts; bei Bewegungsregeln das Ziel. */
  readonly at: number;
  /** Stimmen in der festen Reihenfolge Bass, Tenor, Alt, Sopran. */
  readonly voices: readonly [Voice, ...Voice[]];
}

/** Ob der Befund nur den Zielschnitt oder auch den vorigen Schnitt benötigt. */
export const VOICE_LEADING_RULE_PHASE: Readonly<Record<VoiceLeadingRule, 'slice' | 'motion'>> = {
  'parallel-fifth': 'motion',
  'parallel-octave': 'motion',
  'parallel-unison': 'motion',
  'contrary-fifth': 'motion',
  'contrary-octave': 'motion',
  'hidden-fifth': 'motion',
  'hidden-octave': 'motion',
  'voice-crossing': 'slice',
  'voice-overlap': 'motion',
  'upper-voice-spacing': 'slice',
  'voice-range': 'slice',
  'leading-tone-resolution': 'motion',
  'seventh-resolution': 'motion',
  'doubled-leading-tone': 'slice',
  'augmented-second': 'motion',
  'melodic-leap': 'motion',
};

const VOICES: readonly Voice[] = ['bass', 'tenor', 'alto', 'soprano'];
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
 * Der Aufrufer wählt Stilparameter, Schweregrade und harmonische Grenzen ausdrücklich.
 * Metrische Lage und dissonante Durchgänge werden nicht automatisch interpretiert.
 */
export function analyzeVoiceLeading(
  slices: readonly FourPartSlice[],
  rules: VoiceLeadingRules,
  options: VoiceLeadingOptions = {},
): VoiceLeadingFinding[] {
  validateOptions(slices.length, rules, options);
  const findings: VoiceLeadingFinding[] = [];

  function add(rule: VoiceLeadingRule, at: number, voices: readonly [Voice, ...Voice[]]): void {
    const severity = rules[rule];
    if (severity !== undefined) {
      findings.push({ rule, severity, at, voices });
    }
  }

  for (const [at, current] of slices.entries()) {
    for (const [lower, upper] of NEIGHBOURS) {
      const low = current[lower],
        high = current[upper];
      if (low && high && midi(low) > midi(high)) {
        add('voice-crossing', at, [lower, upper]);
      }
    }
    for (const [lower, upper] of UPPER_NEIGHBOURS) {
      const low = current[lower],
        high = current[upper];
      if (low && high && midi(high) - midi(low) > 12) {
        add('upper-voice-spacing', at, [lower, upper]);
      }
    }
    for (const voice of VOICES) {
      const range = options.ranges?.[voice];
      const tone = current[voice];
      if (range && tone && (midi(tone) < midi(range.min) || midi(tone) > midi(range.max))) {
        add('voice-range', at, [voice]);
      }
    }
    const currentHarmony = options.harmonies?.[at];
    if (currentHarmony?.tonic && rules['doubled-leading-tone'] !== undefined) {
      const leadingTone = leadingToneOf(currentHarmony.tonic);
      const doubled = VOICES.filter((voice) => {
        const tone = current[voice];
        return tone !== null && sameNoteName(tone, leadingTone);
      });
      const [first, ...rest] = doubled;
      if (first && rest.length > 0) add('doubled-leading-tone', at, [first, ...rest]);
    }

    const previous = slices[at - 1];
    if (previous === undefined) continue;

    for (const [lower, upper] of NEIGHBOURS) {
      const beforeLow = previous[lower],
        beforeHigh = previous[upper];
      const afterLow = current[lower],
        afterHigh = current[upper];
      // Eine Stimmkreuzung ist bereits ein eigener Befund. Bei geordneter
      // Ziel-Lage erkennt Übergreifen die Bewegung über die alte Nachbarposition.
      if (
        beforeLow &&
        beforeHigh &&
        afterLow &&
        afterHigh &&
        midi(beforeLow) <= midi(beforeHigh) &&
        midi(afterLow) <= midi(afterHigh) &&
        (midi(afterLow) > midi(beforeHigh) || midi(afterHigh) < midi(beforeLow))
      ) {
        add('voice-overlap', at, [lower, upper]);
      }
    }

    const previousHarmony = options.harmonies?.[at - 1];
    const resolution = previousHarmony?.resolveToNext;
    const leadingTone =
      rules['leading-tone-resolution'] !== undefined &&
      resolution?.leadingTone &&
      previousHarmony?.tonic
        ? leadingToneOf(previousHarmony.tonic)
        : undefined;
    const seventh =
      rules['seventh-resolution'] !== undefined && resolution?.seventh && previousHarmony?.chord
        ? chordTones(previousHarmony.chord)[3]
        : undefined;
    for (const voice of VOICES) {
      const from = previous[voice],
        to = current[voice];
      if (!from) continue;
      if (!to) {
        // Eine Pause ist keine Auflösung, wenn der Autor genau hier eine verlangt.
        if (resolution?.leadingTone && leadingTone && sameNoteName(from, leadingTone)) {
          add('leading-tone-resolution', at, [voice]);
        }
        if (resolution?.seventh && seventh && sameNoteName(from, seventh)) {
          add('seventh-resolution', at, [voice]);
        }
        continue;
      }
      const steps = diatonicIndex(to) - diatonicIndex(from);
      const semitones = midi(to) - midi(from);
      if (Math.abs(steps) === 1 && steps * semitones === 3) {
        add('augmented-second', at, [voice]);
      }
      if (
        options.maxMelodicInterval !== undefined &&
        Math.abs(steps) + 1 > options.maxMelodicInterval
      ) {
        add('melodic-leap', at, [voice]);
      }
      if (resolution?.leadingTone && leadingTone && sameNoteName(from, leadingTone)) {
        const resolvesUp = steps === 1 && semitones === 1;
        const frustrated =
          resolution.leadingTone === 'up-or-frustrated-inner' &&
          (voice === 'tenor' || voice === 'alto') &&
          steps === -2 &&
          semitones === -4;
        if (!resolvesUp && !frustrated) add('leading-tone-resolution', at, [voice]);
      }
      if (resolution?.seventh && seventh && sameNoteName(from, seventh)) {
        if (steps !== -1 || (semitones !== -1 && semitones !== -2)) {
          add('seventh-resolution', at, [voice]);
        }
      }
    }

    for (const [lower, upper] of PAIRS) {
      const beforeLow = previous[lower],
        beforeHigh = previous[upper];
      const afterLow = current[lower],
        afterHigh = current[upper];
      if (!beforeLow || !beforeHigh || !afterLow || !afterHigh) continue;
      const lowerMotion = Math.sign(midi(afterLow) - midi(beforeLow));
      const upperMotion = Math.sign(midi(afterHigh) - midi(beforeHigh));
      if (lowerMotion === 0 || upperMotion === 0) continue;
      // Kreuzungen gehen nicht als scheinbare Parallelen in die Analyse ein.
      if (midi(beforeLow) > midi(beforeHigh) || midi(afterLow) > midi(afterHigh)) {
        continue;
      }
      const before = perfectClass(beforeLow, beforeHigh);
      const after = perfectClass(afterLow, afterHigh);
      const outer = lower === 'bass' && upper === 'soprano';
      const successiveFifths = before === 'fifth' && after === 'fifth';
      const successiveOctaves = isOctaveFamily(before) && isOctaveFamily(after);
      if (lowerMotion === upperMotion) {
        if (successiveFifths) add('parallel-fifth', at, [lower, upper]);
        if (successiveOctaves) {
          add(
            before === 'unison' && after === 'unison' ? 'parallel-unison' : 'parallel-octave',
            at,
            [lower, upper],
          );
        }
        const sopranoSteps = outer
          ? Math.abs(diatonicIndex(afterHigh) - diatonicIndex(beforeHigh))
          : 0;
        if (outer && (options.hiddenPerfectMotion === 'any' || sopranoSteps > 1)) {
          if (after === 'fifth' && !successiveFifths) add('hidden-fifth', at, [lower, upper]);
          if (after === 'octave' && !successiveOctaves) add('hidden-octave', at, [lower, upper]);
        }
      } else if (outer || options.contraryPerfectScope === 'all') {
        if (successiveFifths) add('contrary-fifth', at, [lower, upper]);
        if (successiveOctaves) add('contrary-octave', at, [lower, upper]);
      }
    }
  }

  return findings;
}

type PerfectClass = 'fifth' | 'octave' | 'unison';

function perfectClass(lower: Pitch, upper: Pitch): PerfectClass | undefined {
  const steps = diatonicIndex(upper) - diatonicIndex(lower);
  const semitones = midi(upper) - midi(lower);
  if (steps < 0 || semitones < 0) return undefined;
  if (steps % 7 === 4 && semitones === 7 + 12 * Math.floor(steps / 7)) {
    return 'fifth';
  }
  if (steps % 7 === 0 && semitones === 12 * (steps / 7)) {
    return steps === 0 ? 'unison' : 'octave';
  }
  return undefined;
}

function isOctaveFamily(kind: PerfectClass | undefined): boolean {
  return kind === 'octave' || kind === 'unison';
}

function leadingToneOf(tonic: NoteName): NoteName {
  return transpose(withOctave(tonic, 4), -1, -1);
}

function validateOptions(
  length: number,
  rules: VoiceLeadingRules,
  options: VoiceLeadingOptions,
): void {
  if (rules['voice-range'] !== undefined) {
    if (!options.ranges) throw new RangeError('Stimmumfänge müssen ausdrücklich angegeben werden');
    for (const voice of VOICES) {
      const range = options.ranges[voice];
      if (
        !Number.isFinite(midi(range.min)) ||
        !Number.isFinite(midi(range.max)) ||
        midi(range.min) > midi(range.max)
      ) {
        throw new RangeError(`Ungültiger Stimmumfang: ${voice}`);
      }
    }
  }
  if (
    (rules['contrary-fifth'] !== undefined || rules['contrary-octave'] !== undefined) &&
    !options.contraryPerfectScope
  ) {
    throw new RangeError('Geltungsbereich für Gegenparallelen fehlt');
  }
  if (
    (rules['hidden-fifth'] !== undefined || rules['hidden-octave'] !== undefined) &&
    !options.hiddenPerfectMotion
  ) {
    throw new RangeError('Sopranbewegung für verdeckte Quint-/Oktavgänge fehlt');
  }
  if (
    rules['melodic-leap'] !== undefined &&
    (!Number.isInteger(options.maxMelodicInterval) || (options.maxMelodicInterval ?? 0) < 1)
  ) {
    throw new RangeError('Größtes Melodieintervall muss eine positive ganze Zahl sein');
  }
  const harmonicRules = [
    'leading-tone-resolution',
    'seventh-resolution',
    'doubled-leading-tone',
  ] as const;
  if (harmonicRules.some((rule) => rules[rule] !== undefined) && !options.harmonies) {
    throw new RangeError('Harmonischer Kontext für Leitton-/Septimregeln fehlt');
  }
  if (options.harmonies && options.harmonies.length !== length) {
    throw new RangeError('Genau ein harmonischer Kontext pro Schnitt ist erforderlich');
  }
  for (const [at, harmony] of (options.harmonies ?? []).entries()) {
    const leading =
      rules['leading-tone-resolution'] !== undefined && harmony.resolveToNext?.leadingTone;
    const seventh = rules['seventh-resolution'] !== undefined && harmony.resolveToNext?.seventh;
    if ((leading || seventh) && at === length - 1)
      throw new RangeError('Auflösungsziel nach dem letzten Schnitt fehlt');
    if (leading && !harmony.tonic) throw new RangeError('Tonika für Leittonauflösung fehlt');
    if (seventh && (!harmony.chord || chordTones(harmony.chord)[3] === undefined)) {
      throw new RangeError('Septakkord für Septimauflösung fehlt');
    }
  }
}
