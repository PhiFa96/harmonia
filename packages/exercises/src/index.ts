// Reines TypeScript: Aufgabe, Bewertung und Ablauf funktionieren auch ohne App und Klang.
export * from './types.ts';
export * from './generate.ts';
export * from './evaluate.ts';
export * from './feedback.ts';
export * from './session.ts';
export * from './lesson.ts';
export * from './pitch-input.ts';
export * from './tonality.ts';
export * from './chords.ts';
export * from './rhythm.ts';
export { createRng } from '@harmonia/theory';

import {
  generateAuralInterval,
  generateNote,
  generateVisualInterval,
  generateNotePlace,
  generateKeyFind,
  generateIntervalBuild,
} from './generate.ts';
import { evaluateExercise } from './evaluate.ts';
import { exerciseFeedback, exerciseHints } from './feedback.ts';
import type {
  AuralIntervalParams,
  ExerciseDefinition,
  IntervalItem,
  IntervalBuildItem,
  KeyFindItem,
  NoteItem,
  NotePlaceItem,
  NoteParams,
  VisualIntervalParams,
  ScaleParams,
  ScaleItem,
  KeySignatureParams,
  KeySignatureItem,
  ChordParams,
  ChordIdentifyParams,
  ChordItem,
  RhythmParams,
  MeterParams,
  RhythmItem,
} from './types.ts';
import { generateScale, generateKeySignature } from './tonality.ts';
import { generateChord } from './chords.ts';
import { generateRhythm } from './rhythm.ts';

export const rhythmTapExercise: ExerciseDefinition<RhythmParams, RhythmItem> = {
  generate: (params, rng) => generateRhythm(params, rng, 'RHYTHM_TAP'),
  evaluate: evaluateExercise,
  feedback: exerciseFeedback,
  hints: exerciseHints,
};
export const meterIdentifyExercise: ExerciseDefinition<MeterParams, RhythmItem> = {
  generate: (params, rng) => generateRhythm(params, rng, 'METER_IDENTIFY'),
  evaluate: evaluateExercise,
  feedback: exerciseFeedback,
  hints: exerciseHints,
};

export const chordBuildExercise: ExerciseDefinition<ChordParams, ChordItem> = {
  generate: (params, rng) => generateChord(params, rng, 'CHORD_BUILD'),
  evaluate: evaluateExercise,
  feedback: exerciseFeedback,
  hints: exerciseHints,
};
export const chordIdentifyExercise: ExerciseDefinition<ChordIdentifyParams, ChordItem> = {
  generate: (params, rng) => generateChord(params, rng, 'CHORD_IDENTIFY'),
  evaluate: evaluateExercise,
  feedback: exerciseFeedback,
  hints: exerciseHints,
};

export const noteNameExercise: ExerciseDefinition<NoteParams, NoteItem> = {
  generate: generateNote,
  evaluate: evaluateExercise,
  feedback: exerciseFeedback,
  hints: exerciseHints,
};
export const visualIntervalExercise: ExerciseDefinition<VisualIntervalParams, IntervalItem> = {
  generate: generateVisualInterval,
  evaluate: evaluateExercise,
  feedback: exerciseFeedback,
  hints: exerciseHints,
};
export const auralIntervalExercise: ExerciseDefinition<AuralIntervalParams, IntervalItem> = {
  generate: generateAuralInterval,
  evaluate: evaluateExercise,
  feedback: exerciseFeedback,
  hints: exerciseHints,
};
export const notePlaceExercise: ExerciseDefinition<NoteParams, NotePlaceItem> = {
  generate: generateNotePlace,
  evaluate: evaluateExercise,
  feedback: exerciseFeedback,
  hints: exerciseHints,
};
export const keyFindExercise: ExerciseDefinition<NoteParams, KeyFindItem> = {
  generate: generateKeyFind,
  evaluate: evaluateExercise,
  feedback: exerciseFeedback,
  hints: exerciseHints,
};
export const intervalBuildExercise: ExerciseDefinition<VisualIntervalParams, IntervalBuildItem> = {
  generate: generateIntervalBuild,
  evaluate: evaluateExercise,
  feedback: exerciseFeedback,
  hints: exerciseHints,
};
export const scaleBuildExercise: ExerciseDefinition<ScaleParams, ScaleItem> = {
  generate: (params, rng) => generateScale(params, rng, 'SCALE_BUILD'),
  evaluate: evaluateExercise,
  feedback: exerciseFeedback,
  hints: exerciseHints,
};
export const scaleIdentifyExercise: ExerciseDefinition<ScaleParams, ScaleItem> = {
  generate: (params, rng) => generateScale(params, rng, 'SCALE_IDENTIFY'),
  evaluate: evaluateExercise,
  feedback: exerciseFeedback,
  hints: exerciseHints,
};
export const keySignatureBuildExercise: ExerciseDefinition<KeySignatureParams, KeySignatureItem> = {
  generate: (params, rng) => generateKeySignature(params, rng, 'KEYSIG_BUILD'),
  evaluate: evaluateExercise,
  feedback: exerciseFeedback,
  hints: exerciseHints,
};
export const keySignatureIdentifyExercise: ExerciseDefinition<
  KeySignatureParams,
  KeySignatureItem
> = {
  generate: (params, rng) => generateKeySignature(params, rng, 'KEYSIG_IDENTIFY'),
  evaluate: evaluateExercise,
  feedback: exerciseFeedback,
  hints: exerciseHints,
};
