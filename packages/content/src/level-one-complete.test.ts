import { describe, expect, it } from 'vitest';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
  itemVariantKey,
  knowledgeFactId,
  lessonSummary,
  matchAnswerId,
  nextLessonExercise,
  orderAnswerId,
  orderedValues,
  orderValueId,
  skipLessonAural,
  startLessonReview,
} from '@harmonia/exercises';
import type { ExerciseItem } from '@harmonia/exercises';
import { catalogue, curriculumPlan } from './authoring.ts';
import { publicCatalogue, resolveLesson } from './index.ts';
const units = [
  'aural.l1.pulse-rhythm',
  'aural.l1.pitch-intervals',
  'history.l1.sources',
  'history.l1.overview',
];
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Fehlt');
  return value;
}
function wrong(item: ExerciseItem) {
  if (item.type === 'MATCH') {
    const ids = item.facts.map(knowledgeFactId);
    return matchAnswerId([...ids.slice(1), required(ids[0])]);
  }
  if (item.type === 'ORDER')
    return orderAnswerId([...orderedValues(item)].reverse().map(orderValueId));
  return required(item.choices.find((a) => a !== expectedAnswer(item)));
}
const newLessons = catalogue.lessons.filter((l) => units.includes(l.unitId));
describe('Vollständige interne Stufe 1', () => {
  it('jede geplante Einheit und Fähigkeit besitzt Lektionen, Wissenskarten und einen Artikel', () => {
    const levels = new Set(catalogue.levels.filter((l) => l.number === 1).map((l) => l.id));
    const firstUnits = catalogue.units.filter(
      (u) => levels.has(u.levelId) && curriculumPlan.units.some((p) => p.unitId === u.id),
    );
    expect(firstUnits).toHaveLength(13);
    for (const unit of firstUnits) {
      const plan = required(curriculumPlan.units.find((p) => p.unitId === unit.id));
      const lessons = catalogue.lessons.filter((l) => l.unitId === unit.id);
      expect(lessons.length).toBeGreaterThan(0);
      const skills = new Set(lessons.flatMap((l) => l.skillIds));
      for (const id of plan.skillIds) {
        expect(skills.has(id), `${unit.id}: Lektion für ${id}`).toBe(true);
        expect(
          catalogue.knowledgeCards.some((c) => c.skillIds.includes(id)),
          `${unit.id}: Karte für ${id}`,
        ).toBe(true);
        expect(
          catalogue.knowledgeArticles.some((a) => a.skillIds.includes(id)),
          `${unit.id}: Artikel für ${id}`,
        ).toBe(true);
      }
    }
    const firstUnitIds = new Set(firstUnits.map((u) => u.id));
    const firstLessons = catalogue.lessons.filter((l) => firstUnitIds.has(l.unitId));
    const firstSkills = new Set(firstLessons.flatMap((l) => l.skillIds));
    expect(firstLessons).toHaveLength(37);
    expect(
      firstLessons.reduce(
        (n, l) => n + required(resolveLesson(catalogue, l.id)).exercises.length,
        0,
      ),
    ).toBe(370);
    expect(
      catalogue.knowledgeCards.filter((c) => c.skillIds.some((id) => firstSkills.has(id))),
    ).toHaveLength(106);
    expect(
      catalogue.knowledgeArticles.filter((a) => a.skillIds.some((id) => firstSkills.has(id))),
    ).toHaveLength(13);
    expect(catalogue.contentVersion).toBe(12);
    expect(curriculumPlan.contentVersion).toBe(12);
    expect(publicCatalogue(catalogue)).toMatchObject({
      lessons: [],
      knowledgeCards: [],
      knowledgeArticles: [],
    });
  });
  it('vier Einheiten haben je 8/10/12 Aufgaben, neun Karten und eigene vollständige Beispiele', () => {
    expect(newLessons).toHaveLength(12);
    for (const unit of units) {
      const lessons = newLessons.filter((l) => l.unitId === unit);
      expect(lessons.map((l) => required(resolveLesson(catalogue, l.id)).exercises.length)).toEqual(
        [8, 10, 12],
      );
      expect(lessons.every((l) => l.contentVersion === 11 && l.status === 'entwurf')).toBe(true);
      expect(catalogue.knowledgeCards.filter((c) => c.id.startsWith(unit + '.'))).toHaveLength(9);
      expect(
        catalogue.knowledgeArticles.find((a) => a.id === unit + '.article')?.sections,
      ).toHaveLength(9);
    }
    expect(
      catalogue.knowledgeCards.filter((c) => c.contentVersion === 11).flatMap((c) => c.examples),
    ).toHaveLength(46);
  });
  it.each(newLessons.map((l) => l.id))(
    '%s: 100 vollständige Fehler- und Wiederholungsdurchgänge',
    (id) => {
      const lesson = required(resolveLesson(catalogue, id));
      for (let seed = 0; seed < 100; seed++) {
        let session = createLessonSession(lesson, seed);
        while (session.phase === 'initial') {
          const item = required(currentItem(required(activeLessonSession(session))));
          session = nextLessonExercise(answerLesson(session, wrong(item)));
        }
        expect(session.phase).toBe('review-intro');
        required(session.review).items.forEach((item, i) => {
          const original = required(session.initial.items[i]);
          expect(itemVariantKey(item)).not.toBe(itemVariantKey(original));
          if (item.type === 'LISTENING_CHOICE')
            expect(expectedAnswer(item)).not.toBe(expectedAnswer(original));
        });
        session = startLessonReview(session);
        while (session.phase === 'review')
          session = nextLessonExercise(
            answerLesson(
              session,
              expectedAnswer(required(currentItem(required(activeLessonSession(session))))),
            ),
          );
        expect(lessonSummary(session)).toMatchObject({
          correct: 0,
          answered: lesson.exercises.length,
          reviewCorrect: lesson.exercises.length,
          unresolved: 0,
        });
        expect(JSON.parse(JSON.stringify(session))).toEqual(session);
      }
    },
    // 100 vollständige Durchgänge dauern bis etwa 3 s, unter Last in der CI auch über 5 s
    20_000,
  );
  it.each(newLessons.filter((l) => l.unitId.startsWith('aural.')).map((l) => l.id))(
    '%s: Hörpause zählt keine erfundenen richtigen Antworten',
    (id) => {
      const lesson = required(resolveLesson(catalogue, id)),
        session = skipLessonAural(createLessonSession(lesson, 42));
      expect(session.phase).toBe('complete');
      expect(lessonSummary(session)).toMatchObject({
        answered: 0,
        correct: 0,
        skipped: lesson.exercises.length,
        accuracy: null,
        unresolved: 0,
      });
    },
  );
});
