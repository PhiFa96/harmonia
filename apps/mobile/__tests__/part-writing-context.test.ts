import {
  generateVoiceLeading,
  createRng,
  satbAnswerId,
  satbScore,
  createFreePracticeSession,
  PRACTICE_SETS,
  isAuralExercise,
} from '@harmonia/exercises';
import { taskTutorScore } from '@/tutor/context';

it('keeps the reference score hidden in hints and shows the learner score for explanations', () => {
  const item = generateVoiceLeading({ mode: 'functions', level: 5 }, createRng(1));
  const slices = item.example.map((s, i) =>
    i === 1 ? { ...s, alto: { letter: 'C' as const, alter: 1, octave: 4 } } : s,
  );
  expect(taskTutorScore(item, 'hint')).toBeUndefined();
  expect(taskTutorScore(item, 'chat')).toBeUndefined();
  expect(taskTutorScore(item, 'explain', satbAnswerId(slices))).toEqual(
    satbScore(slices, item.fifths),
  );
  expect(taskTutorScore(item, 'solution')).toEqual(satbScore(item.example, item.fifths));
  expect(taskTutorScore(item, 'explain', 'invalid')).toEqual(item.score);
});

it('keeps aural answer scores hidden in both hint and chat modes', () => {
  let aural = 0;
  for (const set of PRACTICE_SETS.filter((entry) => entry !== 'harmony'))
    for (const item of createFreePracticeSession(set, 'tutor-score-policy').items)
      if (isAuralExercise(item)) {
        aural++;
        expect(taskTutorScore(item, 'hint')).toBeUndefined();
        expect(taskTutorScore(item, 'chat')).toBeUndefined();
      }
  expect(aural).toBeGreaterThan(5);
});
