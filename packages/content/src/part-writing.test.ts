import { describe, expect, it } from 'vitest';
import { catalogue, curriculumPlan } from './authoring.ts';
import {
  publicCatalogue,
  resolveLesson,
  resolveReportSource,
  exerciseSpecSchema,
  learningPath,
} from './index.ts';
import { createLessonSession, expectedAnswer, evaluateExercise } from '@harmonia/exercises';

describe('P4.10 internal course integration', () => {
  it('contains six draft lessons across stages 4 and 5, with prerequisites and no public exercises', () => {
    const lessons = catalogue.lessons.filter((l) => l.id.includes('.writing.'));
    expect(lessons).toHaveLength(6);
    expect(lessons.every((l) => l.status === 'entwurf' && l.contentVersion === 19)).toBe(true);
    expect(curriculumPlan.units.filter((u) => u.unitId.endsWith('.writing'))).toHaveLength(2);
    expect(
      learningPath(catalogue, [])
        .filter((u) => u.id.endsWith('.writing'))
        .every((u) => u.status === 'locked'),
    ).toBe(true);
    expect(publicCatalogue(catalogue).lessons).toEqual([]);
    for (const lesson of lessons) {
      const resolved = resolveLesson(catalogue, lesson.id);
      if (!resolved) throw new Error('Draft lesson missing');
      expect(resolved.exercises).toHaveLength(3);
      const session = createLessonSession(resolved, 'p410-content');
      for (const [index, item] of session.initial.items.entries()) {
        expect(item.type).toBe('VOICE_LEADING');
        const source = {
          kind: 'lesson',
          lessonId: lesson.id,
          contentVersion: lesson.contentVersion,
          seed: 'p410-content',
          round: 'initial',
          index,
        };
        expect(resolveReportSource(catalogue, source).item).toEqual(item);
        expect(evaluateExercise(item, expectedAnswer(item)).correct).toBe(true);
        expect(() => resolveReportSource(publicCatalogue(catalogue), source)).toThrow();
      }
    }
  });
  it('rejects unsupported levels, modes and caller-defined grading rules', () => {
    for (const params of [
      { mode: 'bass', level: 3 },
      { mode: 'free', level: 4 },
      { mode: 'bass', level: 4, rules: {} },
    ])
      expect(exerciseSpecSchema.safeParse({ type: 'VOICE_LEADING', params }).success).toBe(false);
  });
});
