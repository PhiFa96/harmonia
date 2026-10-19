import { note, singleStaffScore } from '@harmonia/notation';
import { duration, formatPitch } from '@harmonia/theory';
import type { Duration, Pitch, Rng } from '@harmonia/theory';
import type { DictationItem, DictationParams, ExerciseItem } from './types.ts';

const C: Pitch = { letter: 'C', alter: 0, octave: 4 };
const D: Pitch = { letter: 'D', alter: 0, octave: 4 };
const E: Pitch = { letter: 'E', alter: 0, octave: 4 };
const F: Pitch = { letter: 'F', alter: 0, octave: 4 };
const G: Pitch = { letter: 'G', alter: 0, octave: 4 };
const PITCHES = [C, D, E, F, G] as const;
const INPUT_PITCHES = [
  C,
  { ...C, alter: 1 },
  D,
  { ...D, alter: 1 },
  E,
  F,
  { ...F, alter: 1 },
  G,
] as const;
const Q = duration('quarter'),
  H = duration('half'),
  EIGHTH = duration('eighth');
const RHYTHMS: readonly (readonly Duration[])[] = [
  [Q, Q, Q, Q],
  [H, Q, Q],
  [Q, H, Q],
  [Q, Q, H],
  [EIGHTH, EIGHTH, Q, H],
  [H, EIGHTH, EIGHTH, Q],
];
const INPUT_DURATIONS = [EIGHTH, Q, H] as const;
export function isDictationItem(item: ExerciseItem): item is DictationItem {
  return item.type === 'MELODY_DICTATION' || item.type === 'RHYTHM_DICTATION';
}
export function dictationDurationId(value: Duration): string {
  return `${value.value}${value.dots ? '.' : ''}`;
}
export function dictationInputValues(
  item: DictationItem,
  answer: string | null,
): string[] | undefined {
  if (answer === null) return [];
  if (!answer.startsWith('dictation:') || answer.length > 100) return undefined;
  const body = answer.slice(10);
  if (!body) return [];
  const values = body.split(',');
  const allowed =
    item.type === 'MELODY_DICTATION'
      ? item.inputPitches.map((pitch) => formatPitch(pitch))
      : item.inputDurations.map(dictationDurationId);
  if (values.length > item.pitches.length || values.some((value) => !allowed.includes(value)))
    return undefined;
  return values;
}
export function dictationAnswerId(values: readonly string[]): string {
  return `dictation:${values.join(',')}`;
}
/** Lösung aus den hörbaren Score-Ereignissen, unabhängig von den Antwortfeldern. */
export function dictationExpected(item: DictationItem): string {
  const events = item.score.staves[0]?.measures[0]?.voices[0]?.events;
  if (events?.length !== item.pitches.length || events.some((event) => event.kind !== 'note'))
    throw new RangeError('Diktat-Score ist unvollständig');
  return dictationAnswerId(
    events.map((event) =>
      item.type === 'MELODY_DICTATION'
        ? formatPitch((event as { pitch: Pitch }).pitch)
        : dictationDurationId(event.duration),
    ),
  );
}
export function generateDictation(
  params: DictationParams,
  rng: Rng,
  type: DictationItem['type'],
): DictationItem {
  const level = params.level ?? 1;
  const pitches =
    type === 'MELODY_DICTATION'
      ? [
          C,
          ...Array.from({ length: 3 }, () => rng.pick(level === 1 ? PITCHES.slice(0, 3) : PITCHES)),
        ]
      : Array.from({ length: 4 }, () => G);
  const durations =
    type === 'MELODY_DICTATION'
      ? pitches.map(() => Q)
      : [
          ...rng.pick(
            RHYTHMS.filter(
              (pattern) => level === 2 || pattern.every((value) => value.value !== 'eighth'),
            ),
          ),
        ];
  const targets = type === 'MELODY_DICTATION' ? pitches : durations.map(() => G);
  const score = singleStaffScore(
    [targets.map((pitch, index) => note(pitch, durations[index] ?? Q))],
    { clef: 'treble' },
  );
  const item: DictationItem = {
    type,
    clef: 'treble',
    score,
    pitches: targets,
    durations,
    inputPitches: INPUT_PITCHES,
    inputDurations: INPUT_DURATIONS,
    choices: [],
  };
  return item;
}
