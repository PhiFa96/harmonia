// Reines TypeScript: Aufgabe, Bewertung und Ablauf funktionieren auch ohne App und Klang.
export * from './types.ts';
export * from './generate.ts';
export * from './evaluate.ts';
export * from './feedback.ts';
export * from './session.ts';
export * from './lesson.ts';
export * from './pitch-input.ts';
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
} from './types.ts';

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
