import { note, singleStaffScore } from '@harmonia/notation';
import type { Interval, Pitch, Rng } from '@harmonia/theory';
import {
  LETTERS,
  duration,
  formatInterval,
  midi,
  parseInterval,
  semitones,
  transposeBy,
} from '@harmonia/theory';
import type {
  AuralIntervalParams,
  ExerciseClef,
  ExerciseSpec,
  IntervalItem,
  NoteItem,
  NoteParams,
  PitchRange,
  VisualIntervalParams,
} from './types.ts';

const DEFAULT_RANGES: Readonly<Record<ExerciseClef, PitchRange>> = {
  treble: { minMidi: 60, maxMidi: 84 },
  bass: { minMidi: 36, maxMidi: 60 },
};
export function noteAnswerId(pitch: Pick<Pitch, 'letter' | 'alter'>): string {
  return `${pitch.letter}:${String(pitch.alter)}`;
}
export function intervalAnswerId(interval: Interval): string {
  return formatInterval({ ...interval, direction: 1 });
}

function clefs(params: NoteParams): readonly ExerciseClef[] {
  const values = params.clefs ?? ['treble'];
  if (values.length === 0 || values.some((clef) => !['treble', 'bass'].includes(clef)))
    throw new RangeError('Mindestens ein unterstützter Schlüssel ist nötig');
  return [...new Set(values)];
}
function accidentalLimit(params: NoteParams, fallback: 0 | 1): number {
  const limit = params.maxAccidentals ?? fallback;
  if (!Number.isInteger(limit) || limit < 0 || limit > 2)
    throw new RangeError('Vorzeichen müssen zwischen 0 und 2 liegen');
  return limit;
}
function rangeFor(params: NoteParams, clef: ExerciseClef): PitchRange {
  const range = params.range ?? DEFAULT_RANGES[clef];
  if (
    !Number.isInteger(range.minMidi) ||
    !Number.isInteger(range.maxMidi) ||
    range.minMidi < 21 ||
    range.maxMidi > 108 ||
    range.minMidi > range.maxMidi
  )
    throw new RangeError('Tonbereich muss innerhalb A0–C8 liegen');
  return range;
}
function pitchPool(range: PitchRange, limit: number): Pitch[] {
  const result: Pitch[] = [];
  for (let octave = 0; octave <= 8; octave++) {
    for (const letter of LETTERS) {
      for (let alter = -limit; alter <= limit; alter++) {
        const pitch = { letter, alter, octave };
        if (midi(pitch) >= range.minMidi && midi(pitch) <= range.maxMidi) result.push(pitch);
      }
    }
  }
  return result;
}
function options(correct: string, available: readonly string[], rng: Rng): string[] {
  const others = rng
    .shuffle([...new Set(available)].filter((value) => value !== correct))
    .slice(0, 3);
  return rng.shuffle([correct, ...others]);
}
export function generateNote(params: NoteParams, rng: Rng): NoteItem {
  const allowedClefs = clefs(params);
  const limit = accidentalLimit(params, 0);
  const pools = allowedClefs.map((clef) => ({
    clef,
    pitches: pitchPool(rangeFor(params, clef), limit),
  }));
  if (pools.some((pool) => pool.pitches.length === 0))
    throw new RangeError('Tonbereich enthält keine erlaubte Note');
  const pool = rng.pick(pools);
  const pitch = rng.pick(pool.pitches);
  const names = LETTERS.flatMap((letter) =>
    Array.from({ length: limit * 2 + 1 }, (_, index) =>
      noteAnswerId({ letter, alter: index - limit }),
    ),
  );
  return {
    type: 'NOTE_NAME',
    clef: pool.clef,
    pitch,
    score: singleStaffScore([[note(pitch, duration('whole'))]], { clef: pool.clef }),
    choices: options(noteAnswerId(pitch), names, rng),
  };
}

