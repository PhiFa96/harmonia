import { describe, expect, it } from 'vitest';
import { catalogue } from './authoring.ts';
import {
  adaptiveLessonPlan,
  applyLessonAction,
  learningEventSchema,
  lessonEvent,
  lessonPlan,
  lessonProgress,
  lessonReward,
  parseCatalogue,
  publicCatalogue,
  resolveLesson,
  restoreLessonDraft,
  retainLearningEvent,
  reviewSkillPlan,
  validateLearningEvent,
} from './index.ts';
import type { LessonAction, LessonDraft } from './index.ts';
import {
  activeLessonSession,
  choirAnswerId,
  createLessonSession,
  currentItem,
  expectedAnswer,
} from '@harmonia/exercises';
import type { LessonDefinition, LessonSession, RatingSnapshot } from '@harmonia/exercises';

const voices = ['soprano', 'alto', 'tenor', 'bass'] as const;
type Singing = 'correct' | 'skip' | 'wrong' | 'solution' | 'hint1' | 'hint2';
function finish(
  definition: LessonDefinition,
  singing: readonly Singing[],
  repeatedSolutions = false,
) {
  let session = createLessonSession(definition, 'minimum-choir');
  const actions: LessonAction[] = [];
  let own = 0;
  const act = (action: LessonAction) => {
    session = applyLessonAction(session, action);
    actions.push(action);
  };
  for (let guard = 0; session.phase !== 'complete' && guard < 100; guard++) {
    if (session.phase === 'review-intro') {
      act({ type: 'review' });
      continue;
    }
    const active = activeLessonSession(session);
    const item = active && currentItem(active);
    if (!item) throw Error('Missing task');
    const choir = item.type === 'CHOIR_PART' && session.phase === 'initial';
    const mode = choir ? (singing[own++] ?? 'correct') : 'correct';
    if (mode === 'skip') {
      act({ type: 'skipVoice' });
      continue;
    }
    const hints =
      mode === 'solution' || (!choir && repeatedSolutions && session.phase === 'initial')
        ? 3
        : mode === 'hint1'
          ? 1
          : mode === 'hint2'
            ? 2
            : 0;
    for (let i = 0; i < hints; i++) act({ type: 'hint' });
    act({
      type: 'answer',
      answer:
        mode === 'wrong'
          ? choirAnswerId(Array.from({ length: 8 }, () => Array<null>(12).fill(null)))
          : expectedAnswer(item),
    });
    act({ type: 'next' });
  }
  expect(session.phase).toBe('complete');
  return { session, actions };
}
const event = (session: LessonSession) =>
  lessonEvent('choir-policy', session, 1000, 2000, 'Europe/Berlin');

describe.each(voices)('%s: required successful initial singing', (voice) => {
  const id = `aural.l4.choir.${voice}.lesson`;
  const fixed = lessonPlan(catalogue, id);
  if (!fixed) throw Error('Missing choir plan');
  const snapshot: RatingSnapshot = {
    skills: Object.fromEntries(
      catalogue.skills.map((skill) => [
        skill.id,
        { rating: 1300, deviation: 60, volatility: 0.06, attempts: 10, updatedAt: 1000 },
      ]),
    ),
    buckets: {},
  };
  const adaptive = adaptiveLessonPlan(catalogue, id, snapshot, 1000);
  if (!adaptive) throw Error('Missing adaptive choir plan');

  it.each([
    ['fixed', fixed],
    ['adaptive', adaptive],
  ] as const)(
    '%s: 100 percent on repetition with all singing skipped never grants completion or XP',
    (_, plan) => {
      expect(plan.exercises).toHaveLength(plan.newCount + plan.repetitionCount);
      expect(plan.repetitionIndices).toHaveLength(plan.repetitionCount);
      const { session } = finish(plan, ['skip', 'skip']);
      const p = lessonProgress(session);
      expect(p).toMatchObject({ passed: false, choirCorrect: 0, voiceSkipped: 2 });
      expect(p.eligibleCorrect).toBe(p.total - 2);
      expect(lessonReward(session, false)).toBe(0);
      expect(lessonReward(session, true)).toBe(0);
      expect(validateLearningEvent(catalogue, event(session)).lesson).toEqual(p);
      expect(
        validateLearningEvent(catalogue, retainLearningEvent(catalogue, event(session))).lesson,
      ).toEqual(p);
    },
  );

  it.each(['correct', 'hint1', 'hint2'] as const)(
    '%s: one eligible singing answer and 80 percent suffice',
    (mode) => {
      const { session } = finish(fixed, [mode, 'skip']);
      const p = lessonProgress(session);
      expect(p).toMatchObject({ passed: true, choirCorrect: 1, voiceSkipped: 1 });
      expect(lessonReward(session, false)).toBeGreaterThan(0);
      expect(validateLearningEvent(catalogue, event(session)).lesson).toEqual(p);
      expect(
        validateLearningEvent(catalogue, retainLearningEvent(catalogue, event(session))).lesson,
      ).toEqual(p);
    },
  );

  it.each(['wrong', 'solution'] as const)(
    '%s: subsequent review or a revealed solution does not satisfy the rule',
    (mode) => {
      const { session } = finish(fixed, [mode, 'skip']);
      const p = lessonProgress(session);
      expect(p.eligibleCorrect * 100).toBeGreaterThanOrEqual((p.total - 1) * 80);
      expect(p).toMatchObject({ passed: false, choirCorrect: 0 });
      if (mode === 'wrong') expect(session.review?.records[0]?.result.correct).toBe(true);
      expect(validateLearningEvent(catalogue, event(session)).lesson).toEqual(p);
      expect(lessonReward(session, false)).toBe(0);
    },
  );

  it('still requires 80 percent when singing succeeds', () => {
    const { session } = finish(fixed, ['correct', 'skip'], true);
    expect(lessonProgress(session)).toMatchObject({
      passed: false,
      choirCorrect: 1,
      eligibleCorrect: 1,
    });
    expect(validateLearningEvent(catalogue, event(session)).lesson?.passed).toBe(false);
  });

  it('preserves the criterion through an offline draft and rejects old and forged evidence', () => {
    const { session, actions } = finish(fixed, ['wrong', 'skip']);
    const draft: LessonDraft = {
      schemaVersion: 1,
      id: 'offline-choir',
      lessonId: id,
      contentVersion: 28,
      planKey: fixed.planKey,
      seed: 'minimum-choir',
      startedAt: 1000,
      finishedAt: 2000,
      timeZone: 'Europe/Berlin',
      introCard: 0,
      started: true,
      actions,
      answer: null,
    };
    const restored = restoreLessonDraft(catalogue, JSON.parse(JSON.stringify(draft)) as unknown);
    expect(restored.plan.minimumChoirCorrect).toBe(1);
    expect(restored.session).toEqual(session);
    if (!restored.session) throw Error('Missing restored session');
    expect(lessonProgress(restored.session)).toMatchObject({ passed: false, choirCorrect: 0 });
    for (const contentVersion of [25, 26, 27]) {
      expect(() => restoreLessonDraft(catalogue, { ...draft, contentVersion })).toThrow();
      expect(() =>
        validateLearningEvent(catalogue, { ...event(session), contentVersion }),
      ).toThrow();
    }
    expect(
      learningEventSchema.safeParse({ ...event(session), choirCorrect: 1, passed: true }).success,
    ).toBe(false);
    expect(() => validateLearningEvent(publicCatalogue(catalogue), event(session))).toThrow();
  });

  it('keeps retained summaries bounded and consistent instead of trusting a new success flag', () => {
    const { session } = finish(fixed, ['skip', 'skip']);
    const retained = retainLearningEvent(catalogue, event(session));
    if (retained.sourceKind !== 'lesson') throw Error('Missing lesson summary');
    const missing = { ...retained.progress };
    delete missing.choirCorrect;
    for (const progress of [
      missing,
      { ...retained.progress, passed: true },
      { ...retained.progress, passed: true, choirCorrect: 1 }, // both own choir tasks were skipped
      { ...retained.progress, choirCorrect: -1 },
      { ...retained.progress, choirCorrect: 201 },
    ])
      expect(() => validateLearningEvent(catalogue, { ...retained, progress })).toThrow();
  });
});

