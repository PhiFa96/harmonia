// Freie Übungssätze; versionierte Kursinhalte werden separat fachlich freigegeben.
import { createRng, createSession, generateExercise } from '@harmonia/exercises';
import type { ExerciseSpec } from '@harmonia/exercises';

const TYPES: readonly ExerciseSpec[] = [
  { type: 'NOTE_NAME', params: { clefs: ['treble', 'bass'], maxAccidentals: 0 } },
  {
    type: 'INTERVAL_IDENTIFY_VISUAL',
    params: {
      clefs: ['treble', 'bass'],
      intervals: ['m3', 'M3', 'P4', 'P5'],
      direction: 'both',
      maxAccidentals: 1,
    },
  },
  {
    type: 'INTERVAL_IDENTIFY_AURAL',
    params: {
      intervals: ['m3', 'M3', 'P4', 'P5'],
      range: { minMidi: 55, maxMidi: 76 },
      playback: 'melodic-up',
    },
  },
];
export function createPracticeSession(seed: number | string) {
  const rng = createRng(seed);
  return createSession(
    Array.from({ length: 3 }, () => TYPES.map((spec) => generateExercise(spec, rng))).flat(),
  );
}
const PITCH_INPUT_TYPES: readonly ExerciseSpec[] = [
  { type: 'NOTE_PLACE', params: { clefs: ['treble', 'bass'], maxAccidentals: 1 } },
  { type: 'KEY_FIND', params: { clefs: ['treble'], maxAccidentals: 1 } },
  {
    type: 'INTERVAL_BUILD',
    params: {
      clefs: ['treble', 'bass'],
      intervals: ['m3', 'M3', 'P4', 'P5'],
      direction: 'both',
      maxAccidentals: 1,
    },
  },
];
export function createPitchInputSession(seed: number | string) {
  const rng = createRng(seed);
  return createSession(
    Array.from({ length: 3 }, () =>
      PITCH_INPUT_TYPES.map((spec) => generateExercise(spec, rng)),
    ).flat(),
  );
}

const TONALITY_TYPES: readonly ExerciseSpec[] = [
  {
    type: 'SCALE_BUILD',
    params: {
      types: ['major', 'naturalMinor', 'harmonicMinor', 'melodicMinor'],
      clefs: ['treble', 'bass'],
      fifths: [-2, -1, 0, 1, 2],
      direction: 'both',
      maxAccidentals: 1,
    },
  },
  {
    type: 'SCALE_IDENTIFY',
    params: {
      types: ['major', 'naturalMinor', 'harmonicMinor', 'melodicMinor'],
      clefs: ['treble', 'bass'],
      fifths: [-2, -1, 0, 1, 2],
      maxAccidentals: 1,
    },
  },
  {
    type: 'KEYSIG_IDENTIFY',
    params: { clefs: ['treble', 'bass'], fifths: [-3, -2, -1, 0, 1, 2, 3] },
  },
  { type: 'KEYSIG_BUILD', params: { clefs: ['treble', 'bass'], fifths: [-3, -2, -1, 0, 1, 2, 3] } },
];
export function createTonalitySession(seed: number | string) {
  const rng = createRng(seed);
  return createSession(
    Array.from({ length: 3 }, () =>
      TONALITY_TYPES.map((spec) => generateExercise(spec, rng)),
    ).flat(),
  );
}

const CHORD_TYPES: readonly ExerciseSpec[] = [
  {
    type: 'CHORD_BUILD',
    params: {
      types: ['major', 'minor', 'diminished', 'augmented'],
      roots: ['C', 'D', 'F', 'G', 'A'],
      clefs: ['treble', 'bass'],
      inversions: [0, 1, 2],
      maxAccidentals: 1,
    },
  },
  {
    type: 'CHORD_IDENTIFY',
    params: {
      types: ['major', 'minor', 'diminished', 'augmented'],
      roots: ['C', 'D', 'F', 'G', 'A'],
      clefs: ['treble', 'bass'],
      inversions: [0, 1, 2],
      maxAccidentals: 1,
    },
  },
  {
    type: 'CHORD_IDENTIFY',
    params: {
      types: ['major', 'minor', 'diminished', 'augmented'],
      roots: ['C', 'D', 'F', 'G', 'A'],
      clefs: ['treble', 'bass'],
      inversions: [0, 1, 2],
      presentation: 'aural',
      maxAccidentals: 1,
    },
  },
];
export function createChordSession(seed: number | string) {
  const rng = createRng(seed);
  return createSession(
    Array.from({ length: 3 }, () => CHORD_TYPES.map((spec) => generateExercise(spec, rng))).flat(),
  );
}
