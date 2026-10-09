import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
  itemVariantKey,
  lessonSummary,
  nextLessonExercise,
  revealLessonHint,
  startLessonReview,
} from '@harmonia/exercises';
import { midi } from '@harmonia/theory';
import { catalogue, curriculumPlan, firstLesson } from './authoring.ts';
import { publicCatalogue, resolveLesson } from './index.ts';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Testwert fehlt');
  return value;
}
const lessons = [
  ['anchor', 8, 65, 71, 3],
  ['positions', 10, 64, 77, 2],
  ['reading', 12, 64, 77, 2],
] as const;
describe('Erste Notationseinheit in Stufe 1', () => {
  it.each(lessons)(
    '%s: Umfang, Tonraum und neue Fehler für 150 Seeds',
    (name, count, min, max, cards) => {
      const content = required(resolveLesson(catalogue, `notation.l1.staff.${name}`));
      expect(content).toMatchObject({ contentVersion: 3, status: 'entwurf' });
      expect(content.introduction).toHaveLength(cards);
      expect(content.exercises).toHaveLength(count);
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          let state = createLessonSession(content, seed);
          expect(state.initial.items).toEqual(createLessonSession(content, seed).initial.items);
          for (const item of state.initial.items) {
            expect(item.type).toBe('NOTE_NAME');
            if (item.type !== 'NOTE_NAME') throw new Error('Notennamen erwartet');
            expect(item.clef).toBe('treble');
            expect(item.pitch.alter).toBe(0);
            expect(midi(item.pitch)).toBeGreaterThanOrEqual(min);
            expect(midi(item.pitch)).toBeLessThanOrEqual(max);
          }
          state = revealLessonHint(state);
          while (state.phase === 'initial') {
            const item = required(currentItem(required(activeLessonSession(state))));
            const wrong = required(item.choices.find((id) => id !== expectedAnswer(item)));
            state = nextLessonExercise(answerLesson(state, wrong));
          }
          expect(state.phase).toBe('review-intro');
          expect(state.reviewOrigins).toHaveLength(count);
          required(state.review).items.forEach((item, index) => {
            expect(itemVariantKey(item)).not.toBe(
              itemVariantKey(required(state.initial.items[index])),
            );
          });
          state = startLessonReview(state);
          while (state.phase === 'review') {
            const item = required(currentItem(required(activeLessonSession(state))));
            state = nextLessonExercise(answerLesson(state, expectedAnswer(item)));
          }
          expect(lessonSummary(state)).toMatchObject({
            correct: 0,
            answered: count,
            assisted: 1,
            reviewCorrect: count,
            unresolved: 0,
          });
        }),
        { numRuns: 150, seed: 20701 },
      );
    },
  );
  it('ordnet alle drei Lektionen denselben drei Grundlagenfähigkeiten zu', () => {
    const expected = ['notation.staff', 'notation.treble-clef', 'notation.treble-natural'];
    const unit = required(
      curriculumPlan.units.find((entry) => entry.unitId === 'notation.l1.staff'),
    );
    expect(unit.skillIds).toEqual(expected);
    const records = catalogue.lessons.filter((lesson) => lesson.unitId === unit.unitId);
    expect(records).toHaveLength(3);
    for (const record of records) expect(record.skillIds).toEqual(expected);
  });
  it('hält sieben neue Karten und den vierteiligen Artikel samt Kursdaten intern', () => {
    expect(
      catalogue.knowledgeCards.filter((card) => card.id.startsWith('notation.l1.staff.')),
    ).toHaveLength(7);
    const article = required(
      catalogue.knowledgeArticles.find((value) => value.id === 'notation.l1.staff.article'),
    );
    expect(article.status).toBe('entwurf');
    expect(article.sections).toHaveLength(4);
    const published = publicCatalogue(catalogue);
    expect(published.lessons).toHaveLength(0);
    expect(published.knowledgeCards).toHaveLength(0);
    expect(published.knowledgeArticles).toHaveLength(0);
    for (const [name] of lessons)
      expect(resolveLesson(published, `notation.l1.staff.${name}`)).toBeUndefined();
  });
  it('erhält die bisherige Lektion und erhöht nur den Katalog und seinen Plan', () => {
    expect(firstLesson).toMatchObject({
      id: 'fundament.reading-and-listening.1',
      contentVersion: 1,
    });
    expect(firstLesson.exercises).toHaveLength(10);
    expect(catalogue.contentVersion).toBe(4);
    expect(curriculumPlan.contentVersion).toBe(4);
    expect(resolveLesson(catalogue, 'unknown.lesson')).toBeUndefined();
  });
});
