import { describe, expect, it } from 'vitest';
import { catalogue, curriculumPlan } from './authoring.ts';
import { resolveLesson, publicCatalogue } from './index.ts';
import {
  activeLessonSession,
  answerLesson,
  chordTargets,
  createLessonSession,
  currentItem,
  expectedAnswer,
  itemVariantKey,
  lessonSummary,
  nextLessonExercise,
  scalePitches,
  skipLessonAural,
  startLessonReview,
} from '@harmonia/exercises';
import type { ExerciseItem } from '@harmonia/exercises';
import { formatPitch } from '@harmonia/theory';
function required<T>(v: T | undefined): T {
  if (v === undefined) throw new Error('Fehlt');
  return v;
}
const levels = new Set(catalogue.levels.filter((l) => l.number === 2).map((l) => l.id));
const units = catalogue.units.filter((u) => levels.has(u.levelId)),
  unitIds = new Set(units.map((u) => u.id));
const lessons = catalogue.lessons.filter((l) => unitIds.has(l.unitId));
function wrong(item: ExerciseItem): string {
  if (item.type === 'SIGHT_SING' || item.type === 'SING_INTERVAL' || item.type === 'PLAY_BACK')
    return expectedAnswer(item).replace(
      /^voice:(\d+)/,
      (_, first: string) => `voice:${String(Number(first) + 600)}`,
    );
  const expected = expectedAnswer(item),
    choice = item.choices.find((a) => a !== expected);
  if (choice) return choice;
  if (item.type === 'RHYTHM_TAP') return 'taps:';
  if (item.type === 'NOTE_PLACE' || item.type === 'INTERVAL_BUILD')
    return expected === 'C4' ? 'D4' : 'C4';
  if (item.type === 'KEY_FIND') return expected === 'key:60' ? 'key:59' : 'key:60';
  if (item.type === 'SCALE_BUILD') {
    const p = scalePitches(item);
    p[1] = item.tonic;
    return 'notes:' + p.map((v) => formatPitch(v)).join(',');
  }
  if (item.type === 'CHORD_BUILD') {
    const p = [...chordTargets(item)];
    p[1] = item.bass;
    return 'chord-notes:' + p.map((v) => formatPitch(v)).join(',');
  }
  throw new Error('Keine falsche Vollantwort für ' + item.type);
}
describe('Stufe 2 vollständig intern', () => {
  it('16 Einheiten, 50 Fähigkeiten, 48 Lektionen und 480 Aufgaben sind vollständig zugeordnet', () => {
    expect(units).toHaveLength(16);
    expect(lessons).toHaveLength(48);
    const skills = new Set<string>();
    for (const u of units) {
      const plan = required(curriculumPlan.units.find((p) => p.unitId === u.id));
      const ls = lessons.filter((l) => l.unitId === u.id);
      expect(ls.map((l) => required(resolveLesson(catalogue, l.id)).exercises.length)).toEqual([
        8, 10, 12,
      ]);
      for (const id of plan.skillIds) {
        skills.add(id);
        expect(ls.some((l) => l.skillIds.includes(id))).toBe(true);
        expect(catalogue.knowledgeCards.some((c) => c.skillIds.includes(id))).toBe(true);
        expect(catalogue.knowledgeArticles.some((a) => a.skillIds.includes(id))).toBe(true);
      }
    }
    expect(skills.size).toBe(50);
    expect(
      lessons.reduce((n, l) => n + required(resolveLesson(catalogue, l.id)).exercises.length, 0),
    ).toBe(480);
    expect(catalogue.contentVersion).toBe(17);
    expect(curriculumPlan.contentVersion).toBe(17);
    expect(catalogue.lessons).toHaveLength(160);
    expect(catalogue.knowledgeCards).toHaveLength(350);
    expect(catalogue.knowledgeCards.flatMap((c) => c.examples)).toHaveLength(407);
    expect(catalogue.knowledgeArticles).toHaveLength(54);
    expect(publicCatalogue(catalogue)).toMatchObject({
      lessons: [],
      knowledgeCards: [],
      knowledgeArticles: [],
    });
  });
  it.each(lessons.map((l) => l.id))(
    '%s: 100 vollständige Fehler- und Wiederholungsdurchgänge',
    (id) => {
      const lesson = required(resolveLesson(catalogue, id));
      for (let seed = 0; seed < 100; seed++) {
        let state = createLessonSession(lesson, seed);
        while (state.phase === 'initial')
          state = nextLessonExercise(
            answerLesson(state, wrong(required(currentItem(required(activeLessonSession(state)))))),
          );
        expect(state.phase).toBe('review-intro');
        required(state.review).items.forEach((item, i) => {
          expect(itemVariantKey(item)).not.toBe(itemVariantKey(required(state.initial.items[i])));
        });
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
          answered: lesson.exercises.length,
          reviewCorrect: lesson.exercises.length,
          unresolved: 0,
        });
        expect(JSON.parse(JSON.stringify(state))).toEqual(state);
      }
    },
    20_000,
  );
  it.each(lessons.filter((l) => l.unitId.startsWith('aural.')).map((l) => l.id))(
    '%s: Hörpause erfindet keine Wertung',
    (id) => {
      const lesson = required(resolveLesson(catalogue, id)),
        state = skipLessonAural(createLessonSession(lesson, 17));
      expect(state.phase).toBe('complete');
      expect(lessonSummary(state)).toMatchObject({
        answered: 0,
        correct: 0,
        skipped: lesson.exercises.length,
        accuracy: null,
      });
    },
  );
});
