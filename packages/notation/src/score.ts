// Score-Modell: was dargestellt wird. Tonhöhen, Dauern und Taktarten kommen aus der Theorie-Engine.
// Phase 1: ein System, eine Stimme. Das Modell erlaubt schon mehrere Systeme und Stimmen sowie
// Wechsel von Schlüssel, Vorzeichnung und Taktart am Taktanfang (Phase 3).

import type { Duration, Key, Pitch, TimeSignature } from '@harmonia/theory';
import { checkMeasure, equals, formatPitch, keyFifths, timeSignature } from '@harmonia/theory';

/** Violin- und Bassschlüssel (Phase 1), Alt- und Tenorschlüssel (Darstellung ab Phase 3). */
export type Clef = 'treble' | 'bass' | 'alto' | 'tenor';

export const CLEFS: readonly Clef[] = ['treble', 'bass', 'alto', 'tenor'];

/** Vorzeichnung: Zahl der Vorzeichen (positiv = Kreuze, negativ = b), optional mit der gemeinten Tonart. */
export interface KeySignature {
  readonly fifths: number;
  readonly key?: Key;
}

export interface Note {
  readonly kind: 'note';
  readonly pitch: Pitch;
  readonly duration: Duration;
  /** Haltebogen zum nächsten Ereignis derselben Stimme, das dieselbe Tonhöhe enthält. */
  readonly tie: boolean;
  /** Beginn oder Ende eines Phrasierungsbogens, unabhängig vom Haltebogen. */
  readonly slur?: 'start' | 'end';
  readonly harmony?: HarmonyAnnotation;
}

/** Geschriebene Labels. Analyse und Wahl der Konvention kommen aus der Theorie-Engine. */
export interface HarmonyAnnotation {
  readonly chordSymbol?: string;
  readonly functionSymbol?: string;
}

export interface ChordNote {
  readonly pitch: Pitch;
  readonly tie: boolean;
}

/** Mehrere Töne mit gemeinsamer Dauer (mindestens zwei, verschiedene Tonhöhen). */
export interface Chord {
  readonly kind: 'chord';
  readonly notes: readonly ChordNote[];
  readonly duration: Duration;
  readonly slur?: 'start' | 'end';
  readonly harmony?: HarmonyAnnotation;
}

export interface Rest {
  readonly kind: 'rest';
  readonly duration: Duration;
}

export type VoiceEvent = Note | Chord | Rest;

export interface Voice {
  readonly events: readonly VoiceEvent[];
}

/** Wechsel am Taktanfang. Was fehlt, gilt weiter. */
export interface MeasureChanges {
  readonly clef?: Clef;
  readonly keySignature?: KeySignature;
  readonly timeSignature?: TimeSignature;
}

export interface Measure {
  readonly changes?: MeasureChanges;
  readonly voices: readonly Voice[];
}

export interface Staff {
  readonly clef: Clef;
  readonly keySignature: KeySignature;
  readonly timeSignature: TimeSignature;
  readonly measures: readonly Measure[];
}

export interface Score {
  readonly staves: readonly Staff[];
}

// ---------------------------------------------------------------------------
// Bausteine

export function note(
  pitch: Pitch,
  duration: Duration,
  tie = false,
  slur?: 'start' | 'end',
  harmony?: HarmonyAnnotation,
): Note {
  return {
    kind: 'note',
    pitch,
    duration,
    tie,
    ...(slur ? { slur } : {}),
    ...(harmony ? { harmony } : {}),
  };
}

export function rest(duration: Duration): Rest {
  return { kind: 'rest', duration };
}

