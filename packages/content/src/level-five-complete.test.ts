import { describe, expect, it } from 'vitest';
import { catalogue, curriculumPlan } from './authoring.ts';
import { knowledgeArticles, learningPath, publicCatalogue, resolveLesson } from './index.ts';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  evaluateExercise,
  expectedAnswer,
  itemVariantKey,
  nextLessonExercise,
  startLessonReview,
} from '@harmonia/exercises';
const units = catalogue.units.filter((unit) =>
  /^(counterpoint|forms|analysis|contemporary|world)\.l5\./.test(unit.id),
);
const unitIds = new Set(units.map((unit) => unit.id));
const lessons = catalogue.lessons.filter((lesson) => unitIds.has(lesson.unitId));

describe('P4.19 internal Stage 5 curriculum', () => {
  it('only asks context topics from units that are prerequisites of the lesson', () => {
    const skills = new Map(catalogue.skills.map((skill) => [skill.id, skill]));
    const ancestors = (id: string, seen = new Set<string>()): Set<string> => {
      for (const parent of skills.get(id)?.prerequisites ?? [])
        if (!seen.has(parent)) {
          seen.add(parent);
          ancestors(parent, seen);
        }
      return seen;
    };
    const topicsOf = (lesson: (typeof lessons)[number]) =>
      lesson.exerciseSetIds.flatMap((id) =>
        (catalogue.exerciseSets.find((set) => set.id === id)?.exercises ?? []).flatMap(
          ({ spec }) =>
            spec.type === 'CONTEXT_CHOICE' ? (spec.params as { topics: string[] }).topics : [],
        ),
      );
    // A topic is introduced by the first unit in plan order that asks it.
    const order = curriculumPlan.units.map((entry) => entry.unitId);
    const introducedIn = new Map<string, string>();
    for (const lesson of [...lessons].sort(
      (a, b) => order.indexOf(a.unitId) - order.indexOf(b.unitId),
    ))
      for (const topic of topicsOf(lesson))
        if (!introducedIn.has(topic)) introducedIn.set(topic, lesson.unitId);
    const missing: string[] = [];
    for (const lesson of lessons) {
      const reach = [...new Set(lesson.skillIds.flatMap((skill) => [...ancestors(skill)]))];
      for (const topic of topicsOf(lesson)) {
        const unit = introducedIn.get(topic);
        if (unit && unit !== lesson.unitId && !reach.some((skill) => skill.startsWith(`${unit}.`)))
          missing.push(`${lesson.id}: ${topic} (introduced in ${unit})`);
      }
    }
    expect(missing).toEqual([]);
  });
  it('adds eight connected units, 24 lessons, 240 tasks and eight draft articles', () => {
    expect(units).toHaveLength(8);
    expect(lessons).toHaveLength(24);
    for (const unit of units) {
      expect(catalogue.levels.find((level) => level.id === unit.levelId)?.number).toBe(5);
      const skills = curriculumPlan.units.find((entry) => entry.unitId === unit.id)?.skillIds;
      expect(skills).toHaveLength(3);
      const own = lessons.filter((lesson) => lesson.unitId === unit.id);
      expect(own.map((lesson) => resolveLesson(catalogue, lesson.id)?.exercises.length)).toEqual([
        8, 10, 12,
      ]);
      expect(
        catalogue.knowledgeCards.filter((card) => card.id.startsWith(`${unit.id}.card-`)),
      ).toHaveLength(4);
      for (const skill of skills ?? []) {
        expect(
          catalogue.skills.find((entry) => entry.id === skill)?.prerequisites.length,
        ).toBeGreaterThan(0);
        expect(own.every((lesson) => lesson.skillIds.includes(skill))).toBe(true);
        expect(
          catalogue.knowledgeArticles.some((article) => article.skillIds.includes(skill)),
        ).toBe(true);
      }
    }
    expect(knowledgeArticles(catalogue, 'preview').filter(({ stage }) => stage === 5)).toHaveLength(
      8,
    );
    expect(learningPath(catalogue, []).filter((unit) => unit.level === 5)).toHaveLength(9);
    expect(lessons.every((lesson) => lesson.status === 'entwurf')).toBe(true);
    expect(publicCatalogue(catalogue).lessons).toHaveLength(0);
    expect(knowledgeArticles(catalogue, 'published')).toHaveLength(0);
  });
  it.each(lessons.map((lesson) => lesson.id))(
    '%s completes with source-derived grading and changed review material',
    (id) => {
      const definition = resolveLesson(catalogue, id);
      if (!definition) throw new Error('Missing lesson');
      for (let seed = 0; seed < 10; seed++) {
        let lesson = createLessonSession(definition, seed);
        const initial = lesson.initial.items;
        for (const [index, item] of initial.entries()) {
          const expected = expectedAnswer(item);
          expect(evaluateExercise(item, expected)).toMatchObject({
            validAnswer: true,
            correct: true,
          });
          // Exercise a real wrong answer and canonical variant generation in each lesson.
          const wrong =
            item.type === 'CONTEXT_CHOICE' || item.type === 'KNOWLEDGE_MC'
              ? item.choices.find((choice) => choice !== expected)
              : undefined;
          lesson = nextLessonExercise(
            answerLesson(lesson, index === initial.length - 1 && wrong ? wrong : expected),
          );
        }
        if (lesson.phase === 'review-intro') {
          lesson = startLessonReview(lesson);
          const review = activeLessonSession(lesson),
            item = review && currentItem(review);
          if (!item) throw new Error('Missing review');
          expect(itemVariantKey(item)).not.toBe(
            itemVariantKey(initial[initial.length - 1] ?? item),
          );
          lesson = nextLessonExercise(answerLesson(lesson, expectedAnswer(item)));
        }
        expect(lesson.phase).toBe('complete');
      }
    },
  );
});
