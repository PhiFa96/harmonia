import { describe, expect, it } from 'vitest';
import { catalogue } from './authoring.ts';
import { lessonExerciseSources, resolveLesson } from './catalogue.ts';
import { lessonPlan } from './lesson-flow.ts';
import { lessonEvent } from './learning-evidence.ts';
import { learningRatingEvidence } from './learning-ratings.ts';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
  isAuralExercise,
  nextLessonExercise,
  ratingBucket,
  revealLessonHint,
  skipLessonAural,
  startLessonReview,
} from '@harmonia/exercises';
import type { LessonDefinition } from '@harmonia/exercises';

function perfect(definition: LessonDefinition) {
  let session = createLessonSession(definition, 'ratings-evidence');
  for (const item of session.initial.items)
    session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
  return session;
}
describe('canonical rating evidence', () => {
  it('covers all 850 authored tasks and their parameter profiles without an answer store', () => {
    const seen = new Set<string>();
    let count = 0;
    for (const record of catalogue.lessons) {
      const lesson = resolveLesson(catalogue, record.id);
      if (!lesson) throw new Error('Lesson missing');
      const evidence = learningRatingEvidence(
        catalogue,
        lessonEvent(record.id, perfect(lesson), 1, 2),
      );
      expect(evidence.outcome).toBe('rated');
      expect(evidence.observations).toHaveLength(lesson.exercises.length);
      evidence.observations.forEach((observation) => {
        expect(observation.correct).toBe(true);
        expect(
          observation.skillIds.every((id) => catalogue.skills.some((skill) => skill.id === id)),
        ).toBe(true);
        expect(observation.bucketId.length).toBeLessThanOrEqual(2048);
        seen.add(observation.bucketId.split(':')[3] ?? '');
      });
      count += evidence.observations.length;
    }
    expect(count).toBe(850);
    const authored = new Set(
      catalogue.lessons.flatMap(
        (record) =>
          lessonExerciseSources(catalogue, record.id)?.map((source) => source.spec.type) ?? [],
      ),
    );
    expect(seen).toEqual(authored);
  });
  it('keeps original provenance for every interleaved prior-lesson task', () => {
    let repeats = 0;
    for (const record of catalogue.lessons) {
      const plan = lessonPlan(catalogue, record.id);
      if (!plan) throw new Error('Plan missing');
      const evidence = learningRatingEvidence(
        catalogue,
        lessonEvent(record.id, perfect(plan), 1, 2),
      );
      expect(evidence.observations.map((item) => item.bucketId)).toEqual(
        plan.exerciseSources.map((source) => ratingBucket(source.spec, source.contentVersion)),
      );
      expect(evidence.observations.map((item) => item.skillIds)).toEqual(
        plan.exerciseSources.map((source) => source.skillIds),
      );
      const base = lessonExerciseSources(catalogue, record.id);
      expect(base).toHaveLength(plan.newCount);
      repeats += plan.repetitionIndices.length;
    }
    expect(repeats).toBeGreaterThan(0);
  });
  it('excludes assisted responses and review rounds without changing lesson passing', () => {
    const record = catalogue.lessons[0];
    if (!record) throw new Error('Lesson missing');
    const definition = resolveLesson(catalogue, record.id);
    if (!definition) throw new Error('Lesson missing');
    let session = createLessonSession(definition, 'hints');
    for (const item of session.initial.items) {
      session = revealLessonHint(session);
      session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
    }
    expect(learningRatingEvidence(catalogue, lessonEvent('assisted', session, 1, 2))).toEqual({
      outcome: 'no_evidence',
      observations: [],
    });
    const original = createLessonSession(definition, 'wrong-then-review');
    const first = original.initial.items[0];
    if (!first) throw new Error('Question missing');
    const wrong =
      'choices' in first
        ? first.choices.find((value) => value !== expectedAnswer(first))
        : undefined;
    if (!wrong) throw new Error('Wrong option missing');
    session = nextLessonExercise(answerLesson(original, wrong));
    for (const item of original.initial.items.slice(1))
      session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
    session = startLessonReview(session);
    for (const item of session.review?.items ?? [])
      session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
    const evidence = learningRatingEvidence(catalogue, lessonEvent('review', session, 1, 2));
    expect(evidence.observations).toHaveLength(definition.exercises.length);
    expect(evidence.observations.filter((item) => !item.correct)).toHaveLength(1);
  });
  it('records skipped audio as missing evidence and retains other answers', () => {
    const plan = catalogue.lessons
      .map((record) => lessonPlan(catalogue, record.id))
      .find((candidate) => {
        if (!candidate) return false;
        const session = createLessonSession(candidate, 'skip');
        return (
          session.initial.items.some(isAuralExercise) &&
          session.initial.items.some((item) => !isAuralExercise(item))
        );
      });
    if (!plan) throw new Error('Mixed audio lesson missing');
    let session = skipLessonAural(createLessonSession(plan, 'skip'));
    while (session.phase === 'initial') {
      const active = activeLessonSession(session),
        item = active && currentItem(active);
      if (!item) throw new Error('Question missing');
      session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
    }
    const evidence = learningRatingEvidence(catalogue, lessonEvent('skip', session, 1, 2));
    expect(session.initial.skipped.length).toBeGreaterThan(0);
    expect(evidence.observations.length).toBeGreaterThan(0);
    expect(evidence.observations.length + session.initial.skipped.length).toBe(
      session.initial.items.length,
    );
  });
  it('does not manufacture evidence for retained, changed or invalid historical events', () => {
    expect(learningRatingEvidence(catalogue, {}).outcome).toBe('invalid');
    expect(
      learningRatingEvidence(catalogue, {
        kind: 'retained',
        sourceKind: 'unavailable',
        id: 'old',
        finishedAt: 1,
      }).outcome,
    ).toBe('retained');
    const record = catalogue.lessons[0];
    if (!record) throw new Error('Lesson missing');
    const definition = resolveLesson(catalogue, record.id);
    if (!definition) throw new Error('Lesson missing');
    const event = lessonEvent('changed', perfect(definition), 1, 2);
    expect(learningRatingEvidence(catalogue, { ...event, contentVersion: 999 }).outcome).toBe(
      'unavailable',
    );
    expect(learningRatingEvidence(catalogue, { ...event, finishedAt: 0 }).outcome).toBe('invalid');
  });
});
