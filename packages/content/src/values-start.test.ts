import { describe, expect, it } from 'vitest';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
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
describe('Notenwerte, Pausen und Taktfüllung', () => {
  it.each([
    ['notes', 8],
    ['rests', 10],
    ['fill', 12],
  ] as const)('%s: %s Aufgaben und neue Fehlerwiederholungen in 150 Seeds', (name, count) => {
    const lesson = required(resolveLesson(catalogue, `rhythm.l1.values.${name}`));
    expect(lesson).toMatchObject({ contentVersion: 7, status: 'entwurf' });
    expect(lesson.introduction).toHaveLength(3);
    expect(lesson.exercises).toHaveLength(count);
    for (let seed = 0; seed < 150; seed++) {
      let session = createLessonSession(lesson, seed);
      while (session.phase === 'initial') {
        const item = required(currentItem(required(activeLessonSession(session))));
        const correct = expectedAnswer(item);
        const wrong =
          item.type === 'MATCH' || item.type === 'ORDER'
            ? correct.slice(0, correct.indexOf(':') + 1) +
              correct
                .slice(correct.indexOf(':') + 1)
                .split(',')
                .reverse()
                .join(',')
            : required(item.choices.find((id) => id !== correct));
        session = nextLessonExercise(answerLesson(session, wrong));
      }
      expect(session.phase).toBe('review-intro');
      required(session.review).items.forEach((item, index) => {
        expect(itemVariantKey(item)).not.toBe(
          itemVariantKey(required(session.initial.items[index])),
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
  it('neun Karten, 15 vollständige Hörbeispiele und ein Artikel bleiben Entwurf', () => {
    expect(catalogue.contentVersion).toBe(9);
    expect(curriculumPlan.contentVersion).toBe(9);
    expect(catalogue.lessons).toHaveLength(22);
    const cards = catalogue.knowledgeCards.filter((c) => c.id.startsWith('rhythm.l1.values.'));
    expect(cards).toHaveLength(9);
    expect(cards.flatMap((c) => c.examples)).toHaveLength(15);
    expect(
      catalogue.knowledgeArticles.find((a) => a.id === 'rhythm.l1.values.article')?.sections,
    ).toHaveLength(9);
    expect(publicCatalogue(catalogue)).toMatchObject({
      lessons: [],
      knowledgeCards: [],
      knowledgeArticles: [],
    });
    expect(resolveLesson(catalogue, 'rhythm.l1.pulse.steady')?.contentVersion).toBe(6);
    expect(catalogue.skills.find((s) => s.id === 'rhythm.note-values')?.prerequisites).toEqual([
      'rhythm.pulse',
    ]);
  });
  it('erhält Parameter und lehnt versteckte Punktierungen oder fachfremde Darstellungen ab', () => {
    for (const type of ['KNOWLEDGE_MC', 'MATCH', 'ORDER']) {
      const spec = { type, params: { topics: ['noteValues'], maxDots: 0 } };
      expect(exerciseSpecSchema.parse(spec)).toEqual(spec);
    }
    for (const params of [
      { topics: ['noteValues'], presentation: 'symbol' },
      { topics: ['rests'], maxDots: 1, presentation: 'measure-gap' },
      { topics: ['pulse'], maxDots: 0 },
      { topics: ['barlines'], maxDots: 0, presentation: 'symbol' },
      { topics: ['rests'], maxDots: 2 },
    ])
      expect(exerciseSpecSchema.safeParse({ type: 'KNOWLEDGE_MC', params }).success).toBe(false);
    expect(
      exerciseSpecSchema.safeParse({
        type: 'MATCH',
        params: { topics: ['rests'], maxDots: 0, presentation: 'symbol' },
      }).success,
    ).toBe(false);
    expect(
      exerciseSpecSchema.safeParse({
        type: 'ORDER',
        params: { topics: ['noteValues'], maxDots: 0, count: 6 },
      }).success,
    ).toBe(false);
  });
});
