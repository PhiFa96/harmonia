import { intervalBetween, keySignature } from '@harmonia/theory';
import {
  identifyScale,
  isKeySignatureItem,
  isScaleItem,
  scaleAnswerId,
  scaleAnswerPitches,
  scaleChoiceId,
  scalePitches,
  signatureAnswerId,
  signatureAnswerNotes,
  signatureKey,
  tonalityAnswerId,
} from './tonality.ts';
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
  if (isScaleItem(item))
    return item.type === 'SCALE_BUILD'
      ? scaleAnswerId(scalePitches(item))
      : scaleChoiceId(identifyScale(item));
  if (isKeySignatureItem(item))
    return item.type === 'KEYSIG_BUILD'
      ? signatureAnswerId(keySignature(item.key))
      : tonalityAnswerId(signatureKey(item));
  if (isPitchInput(item))
    return item.type === 'KEY_FIND' ? keyAnswerId(item.pitch) : pitchAnswerId(inputTarget(item));
  return item.type === 'NOTE_NAME'
    ? noteAnswerId(item.pitch)
    : intervalAnswerId(intervalBetween(item.from, item.to));
}
export function evaluateExercise(item: ExerciseItem, answer: string): Evaluation {
  const expected = expectedAnswer(item);
  const validAnswer =
    item.type === 'SCALE_BUILD'
      ? scaleAnswerPitches(item, answer)?.every((pitch) => pitch !== null) === true
      : item.type === 'KEYSIG_BUILD'
        ? signatureAnswerNotes(answer) !== undefined
        : isPitchInput(item)
          ? answerPitch(item, answer) !== undefined
          : item.choices.includes(answer);
  return { answer, expected, validAnswer, correct: validAnswer && answer === expected };
}
