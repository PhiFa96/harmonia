import { describe, expect, it } from 'vitest';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
  intervalReadingPitches,
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
describe('Intervallgröße, Richtung und Schritt/Sprung', () => {
  it.each([
    ['numbers', 8],
    ['direction', 10],
    ['motion', 12],
  ] as const)('%s: %s Aufgaben und 150 vollständige Fehlerdurchgänge', (name, count) => {
    const lesson = required(resolveLesson(catalogue, `intervals.l1.size.${name}`));
    expect(lesson).toMatchObject({ contentVersion: 9, status: 'entwurf' });
    expect(lesson.introduction).toHaveLength(3);
    expect(lesson.exercises).toHaveLength(count);
    for (let seed = 0; seed < 150; seed++) {
      let session = createLessonSession(lesson, seed);
      while (session.phase === 'initial') {
        const item = required(currentItem(required(activeLessonSession(session))));
        if (!isIntervalReadingItem(item)) throw new Error('Grundlagenfrage fehlt');
        expect(intervalReadingPitches(item).every((pitch) => pitch.alter === 0)).toBe(true);
        expect(item.clef).toBe('treble');
        const wrong = required(item.choices.find((answer) => answer !== expectedAnswer(item)));
        session = nextLessonExercise(answerLesson(session, wrong));
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
  it('Version 9 ergänzt neun Karten, 15 vollständige Notenbeispiele und einen Artikel', () => {
    expect(catalogue.contentVersion).toBe(15);
    expect(curriculumPlan.contentVersion).toBe(15);
    expect(catalogue.lessons).toHaveLength(121);
    const cards = catalogue.knowledgeCards.filter((card) =>
      card.id.startsWith('intervals.l1.size.'),
    );
    expect(cards).toHaveLength(9);
    expect(cards.flatMap((card) => card.examples)).toHaveLength(15);
    expect(
      catalogue.knowledgeArticles.find((article) => article.id === 'intervals.l1.size.article')
        ?.sections,
    ).toHaveLength(9);
    expect(publicCatalogue(catalogue)).toMatchObject({
      lessons: [],
      knowledgeCards: [],
      knowledgeArticles: [],
    });
    expect(
      catalogue.skills.find((skill) => skill.id === 'interval.generic-size')?.prerequisites,
    ).toEqual(['notation.treble-natural']);
    expect(resolveLesson(catalogue, 'rhythm.l1.simple-meter.meter')?.contentVersion).toBe(8);
  });
  it('nur visuelle Erkennung übernimmt die Grundlagenfrage', () => {
    const params = {
      intervals: ['P1', 'M2', 'M3'],
      direction: 'both',
      maxAccidentals: 0,
      question: 'number',
    };
    expect(exerciseSpecSchema.parse({ type: 'INTERVAL_IDENTIFY_VISUAL', params })).toEqual({
      type: 'INTERVAL_IDENTIFY_VISUAL',
      params,
    });
    for (const type of ['INTERVAL_BUILD', 'INTERVAL_IDENTIFY_AURAL'])
      expect(exerciseSpecSchema.safeParse({ type, params }).success).toBe(false);
    for (const question of ['number', 'direction', 'motion'])
      expect(
        exerciseSpecSchema.safeParse({
          type: 'INTERVAL_IDENTIFY_VISUAL',
          params: { ...params, question },
        }).success,
      ).toBe(true);
  });
});
