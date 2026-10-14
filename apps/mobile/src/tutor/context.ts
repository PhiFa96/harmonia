import { feedbackMedia, isAuralExercise, isPitchInput } from '@harmonia/exercises';
import type { ExerciseItem } from '@harmonia/exercises';
import type { TutorScope } from '@harmonia/content';
import type { Score } from '@harmonia/notation';

/** Hinweise zeigen nur ein vorhandenes Fragebild; nach Bewertung darf die Quelle erscheinen. */
export function taskTutorScore(item: ExerciseItem, mode: TutorScope['mode']): Score | undefined {
  if (mode === 'hint') {
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
