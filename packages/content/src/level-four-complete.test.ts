import { describe, expect, it } from 'vitest';
import { catalogue, curriculumPlan } from './authoring.ts';
import { knowledgeArticles, learningPath, publicCatalogue, resolveLesson } from './index.ts';
import {
  answerLesson,
  createLessonSession,
  evaluateExercise,
  expectedAnswer,
  nextLessonExercise,
} from '@harmonia/exercises';

const levelIds = new Set(catalogue.levels.filter((level) => level.number === 4).map((v) => v.id));
const units = catalogue.units.filter(
  (unit) => levelIds.has(unit.levelId) && !['satz.l4.writing', 'aural.l4.choir'].includes(unit.id),
);
const unitIds = new Set(units.map((unit) => unit.id));
const lessons = catalogue.lessons.filter((lesson) => unitIds.has(lesson.unitId));

describe('Stufe 4 als interner Entwurf', () => {
  it('ordnet 13 Einheiten, 39 Fähigkeiten und 390 Aufgaben samt Karten und Artikeln zu', () => {
    expect(units).toHaveLength(13);
    expect(lessons).toHaveLength(39);
    const skills = new Set<string>();
    for (const unit of units) {
      const plan = curriculumPlan.units.find((entry) => entry.unitId === unit.id);
      expect(plan?.skillIds).toHaveLength(3);
      const ownLessons = lessons.filter((lesson) => lesson.unitId === unit.id);
      expect(
        ownLessons.map((lesson) => resolveLesson(catalogue, lesson.id)?.exercises.length),
      ).toEqual([8, 10, 12]);
      expect(
        catalogue.knowledgeCards.filter((card) => card.id.startsWith(`${unit.id}.card-`)),
      ).toHaveLength(4);
      for (const id of plan?.skillIds ?? []) {
        skills.add(id);
        expect(ownLessons.every((lesson) => lesson.skillIds.includes(id))).toBe(true);
        expect(catalogue.knowledgeCards.some((card) => card.skillIds.includes(id))).toBe(true);
        expect(catalogue.knowledgeArticles.some((article) => article.skillIds.includes(id))).toBe(
          true,
        );
      }
    }
    expect(skills.size).toBe(39);
    expect(
      lessons.reduce(
        (sum, lesson) => sum + (resolveLesson(catalogue, lesson.id)?.exercises.length ?? 0),
        0,
      ),
    ).toBe(390);
    expect(knowledgeArticles(catalogue, 'preview').filter(({ stage }) => stage === 4)).toHaveLength(
      13,
    );
    expect(learningPath(catalogue, []).filter((unit) => unit.level === 4)).toHaveLength(15);
    expect(publicCatalogue(catalogue).lessons).toHaveLength(0);
  });

  it.each(lessons.map((lesson) => lesson.id))(
    '%s erzeugt und bewertet 25 vollständige Varianten',
    (id) => {
      const lesson = resolveLesson(catalogue, id);
      expect(lesson).toBeDefined();
      if (!lesson) return;
      for (let seed = 0; seed < 25; seed++) {
        let session = createLessonSession(lesson, seed);
        expect(session.initial.items).toHaveLength(lesson.exercises.length);
        for (const item of session.initial.items) {
          const answer = expectedAnswer(item);
          expect(evaluateExercise(item, answer)).toMatchObject({
            validAnswer: true,
            correct: true,
          });
          session = nextLessonExercise(answerLesson(session, answer));
        }
        expect(session.phase).toBe('complete');
      }
    },
  );
});