/** Wirft einen RangeError bei weniger als zwei Tönen oder doppelten Tonhöhen. */
export function chord(
  notes: readonly ChordNote[],
  duration: Duration,
  slur?: 'start' | 'end',
  harmony?: HarmonyAnnotation,
): Chord {
  if (notes.length < 2) {
    throw new RangeError('Ein Akkord braucht mindestens zwei Töne');
  }
  const duplicate = notes.find((n, i) => notes.findIndex((m) => equals(m.pitch, n.pitch)) !== i);
  if (duplicate) {
    throw new RangeError(`Ton doppelt im Akkord: ${formatPitch(duplicate.pitch)}`);
  }
  return {
    kind: 'chord',
    notes: [...notes],
    duration,
    ...(slur ? { slur } : {}),
    ...(harmony ? { harmony } : {}),
  };
}

/** Vorzeichnung aus einer Tonart (Es-Dur → −3) oder direkt aus der Vorzeichenzahl. */
export function keySignature(source: Key | number): KeySignature {
  if (typeof source === 'number') {
    if (!Number.isInteger(source) || Math.abs(source) > 7) {
      throw new RangeError(`Vorzeichenzahl außerhalb von −7…7: ${String(source)}`);
    }
    return { fifths: source };
  }
  return { fifths: keyFifths(source), key: source };
}

export const DEFAULT_CLEF: Clef = 'treble';
export const DEFAULT_KEY_SIGNATURE: KeySignature = { fifths: 0 };
export const DEFAULT_TIME_SIGNATURE: TimeSignature = timeSignature(4, 4);

/** Ein System mit einer Stimme pro Takt (Phase 1). */
export function singleStaffScore(
  measures: readonly (readonly VoiceEvent[])[],
  options: Partial<Pick<Staff, 'clef' | 'keySignature' | 'timeSignature'>> = {},
): Score {
  return {
    staves: [
      {
        clef: options.clef ?? DEFAULT_CLEF,
        keySignature: options.keySignature ?? DEFAULT_KEY_SIGNATURE,
        timeSignature: options.timeSignature ?? DEFAULT_TIME_SIGNATURE,
        measures: measures.map((events) => ({ voices: [{ events: [...events] }] })),
      },
    ],
  };
}

/** Tonhöhen eines Ereignisses (leer bei Pausen). */
export function eventPitches(event: VoiceEvent): Pitch[] {
  switch (event.kind) {
    case 'note':
      return [event.pitch];
    case 'chord':
      return event.notes.map((n) => n.pitch);
    case 'rest':
      return [];
  }
}

// ---------------------------------------------------------------------------
// Haltebögen

/** Position eines Ereignisses: System, Takt, Stimme, Ereignis (jeweils ab 0). */
export interface EventPosition {
  readonly staff: number;
  readonly measure: number;
  readonly voice: number;
  readonly event: number;
}

/** Haltebogen von einem Ton zum gleichen Ton des nächsten Ereignisses derselben Stimme. */
export interface Tie {
  readonly pitch: Pitch;
  readonly from: EventPosition;
  readonly to: EventPosition;
}

/**
 * Alle Haltebögen der Partitur. Ein Bogen braucht als Ziel das nächste Ereignis derselben Stimme
 * (auch über den Taktstrich), und dieses muss dieselbe Tonhöhe in derselben Schreibweise enthalten.
 * Bögen ohne Ziel liefert `validateScore` als Problem.
 */
export function ties(score: Score): Tie[] {
  return collectTies(score).filter((t): t is Tie => t.to !== undefined);
}

export interface Slur {
  readonly from: EventPosition;
  readonly to: EventPosition;
}

/** Verbindet Beginn und Ende eines Phrasierungsbogens innerhalb derselben Stimme. */
export function slurs(score: Score): Slur[] {
  return collectSlurs(score).pairs;
}

