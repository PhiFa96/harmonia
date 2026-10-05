// Vorschau des Aufgabenablaufs (P1.19). Die versionierte Lektion als Inhalt folgt in P1.20.
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
