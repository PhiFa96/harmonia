import { equals, intervalBetween, keySignature } from '@harmonia/theory';
import {
  knowledgeFactId,
  measureGapFact,
  matchAnswerId,
  matchAnswerValues,
  orderedValues,
  orderAnswerId,
  orderAnswerValues,
  orderValueId,
} from './knowledge.ts';
import {
  assessRhythm,
  isRhythmItem,
  meterAnswerId,
  pickupAnswer,
  rhythmAnswerId,
  rhythmAnswerTaps,
  rhythmMeter,
  rhythmOnsets,
} from './rhythm.ts';
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

/** Die Engine berechnet die Lösung aus den Fachdaten, nie aus dem sichtbaren Antworttext. */
export function expectedAnswer(item: ExerciseItem): string {
  if (item.type === 'KNOWLEDGE_MC')
    return knowledgeFactId(item.gap ? measureGapFact(item.gap) : item.fact);
  if (item.type === 'MATCH') return matchAnswerId(item.facts.map(knowledgeFactId));
  if (item.type === 'ORDER') return orderAnswerId(orderedValues(item).map(orderValueId));
  if (isRhythmItem(item))
    return item.type === 'RHYTHM_TAP'
      ? rhythmAnswerId(rhythmOnsets(item))
      : item.presentation === 'pickup'
        ? pickupAnswer(item)
        : meterAnswerId(rhythmMeter(item));
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
    ? item.includeOctave
      ? pitchAnswerId(item.pitch)
      : noteAnswerId(item.pitch)
    : intervalAnswerId(intervalBetween(item.from, item.to));
}
export function evaluateExercise(item: ExerciseItem, answer: string): Evaluation {
  const expected = expectedAnswer(item);
  if (item.type === 'MATCH' || item.type === 'ORDER') {
    const values =
      item.type === 'MATCH' ? matchAnswerValues(item, answer) : orderAnswerValues(item, answer);
    const validAnswer =
      values?.length === item.choices.length && values.every((value) => value !== null);
    return { answer, expected, validAnswer, correct: validAnswer && answer === expected };
  }
  if (item.type === 'RHYTHM_TAP') {
    const taps = rhythmAnswerTaps(item, answer);
    return {
      answer,
      expected,
      validAnswer: taps !== undefined,
      correct: taps !== undefined && assessRhythm(item, taps).correct,
    };
  }
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
