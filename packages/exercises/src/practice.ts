// Freie Übungssätze; versionierte Kursinhalte werden separat fachlich freigegeben.
import { createRng } from '@harmonia/theory';
import { createSession } from './session.ts';
import { generateExercise } from './generate.ts';
import type { ExerciseSpec } from './types.ts';

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
const RHYTHM_TYPES: readonly ExerciseSpec[] = [
  {
    type: 'RHYTHM_TAP',
    params: {
      meters: ['2/4', '3/4', '4/4', '6/8'],
      tempos: [72, 96],
      level: 'dotted',
      rests: true,
      toleranceMs: 120,
    },
  },
  {
    type: 'METER_IDENTIFY',
    params: { meters: ['2/4', '3/4', '4/4', '6/8'], clefs: ['treble', 'bass'] },
  },
];
export function createRhythmSession(seed: number | string) {
  const rng = createRng(seed);
  return createSession(
    Array.from({ length: 3 }, () => RHYTHM_TYPES.map((spec) => generateExercise(spec, rng))).flat(),
  );
}
const KNOWLEDGE_TYPES: readonly ExerciseSpec[] = [
  {
    type: 'KNOWLEDGE_MC',
    params: { topics: ['accidentals', 'noteValues', 'intervals', 'triads', 'scales', 'meters'] },
  },
  {
    type: 'MATCH',
    params: {
      topics: ['accidentals', 'noteValues', 'intervals', 'triads', 'scales', 'meters'],
      count: 3,
    },
  },
  { type: 'ORDER', params: { topics: ['noteValues', 'pitches'], count: 4, direction: 'both' } },
];
export function createKnowledgeSession(seed: number | string) {
  const rng = createRng(seed);
  return createSession(
    Array.from({ length: 3 }, () =>
      KNOWLEDGE_TYPES.map((spec) => generateExercise(spec, rng)),
    ).flat(),
  );
}
const HARMONY_TYPES: readonly ExerciseSpec[] = [
  { type: 'CADENCE_IDENTIFY', params: { fifths: [-1, 0, 1] } },
  { type: 'FUNCTION_ANALYSIS', params: { fifths: [-1, 0, 1], degrees: [1, 2, 4, 5, 6] } },
  { type: 'MELODY_DICTATION', params: { level: 1 } },
  { type: 'RHYTHM_DICTATION', params: { level: 2 } },
  {
    type: 'CHORD_IDENTIFY',
    params: {
      types: ['dominant7', 'major7', 'minor7'],
      roots: ['C', 'G'],
      inversions: [0, 1, 2, 3],
      clefs: ['treble'],
    },
  },
  {
    type: 'CHORD_BUILD',
    params: {
      types: ['dominant7', 'major7', 'minor7'],
      roots: ['C', 'G'],
      inversions: [0, 1, 2, 3],
      clefs: ['treble'],
    },
  },
];
export function createHarmonySession(seed: number | string) {
  const rng = createRng(seed);
  return createSession(
    Array.from({ length: 2 }, () =>
      HARMONY_TYPES.map((spec) => generateExercise(spec, rng)),
    ).flat(),
  );
}

export const PRACTICE_CONTENT_VERSION = 1;
export const PRACTICE_SETS = [
  'reading',
  'pitch',
  'tonality',
  'chords',
  'rhythm',
  'knowledge',
  'harmony',
  'mini',
] as const;
export type PracticeSet = (typeof PRACTICE_SETS)[number];
export function createMiniSession(seed: number | string) {
  return createSession([
    generateExercise(
      {
        type: 'INTERVAL_IDENTIFY_VISUAL',
        params: {
          intervals: ['P1', 'M2', 'm2', 'M3', 'm3'],
          question: 'direction',
          direction: 'both',
          clefs: ['treble'],
          range: { minMidi: 64, maxMidi: 77 },
          maxAccidentals: 0,
        },
      },
      createRng(seed),
    ),
  ]);
}
export function createFreePracticeSession(set: PracticeSet, seed: number | string) {
  return {
    reading: createPracticeSession,
    pitch: createPitchInputSession,
    tonality: createTonalitySession,
    chords: createChordSession,
    rhythm: createRhythmSession,
    knowledge: createKnowledgeSession,
    harmony: createHarmonySession,
    mini: createMiniSession,
  }[set](seed);
}
