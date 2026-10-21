import { describe, expect, it } from 'vitest';
import { catalogue } from './authoring.ts';
import { publicCatalogue, resolveLesson } from './index.ts';
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
