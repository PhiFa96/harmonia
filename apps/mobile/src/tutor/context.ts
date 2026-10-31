import {
  feedbackMedia,
  isAuralExercise,
  isPitchInput,
  satbAnswer,
  satbScore,
} from '@harmonia/exercises';
import type { ExerciseItem } from '@harmonia/exercises';
import type { TutorScope } from '@harmonia/content';
import type { Score } from '@harmonia/notation';

/** Hint/chat show only question material; explain/solution may show feedback media. */
export function taskTutorScore(
  item: ExerciseItem,
  mode: TutorScope['mode'],
  answer?: string | null,
): Score | undefined {
  if (item.type === 'VOICE_LEADING') {
    if (mode === 'hint' || mode === 'chat') return undefined;
    return satbScore(
      mode === 'solution' ? item.example : (satbAnswer(item, answer ?? null) ?? item.given),
      item.fifths,
    );
  }
  if (mode === 'hint' || mode === 'chat') {
    return !isAuralExercise(item) &&
      !isPitchInput(item) &&
      !['SCALE_BUILD', 'KEYSIG_BUILD', 'CHORD_BUILD'].includes(item.type) &&
      'score' in item
      ? item.score
      : undefined;
  }
  return (
    feedbackMedia(item).score ??
    ('score' in item
      ? item.score
      : 'promptScore' in item
        ? item.promptScore
        : item.type === 'CONTEXT_CHOICE' && item.source.kind === 'score'
          ? item.source.score
          : undefined)
  );
}
