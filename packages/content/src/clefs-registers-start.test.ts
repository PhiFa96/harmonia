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
function required<T>(v: T | undefined): T {
  if (v === undefined) throw new Error('Fehlt');
  return v;
}
const unit = 'notation.l2.clefs-registers';
describe('Erste Stufe-2-Einheit', () => {
  it('195 Lektionen mit 1876 Aufgaben, neue 9 Karten/15 Beispiele/Artikel und drei Fähigkeiten', () => {
    expect(catalogue.contentVersion).toBe(28);
    expect(curriculumPlan.contentVersion).toBe(28);
    expect(catalogue.lessons).toHaveLength(195);
    expect(
      catalogue.lessons.reduce(
        (n, l) => n + required(resolveLesson(catalogue, l.id)).exercises.length,
        0,
      ),
    ).toBe(1876);
    const cards = catalogue.knowledgeCards.filter((c) => c.id.startsWith(unit));
    expect(cards).toHaveLength(9);
    expect(cards.flatMap((c) => c.examples)).toHaveLength(15);
    const article = required(catalogue.knowledgeArticles.find((a) => a.id === unit + '.article'));
    expect(article.sections).toHaveLength(9);
    const plan = required(curriculumPlan.units.find((u) => u.unitId === unit));
    for (const id of plan.skillIds) {
      expect(cards.some((c) => c.skillIds.includes(id))).toBe(true);
      expect(article.skillIds).toContain(id);
    }
    expect(publicCatalogue(catalogue)).toMatchObject({
      lessons: [],
      knowledgeCards: [],
      knowledgeArticles: [],
    });
  });
  it.each([
    ['bass', 8],
    ['grand', 10],
    ['names', 12],
  ] as const)('%s: %i Fragen und neue Zielhöhe nach jedem Fehler in 100 Seeds', (name, count) => {
    const lesson = required(resolveLesson(catalogue, unit + '.' + name));
    expect(lesson).toMatchObject({ status: 'entwurf', contentVersion: 12 });
    expect(lesson.exercises).toHaveLength(count);
    expect(lesson.introduction).toHaveLength(3);
    for (let seed = 0; seed < 100; seed++) {
      let state = createLessonSession(lesson, seed);
      if (name === 'names')
        expect(state.initial.items.map((i) => i.type === 'NOTE_NAME' && i.sourceSystem)).toEqual([
          ...Array<string>(6).fill('helmholtz'),
          ...Array<string>(6).fill('scientific'),
        ]);
      while (state.phase === 'initial') {
        const item = required(currentItem(required(activeLessonSession(state))));
        const answer =
          item.type === 'KEY_FIND'
            ? `key:${expectedAnswer(item) === 'key:60' ? '59' : '60'}`
            : required(item.choices.find((a) => a !== expectedAnswer(item)));
        state = nextLessonExercise(answerLesson(state, answer));
      }
      expect(state.phase).toBe('review-intro');
      for (const [i, item] of required(state.review).items.entries())
        expect(itemVariantKey(item)).not.toBe(itemVariantKey(required(state.initial.items[i])));
      state = startLessonReview(state);
      while (state.phase === 'review')
        state = nextLessonExercise(
          answerLesson(
            state,
            expectedAnswer(required(currentItem(required(activeLessonSession(state))))),
          ),
        );
      expect(lessonSummary(state)).toMatchObject({
        correct: 0,
        answered: count,
        reviewCorrect: count,
        unresolved: 0,
      });
      expect(JSON.parse(JSON.stringify(state))).toEqual(state);
    }
  });
  it('bewahrt neue Parameter und lehnt unpassende Kombinationen früh ab', () => {
    const specs = required(resolveLesson(catalogue, unit + '.names')).exercises;
    for (const spec of specs) expect(exerciseSpecSchema.parse(spec)).toEqual(spec);
    for (const params of [
      { presentation: 'octave-name', includeOctave: false },
      { sourceSystem: 'scientific' },
      { presentation: 'octave-name', maxAccidentals: 1 },
    ])
      expect(exerciseSpecSchema.safeParse({ type: 'NOTE_NAME', params }).success).toBe(false);
    expect(
      exerciseSpecSchema.safeParse({
        type: 'KEY_FIND',
        params: { presentation: 'grand-staff', range: { minMidi: 48, maxMidi: 64 } },
      }).success,
    ).toBe(false);
  });
});
