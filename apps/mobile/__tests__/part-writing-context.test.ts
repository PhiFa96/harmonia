import { generateVoiceLeading, createRng, satbAnswerId, satbScore } from '@harmonia/exercises';
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
