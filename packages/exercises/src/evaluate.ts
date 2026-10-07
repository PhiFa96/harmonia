import { equals, intervalBetween, keySignature } from '@harmonia/theory';
import {
  canonicalChordAnswer,
  chordAnswerPitches,
  chordChoiceId,
  chordTargets,
  isChordItem,
  resolvedChord,
} from './chords.ts';
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
  if (isChordItem(item))
    return item.type === 'CHORD_BUILD'
      ? canonicalChordAnswer(chordTargets(item))
      : chordChoiceId(resolvedChord(item));
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
  if (item.type === 'CHORD_BUILD') {
    const pitches = chordAnswerPitches(item, answer);
    const complete = pitches?.filter((pitch): pitch is NonNullable<typeof pitch> => pitch !== null);
    const validAnswer = complete?.length === 3;
    return {
      answer,
      expected,
      validAnswer,
      correct:
        validAnswer &&
        !!complete[0] &&
        equals(complete[0], item.bass) &&
        canonicalChordAnswer(complete) === expected,
    };
  }
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
