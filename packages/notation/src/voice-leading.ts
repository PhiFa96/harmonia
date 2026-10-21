// Interner P4.09-Adapter: geschriebene Partitur → exakte SATB-Schnitte → belegbare Befunde.
import {
  addFractions,
  analyzeVoiceLeading,
  compareFractions,
  durationValue,
  formatFraction,
  fraction,
  VOICE_LEADING_RULE_PHASE,
  type FourPartSlice,
  type Fraction,
  type Pitch,
  type Voice as SatbVoice,
  type VoiceLeadingFinding,
  type VoiceLeadingOptions,
  type VoiceLeadingRules,
} from '@harmonia/theory';
import { validateScore, type EventPosition, type Score } from './score.ts';

/** Explizite Zuordnung; keine Ableitung der Stimme aus Schlüssel oder klingender Lage. */
export type SatbAssignment = Readonly<
  Record<SatbVoice, { readonly staff: number; readonly voice: number }>
>;

export interface VoiceLeadingScorePosition {
  /** Exakter Zeitpunkt als Bruch der ganzen Note ab Partiturbeginn. */
  readonly at: Fraction;
  readonly measure: number;
  readonly offset: Fraction;
}

export interface VoiceLeadingScoreTone {
  readonly voice: SatbVoice;
  readonly pitch: Pitch | null;
  readonly ref: EventPosition;
  /** Beginn derselben Haltebogenkette, für unveränderte Lagen ohne Mehrfachmeldung. */
  readonly origin: EventPosition;
}

export interface VoiceLeadingScoreFrame {
  readonly position: VoiceLeadingScorePosition;
  readonly slice: FourPartSlice;
  readonly notes: Readonly<Record<SatbVoice, VoiceLeadingScoreTone>>;
}

export interface VoiceLeadingScoreTimeline {
  readonly duration: Fraction;
  readonly frames: readonly VoiceLeadingScoreFrame[];
}

export interface LocatedVoiceLeadingFinding extends VoiceLeadingFinding {
  readonly position: VoiceLeadingScorePosition;
  readonly notes: readonly VoiceLeadingScoreTone[];
  readonly previous?: {
    readonly position: VoiceLeadingScorePosition;
    readonly notes: readonly VoiceLeadingScoreTone[];
  };
}

export interface VoiceLeadingScoreAnalysis extends VoiceLeadingScoreTimeline {
  readonly status: 'draft';
  readonly findings: readonly LocatedVoiceLeadingFinding[];
}

const VOICES: readonly SatbVoice[] = ['bass', 'tenor', 'alto', 'soprano'];

function voiceRecord<T>(value: (voice: SatbVoice) => T): Record<SatbVoice, T> {
  return {
    bass: value('bass'),
    tenor: value('tenor'),
    alto: value('alto'),
    soprano: value('soprano'),
  };
}

interface Segment extends VoiceLeadingScoreTone {
  readonly start: Fraction;
  readonly end: Fraction;
  readonly tie: boolean;
}

/**
 * Ein Schnitt an jedem Ereignisanfang der vier gewählten Stimmen. Lange und gebundene
 * Töne klingen weiter, Pausen bleiben null. Die vier Stimmen müssen gemeinsame Taktgrenzen
 * haben; ein gleich langer Auftakt ist möglich. Akkorde innerhalb einer Stimme sind mehrdeutig.
 */