function allowedIntervals(values: readonly string[], aural: boolean): readonly Interval[] {
  if (values.length === 0) throw new RangeError('Mindestens ein Intervall ist nötig');
  const intervals = [
    ...new Map(
      values.map((value) => {
        const parsed = parseInterval(value);
        if (parsed.direction < 0 || parsed.number > 15 || semitones(parsed) < 0)
          throw new RangeError(
            'Intervalle müssen aufwärts und höchstens eine Doppeloktave groß sein',
          );
        return [intervalAnswerId(parsed), parsed] as const;
      }),
    ).values(),
  ];
  if (aural && new Set(intervals.map(semitones)).size !== intervals.length)
    throw new RangeError('Gleich klingende Intervalle sind in einer Hörfrage nicht unterscheidbar');
  return intervals;
}
interface Pair {
  readonly clef: ExerciseClef;
  readonly from: Pitch;
  readonly to: Pitch;
  readonly direction: 1 | -1;
}
function generateInterval(
  params: VisualIntervalParams | AuralIntervalParams,
  rng: Rng,
  type: IntervalItem['type'],
): IntervalItem {
  const aural = type === 'INTERVAL_IDENTIFY_AURAL';
  const allowedClefs = clefs(params);
  const limit = accidentalLimit(params, 1);
  const playback = 'playback' in params ? (params.playback ?? 'melodic-up') : 'melodic-up';
  if (!['melodic-up', 'melodic-down', 'harmonic'].includes(playback))
    throw new RangeError('Unbekannte Wiedergabe');
  const direction = 'direction' in params ? (params.direction ?? 'up') : 'up';
  if (!['up', 'down', 'both'].includes(direction)) throw new RangeError('Unbekannte Richtung');
  const directions: readonly (1 | -1)[] = aural
    ? [playback === 'melodic-down' ? -1 : 1]
    : direction === 'both'
      ? [1, -1]
      : [direction === 'down' ? -1 : 1];
  const intervals = allowedIntervals(params.intervals, aural);
  const pools = allowedClefs.map((clef) => ({
    clef,
    range: rangeFor(params, clef),
    pitches: pitchPool(rangeFor(params, clef), limit),
  }));
  // Erst alle erlaubten Ziele prüfen: kein Zufalls-Seed darf durch einen leeren Teilbereich scheitern.
  const groups = intervals.map((interval) => {
    const pairs: Pair[] = [];
    for (const pool of pools) {
      for (const from of pool.pitches) {
        for (const dir of directions) {
          let to: Pitch;
          try {
            to = transposeBy(from, { ...interval, direction: dir });
          } catch (error) {
            if (error instanceof RangeError) continue;
            throw error;
          }
          if (
            Math.abs(to.alter) <= limit &&
            midi(to) >= pool.range.minMidi &&
            midi(to) <= pool.range.maxMidi
          )
            pairs.push({ clef: pool.clef, from, to, direction: dir });
        }
      }
    }
    if (pairs.length === 0)
      throw new RangeError(
        `Kein darstellbares Tonpaar für ${intervalAnswerId(interval)} im Tonbereich`,
      );
    return { interval, pairs };
  });
  const group = rng.pick(groups);
  const pair = rng.pick(group.pairs);
  return {
    type,
    clef: pair.clef,
    from: pair.from,
    to: pair.to,
    playback: aural ? playback : pair.direction < 0 ? 'melodic-down' : 'melodic-up',
    score: singleStaffScore(
      [[note(pair.from, duration('half')), note(pair.to, duration('half'))]],
      { clef: pair.clef },
    ),
    choices: options(intervalAnswerId(group.interval), intervals.map(intervalAnswerId), rng),
  };
}
export function generateVisualInterval(params: VisualIntervalParams, rng: Rng): IntervalItem {
  return generateInterval(params, rng, 'INTERVAL_IDENTIFY_VISUAL');
}
export function generateAuralInterval(params: AuralIntervalParams, rng: Rng): IntervalItem {
  return generateInterval(params, rng, 'INTERVAL_IDENTIFY_AURAL');
}
export function generateExercise(spec: ExerciseSpec, rng: Rng) {
  switch (spec.type) {
    case 'NOTE_NAME':
      return generateNote(spec.params, rng);
    case 'INTERVAL_IDENTIFY_VISUAL':
      return generateVisualInterval(spec.params, rng);
    case 'INTERVAL_IDENTIFY_AURAL':
      return generateAuralInterval(spec.params, rng);
  }
}