function collectSlurs(score: Score): { pairs: Slur[]; issues: ScoreIssue[] } {
  const pairs: Slur[] = [];
  const issues: ScoreIssue[] = [];
  score.staves.forEach((staff, staffIndex) => {
    const voiceCount = Math.max(0, ...staff.measures.map((m) => m.voices.length));
    for (let voice = 0; voice < voiceCount; voice++) {
      let start: EventPosition | undefined;
      staff.measures.forEach((measure, measureIndex) => {
        measure.voices[voice]?.events.forEach((event, eventIndex) => {
          if (event.kind === 'rest' || !event.slur) return;
          const position = { staff: staffIndex, measure: measureIndex, voice, event: eventIndex };
          if (event.slur === 'start') {
            if (start) issues.push({ type: 'slur-without-end', from: start });
            start = position;
          } else if (start) {
            pairs.push({ from: start, to: position });
            start = undefined;
          } else {
            issues.push({ type: 'slur-without-start', to: position });
          }
        });
      });
      if (start) issues.push({ type: 'slur-without-end', from: start });
    }
  });
  return { pairs, issues };
}

function collectTies(score: Score): { pitch: Pitch; from: EventPosition; to?: EventPosition }[] {
  const result: { pitch: Pitch; from: EventPosition; to?: EventPosition }[] = [];
  score.staves.forEach((staff, staffIndex) => {
    const voiceCount = Math.max(0, ...staff.measures.map((m) => m.voices.length));
    for (let voice = 0; voice < voiceCount; voice++) {
      const events = staff.measures.flatMap((m, measure) =>
        (m.voices[voice]?.events ?? []).map((e, event) => ({
          e,
          position: { staff: staffIndex, measure, voice, event },
        })),
      );
      events.forEach(({ e, position }, i) => {
        const next = events[i + 1];
        for (const tied of tiedPitches(e)) {
          const hit = next !== undefined && eventPitches(next.e).some((p) => equals(p, tied));
          result.push(
            hit
              ? { pitch: tied, from: position, to: next.position }
              : { pitch: tied, from: position },
          );
        }
      });
    }
  });
  return result;
}

function tiedPitches(event: VoiceEvent): Pitch[] {
  switch (event.kind) {
    case 'note':
      return event.tie ? [event.pitch] : [];
    case 'chord':
      return event.notes.filter((n) => n.tie).map((n) => n.pitch);
    case 'rest':
      return [];
  }
}

// ---------------------------------------------------------------------------
// Prüfung

export type ScoreIssue =
  | {
      readonly type: 'measure-incomplete' | 'measure-overfull';
      readonly staff: number;
      readonly measure: number;
      readonly voice: number;
    }
  | { readonly type: 'tie-without-target'; readonly from: EventPosition; readonly pitch: Pitch }
  | { readonly type: 'slur-without-end'; readonly from: EventPosition }
  | { readonly type: 'slur-without-start'; readonly to: EventPosition };

export interface ValidateOptions {
  /** Ersten Takt als Auftakt erlauben, wenn er zu kurz ist. Standard: ja. */
  readonly allowPickup?: boolean;
}

/** Prüft Taktfüllung (je Stimme, mit der jeweils gültigen Taktart) und Haltebögen. Leere Liste = in Ordnung. */
export function validateScore(score: Score, options: ValidateOptions = {}): ScoreIssue[] {
  const allowPickup = options.allowPickup ?? true;
  const issues: ScoreIssue[] = [];
  score.staves.forEach((staff, staffIndex) => {
    let time = staff.timeSignature;
    staff.measures.forEach((m, measureIndex) => {
      time = m.changes?.timeSignature ?? time;
      m.voices.forEach((v, voiceIndex) => {
        const { status } = checkMeasure(
          v.events.map((e) => e.duration),
          time,
        );
        const pickup = allowPickup && measureIndex === 0 && status === 'incomplete';
        if (status !== 'complete' && !pickup) {
          issues.push({
            type: status === 'overfull' ? 'measure-overfull' : 'measure-incomplete',
            staff: staffIndex,
            measure: measureIndex,
            voice: voiceIndex,
          });
        }
      });
    });
  });
  for (const t of collectTies(score)) {
    if (t.to === undefined) {
      issues.push({ type: 'tie-without-target', from: t.from, pitch: t.pitch });
    }
  }
  issues.push(...collectSlurs(score).issues);
  return issues;
}
