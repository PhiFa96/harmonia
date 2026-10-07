import { MAX_STEP, MIN_STEP, note, rest, singleStaffScore, stepOf } from '@harmonia/notation';
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
  IntervalBuildItem,
  KeyFindItem,
  NoteItem,
  NotePlaceItem,
  NoteParams,
  VisualIntervalParams,
} from './types.ts';

import { accidentalLimit, clefs, options, pitchPool, rangeFor } from './parameters.ts';
import { generateScale, generateKeySignature } from './tonality.ts';
import { generateChord } from './chords.ts';
export function noteAnswerId(pitch: Pick<Pitch, 'letter' | 'alter'>): string {
  return `${pitch.letter}:${String(pitch.alter)}`;
}
export function intervalAnswerId(interval: Interval): string {
  return formatInterval({ ...interval, direction: 1 });
}

function choosePitch(params: NoteParams, rng: Rng, editable = false) {
  const allowedClefs = clefs(params);
  const limit = accidentalLimit(params, 0);
  const pools = allowedClefs.map((clef) => ({
    clef,
    pitches: pitchPool(rangeFor(params, clef), limit).filter(
      (pitch) => !editable || (stepOf(pitch, clef) >= MIN_STEP && stepOf(pitch, clef) <= MAX_STEP),
    ),
  }));
  if (pools.some((pool) => pool.pitches.length === 0))
    throw new RangeError('Tonbereich enthält keine erlaubte Note');
  const pool = rng.pick(pools);
  const pitch = rng.pick(pool.pitches);
  return { clef: pool.clef, pitch, limit };
}
export function generateNote(params: NoteParams, rng: Rng): NoteItem {
  const { clef, pitch, limit } = choosePitch(params, rng);
  const names = LETTERS.flatMap((letter) =>
    Array.from({ length: limit * 2 + 1 }, (_, index) =>
      noteAnswerId({ letter, alter: index - limit }),
    ),
  );
  return {
    type: 'NOTE_NAME',
    clef,
    pitch,
    score: singleStaffScore([[note(pitch, duration('whole'))]], { clef }),
    choices: options(noteAnswerId(pitch), names, rng),
  };
}
export function generateNotePlace(params: NoteParams, rng: Rng): NotePlaceItem {
  const { clef, pitch } = choosePitch(params, rng, true);
  return {
    type: 'NOTE_PLACE',
    clef,
    pitch,
    choices: [],
    score: singleStaffScore([[rest(duration('whole'))]], { clef }),
  };
}
export function generateKeyFind(params: NoteParams, rng: Rng): KeyFindItem {
  const { clef, pitch } = choosePitch(
    { ...params, range: params.range ?? { minMidi: 60, maxMidi: 76 } },
    rng,
  );
  return {
    type: 'KEY_FIND',
    clef,
    pitch,
    choices: [],
    score: singleStaffScore([[note(pitch, duration('whole'))]], { clef }),
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
  params: VisualIntervalParams,
  rng: Rng,
  type: 'INTERVAL_BUILD',
): IntervalBuildItem;
function generateInterval(
  params: VisualIntervalParams | AuralIntervalParams,
  rng: Rng,
  type: IntervalItem['type'],
): IntervalItem;
function generateInterval(
  params: VisualIntervalParams | AuralIntervalParams,
  rng: Rng,
  type: IntervalItem['type'] | 'INTERVAL_BUILD',
): IntervalItem | IntervalBuildItem {
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
            (type !== 'INTERVAL_BUILD' ||
              [from, to].every(
                (pitch) =>
                  stepOf(pitch, pool.clef) >= MIN_STEP && stepOf(pitch, pool.clef) <= MAX_STEP,
              )) &&
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
    score:
      type === 'INTERVAL_BUILD'
        ? singleStaffScore([[note(pair.from, duration('whole'))], [rest(duration('whole'))]], {
            clef: pair.clef,
          })
        : singleStaffScore([[note(pair.from, duration('half')), note(pair.to, duration('half'))]], {
            clef: pair.clef,
          }),
    choices:
      type === 'INTERVAL_BUILD'
        ? []
        : options(intervalAnswerId(group.interval), intervals.map(intervalAnswerId), rng),
  };
}
export function generateVisualInterval(params: VisualIntervalParams, rng: Rng): IntervalItem {
  return generateInterval(params, rng, 'INTERVAL_IDENTIFY_VISUAL');
}
export function generateAuralInterval(params: AuralIntervalParams, rng: Rng): IntervalItem {
  return generateInterval(params, rng, 'INTERVAL_IDENTIFY_AURAL');
}
export function generateIntervalBuild(params: VisualIntervalParams, rng: Rng): IntervalBuildItem {
  return generateInterval(params, rng, 'INTERVAL_BUILD');
}
export function generateExercise(spec: ExerciseSpec, rng: Rng) {
  switch (spec.type) {
    case 'CHORD_IDENTIFY':
    case 'CHORD_BUILD':
      return generateChord(spec.params, rng, spec.type);
    case 'NOTE_NAME':
      return generateNote(spec.params, rng);
    case 'NOTE_PLACE':
      return generateNotePlace(spec.params, rng);
    case 'KEY_FIND':
      return generateKeyFind(spec.params, rng);
    case 'INTERVAL_BUILD':
      return generateIntervalBuild(spec.params, rng);
    case 'SCALE_BUILD':
    case 'SCALE_IDENTIFY':
      return generateScale(spec.params, rng, spec.type);
    case 'KEYSIG_BUILD':
    case 'KEYSIG_IDENTIFY':
      return generateKeySignature(spec.params, rng, spec.type);
    case 'INTERVAL_IDENTIFY_VISUAL':
      return generateVisualInterval(spec.params, rng);
    case 'INTERVAL_IDENTIFY_AURAL':
      return generateAuralInterval(spec.params, rng);
  }
}
