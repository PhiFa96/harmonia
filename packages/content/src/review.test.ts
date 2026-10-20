import { describe, expect, it } from 'vitest';
import { createEmptyCard, fsrs, Rating } from 'ts-fsrs';
import type { Card, Grade } from 'ts-fsrs';
import { catalogue } from './authoring.ts';
import {
  lessonPlan,
  reviewSkillPlan,
  REVIEW_LESSON_ID,
  practiceSourceLessons,
} from './lesson-flow.ts';
import { lessonEvent, retainLearningEvent, validateLearningEvent } from './learning-evidence.ts';
import { lessonReward } from './lesson-rewards.ts';
import { accessSourceDetails } from './access.ts';
import { learningRatingEvidence } from './learning-ratings.ts';
import {
  applyReviewEvent,
  dueReviews,
  emptyReviewState,
  localReviewState,
  newReviewCard,
  reviewCardKey,
  reviewCardSchema,
  reviewEvidence,
  REVIEW_PARAMETERS,
  scheduleReview,
  reviewGrade,
  serializeReviewCard,
} from './review.ts';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
  nextLessonExercise,
  revealLessonHint,
  startLessonReview,
} from '@harmonia/exercises';
function required<T>(v: T | undefined): T {
  if (v === undefined) throw Error('Fixture');
  return v;
}
const definition = required(lessonPlan(catalogue, 'notation.l1.staff.anchor'));
const at = Date.parse('2026-03-28T18:00:00Z');
function lesson(id = 'lesson', hint = 0, wrong = false) {
  let s = createLessonSession(definition, id);
  for (const item of s.initial.items) {
    for (let i = 0; i < hint; i++) s = revealLessonHint(s);
    s = nextLessonExercise(
      answerLesson(
        s,
        wrong && 'choices' in item
          ? required(item.choices.find((a) => a !== expectedAnswer(item)))
          : expectedAnswer(item),
      ),
    );
  }
  if (s.phase === 'review-intro') {
    s = startLessonReview(s);
    while (s.phase === 'review') {
      const item = required(currentItem(required(activeLessonSession(s))));
      s = nextLessonExercise(answerLesson(s, expectedAnswer(item)));
    }
  }
  return lessonEvent(id, s, at - 1000, at, 'Europe/Berlin');
}
describe('FSRS scheduling', () => {
  for (const rating of [1, 2, 3, 4] as const)
    it(`matches ts-fsrs for initial grade ${String(rating)}`, () => {
      expect(scheduleReview(undefined, rating, at)).toEqual(
        serializeReviewCard(
          fsrs(REVIEW_PARAMETERS).next(
            createEmptyCard(new Date(at)),
            new Date(at),
            reviewGrade(rating),
          ).card,
        ),
      );
    });
  it('matches a long independent engine history including lapses, short steps and DST', () => {
    const engine = fsrs(REVIEW_PARAMETERS);
    let raw: Card = createEmptyCard(new Date(at)),
      serial = newReviewCard(at),
      now = at;
    for (let n = 0; n < 80; n++) {
      const grade =
        (
          [
            Rating.Good,
            Rating.Good,
            Rating.Easy,
            Rating.Hard,
            Rating.Again,
            Rating.Good,
            Rating.Easy,
            Rating.Good,
          ] as Grade[]
        )[n % 8] ?? Rating.Good;
      now = Math.max(now, raw.due.getTime()) + (n % 5) * 86400000;
      raw = engine.next(raw, new Date(now), grade).card;
      serial = scheduleReview(JSON.parse(JSON.stringify(serial)) as typeof serial, grade, now);
      expect(serial).toEqual(serializeReviewCard(raw));
    }
    expect(serial.lapses).toBeGreaterThan(0);
  });
  it('clamps late offline arrivals to the last review without negative elapsed time', () => {
    const first = scheduleReview(undefined, 3, at);
    expect(scheduleReview(first, 1, at - 86400000)).toEqual(scheduleReview(first, 1, at));
  });
  it('rejects corrupt state and non-date timestamps', () => {
    expect(reviewCardSchema.safeParse({ ...newReviewCard(at), state: 99 }).success).toBe(false);
    expect(reviewCardSchema.safeParse({ ...newReviewCard(at), reps: 1 }).success).toBe(false);
    expect(() => newReviewCard(Number.MAX_SAFE_INTEGER)).toThrow();
  });
});
describe('canonical review evidence', () => {
  it.each([
    [0, 3],
    [1, 2],
    [2, 2],
    [3, 1],
  ])('maps hint %s to grade %s once per skill', (hint, grade) => {
    const e = lesson('hint', hint);
    const evidence = reviewEvidence(catalogue, e);
    expect(Object.values(evidence.skills)).toEqual(Object.keys(evidence.skills).map(() => grade));
    const state = applyReviewEvent(catalogue, emptyReviewState(), e);
    for (const card of Object.values(state.skills)) expect(card.reps).toBe(1);
    expect(Object.keys(state.cards)).toHaveLength(definition.introduction.length);
    for (const c of Object.values(state.cards)) expect(c).toEqual(newReviewCard(at));
  });
  it('correction rounds do not erase failure or advance skills again', () => {
    const state = applyReviewEvent(catalogue, emptyReviewState(), lesson('wrong', 0, true));
    expect(Object.values(state.skills).every((c) => c.reps === 1 && c.due === at + 60000)).toBe(
      true,
    );
  });
  it('self-ratings update an enrolled current card, never skill ratings or course completion', () => {
    const state = applyReviewEvent(catalogue, emptyReviewState(), lesson());
    const card = required(
      catalogue.knowledgeCards.find((c) => reviewCardKey(c.id, c.contentVersion) in state.cards),
    );
    const e = {
      kind: 'card-review' as const,
      id: 'card',
      cardId: card.id,
      contentVersion: card.contentVersion,
      startedAt: at,
      finishedAt: at + 1000,
      timeZone: 'Europe/Berlin',
      rating: 4 as const,
    };
    expect(validateLearningEvent(catalogue, e).lesson).toBeNull();
    const next = applyReviewEvent(catalogue, state, e);
    expect(next.skills).toEqual(state.skills);
    expect(next.cards[reviewCardKey(card.id, card.contentVersion)]).toEqual(
      scheduleReview(newReviewCard(at), 4, at + 1000),
    );
    expect(learningRatingEvidence(catalogue, e).observations).toEqual([]);
    expect(retainLearningEvent(catalogue, e).sourceKind).toBe('practice');
    expect(applyReviewEvent(catalogue, emptyReviewState(), e)).toEqual(emptyReviewState());
    expect(() => validateLearningEvent(catalogue, { ...e, contentVersion: 999 })).toThrow();
  });
  it('deduplicates offline retries, applies only newer receipts and hides obsolete versions', () => {
    const event = lesson(),
      row = { event, position: 1, sequence: 10, pending: false };
    const state = localReviewState(catalogue, [row, row]);
    expect(
      localReviewState(catalogue, [row, row], {
        ...state,
        throughSequence: 10,
        throughPosition: 0,
      }),
    ).toEqual(state);
    expect(
      localReviewState(catalogue, [{ ...row, sequence: null }], {
        ...state,
        throughSequence: 10,
        throughPosition: 0,
      }),
    ).toEqual(state);
    const queued = {
      ...row,
      event: { ...event, id: 'new' },
      position: 2,
      sequence: null,
      pending: true,
    };
    const next = localReviewState(catalogue, [row, queued], {
      ...state,
      throughSequence: 10,
      throughPosition: 0,
    });
    expect(Object.values(next.skills).every((c) => c.reps === 2)).toBe(true);
    expect(
      localReviewState(catalogue, [queued], { ...next, throughSequence: 10, throughPosition: 2 }),
    ).toEqual(next);
  });
  it('lists only actually due and reached material, using exact UTC instants', () => {
    const e = lesson(),
      state = applyReviewEvent(catalogue, emptyReviewState(), e);
    expect(dueReviews(catalogue, state, at - 1, [definition.id]).cards).toHaveLength(0);
    const due = dueReviews(catalogue, state, at, [definition.id]);
    expect(due.cards).toHaveLength(definition.introduction.length);
    expect(due.skills).toHaveLength(0);
    expect(
      dueReviews(catalogue, state, at + 600000, [definition.id]).skills.length,
    ).toBeGreaterThan(0);
    expect(dueReviews(catalogue, state, at + 600000, [])).toEqual({
      skills: [],
      cards: [],
      nextDue: null,
    });
    const changed = structuredClone(catalogue);
    for (const c of changed.knowledgeCards) c.contentVersion++;
    expect(dueReviews(changed, state, at, [definition.id]).cards).toHaveLength(0);
  });
  it('replays a due skill plan from versioned references with normal access and zero course rewards', () => {
    const state = applyReviewEvent(catalogue, emptyReviewState(), lesson());
    const skillIds = Object.keys(state.skills);
    const plan = required(reviewSkillPlan(catalogue, skillIds, [definition.id]));
    expect(plan.id).toBe(REVIEW_LESSON_ID);
    expect(plan.exercises.length).toBeGreaterThan(0);
    expect(practiceSourceLessons(plan.planKey)).toEqual([definition.id]);
    expect(lessonPlan(catalogue, plan.id, plan.planKey)).toEqual(plan);
    expect(
      lessonPlan(catalogue, plan.id, plan.planKey.replace('review:1', 'weak:1')),
    ).toBeUndefined();
    let s = createLessonSession(plan, 'due');
    for (const item of s.initial.items)
      s = nextLessonExercise(answerLesson(s, expectedAnswer(item)));
    expect(lessonReward(s, false)).toBe(0);
    const event = lessonEvent('due', s, at, at + 1000);
    expect(validateLearningEvent(catalogue, event).lesson).toBeNull();
    expect(retainLearningEvent(catalogue, event).sourceKind).toBe('practice');
    expect(
      accessSourceDetails(catalogue, {
        kind: 'lesson',
        lessonId: plan.id,
        contentVersion: plan.contentVersion,
        seed: 'due',
        planKey: plan.planKey,
      }).cost,
    ).toBe(plan.exercises.length);
    expect(
      Object.values(applyReviewEvent(catalogue, state, event).skills).every((c) => c.reps === 2),
    ).toBe(true);
  });
});