export function voiceLeadingScoreTimeline(
  score: Score,
  assignment: SatbAssignment,
): VoiceLeadingScoreTimeline {
  if (validateScore(score).length) throw new RangeError('Ungültige Partitur für die Satzprüfung');
  const identities = VOICES.map((voice) => {
    const binding = assignment[voice];
    if (
      !Number.isInteger(binding.staff) ||
      binding.staff < 0 ||
      !Number.isInteger(binding.voice) ||
      binding.voice < 0
    ) {
      throw new RangeError(`Ungültige SATB-Zuordnung: ${voice}`);
    }
    return `${String(binding.staff)}:${String(binding.voice)}`;
  });
  if (new Set(identities).size !== VOICES.length)
    throw new RangeError('Vier verschiedene Notationsstimmen sind erforderlich');
  const staves = voiceRecord((voice) => {
    const staff = score.staves[assignment[voice].staff];
    if (!staff || staff.measures.length === 0)
      throw new RangeError(`System für ${voice} fehlt oder ist leer`);
    return staff;
  });
  const measureCount = staves.bass.measures.length;
  if (VOICES.some((voice) => staves[voice].measures.length !== measureCount)) {
    throw new RangeError('Die gewählten Systeme müssen gleich viele Takte haben');
  }

  const segments = voiceRecord<Segment[]>(() => []);
  const last: Partial<Record<SatbVoice, Segment>> = {};
  const moments = new Map<string, VoiceLeadingScorePosition>();
  let measureStart = fraction(0);
  for (let measure = 0; measure < measureCount; measure++) {
    const lengths = voiceRecord((voice) => {
      const binding = assignment[voice];
      const track = staves[voice].measures[measure]?.voices[binding.voice];
      if (!track || track.events.length === 0)
        throw new RangeError(`Stimme ${voice} fehlt in Takt ${String(measure)}`);
      let offset = fraction(0);
      for (const [eventIndex, event] of track.events.entries()) {
        if (event.kind === 'chord') throw new RangeError('SATB-Stimmen müssen einstimmig sein');
        const length = durationValue(event.duration);
        if (compareFractions(length, fraction(0)) <= 0)
          throw new RangeError('Ereignisse brauchen eine positive Dauer');
        const start = addFractions(measureStart, offset);
        const ref = { staff: binding.staff, measure, voice: binding.voice, event: eventIndex };
        const previous = last[voice];
        const origin = previous?.tie ? previous.origin : ref;
        const segment: Segment = {
          voice,
          pitch: event.kind === 'note' ? event.pitch : null,
          ref,
          origin,
          start,
          end: addFractions(start, length),
          tie: event.kind === 'note' && event.tie,
        };
        segments[voice].push(segment);
        last[voice] = segment;
        moments.set(formatFraction(start), { at: start, measure, offset });
        offset = addFractions(offset, length);
      }
      return offset;
    });
    if (
      compareFractions(lengths.bass, fraction(0)) <= 0 ||
      VOICES.some((voice) => compareFractions(lengths[voice], lengths.bass) !== 0)
    ) {
      throw new RangeError('Die vier Stimmen müssen in jedem Takt gleich lang sein');
    }
    measureStart = addFractions(measureStart, lengths.bass);
  }

  const cursor = voiceRecord(() => 0);
  const frames = [...moments.values()]
    .sort((a, b) => compareFractions(a.at, b.at))
    .map((position): VoiceLeadingScoreFrame => {
      const notes = voiceRecord((voice): VoiceLeadingScoreTone => {
        let segment = segments[voice][cursor[voice]];
        while (segment && compareFractions(segment.end, position.at) <= 0) {
          cursor[voice]++;
          segment = segments[voice][cursor[voice]];
        }
        if (!segment || compareFractions(segment.start, position.at) > 0)
          throw new RangeError('Lücke in der Notationsstimme');
        return { voice, pitch: segment.pitch, ref: segment.ref, origin: segment.origin };
      });
      return { position, notes, slice: voiceRecord((voice) => notes[voice].pitch) };
    });
  return { duration: measureStart, frames };
}

/** Prüft ausschließlich die vier zugeordneten Stimmen; Textlabels sind kein Harmoniebeweis. */
export function analyzeVoiceLeadingScore(
  score: Score,
  assignment: SatbAssignment,
  rules: VoiceLeadingRules,
  options: VoiceLeadingOptions = {},
): VoiceLeadingScoreAnalysis {
  const timeline = voiceLeadingScoreTimeline(score, assignment);
  const raw = analyzeVoiceLeading(
    timeline.frames.map((frame) => frame.slice),
    rules,
    options,
  );
  const findings: LocatedVoiceLeadingFinding[] = [];
  let index = 0;
  let previousKeys = new Set<string>();
  for (const [at, frame] of timeline.frames.entries()) {
    const currentKeys = new Set<string>();
    let finding = raw[index];
    while (finding?.at === at) {
      const notes = finding.voices.map((voice) => frame.notes[voice]);
      const phase = VOICE_LEADING_RULE_PHASE[finding.rule];
      const key = `${finding.rule}:${notes.map((tone) => `${tone.voice}:${refKey(tone.origin)}`).join(',')}`;
      if (phase === 'slice') currentKeys.add(key);
      const previous = phase === 'motion' ? timeline.frames[at - 1] : undefined;
      if (phase === 'motion' || !previousKeys.has(key)) {
        findings.push({
          ...finding,
          position: frame.position,
          notes,
          ...(previous
            ? {
                previous: {
                  position: previous.position,
                  notes: finding.voices.map((voice) => previous.notes[voice]),
                },
              }
            : {}),
        });
      }
      finding = raw[++index];
    }
    previousKeys = currentKeys;
  }
  return { ...timeline, status: 'draft', findings };
}

function refKey(ref: EventPosition): string {
  return `${String(ref.staff)}:${String(ref.measure)}:${String(ref.voice)}:${String(ref.event)}`;
}
