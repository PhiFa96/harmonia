import { intervalBetween } from '@harmonia/theory';
import { intervalAnswerId, noteAnswerId } from './generate.ts';
import {
  answerPitch,
  inputTarget,
  isPitchInput,
  keyAnswerId,
  pitchAnswerId,
} from './pitch-input.ts';
import type { Evaluation, ExerciseItem } from './types.ts';

/** Die Engine berechnet die Lösung aus den Tönen, nie aus dem sichtbaren Antworttext. */
export function expectedAnswer(item: ExerciseItem): string {
  if (isPitchInput(item))
    return item.type === 'KEY_FIND' ? keyAnswerId(item.pitch) : pitchAnswerId(inputTarget(item));
  return item.type === 'NOTE_NAME'
    ? noteAnswerId(item.pitch)
    : intervalAnswerId(intervalBetween(item.from, item.to));
}
export function evaluateExercise(item: ExerciseItem, answer: string): Evaluation {
  const expected = expectedAnswer(item);
  const validAnswer = isPitchInput(item)
    ? answerPitch(item, answer) !== undefined
    : item.choices.includes(answer);
  return { answer, expected, validAnswer, correct: validAnswer && answer === expected };
}
