import { describe, expect, it } from 'vitest';
import { catalogue } from './authoring.ts';
import {
  publicCatalogue,
  resolveLesson,
  resolveReportSource,
  lessonExerciseSources,
  exerciseSpecSchema,
} from './index.ts';
import { lessonProgress } from './learning-evidence.ts';
import {
  answerLesson,
  choirAnswerId,
  createLessonSession,
  currentItem,
  expectedAnswer,
  evaluateExercise,
  itemVariantKey,
  lessonReviewItem,
  lessonSummary,
  nextLessonExercise,
  skipLessonVoice,
  startLessonReview,
} from '@harmonia/exercises';

describe('internal choir lessons', () => {
  const lessons = catalogue.lessons.filter((l) => l.unitId === 'aural.l4.choir');
  it('accepts only the three authored key parameters', () => {
    for (const fifths of [-2, 0, 2])
      expect(
        exerciseSpecSchema.safeParse({
          type: 'CHOIR_PART',
          params: { voice: 'alto', piece: 'arch', fifths },
        }).success,
      ).toBe(true);
    for (const fifths of [-3, -1, 1, 3, 0.5, '2', null])
      expect(
        exerciseSpecSchema.safeParse({
          type: 'CHOIR_PART',
          params: { voice: 'alto', piece: 'arch', fifths },
        }).success,
      ).toBe(false);
  });

  it('starts every voice with distinct C- and D-major targets and replays musically changed reviews', () => {
    for (const entry of lessons) {
      const lesson = resolveLesson(catalogue, entry.id);
      if (!lesson) throw new Error('Choir lesson missing');
      for (const seed of [0, 1, 42, 'choir-source', 'another-source']) {
        let state = createLessonSession(lesson, seed);
        const originals = state.initial.items;
        expect(originals.map((item) => item.type === 'CHOIR_PART' && item.params.fifths)).toEqual([
          0, 2,
        ]);
        expect(new Set(originals.map(itemVariantKey)).size).toBe(2);
        expect(new Set(originals.map(expectedAnswer)).size).toBe(2);
        expect(createLessonSession(lesson, seed)).toEqual(state);
        while (state.phase === 'initial')
          state = nextLessonExercise(
            answerLesson(
              state,
              choirAnswerId(Array.from({ length: 8 }, () => Array<null>(12).fill(null))),
            ),
          );
        expect(state.phase).toBe('review-intro');
        state = startLessonReview(state);
        for (const [index, original] of originals.entries()) {
          if (!state.review) throw new Error('Review missing');
          const repeated = currentItem(state.review);
          if (repeated?.type !== 'CHOIR_PART' || original.type !== 'CHOIR_PART')
            throw new Error('Choir source missing');
          expect(itemVariantKey(repeated)).not.toBe(itemVariantKey(original));
          expect(repeated.params.fifths).not.toBe(original.params.fifths);
          expect(evaluateExercise(repeated, expectedAnswer(original)).correct).toBe(false);
          expect(lessonReviewItem(lesson, seed, index)).toEqual(repeated);
          const source = {
            kind: 'lesson',
            lessonId: lesson.id,
            contentVersion: 26,
            seed,
            round: 'review',
            index,
          } as const;
          expect(resolveReportSource(catalogue, source).item).toEqual(repeated);
          for (const contentVersion of [20, 24, 25])
            expect(() => resolveReportSource(catalogue, { ...source, contentVersion })).toThrow();
          state = nextLessonExercise(answerLesson(state, expectedAnswer(repeated)));
        }
        expect(state.phase).toBe('complete');
        expect(lessonSummary(state)).toMatchObject({
          accuracy: 0,
          reviewCorrect: 2,
          unresolved: 0,
        });
      }
    }
  });
  it('contains four draft parts with two original pieces and no public lessons', () => {
    expect(lessons).toHaveLength(4);
    for (const l of lessons) {
      expect(l.status).toBe('entwurf');
      expect(resolveLesson(catalogue, l.id)?.exercises.map((s) => s.type)).toEqual([
        'CHOIR_PART',
        'CHOIR_PART',
      ]);
      expect(publicCatalogue(catalogue).lessons.some((p) => p.id === l.id)).toBe(false);
    }
  });
  it.each(['soprano', 'alto', 'tenor', 'bass'] as const)(
    '%s binds versioned key variants while retaining the original introduction',
    (voice) => {
      const id = `aural.l4.choir.${voice}.lesson`;
      const lesson = resolveLesson(catalogue, id);
      if (!lesson) throw new Error('Missing choir lesson');
      expect(lesson.contentVersion).toBe(26);
      expect(lesson.introduction).toHaveLength(1);
      expect(
        catalogue.knowledgeCards.find((card) => card.id === `aural.l4.choir.${voice}.card`),
      ).toMatchObject({
        id: `aural.l4.choir.${voice}.card`,
        contentVersion: 24,
        status: 'entwurf',
        titleKey: `content.choir.${voice}`,
      });
      expect(lesson.introduction[0]?.titleKey).toBe(`content.choir.${voice}`);
      expect(lesson.introduction[0]?.examples).toHaveLength(2);
      expect(lessonExerciseSources(catalogue, id)?.map((source) => source.contentVersion)).toEqual([
        25, 25,
      ]);
      const session = createLessonSession(lesson, 'choir-introduction');
      for (const [index, item] of session.initial.items.entries()) {
        const source = {
          kind: 'lesson',
          lessonId: id,
          contentVersion: 26,
          seed: 'choir-introduction',
          round: 'initial',
          index,
        };
        expect(resolveReportSource(catalogue, source).item).toEqual(item);
        for (const contentVersion of [20, 24, 25])
          expect(() => resolveReportSource(catalogue, { ...source, contentVersion })).toThrow();
        expect(() => resolveReportSource(publicCatalogue(catalogue), source)).toThrow();
      }
    },
  );
  it('does not pass a lesson or award a failed answer when both microphone tasks are skipped', () => {
    const first = lessons[0];
    if (!first) throw new Error('Missing choir lesson');
    const lesson = resolveLesson(catalogue, first.id);
    if (!lesson) throw new Error('Unresolved choir lesson');
    const session = skipLessonVoice(skipLessonVoice(createLessonSession(lesson, 1)));
    expect(session.phase).toBe('complete');
    expect(lessonProgress(session)).toMatchObject({
      passed: false,
      eligibleCorrect: 0,
      total: 2,
      voiceSkipped: 2,
    });
  });
});
