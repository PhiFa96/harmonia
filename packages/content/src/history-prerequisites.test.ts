import { describe, expect, it } from 'vitest';
import { catalogue } from './authoring.ts';
import { learningPath } from './learning-path.ts';

describe('history source-comparison prerequisites', () => {
  const sourceUnit = 'history.l2.jazz-pop-sources';
  const sourceSkill = 'history.compare-sources';
  const ancestors = (id: string, seen = new Set<string>()): Set<string> => {
    for (const parent of catalogue.skills.find((skill) => skill.id === id)?.prerequisites ?? [])
      if (!seen.has(parent)) {
        seen.add(parent);
        ancestors(parent, seen);
      }
    return seen;
  };

  it('introduces source comparison before every later history lesson that asks it', () => {
    const lessons = catalogue.lessons.filter((lesson) =>
      lesson.exerciseSetIds.some((id) =>
        catalogue.exerciseSets
          .find((set) => set.id === id)
          ?.exercises.some(
            ({ spec }) =>
              spec.type === 'CONTEXT_CHOICE' &&
              (spec.params as { topics: string[] }).topics.includes('source-comparison'),
          ),
      ),
    );
    expect(lessons.map((lesson) => lesson.id)).toEqual(
      expect.arrayContaining([
        'history.l3.methods.lesson2',
        'history.l3.methods.lesson3',
        'history.l4.survey.lesson2',
        'history.l4.survey.lesson3',
      ]),
    );
    for (const lesson of lessons)
      if (lesson.unitId !== sourceUnit)
        expect(
          lesson.skillIds.some((id) => ancestors(id).has(sourceSkill)),
          lesson.id,
        ).toBe(true);
  });

  it.each(['history.l3.methods', 'history.l4.survey'])(
    '%s stays locked without source comparison even when the unit is marked tested',
    (unitId) => {
      const progress = catalogue.lessons
        .filter((lesson) => lesson.unitId !== unitId && lesson.unitId !== sourceUnit)
        .map((lesson) => ({
          lessonId: lesson.id,
          contentVersion: lesson.contentVersion,
          passed: true,
          eligibleCorrect: 10,
          total: 10,
        }));
      const locked = learningPath(catalogue, progress, [unitId]).find((unit) => unit.id === unitId);
      expect(locked?.lessons.every((lesson) => lesson.status === 'locked')).toBe(true);
      const withSources = [
        ...progress,
        ...catalogue.lessons
          .filter((lesson) => lesson.unitId === sourceUnit)
          .map((lesson) => ({
            lessonId: lesson.id,
            contentVersion: lesson.contentVersion,
            passed: true,
            eligibleCorrect: 10,
            total: 10,
          })),
      ];
      const open = learningPath(catalogue, withSources, [unitId]).find(
        (unit) => unit.id === unitId,
      );
      expect(open?.lessons.every((lesson) => lesson.status === 'tested')).toBe(true);
    },
  );
});
