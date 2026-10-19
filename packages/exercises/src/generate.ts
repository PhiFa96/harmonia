import { generateContext } from './context.ts';
import {
  MAX_STEP,
  MIN_STEP,
  note,
  rest,
  singleStaffScore,
  stepOf,
  grandStaffExample,
} from '@harmonia/notation';
import type { Interval, Pitch, Rng } from '@harmonia/theory';
import {
  LETTERS,
  duration,
  formatPitch,
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
  KeyFindParams,
  NoteItem,
  NotePlaceItem,
  NoteParams,
  NoteNameParams,
  VisualIntervalParams,
} from './types.ts';

import { accidentalLimit, clefs, options, pitchPool, rangeFor } from './parameters.ts';
import { generateScale, generateKeySignature } from './tonality.ts';
import { generateChord } from './chords.ts';
import { generatePickup, generateRhythm } from './rhythm.ts';
import { generateKnowledge, generateMatch, generateOrder } from './knowledge.ts';
import { generateListening } from './listening.ts';
import { generateCadence, generateFunction } from './harmony-exercises.ts';
import { generateDictation } from './dictation.ts';
import { intervalMotion, intervalReadingAnswer } from './interval-reading.ts';
import { generateSightSing, generateVoiceSequence } from './voice.ts';
export function noteAnswerId(pitch: Pick<Pitch, 'letter' | 'alter'>): string {
  return `${pitch.letter}:${String(pitch.alter)}`;
}
export function intervalAnswerId(interval: Interval): string {
  return formatInterval({ ...interval, direction: 1 });
}

