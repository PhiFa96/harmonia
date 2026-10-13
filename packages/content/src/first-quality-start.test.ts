import { describe, expect, it } from 'vitest';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
  isIntervalReadingItem,
  itemVariantKey,
  lessonSummary,
  nextLessonExercise,
  startLessonReview,
} from '@harmonia/exercises';
import { catalogue, curriculumPlan } from './authoring.ts';
import { exerciseSpecSchema, publicCatalogue, resolveLesson } from './index.ts';
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Fehlt');
  return value;
}
describe('Erste Intervallqualitäten', () => {
  it.each([
    ['distance', 8],
    ['thirds', 10],
    ['perfect', 12],
  ] as const)('%s: %s Aufgaben und 150 vollständige Fehlerdurchgänge', (name, count) => {
    const lesson = required(resolveLesson(catalogue, `intervals.l1.first-qualities.${name}`));
    expect(lesson).toMatchObject({ contentVersion: 10, status: 'entwurf' });
    expect(lesson.introduction).toHaveLength(3);
    expect(lesson.exercises).toHaveLength(count);
    for (let seed = 0; seed < 150; seed++) {
      let session = createLessonSession(lesson, seed);
      while (session.phase === 'initial') {
        const item = required(currentItem(required(activeLessonSession(session))));
        if (!isIntervalReadingItem(item)) throw new Error('Intervallfrage fehlt');
        expect(['semitones', 'quality', 'perfect']).toContain(item.question);
        expect(item.from.alter).toBe(0);
        expect(item.to.alter).toBe(0);
        expect(item.clef).toBe('treble');
        session = nextLessonExercise(
          answerLesson(session, required(item.choices.find((a) => a !== expectedAnswer(item)))),
        );
      }
      expect(session.phase).toBe('review-intro');
      required(session.review).items.forEach((item, index) => {
        expect(itemVariantKey(item)).not.toBe(
          itemVariantKey(required(session.initial.items[index])),
        );
        expect(expectedAnswer(item)).not.toBe(
          expectedAnswer(required(session.initial.items[index])),
        );
      });
      session = startLessonReview(session);
      while (session.phase === 'review') {
        const item = required(currentItem(required(activeLessonSession(session))));
        session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
      }
      expect(lessonSummary(session)).toMatchObject({
        correct: 0,
        answered: count,
        reviewCorrect: count,
        unresolved: 0,
      });
      expect(JSON.parse(JSON.stringify(session))).toEqual(session);
    }
  });
  it('neun Karten und 15 vollständige Klaviatur-/Notenbeispiele bleiben Entwurf', () => {
    expect(catalogue.contentVersion).toBe(11);
    expect(curriculumPlan.contentVersion).toBe(11);
    expect(catalogue.lessons).toHaveLength(37);
    const cards = catalogue.knowledgeCards.filter((c) =>
      c.id.startsWith('intervals.l1.first-qualities.'),
    );
    expect(cards).toHaveLength(9);
    expect(cards.flatMap((c) => c.examples)).toHaveLength(15);
    expect(cards.flatMap((c) => c.examples).every((e) => e.keyboard !== undefined)).toBe(true);
    expect(
      catalogue.knowledgeArticles.find((a) => a.id === 'intervals.l1.first-qualities.article')
        ?.sections,
    ).toHaveLength(9);
    expect(publicCatalogue(catalogue)).toMatchObject({
      lessons: [],
      knowledgeCards: [],
      knowledgeArticles: [],
    });
    expect(resolveLesson(catalogue, 'intervals.l1.size.numbers')?.contentVersion).toBe(9);
    expect(catalogue.skills.find((s) => s.id === 'interval.thirds')?.prerequisites).toEqual([
      'interval.generic-size',
      'interval.semitone-distance',
    ]);
  });
  it('die neuen Frageformen sind nur bei visueller Erkennung und passender Antwortvielfalt erlaubt', () => {
    for (const question of ['semitones', 'quality', 'perfect']) {
      const params = {
        question,
        intervals: ['P4', 'P5', 'P8', 'A4', 'd5'],
        maxAccidentals: 0,
        direction: 'both',
      };
      const spec = { type: 'INTERVAL_IDENTIFY_VISUAL', params };
      expect(exerciseSpecSchema.parse(spec)).toEqual(spec);
      for (const type of ['INTERVAL_BUILD', 'INTERVAL_IDENTIFY_AURAL'])
        expect(exerciseSpecSchema.safeParse({ type, params }).success).toBe(false);
    }
    expect(
      exerciseSpecSchema.safeParse({
        type: 'INTERVAL_IDENTIFY_VISUAL',
        params: { question: 'perfect', intervals: ['P4', 'P5', 'P8'], maxAccidentals: 0 },
      }).success,
    ).toBe(false);
  });
});
