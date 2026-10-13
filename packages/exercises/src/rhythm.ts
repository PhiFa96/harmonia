import { note, rest, singleStaffScore } from '@harmonia/notation';
import type { Score, VoiceEvent } from '@harmonia/notation';
import type { Duration, Fraction, Rng, TimeSignature } from '@harmonia/theory';
import {
  addFractions,
  beats,
  compareFractions,
  duration,
  durationSeconds,
  durationValue,
  fraction,
  fractionEquals,
  formatTimeSignature,
  multiplyFractions,
  parseTimeSignature,
} from '@harmonia/theory';
import { clefs, options } from './parameters.ts';
import type { ExerciseItem, MeterParams, MvpMeter, RhythmItem, RhythmParams } from './types.ts';

export const MVP_METERS = [
  '2/2',
  '2/4',
  '3/4',
  '4/4',
  '3/8',
  '6/8',
  '9/8',
  '12/8',
] as const satisfies readonly MvpMeter[];
export function isRhythmItem(item: ExerciseItem): item is RhythmItem {
  return item.type === 'RHYTHM_TAP' || item.type === 'METER_IDENTIFY';
}
export function rhythmMeter(item: RhythmItem): TimeSignature {
  const meter = item.score.staves[0]?.timeSignature;
  if (!meter) throw new RangeError('Taktangabe fehlt');
  return meter;
}
export function meterAnswerId(meter: TimeSignature): string {
  return `meter:${formatTimeSignature(meter)}`;
}
export function meterFromId(id: string): TimeSignature {
  const name = MVP_METERS.find((name) => `meter:${name}` === id);
  if (!name) throw new RangeError('Ungültige Takt-ID');
  return parseTimeSignature(name);
}
const VALUES = ['whole', 'half', 'quarter', 'eighth', 'sixteenth'] as const;
const DURATIONS = VALUES.flatMap((value) => [duration(value), duration(value, 1)]);
export function rhythmBeat(item: RhythmItem): Duration {
  const value = beats(rhythmMeter(item))[0];
  const result = DURATIONS.find((d) => value && fractionEquals(durationValue(d), value));
  if (!result) throw new RangeError('Grundschlag nicht unterstützt');
  return result;
}
export function rhythmMeasureMs(item: RhythmItem): number {
  return (rhythmMeter(item).grouping.length * 60000) / item.bpm;
}
export interface RhythmEvent {
  readonly rest: boolean;
  readonly onsetMs: number;
  readonly durationMs: number;
}
/** Aus dem tatsächlichen Notenbild, mit exakten Brüchen bis zur Umrechnung in Sekunden. */
export function rhythmTimeline(item: RhythmItem): readonly RhythmEvent[] {
  const events = item.score.staves[0]?.measures[0]?.voices[0]?.events;
  if (!events) throw new RangeError('Rhythmus fehlt');
  let position = fraction(0);
  const tempo = { bpm: item.bpm, beat: rhythmBeat(item) };
  return events.map((event) => {
    const result = {
      rest: event.kind === 'rest',
      onsetMs: durationSeconds(position, tempo) * 1000,
      durationMs: durationSeconds(event.duration, tempo) * 1000,
    };
    position = addFractions(position, durationValue(event.duration));
    return result;
  });
}
export function rhythmOnsets(item: RhythmItem): readonly number[] {
  return rhythmTimeline(item)
    .filter((event) => !event.rest)
    .map((event) => Math.round(event.onsetMs));
}
export function rhythmTolerance(item: RhythmItem): number {
  const onsets = rhythmOnsets(item);
  const distances = onsets.slice(1).map((time, index) => time - (onsets[index] ?? 0));
  return Math.min(
    item.toleranceMs,
    Math.floor(Math.min(...distances, rhythmMeasureMs(item)) * 0.4),
  );
}
export function rhythmAnswerId(taps: readonly number[]): string {
  return `taps:${taps.join(',')}`;
}
export function rhythmAnswerTaps(item: RhythmItem, answer: string): readonly number[] | undefined {
  if (!answer.startsWith('taps:') || answer.length > 1000) return undefined;
  if (answer === 'taps:') return [];
  const parts = answer.slice(5).split(',');
  if (parts.length > 128 || parts.some((value) => !/^-?(?:0|[1-9]\d*)$/.test(value)))
    return undefined;
  const taps = parts.map(Number);
  if (
    rhythmAnswerId(taps) !== answer ||
    taps.some(
      (time, index) =>
        !Number.isSafeInteger(time) ||
        time < -item.toleranceMs ||
        time > Math.ceil(rhythmMeasureMs(item)) + item.toleranceMs ||
        (index > 0 && time < (taps[index - 1] ?? 0)),
    )
  )
    return undefined;
  return taps;
}
export interface RhythmMatch {
  readonly expectedMs: number;
  readonly tapMs?: number;
  readonly offsetMs?: number;
}
export interface RhythmAssessment {
  readonly targets: readonly RhythmMatch[];
  readonly extras: readonly number[];
  readonly matched: number;
  readonly missing: number;
  readonly toleranceMs: number;
  readonly correct: boolean;
}
interface Alignment {
  readonly pairs: readonly (readonly [number, number])[];
  readonly cost: number;
}
/** Reihenfolge erhalten, Treffer maximieren, dann Abweichung minimieren. Extras verschieben keine Folgetreffer. */
export function assessRhythm(item: RhythmItem, taps: readonly number[]): RhythmAssessment {
  const expected = rhythmOnsets(item),
    toleranceMs = rhythmTolerance(item);
  const rows: Alignment[][] = Array.from({ length: expected.length + 1 }, () =>
    Array.from({ length: taps.length + 1 }, () => ({ pairs: [], cost: 0 })),
  );
  for (let i = 1; i <= expected.length; i++)
    for (let j = 1; j <= taps.length; j++) {
      const above = rows[i - 1]?.[j],
        left = rows[i]?.[j - 1],
        diagonal = rows[i - 1]?.[j - 1];
      if (!above || !left || !diagonal) throw new RangeError('Rhythmusvergleich fehlt');
      const offset = Math.abs((expected[i - 1] ?? 0) - (taps[j - 1] ?? 0));
      const candidates = [
        above,
        left,
        ...(offset <= toleranceMs
          ? [{ pairs: [...diagonal.pairs, [i - 1, j - 1] as const], cost: diagonal.cost + offset }]
          : []),
      ];
      const best = candidates.sort((a, b) => b.pairs.length - a.pairs.length || a.cost - b.cost)[0];
      const row = rows[i];
      if (best && row) row[j] = best;
    }
  const pairs = rows[expected.length]?.[taps.length]?.pairs ?? [];
  const targets = expected.map((expectedMs, index) => {
    const pair = pairs.find((pair) => pair[0] === index),
      tapMs = pair ? taps[pair[1]] : undefined;
    return tapMs === undefined
      ? { expectedMs }
      : { expectedMs, tapMs, offsetMs: tapMs - expectedMs };
  });
  return {
    targets,
    extras: taps.filter((_time, index) => !pairs.some((pair) => pair[1] === index)),
    matched: pairs.length,
    missing: expected.length - pairs.length,
    toleranceMs,
    correct: expected.length === taps.length && pairs.length === expected.length,
  };
}
function allowedMeters(params: MeterParams): readonly MvpMeter[] {
  if (!params.meters.length || params.meters.some((value) => !MVP_METERS.includes(value)))
    throw new RangeError('Ungültige Taktart');
  return [...new Set(params.meters)];
}
interface CellNote {
  readonly value: Fraction;
  readonly rest: boolean;
}
function cells(meter: TimeSignature, params: RhythmParams): readonly (readonly VoiceEvent[])[] {
  const beat = beats(meter)[0];
  if (!beat) throw new RangeError('Grundschlag fehlt');
  if (params.level === 'pulse')
    return [[note({ letter: 'G', alter: 0, octave: 4 }, duration('quarter'))]];
  const ratios: (readonly CellNote[])[] = [
    [{ value: fraction(1), rest: false }],
    ...(meter.grouping[0] === 3
      ? [[1, 1, 1].map(() => ({ value: fraction(1, 3), rest: false }))]
      : [[1, 1].map(() => ({ value: fraction(1, 2), rest: false }))]),
  ];
  if (params.level === 'dotted' || meter.grouping[0] === 3)
    ratios.push(
      [
        { value: fraction(2, 3), rest: false },
        { value: fraction(1, 3), rest: false },
      ],
      [
        { value: fraction(1, 3), rest: false },
        { value: fraction(2, 3), rest: false },
      ],
      [
        { value: fraction(3, 4), rest: false },
        { value: fraction(1, 4), rest: false },
      ],
    );
  if (params.rests ?? true) {
    ratios.push([{ value: fraction(1), rest: true }]);
    const split = meter.grouping[0] === 3 ? fraction(1, 3) : fraction(1, 2),
      remaining = meter.grouping[0] === 3 ? fraction(2, 3) : fraction(1, 2);
    ratios.push(
      [
        { value: split, rest: true },
        { value: remaining, rest: false },
      ],
      [
        { value: remaining, rest: false },
        { value: split, rest: true },
      ],
    );
  }
  return ratios.flatMap((cell) => {
    const events: VoiceEvent[] = [];
    for (const part of cell) {
      const value = multiplyFractions(beat, part.value),
        d = DURATIONS.find((d) => fractionEquals(durationValue(d), value));
      if (!d || compareFractions(value, fraction(1, 16)) < 0) return [];
      events.push(part.rest ? rest(d) : note({ letter: 'G', alter: 0, octave: 4 }, d));
    }
    return [events];
  });
}
export function generateRhythm(
  params: RhythmParams,
  rng: Rng,
  type: RhythmItem['type'],
): RhythmItem {
  const meters = allowedMeters(params),
    allowedClefs = clefs(params),
    tempos = params.tempos ?? [72, 96];
  if (
    !tempos.length ||
    tempos.some((bpm) => !Number.isInteger(bpm) || bpm < 60 || bpm > 120) ||
    !['basic', 'dotted', 'pulse'].includes(params.level ?? 'basic') ||
    (params.level === 'pulse' &&
      (type !== 'RHYTHM_TAP' ||
        meters.some((meter) => !['2/4', '3/4', '4/4'].includes(meter)) ||
        params.rests === true)) ||
    (params.rests !== undefined && typeof params.rests !== 'boolean') ||
    !Number.isInteger(params.toleranceMs ?? 120) ||
    (params.toleranceMs ?? 120) < 40 ||
    (params.toleranceMs ?? 120) > 180
  )
    throw new RangeError('Ungültige Rhythmusparameter');
  const meter = parseTimeSignature(rng.pick(meters)),
    clef = rng.pick(allowedClefs),
    available = cells(meter, params);
  const selected = Array.from({ length: meter.grouping.length }, () => rng.pick(available));
  if (selected.flat().every((event) => event.kind === 'rest')) selected[0] = available[0] ?? [];
  const events = selected
    .flat()
    .map((event) =>
      event.kind === 'note'
        ? { ...event, pitch: { ...event.pitch, octave: clef === 'treble' ? 4 : 3 } }
        : event,
    );
  return {
    type,
    ...(params.level === 'pulse' ? { presentation: 'pulse' as const } : {}),
    clef,
    meter,
    bpm: type === 'METER_IDENTIFY' ? 84 : rng.pick([...new Set(tempos)]),
    toleranceMs: params.toleranceMs ?? 120,
    score: singleStaffScore([events], { clef, timeSignature: meter }),
    choices:
      type === 'RHYTHM_TAP'
        ? []
        : options(
            meterAnswerId(meter),
            meters.map((name) => `meter:${name}`),
            rng,
          ),
  };
}
export function rhythmBeatCount(item: RhythmItem): number {
  return beats(rhythmMeter(item)).length;
}

