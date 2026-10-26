import { describe, expect, it } from 'vitest';
import { catalogue } from './authoring.ts';
import {
  publicCatalogue,
  resolveLesson,
  resolveReportSource,
  lessonExerciseSources,
} from './index.ts';
import { lessonProgress } from './learning-evidence.ts';
import { createLessonSession, skipLessonVoice } from '@harmonia/exercises';

describe('internal choir lessons', () => {
  const lessons = catalogue.lessons.filter((l) => l.unitId === 'aural.l4.choir');
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
    '%s binds the new introduction version while retaining the original task sources',
    (voice) => {
      const id = `aural.l4.choir.${voice}.lesson`;
      const lesson = resolveLesson(catalogue, id);
      if (!lesson) throw new Error('Missing choir lesson');
      expect(lesson.contentVersion).toBe(24);
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
        20, 20,
      ]);
      const session = createLessonSession(lesson, 'choir-introduction');
      for (const [index, item] of session.initial.items.entries()) {
        const source = {
          kind: 'lesson',
          lessonId: id,
          contentVersion: 24,
          seed: 'choir-introduction',
          round: 'initial',
          index,
        };
        expect(resolveReportSource(catalogue, source).item).toEqual(item);
        expect(() => resolveReportSource(catalogue, { ...source, contentVersion: 20 })).toThrow();
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
