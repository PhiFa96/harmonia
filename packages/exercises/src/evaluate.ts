import { intervalBetween } from '@harmonia/theory';
import { intervalAnswerId, noteAnswerId } from './generate.ts';
import type { Evaluation, ExerciseItem } from './types.ts';

/** Die Engine berechnet die Lösung aus den Tönen, nie aus dem sichtbaren Antworttext. */
export function expectedAnswer(item: ExerciseItem): string {
  return item.type === 'NOTE_NAME'
    ? noteAnswerId(item.pitch)
    : intervalAnswerId(intervalBetween(item.from, item.to));
}
export function evaluateExercise(item: ExerciseItem, answer: string): Evaluation {
  const expected = expectedAnswer(item);
  const validAnswer = item.choices.includes(answer);
  return { answer, expected, validAnswer, correct: validAnswer && answer === expected };
}
