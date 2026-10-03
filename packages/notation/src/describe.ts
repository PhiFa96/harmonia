// Texte für Screenreader: jede Note, jeder Akkord und jede Pause einzeln, auf Deutsch oder Englisch.

import { durationName, spokenPitchName } from '@harmonia/theory';

import type { Score, VoiceEvent } from './score.ts';

export interface DescribeOptions {
  readonly language?: 'de' | 'en';
  /** Nur Englisch: US („quarter note“, Standard) oder UK („crotchet“). */
  readonly variant?: 'us' | 'uk';
}

/**
 * Beschreibung eines Ereignisses, z. B. „Viertelnote, eingestrichenes c“,
 * „Halbe Note, Akkord: eingestrichenes c, eingestrichenes e“ oder „Achtelpause“.
 */
export function describeEvent(event: VoiceEvent, options: DescribeOptions = {}): string {
  const language = options.language ?? 'de';
  const variant = options.variant ?? 'us';
  const kind = event.kind === 'rest' ? 'rest' : 'note';
  const duration = capitalize(durationName(event.duration, { language, variant, kind }));
  switch (event.kind) {
    case 'rest':
      return duration;
    case 'note':
      return `${duration}, ${spokenPitchName(event.pitch, language)}`;
    case 'chord': {
      const label = language === 'de' ? 'Akkord' : 'chord';
      const pitches = [...event.notes]
        .map((n) => n.pitch)
        .map((p) => spokenPitchName(p, language))
        .join(', ');
      return `${duration}, ${label}: ${pitches}`;
    }
  }
}

export interface EventDescription {
  readonly staff: number;
  readonly measure: number;
  readonly voice: number;
  readonly event: number;
  readonly text: string;
}

/** Beschreibungen aller Ereignisse in Partiturreihenfolge. */
export function describeScore(score: Score, options: DescribeOptions = {}): EventDescription[] {
  return score.staves.flatMap((staff, staffIndex) =>
    staff.measures.flatMap((m, measure) =>
      m.voices.flatMap((v, voice) =>
        v.events.map((e, event) => ({
          staff: staffIndex,
          measure,
          voice,
          event,
          text: describeEvent(e, options),
        })),
      ),
    ),
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
