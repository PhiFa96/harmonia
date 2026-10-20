import { describe, expect, it } from 'vitest';
import { catalogue } from './authoring.ts';
import { lessonExerciseSources, publicCatalogue } from './catalogue.ts';
import {
  adaptiveLessonPlan,
  lessonPlan,
  weakestSkills,
  weaknessPlan,
  WEAKNESS_LESSON_ID,
  restoreLessonDraft,
} from './lesson-flow.ts';
import { lessonEvent, validateLearningEvent, retainLearningEvent } from './learning-evidence.ts';
import { learningRatingEvidence } from './learning-ratings.ts';
import { localLearningRatings } from './local-ratings.ts';
import { accessSourceDetails } from './access.ts';
import { resolveReportSource } from './content-reports.ts';
import { lessonReward } from './lesson-rewards.ts';
import { placementBank, ratingPlacementBank } from './placement.ts';
import {
  actPlacement,
  createPlacement,
  currentPlacementTask,
  expectedAnswer,
  answerLesson,
  createLessonSession,
  nextLessonExercise,
  ratingBucket,
  placementEstimates,
  replayPlacement,
  revealLessonHint,
  evaluateExercise,
} from '@harmonia/exercises';
import type { RatingSnapshot, PlacementAction } from '@harmonia/exercises';

