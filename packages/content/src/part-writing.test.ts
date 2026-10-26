import { describe, expect, it } from 'vitest';
import { catalogue, curriculumPlan } from './authoring.ts';
import {
  publicCatalogue,
  resolveLesson,
  resolveReportSource,
  exerciseSpecSchema,
  learningPath,
  lessonEvent,
  validateLearningEvent,
} from './index.ts';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
  evaluateExercise,
  itemVariantKey,
  lessonReviewItem,
  lessonSummary,
  nextLessonExercise,
  satbAnswerId,
  startLessonReview,
} from '@harmonia/exercises';

describe('P4.10 internal course integration', () => {
  it('contains six draft lessons across stages 4 and 5, with prerequisites and no public exercises', () => {
    const lessons = catalogue.lessons.filter((l) => l.id.includes('.writing.'));
    expect(lessons).toHaveLength(6);
    expect(lessons.every((l) => l.status === 'entwurf' && l.contentVersion === 22)).toBe(true);
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
        expect(() => resolveReportSource(catalogue, { ...source, contentVersion: 19 })).toThrow();
        expect(evaluateExercise(item, expectedAnswer(item)).correct).toBe(true);
        expect(() => resolveReportSource(publicCatalogue(catalogue), source)).toThrow();
      }
    }
  });
  it('starts all six lessons with C, F and G major exactly once across numeric and text seeds', () => {
    for (const entry of catalogue.lessons.filter((lesson) => lesson.id.includes('.writing.'))) {
      const lesson = resolveLesson(catalogue, entry.id);
      if (!lesson) throw new Error('Draft lesson missing');
      for (const seed of [
        0,
        -1,
        4294967295,
        'p410-content',
        ...Array.from({ length: 50 }, (_, i) => i),
      ]) {
        const session = createLessonSession(lesson, seed);
        expect(
          session.initial.items.map((item) => item.type === 'VOICE_LEADING' && item.fifths),
        ).toEqual([0, -1, 1]);
        expect(new Set(session.initial.items.map(itemVariantKey)).size).toBe(3);
        expect(new Set(session.initial.items.map(expectedAnswer)).size).toBe(3);
        expect(createLessonSession(lesson, seed)).toEqual(session);
      }
    }
  });
  it('finishes failed fixed-key tasks with changed, replayable reviews and reconstructs each source', () => {
    for (const entry of catalogue.lessons.filter((lesson) => lesson.id.includes('.writing.'))) {
      const lesson = resolveLesson(catalogue, entry.id);
      if (!lesson) throw new Error('Draft lesson missing');
      for (const seed of [0, 1, 42, 'satb-review', 'other-review']) {
        let state = createLessonSession(lesson, seed);
        const originals = state.initial.items;
        while (state.phase === 'initial') {
          const item = currentItem(state.initial);
          if (item?.type !== 'VOICE_LEADING') throw new Error('SATB task missing');
          // Alto is editable in every mode; a chromatically altered chord tone is a valid error.
          const alto = item.example[0]?.alto;
          if (!alto) throw new Error('Alto missing');
          const wrong = satbAnswerId(
            item.example.map((slice, index) =>
              index === 0 ? { ...slice, alto: { ...alto, alter: alto.alter + 1 } } : slice,
            ),
          );
          expect(evaluateExercise(item, wrong)).toMatchObject({
            validAnswer: true,
            correct: false,
          });
          state = nextLessonExercise(answerLesson(state, wrong));
        }
        expect(state.phase).toBe('review-intro');
        expect(state.reviewOrigins).toEqual([0, 1, 2]);
        for (const [index, review] of (state.review?.items ?? []).entries()) {
          const initial = originals[index];
          if (initial?.type !== 'VOICE_LEADING' || review.type !== 'VOICE_LEADING')
            throw new Error('SATB review missing');
          expect(review.fifths).not.toBe(initial.fifths);
          expect(expectedAnswer(review)).not.toBe(expectedAnswer(initial));
          expect(lessonReviewItem(lesson, seed, index)).toEqual(review);
          expect(
            resolveReportSource(catalogue, {
              kind: 'lesson',
              lessonId: lesson.id,
              contentVersion: lesson.contentVersion,
              seed,
              round: 'review',
              index,
            }).item,
          ).toEqual(review);
        }
        state = startLessonReview(state);
        while (state.phase === 'review') {
          const active = activeLessonSession(state);
          const item = active && currentItem(active);
          if (!item) throw new Error('Review task missing');
          state = nextLessonExercise(answerLesson(state, expectedAnswer(item)));
        }
        expect(state.phase).toBe('complete');
        expect(lessonSummary(state)).toMatchObject({
          correct: 0,
          answered: 3,
          reviewCorrect: 3,
          unresolved: 0,
        });
        const event = lessonEvent('p410-review-proof', state, 1, 2);
        expect(validateLearningEvent(catalogue, event).lesson).toMatchObject({
          eligibleCorrect: 0,
          total: 3,
          passed: false,
        });
        expect(() => validateLearningEvent(catalogue, { ...event, contentVersion: 19 })).toThrow();
      }
    }
  });
  it('rejects unsupported levels, modes and caller-defined grading rules', () => {
    for (const params of [
      { mode: 'bass', level: 3 },
      { mode: 'free', level: 4 },
      { mode: 'bass', level: 4, rules: {} },
      { mode: 'bass', level: 4, fifths: -2 },
      { mode: 'bass', level: 4, fifths: 2 },
      { mode: 'bass', level: 4, fifths: [0, -1, 1] },
      { mode: 'bass', level: 4, fifths: null },
      { mode: 'bass', level: 4, fifths: '0' },
    ])
      expect(exerciseSpecSchema.safeParse({ type: 'VOICE_LEADING', params }).success).toBe(false);
  });
  it('stage-5 writing requires writing seventh chords, because the progression uses V7', () => {
    for (const name of ['bass', 'soprano', 'functions']) {
      const skill = catalogue.skills.find((s) => s.id === `satz.l5.writing.${name}`);
      expect(skill?.prerequisites).toContain('chords.l3.sevenths.s2');
    }
  });
});
