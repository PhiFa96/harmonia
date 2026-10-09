import type { Fraction, Pitch, Tempo } from '@harmonia/theory';
import {
  addFractions,
  compareFractions,
  durationSeconds,
  durationValue,
  formatPitch,
  fraction,
  subtractFractions,
} from '@harmonia/theory';
import type { Score } from './score.ts';
import { validateScore } from './score.ts';

interface Tone {
  readonly pitch: Pitch;
  readonly at: Fraction;
  duration: Fraction;
}
export interface ScoreTimeline {
  readonly tones: readonly {
    readonly pitch: Pitch;
    readonly onsetSeconds: number;
    readonly durationSeconds: number;
  }[];
  readonly durationSeconds: number;
}

/** Tatsächliche Partitur als Zeitfolge: Pausen, Akkorde, Stimmen und Haltebögen erhalten. */
export function scoreTimeline(score: Score, tempo: Tempo): ScoreTimeline {
  if (!score.staves.length || validateScore(score).length)
    throw new RangeError('Ungültiges Klangbeispiel');
  const tones: Tone[] = [],
    held = new Map<string, Map<string, Tone>>();
  let measureStart = fraction(0);
  const measureCount = Math.max(...score.staves.map((staff) => staff.measures.length));
  for (let measure = 0; measure < measureCount; measure++) {
    let measureLength = fraction(0);
    score.staves.forEach((staff, staffIndex) => {
      staff.measures[measure]?.voices.forEach((voice, voiceIndex) => {
        const voiceId = `${String(staffIndex)}:${String(voiceIndex)}`;
        let previous = held.get(voiceId) ?? new Map<string, Tone>(),
          position = fraction(0);
        for (const event of voice.events) {
          const at = addFractions(measureStart, position),
            length = durationValue(event.duration),
            next = new Map<string, Tone>();
          const notes = event.kind === 'note' ? [event] : event.kind === 'chord' ? event.notes : [];
          for (const note of notes) {
            const id = formatPitch(note.pitch),
              existing = previous.get(id),
              tone = existing ?? { pitch: note.pitch, at, duration: length };
            if (existing) tone.duration = subtractFractions(addFractions(at, length), tone.at);
            else tones.push(tone);
            if (note.tie) next.set(id, tone);
          }
          previous = next;
          position = addFractions(position, length);
        }
        held.set(voiceId, previous);
        if (compareFractions(position, measureLength) > 0) measureLength = position;
      });
    });
    measureStart = addFractions(measureStart, measureLength);
  }
  return {
    tones: tones.map((tone) => ({
      pitch: tone.pitch,
      onsetSeconds: durationSeconds(tone.at, tempo),
      durationSeconds: durationSeconds(tone.duration, tempo),
    })),
    durationSeconds: durationSeconds(measureStart, tempo),
  };
}
