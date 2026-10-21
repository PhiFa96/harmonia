import { choirExpected, evaluateChoir } from './choir.ts';
import { satbAnswerId, evaluateSatb } from './voice-leading.ts';
import { contextAnswer } from './context.ts';
import { octaveNamePitch } from './octave-names.ts';
import { listeningAnswer } from './listening.ts';
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
import { isIntervalReadingItem, intervalReadingAnswer } from './interval-reading.ts';
import { evaluateVoice, isVoiceItem, voiceAnswerId, voiceTargets } from './voice.ts';
import { cadenceAnswer, functionAnswer } from './harmony-exercises.ts';
import { dictationExpected, dictationInputValues, isDictationItem } from './dictation.ts';

/** Die Engine berechnet die Lösung aus den Fachdaten, nie aus dem sichtbaren Antworttext. */
export function expectedAnswer(item: ExerciseItem): string {
  if (item.type === 'CHOIR_PART') return choirExpected(item);
  if (item.type === 'VOICE_LEADING') return satbAnswerId(item.example);
  if (isVoiceItem(item)) return voiceAnswerId(voiceTargets(item));
  if (item.type === 'CADENCE_IDENTIFY') return cadenceAnswer(item);
  if (item.type === 'FUNCTION_ANALYSIS') return functionAnswer(item);
  if (isDictationItem(item)) return dictationExpected(item);
  if (item.type === 'CONTEXT_CHOICE') return contextAnswer(item);
  if (item.type === 'LISTENING_CHOICE') return listeningAnswer(item);
  if (isIntervalReadingItem(item)) return intervalReadingAnswer(item);
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
    return item.type === 'KEY_FIND'
      ? keyAnswerId(inputTarget(item))
      : pitchAnswerId(inputTarget(item));
  return item.type === 'NOTE_NAME'
    ? item.includeOctave
      ? pitchAnswerId(item.presentation === 'octave-name' ? octaveNamePitch(item) : item.pitch)
      : noteAnswerId(item.pitch)
    : intervalAnswerId(intervalBetween(item.from, item.to));
}
export function evaluateExercise(item: ExerciseItem, answer: string): Evaluation {
  if (item.type === 'CHOIR_PART') return evaluateChoir(item, answer);
  if (item.type === 'VOICE_LEADING') return evaluateSatb(item, answer);
  if (isVoiceItem(item)) return evaluateVoice(item, answer);
  const expected = expectedAnswer(item);
  if (isDictationItem(item)) {
    const values = dictationInputValues(item, answer);
    const validAnswer = values?.length === item.pitches.length;
    return { answer, expected, validAnswer, correct: validAnswer && answer === expected };
  }
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
    const validAnswer = complete?.length === chordTargets(item).length;
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