/** Derselbe geprüfte Puls für Inhaltsbeispiele, Darstellung und Audio; keine zweite Zeitquelle. */
export function pulseExample(score: Score, bpm: number): RhythmItem {
  const staff = score.staves[0],
    meter = staff?.timeSignature,
    measure = staff?.measures[0],
    events = measure?.voices[0]?.events;
  if (
    !Number.isInteger(bpm) ||
    bpm < 60 ||
    bpm > 120 ||
    score.staves.length !== 1 ||
    staff?.measures.length !== 1 ||
    !meter ||
    !['2/4', '3/4', '4/4'].includes(formatTimeSignature(meter)) ||
    meter.grouping.some((value) => value !== 1) ||
    (staff.clef !== 'treble' && staff.clef !== 'bass') ||
    !fractionEquals(beats(meter)[0] ?? fraction(0), fraction(1, 4)) ||
    measure?.voices.length !== 1 ||
    measure.changes !== undefined ||
    events?.length !== beats(meter).length ||
    events.some(
      (event) =>
        event.kind !== 'note' ||
        !fractionEquals(durationValue(event.duration), fraction(1, 4)) ||
        event.tie,
    )
  )
    throw new RangeError(
      'Pulsbeispiel braucht einen vollständigen gleichmäßigen Zweier-, Dreier- oder Vierertakt',
    );
  return {
    type: 'RHYTHM_TAP',
    presentation: 'pulse',
    score,
    clef: staff.clef,
    meter,
    bpm,
    toleranceMs: 120,
    choices: [],
  };
}