describe('scope and authoring of the completion rule', () => {
  it('binds the rule to exactly the four versioned choir lessons', () => {
    expect(
      catalogue.lessons.filter((lesson) => lesson.minimumChoirCorrect === 1).map((l) => l.id),
    ).toEqual(voices.map((voice) => `aural.l4.choir.${voice}.lesson`));
    const data = structuredClone(catalogue);
    const ordinary = data.lessons.find((lesson) => lesson.unitId !== 'aural.l4.choir');
    if (!ordinary) throw Error('Missing ordinary lesson');
    ordinary.minimumChoirCorrect = 1;
    expect(() => parseCatalogue(data)).toThrow(/Chor-Abschlussregel ohne Chor-Aufgabe/);
  });

  it('retains a fully skipped pure singing lesson as failed even with a zero denominator', () => {
    const definition = resolveLesson(catalogue, 'aural.l4.choir.bass.lesson');
    if (!definition) throw Error('Missing pure choir lesson');
    const { session } = finish(definition, ['skip', 'skip']);
    expect(lessonProgress(session)).toMatchObject({
      passed: false,
      choirCorrect: 0,
      total: 2,
      voiceSkipped: 2,
    });
    const proof = event(session);
    expect(validateLearningEvent(catalogue, retainLearningEvent(catalogue, proof)).lesson).toEqual(
      lessonProgress(session),
    );
  });

  it('does not count a choir task marked as repetition or an incomplete attempt', () => {
    const definition = resolveLesson(catalogue, 'aural.l4.choir.bass.lesson');
    if (!definition) throw Error('Missing choir lesson');
    const { session } = finish({ ...definition, repetitionIndices: [0, 1] }, [
      'correct',
      'correct',
    ]);
    expect(lessonProgress(session)).toMatchObject({ passed: false, choirCorrect: 0 });
    let incomplete = createLessonSession(definition, 1);
    const item = currentItem(incomplete.initial);
    if (!item) throw Error('Missing initial item');
    incomplete = applyLessonAction(incomplete, { type: 'answer', answer: expectedAnswer(item) });
    expect(lessonProgress(incomplete)).toMatchObject({ passed: false, choirCorrect: 1 });
    expect(lessonReward(incomplete, false)).toBe(0);
  });

  it('does not turn a free review into a choir course completion', () => {
    const id = 'aural.l4.choir.bass.lesson';
    const plan = reviewSkillPlan(catalogue, ['aural.l4.choir.bass'], [id]);
    if (!plan) throw Error('Missing review plan');
    expect(plan.minimumChoirCorrect).toBeUndefined();
    const { session } = finish(plan, ['correct']);
    expect(validateLearningEvent(catalogue, event(session)).lesson).toBeNull();
    expect(lessonReward(session, false)).toBe(0);
  });
});
