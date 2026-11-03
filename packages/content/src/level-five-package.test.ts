import { describe, expect, it } from 'vitest';
import { catalogue } from './authoring.ts';
import { lessonExerciseSources } from './catalogue.ts';
import { learningPath } from './learning-path.ts';

const units = catalogue.units.filter((u) =>
  /^(counterpoint|forms|analysis|contemporary|world)\.l5\./.test(u.id),
);
describe('P4.19 complete teaching package', () => {
  it.each(units.map((u) => u.id))(
    '%s unlocks its three actual lesson targets in sequence',
    (id) => {
      const own = catalogue.lessons.filter((l) => l.unitId === id),
        tested = catalogue.units.filter((u) => u.id !== id).map((u) => u.id);
      const first = own[0],
        second = own[1];
      if (!first || !second) throw Error('Missing level-five lesson');
      const progress = (lesson: typeof first) => ({
        lessonId: lesson.id,
        contentVersion: lesson.contentVersion,
        passed: true,
        eligibleCorrect: 10,
        total: 10,
      });
      const statuses = (records: ReturnType<typeof progress>[]) =>
        learningPath(catalogue, records, tested)
          .find((u) => u.id === id)
          ?.lessons.map((l) => l.status);
      expect(statuses([])).toEqual(['open', 'locked', 'locked']);
      expect(statuses([progress(first)])).toEqual(['completed', 'open', 'locked']);
      expect(statuses([progress(first), progress(second)])).toEqual([
        'completed',
        'completed',
        'open',
      ]);
      expect(statuses([{ ...progress(first), contentVersion: first.contentVersion - 1 }])).toEqual([
        'open',
        'locked',
        'locked',
      ]);
    },
  );
  it('credits the actual lesson target instead of giving every lesson all three ratings', () => {
    for (const unit of units)
      for (let index = 1; index <= 3; index++) {
        const id = unit.id + '.lesson' + String(index),
          lesson = catalogue.lessons.find((l) => l.id === id);
        expect(lesson?.skillIds).toEqual([unit.id + '.s' + String(index)]);
        expect(
          lessonExerciseSources(catalogue, id)?.every(
            (s) => s.skillIds.length === 1 && s.skillIds[0] === unit.id + '.s' + String(index),
          ),
        ).toBe(true);
      }
  });
  it('uses distinct evidence/context tasks in the final cultures lesson', () => {
    const sources = lessonExerciseSources(catalogue, 'world.l5.context.lesson3') ?? [];
    const topics = new Set(
      sources.flatMap((s) =>
        s.spec.type === 'KNOWLEDGE_MC' || s.spec.type === 'MATCH' ? s.spec.params.topics : [],
      ),
    );
    expect(topics.size).toBeGreaterThanOrEqual(3);
    expect(new Set(sources.map((s) => s.spec.type))).toEqual(new Set(['KNOWLEDGE_MC', 'MATCH']));
  });
});