const at = 1_000_000;
function required<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) throw new Error('Missing test fixture');
  return value;
}
const snapshot: RatingSnapshot = {
  skills: Object.fromEntries(
    catalogue.skills.map((s, i) => [
      s.id,
      { rating: 1650 + i, deviation: 60, volatility: 0.06, attempts: 10, updatedAt: at },
    ]),
  ),
  buckets: Object.fromEntries(
    catalogue.lessons.flatMap((l) =>
      (lessonExerciseSources(catalogue, l.id) ?? []).map((s, i) => [
        ratingBucket(s.spec, s.contentVersion),
        { rating: 1400 + i * 15, deviation: 60, volatility: 0.06, attempts: 10, updatedAt: at },
      ]),
    ),
  ),
};
function complete(plan: NonNullable<ReturnType<typeof lessonPlan>>, hints = false) {
  let session = createLessonSession(plan, 'adaptive-evidence');
  for (const item of session.initial.items) {
    if (hints) session = revealLessonHint(session);
    session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
  }
  return session;
}
describe('canonical adaptive plans', () => {
  it.each(catalogue.lessons)('retains all authored questions and repetitions: $id', (lesson) => {
    const fixed = required(lessonPlan(catalogue, lesson.id));
    const adaptive = required(adaptiveLessonPlan(catalogue, lesson.id, snapshot, at));
    expect(adaptive.planKey.startsWith('["flow:2"')).toBe(true);
    expect(adaptive.newCount).toBe(fixed.newCount);
    expect(adaptive.repetitionCount).toBe(fixed.repetitionCount);
    const originals = required(lessonExerciseSources(catalogue, lesson.id));
    expect(
      adaptive.exerciseSources
        .filter((_, i) => !adaptive.repetitionIndices.includes(i))
        .map((o) => ratingBucket(o.spec, o.contentVersion))
        .sort(),
    ).toEqual(originals.map((o) => ratingBucket(o.spec, o.contentVersion)).sort());
    expect(lessonPlan(catalogue, lesson.id, adaptive.planKey)).toEqual(adaptive);
    const event = lessonEvent(`adaptive:${lesson.id}`, complete(adaptive), 1, 2, 'UTC');
    expect(validateLearningEvent(catalogue, event).lesson?.passed).toBe(true);
    expect(learningRatingEvidence(catalogue, event).observations).toHaveLength(
      adaptive.exercises.length,
    );
    expect(
      accessSourceDetails(catalogue, {
        kind: 'lesson',
        lessonId: lesson.id,
        contentVersion: lesson.contentVersion,
        planKey: adaptive.planKey,
        seed: 1,
      }).cost,
    ).toBe(adaptive.exercises.length);
  });
  it('rejects deleted/repeated mandatory slots, unrelated reviews and changed source versions', () => {
    const id = 'notation.l1.staff.positions';
    const plan = required(adaptiveLessonPlan(catalogue, id, snapshot, at));
    const original = JSON.parse(plan.planKey) as [
      string,
      string,
      number,
      number[],
      [string, number, number][],
    ];
    const corruptions = [
      [original[0], id, original[2], original[3].slice(1), original[4]],
      [original[0], id, original[2], original[3].map(() => 0), original[4]],
      [original[0], id, original[2], original[3], original[4].slice(1)],
      [
        original[0],
        id,
        original[2],
        original[3],
        [['notation.l2.clefs-registers.bass', 13, 0], ...original[4].slice(1)],
      ],
      [original[0], id, original[2], original[3], original[4].map((r) => [r[0], 999, r[2]])],
    ];
    for (const key of corruptions)
      expect(lessonPlan(catalogue, id, JSON.stringify(key))).toBeUndefined();
    expect(lessonPlan(catalogue, id, 'broken')).toBeUndefined();
  });
  it('preserves fixed plans for cold starts, and replays a frozen adaptive draft without current ratings', () => {
    const id = 'notation.l1.staff.positions';
    expect(adaptiveLessonPlan(catalogue, id, { skills: {}, buckets: {} }, at)).toEqual(
      lessonPlan(catalogue, id),
    );
    expect(
      adaptiveLessonPlan(
        catalogue,
        id,
        {
          skills: { unrelated: required(Object.values(snapshot.skills)[0]) },
          buckets: snapshot.buckets,
        },
        at,
      ),
    ).toEqual(lessonPlan(catalogue, id));
    const plan = required(adaptiveLessonPlan(catalogue, id, snapshot, at));
    const restored = restoreLessonDraft(catalogue, {
      schemaVersion: 1,
      id: 'draft',
      lessonId: id,
      contentVersion: plan.contentVersion,
      planKey: plan.planKey,
      seed: 1,
      startedAt: 1,
      finishedAt: null,
      timeZone: 'UTC',
      introCard: 0,
      started: true,
      actions: [],
      answer: null,
    });
    expect(restored.plan).toEqual(plan);
    expect(restored.session?.initial.items).toHaveLength(plan.exercises.length);
  });
  it('adapts the repetitions on a first run when only earlier material has ratings', () => {
    let adaptive = 0;
    let withRepetitions = 0;
    for (const lesson of catalogue.lessons) {
      const fixed = required(lessonPlan(catalogue, lesson.id));
      if (!fixed.repetitionCount) continue;
      withRepetitions++;
      // Realistic first run: this lesson's own skills are still new, everything else is rated.
      const own = new Set(
        (lessonExerciseSources(catalogue, lesson.id) ?? []).flatMap((s) => s.skillIds),
      );
      const earlier: RatingSnapshot = {
        buckets: snapshot.buckets,
        skills: Object.fromEntries(Object.entries(snapshot.skills).filter(([id]) => !own.has(id))),
      };
      const plan = required(adaptiveLessonPlan(catalogue, lesson.id, earlier, at));
      expect(plan.newCount).toBe(fixed.newCount);
      expect(plan.repetitionCount).toBe(fixed.repetitionCount);
      if (plan.planKey.startsWith('["flow:2"')) {
        adaptive++;
        expect(lessonPlan(catalogue, lesson.id, plan.planKey)).toEqual(plan);
        // Mandatory questions keep their authored order while none of their skills is rated.
        const order = (JSON.parse(plan.planKey) as [string, string, number, number[]])[3];
        const unrated = (lessonExerciseSources(catalogue, lesson.id) ?? []).every((s) =>
          s.skillIds.every((id) => own.has(id)),
        );
        if (unrated) expect(order).toEqual(order.map((_, i) => i));
      }
    }
    expect(withRepetitions).toBeGreaterThan(60);
    expect(adaptive).toBeGreaterThan(withRepetitions * 0.8);
  }, 60_000);
  it('does not deliver draft sources from a public catalogue', () => {
    const published = publicCatalogue(catalogue);
    expect(
      adaptiveLessonPlan(published, required(catalogue.lessons[0]).id, snapshot, at),
    ).toBeUndefined();
    expect(
      weaknessPlan(
        published,
        snapshot,
        catalogue.lessons.map((l) => l.id),
        at,
      ),
    ).toBeUndefined();
  });
});
describe('focused weakness practice', () => {
  const reached = ['notation.l1.staff.anchor', 'notation.l1.staff.positions'];
  it('trains the weakest known eligible skills; keeps unknown/locked skills out', () => {
    expect(weakestSkills(snapshot, new Set(['s.unknown']))).toEqual([]);
    expect(weaknessPlan(catalogue, { skills: {}, buckets: {} }, reached, at)).toBeUndefined();
    const plan = required(weaknessPlan(catalogue, snapshot, reached, at));
    expect(plan.id).toBe(WEAKNESS_LESSON_ID);
    expect(plan.exercises).toHaveLength(10);
    const refs = (JSON.parse(plan.planKey) as [string, number, [string, number, number][]])[2];
    expect(refs.every((ref) => reached.includes(ref[0]))).toBe(true);
    const event = lessonEvent('weakness', complete(plan), 1, 2, 'UTC');
    expect(validateLearningEvent(catalogue, event).lesson).toBeNull();
    expect(validateLearningEvent(catalogue, event).testedUnitIds).toEqual([]);
    expect(lessonReward(complete(plan), false)).toBe(0);
    expect(learningRatingEvidence(catalogue, event).observations).toHaveLength(10);
    expect(
      learningRatingEvidence(catalogue, lessonEvent('assisted', complete(plan, true), 1, 2))
        .observations,
    ).toEqual([]);
    expect(retainLearningEvent(catalogue, event)).toMatchObject({ sourceKind: 'practice' });
    expect(
      validateLearningEvent(catalogue, retainLearningEvent(catalogue, event)).lesson,
    ).toBeNull();
    expect(
      accessSourceDetails(catalogue, {
        kind: 'lesson',
        lessonId: plan.id,
        contentVersion: plan.contentVersion,
        planKey: plan.planKey,
        seed: 1,
      }),
    ).toEqual({ cost: 10, level: 1 });
    expect(
      resolveReportSource(catalogue, {
        kind: 'lesson',
        lessonId: plan.id,
        contentVersion: plan.contentVersion,
        planKey: plan.planKey,
        seed: 1,
        round: 'initial',
        index: 0,
      }).item,
    ).toEqual(createLessonSession(plan, 1).initial.items[0]);
  });
  it('reconstructs local ratings exactly once per canonical event and does not invent retained evidence', () => {
    const plan = required(lessonPlan(catalogue, required(reached[0])));
    const event = lessonEvent('local-rating', complete(plan), 1, 2);
    const first = localLearningRatings(catalogue, [event]);
    expect(localLearningRatings(catalogue, [event, event])).toEqual(first);
    expect(Object.values(first.skills).every((s) => s.attempts > 0)).toBe(true);
    expect(localLearningRatings(catalogue, [retainLearningEvent(catalogue, event)])).toEqual({
      skills: {},
      buckets: {},
    });
  });
});
describe('rating-based placement and compatibility', () => {
  it.each([false, true])(
    'adapts/replays independent answers (%s), and feeds canonical ratings',
    (correct) => {
      const bank = ratingPlacementBank(catalogue);
      let state = createPlacement(bank, 'p302-placement');
      const actions: PlacementAction[] = [];
      for (let guard = 0; !state.ended && guard < 30; guard++) {
        const task = required(currentPlacementTask(state));
        const item = required(task.session.items[0]);
        const expected = expectedAnswer(item);
        const candidates = [
          ...item.choices,
          'C4',
          'D4',
          'E4',
          'taps:',
          `key:${String(Number(expected.slice(4)) + 1)}`,
        ];
        for (const prefix of ['notes:', 'chord-notes:']) {
          if (expected.startsWith(prefix)) {
            const parts = expected.slice(prefix.length).split(',');
            parts[parts.length - 1] = parts[0] ?? 'C4';
            candidates.push(prefix + parts.join(','));
          }
        }
        if (expected.startsWith('match:') || expected.startsWith('order:'))
          candidates.push(expected.slice(0, 6) + expected.slice(6).split(',').reverse().join(','));
        const answer = correct
          ? expected
          : candidates.find((value) => {
              const result = evaluateExercise(item, value);
              return result.validAnswer && !result.correct;
            });
        if (!answer) throw new Error(`Missing wrong answer: ${item.type}`);
        for (const action of [{ type: 'answer', answer }, { type: 'next' }] as PlacementAction[]) {
          actions.push(action);
          state = actPlacement(bank, state, action);
        }
      }
      expect(state.ended).toBe('complete');
      expect(state.tasks.length).toBeGreaterThanOrEqual(15);
      expect(state.tasks.length).toBeLessThanOrEqual(25);
      expect(replayPlacement(bank, state.seed, actions)).toEqual(state);
      expect(
        placementEstimates(bank, state).every((e) => (correct ? e.correct > 0 : e.correct === 0)),
      ).toBe(true);
      const event = {
        kind: 'placement',
        id: 'placement-rating',
        bankKey: bank.key,
        seed: state.seed,
        startedAt: 1,
        finishedAt: 2,
        actions,
      };
      expect(learningRatingEvidence(catalogue, event).outcome).toBe('rated');
      expect(validateLearningEvent(catalogue, event).lesson).toBeNull();
    },
  );
  it('still validates P2 placement keys and partial tests, with no unsupported unlock', () => {
    const bank = placementBank(catalogue);
    const state = createPlacement(bank, 'old');
    const event = {
      kind: 'placement',
      id: 'old',
      bankKey: bank.key,
      seed: state.seed,
      startedAt: 1,
      finishedAt: 2,
      actions: [{ type: 'finish' }],
    };
    expect(validateLearningEvent(catalogue, event).testedUnitIds).toEqual([]);
    expect(learningRatingEvidence(catalogue, event).outcome).toBe('no_evidence');
  });
});