function choosePitch(params: NoteParams, rng: Rng, editable = false, naturalInRange = false) {
  const allowedClefs = clefs(params);
  const limit = accidentalLimit(params, 0);
  const pools = allowedClefs.map((clef) => {
    const range = rangeFor(params, clef);
    return {
      clef,
      pitches: pitchPool(range, limit).filter(
        (pitch) =>
          (!editable || (stepOf(pitch, clef) >= MIN_STEP && stepOf(pitch, clef) <= MAX_STEP)) &&
          (!naturalInRange ||
            (midi({ ...pitch, alter: 0 }) >= range.minMidi &&
              midi({ ...pitch, alter: 0 }) <= range.maxMidi)),
      ),
    };
  });
  if (pools.some((pool) => pool.pitches.length === 0))
    throw new RangeError('Tonbereich enthält keine erlaubte Note');
  const pool = rng.pick(pools);
  const pitch = rng.pick(pool.pitches);
  return { clef: pool.clef, pitch, limit };
}
export function generateNote(params: NoteNameParams, rng: Rng): NoteItem {
  if (![undefined, 'octave-name'].includes(params.presentation))
    throw new RangeError('Unbekannte Oktavnamens-Vorgabe');
  if (
    params.sourceSystem !== undefined &&
    (!params.presentation || !['helmholtz', 'scientific', 'both'].includes(params.sourceSystem))
  )
    throw new RangeError('Ungültiges Quellsystem');
  if (params.presentation === 'octave-name') {
    if (params.includeOctave === false || (params.maxAccidentals ?? 0) !== 0)
      throw new RangeError('Oktavnamen brauchen vollständige natürliche Tonhöhen');
    const item = generateNote(
      {
        ...(params.clefs ? { clefs: params.clefs } : {}),
        ...(params.range ? { range: params.range } : {}),
        ...(params.maxAccidentals === undefined ? {} : { maxAccidentals: params.maxAccidentals }),
        includeOctave: true,
      },
      rng,
    );
    const sourceSystem =
      params.sourceSystem === undefined || params.sourceSystem === 'both'
        ? rng.pick(['helmholtz', 'scientific'] as const)
        : params.sourceSystem;
    return { ...item, presentation: 'octave-name', sourceSystem };
  }
  if (![undefined, true, false].includes(params.includeOctave))
    throw new RangeError('Ungültige Oktav-Antwortvorgabe');
  const { clef, pitch, limit } = choosePitch(params, rng);
  if (params.includeOctave) {
    const sourcePitches = pitchPool(rangeFor(params, clef), limit);
    const octaves = [...new Set(sourcePitches.map((value) => value.octave))];
    if (octaves.length < 2) throw new RangeError('Oktavfragen brauchen mindestens zwei Oktavlagen');
    const candidates = octaves
      .flatMap((octave) =>
        LETTERS.flatMap((letter) =>
          Array.from({ length: limit * 2 + 1 }, (_, index) => ({
            letter,
            alter: index - limit,
            octave,
          })),
        ),
      )
      .filter((value) => midi(value) >= 21 && midi(value) <= 108);
    if (
      sourcePitches.some(
        (source) =>
          !candidates.some(
            (value) =>
              value.letter === source.letter &&
              value.alter === source.alter &&
              value.octave !== source.octave,
          ),
      )
    )
      throw new RangeError('Jede Oktavfrage braucht eine zweite erreichbare Lage desselben Namens');
    const otherRegisters = candidates.filter(
      (value) =>
        value.letter === pitch.letter &&
        value.alter === pitch.alter &&
        value.octave !== pitch.octave,
    );
    const closest = Math.min(
      ...otherRegisters.map((value) => Math.abs(value.octave - pitch.octave)),
    );
    const confusion = formatPitch(
      rng.pick(otherRegisters.filter((value) => Math.abs(value.octave - pitch.octave) === closest)),
    );
    const answer = formatPitch(pitch);
    const others = options(
      answer,
      candidates.map((value) => formatPitch(value)).filter((value) => value !== confusion),
      rng,
    )
      .filter((value) => value !== answer)
      .slice(0, 2);
    return {
      type: 'NOTE_NAME',
      clef,
      pitch,
      includeOctave: true,
      score: singleStaffScore([[note(pitch, duration('whole'))]], { clef }),
      choices: rng.shuffle([answer, confusion, ...others]),
    };
  }
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
export function generateKeyFind(params: KeyFindParams, rng: Rng): KeyFindItem {
  if (params.presentation === 'grand-staff') {
    if ((params.maxAccidentals ?? 0) !== 0)
      throw new RangeError('Der Einstieg ins große System verwendet natürliche Töne');
    const range = params.range ?? { minMidi: 57, maxMidi: 64 };
    if (range.minMidi < 57 || range.maxMidi > 64)
      throw new RangeError('Großes Lernsystem: A3 bis E4');
    const { clef, pitch } = choosePitch({ ...params, range }, rng);
    const score = grandStaffExample(pitch, clef);
    return {
      type: 'KEY_FIND',
      clef,
      pitch,
      score,
      choices: [],
      presentation: 'grand-staff',
      keyboardRange: { first: range.minMidi, last: range.maxMidi },
    };
  }
  if (!['notation', 'name', 'score'].includes(params.presentation ?? 'notation'))
    throw new RangeError('Unbekannte Tasten-Vorgabe');
  const named = params.presentation === 'name',
    range = params.range ?? { minMidi: 60, maxMidi: named ? 71 : 76 };
  if (named && range.maxMidi - range.minMidi > 11)
    throw new RangeError('Tonnamen brauchen einen eindeutigen Klaviatur-Ausschnitt');
  const { clef, pitch } = choosePitch({ ...params, range }, rng, false, named);
  return {
    type: 'KEY_FIND',
    clef,
    pitch,
    choices: [],
    score: singleStaffScore([[note(pitch, duration('whole'))]], { clef }),
    ...(named || params.presentation === 'score'
      ? {
          presentation: named ? ('name' as const) : ('score' as const),
          keyboardRange: { first: range.minMidi, last: range.maxMidi },
        }
      : {}),
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
  const question = 'question' in params ? params.question : undefined;
  if (
    question !== undefined &&
    (type !== 'INTERVAL_IDENTIFY_VISUAL' ||
      !['number', 'direction', 'motion', 'semitones', 'quality', 'perfect'].includes(question))
  )
    throw new RangeError('Unbekannte Intervall-Grundlagenfrage');
  const allowedClefs = clefs(params);
  const limit = accidentalLimit(params, question ? 0 : 1);
  if (question && limit !== 0) throw new RangeError('Grundlagenfragen verwenden natürliche Töne');
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
  if (question && intervals.some((interval) => interval.number > 8))
    throw new RangeError('Grundlagenfragen unterstützen Prime bis Oktave');
  if (question === 'perfect' && intervals.some((interval) => ![4, 5, 8].includes(interval.number)))
    throw new RangeError('Reinheitsfrage unterstützt Quarte, Quinte und Oktave');
  const readingChoices =
    question === 'number'
      ? intervals.map((interval) => `interval-number:${String(interval.number)}`)
      : question === 'direction'
        ? intervals.flatMap((interval) =>
            interval.number === 1
              ? ['interval-direction:same']
              : directions.map((dir) => `interval-direction:${dir === 1 ? 'up' : 'down'}`),
          )
        : question === 'motion'
          ? intervals.map((interval) => `interval-motion:${intervalMotion(interval.number)}`)
          : question === 'semitones'
            ? intervals.map(
                (interval) => `interval-semitones:${String(Math.abs(semitones(interval)))}`,
              )
            : question === 'quality'
              ? intervals.map(intervalAnswerId)
              : question === 'perfect'
                ? intervals.map((interval) =>
                    interval.quality === 'P' ? 'interval-perfect:yes' : 'interval-perfect:no',
                  )
                : [];
  if (question && new Set(readingChoices).size < 2)
    throw new RangeError('Grundlagenfrage braucht mindestens zwei verschiedene Antworten');
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
  const item: IntervalItem | IntervalBuildItem = {
    type,
    clef: pair.clef,
    from: pair.from,
    to: pair.to,
    playback: aural ? playback : pair.direction < 0 ? 'melodic-down' : 'melodic-up',
    ...(question ? { question } : {}),
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
        : question
          ? []
          : options(intervalAnswerId(group.interval), intervals.map(intervalAnswerId), rng),
  };
  if (question && item.type === 'INTERVAL_IDENTIFY_VISUAL')
    return { ...item, choices: options(intervalReadingAnswer(item), readingChoices, rng) };
  return item;
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
    case 'SIGHT_SING':
      return generateSightSing(spec.params, rng);
    case 'SING_INTERVAL':
    case 'PLAY_BACK':
      return generateVoiceSequence(spec.params, rng, spec.type);
    case 'CONTEXT_CHOICE':
      return generateContext(spec.params, rng);
    case 'LISTENING_CHOICE':
      return generateListening(spec.params, rng);
    case 'KNOWLEDGE_MC':
      return generateKnowledge(spec.params, rng);
    case 'MATCH':
      return generateMatch(spec.params, rng);
    case 'ORDER':
      return generateOrder(spec.params, rng);
    case 'RHYTHM_TAP':
      return generateRhythm(spec.params, rng, spec.type);
    case 'METER_IDENTIFY':
      return spec.params.presentation === 'pickup'
        ? generatePickup(spec.params, rng)
        : generateRhythm(spec.params, rng, spec.type);
    case 'CHORD_IDENTIFY':
    case 'CHORD_BUILD':
      return generateChord(spec.params, rng, spec.type);
    case 'CADENCE_IDENTIFY':
      return generateCadence(spec.params, rng);
    case 'FUNCTION_ANALYSIS':
      return generateFunction(spec.params, rng);
    case 'MELODY_DICTATION':
    case 'RHYTHM_DICTATION':
      return generateDictation(spec.params, rng, spec.type);
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
