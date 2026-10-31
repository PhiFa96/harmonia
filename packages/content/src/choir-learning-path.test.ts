import { describe, expect, it } from 'vitest';
import { catalogue } from './authoring.ts';
import {
  adaptiveLessonPlan,
  applyLessonAction,
  learningPath,
  lessonEvent,
  lessonProgress,
  lessonPlan,
  parseCatalogue,
  publicCatalogue,
  restoreLessonDraft,
  unitSchema,
  validateLearningEvent,
} from './index.ts';
import type { LessonAction, LessonDraft, LessonProgress } from './index.ts';
import {
  activeLessonSession,
  createLessonSession,
  currentItem,
  expectedAnswer,
} from '@harmonia/exercises';
import type { RatingSnapshot } from '@harmonia/exercises';

const unitId = 'aural.l4.choir';
const voices = ['soprano', 'alto', 'tenor', 'bass'] as const;
const lessons = catalogue.lessons.filter((lesson) => lesson.unitId === unitId);
const otherProgress: LessonProgress[] = catalogue.lessons
  .filter((lesson) => lesson.unitId !== unitId)
  .map((lesson) => ({
    lessonId: lesson.id,
    contentVersion: lesson.contentVersion,
    passed: true,
    eligibleCorrect: 10,
    total: 10,
  }));
const choir = (progress = otherProgress, tested: string[] = []) =>
  learningPath(catalogue, progress, tested).find((unit) => unit.id === unitId);

describe('independent choir lessons with explicit prerequisites', () => {
  it('opens every part without passing a different choir voice, in any catalogue order', () => {
    for (const entries of [catalogue.lessons, [...catalogue.lessons].reverse()]) {
      const unit = learningPath({ ...catalogue, lessons: entries }, otherProgress).find(
        (unit) => unit.id === unitId,
      );
      expect(unit).toMatchObject({ status: 'open', completed: 0, lessonOrder: 'independent' });
      expect(unit?.lessons).toHaveLength(4);
      expect(unit?.lessons.every((lesson) => lesson.status === 'open')).toBe(true);
    }
    expect(
      catalogue.units.filter((unit) => unit.lessonOrder === 'independent').map((u) => u.id),
    ).toEqual([unitId]);
  });

  it('requires the displayed clef, accidentals and rhythm in addition to aural preparation', () => {
    for (const voice of voices)
      expect(
        catalogue.skills.find((skill) => skill.id === `${unitId}.${voice}`)?.prerequisites,
      ).toEqual([
        'aural.l3.dictation.s3',
        voice === 'soprano' || voice === 'alto'
          ? 'notation.treble-natural'
          : 'notation.bass-natural',
        'notation.accidental-scope',
        'rhythm.read-basic',
      ]);
    expect(choir([])?.lessons.every((lesson) => lesson.status === 'locked')).toBe(true);
  });

  it('opens treble parts while missing bass reading still locks tenor and bass', () => {
    const withoutBass = otherProgress.filter(
      (progress) =>
        catalogue.lessons.find((lesson) => lesson.id === progress.lessonId)?.unitId !==
        'notation.l2.clefs-registers',
    );
    const unit = choir(withoutBass);
    expect(unit?.status).toBe('open');
    expect(unit?.lessons.map((lesson) => lesson.status)).toEqual([
      'open',
      'open',
      'locked',
      'locked',
    ]);
    expect(unit?.lessons[0]?.prerequisiteUnitIds).toEqual([]);
    expect(unit?.lessons[3]?.prerequisiteUnitIds).toContain('notation.l2.clefs-registers');
    const placed = choir(withoutBass, [unitId]);
    expect(placed?.status).toBe('open');
    expect(placed?.lessons.map((lesson) => lesson.status)).toEqual([
      'tested',
      'tested',
      'locked',
      'locked',
    ]);
    expect(placed?.completed).toBe(0);
  });

  it('keeps missing aural prerequisites locked even with an isolated choir placement', () => {
    const withoutAural = otherProgress.filter(
      (progress) => !progress.lessonId.startsWith('aural.l3.dictation.'),
    );
    expect(choir(withoutAural, [unitId])?.lessons.every((l) => l.status === 'locked')).toBe(true);
  });

  it('still enforces explicit prerequisites inside an independent unit', () => {
    const data = structuredClone(catalogue);
    const bass = data.skills.find((skill) => skill.id === `${unitId}.bass`);
    if (!bass) throw Error('Missing bass skill');
    bass.prerequisites.push(`${unitId}.soprano`);
    const status = learningPath(parseCatalogue(data), otherProgress).find(
      (unit) => unit.id === unitId,
    )?.lessons;
    expect(status?.map((lesson) => lesson.status)).toEqual(['open', 'open', 'open', 'locked']);
  });

  it('ignores outdated choir completion and retains a current passed part without requiring its peers', () => {
    const bass = lessons.find((lesson) => lesson.id.endsWith('.bass.lesson'));
    if (!bass) throw Error('Missing bass lesson');
    const receipt = {
      lessonId: bass.id,
      contentVersion: 27,
      passed: true,
      eligibleCorrect: 2,
      total: 2,
    };
    expect(choir([...otherProgress, { ...receipt, contentVersion: 25 }])?.completed).toBe(0);
    const unit = choir([...otherProgress, receipt]);
    expect(unit?.completed).toBe(1);
    expect(unit?.lessons.map((lesson) => lesson.status)).toEqual([
      'open',
      'open',
      'open',
      'completed',
    ]);
    expect(learningPath(publicCatalogue(catalogue), [...otherProgress, receipt])).toEqual([]);
  });

  it('rejects unknown lesson ordering values instead of silently dropping them', () => {
    const unit = catalogue.units.find((unit) => unit.id === unitId);
    expect(unitSchema.safeParse({ ...unit, lessonOrder: 'parallel-ish' }).success).toBe(false);
  });
});

describe.each(voices)('%s: independent mixed plan, offline replay and server evidence', (voice) => {
  const id = `${unitId}.${voice}.lesson`;
  it('never mixes another voice into fixed or adaptive repetitions', () => {
    const fixed = lessonPlan(catalogue, id);
    if (!fixed) throw Error('Missing choir plan');
    expect(fixed.newCount).toBe(2);
    expect(fixed.repetitionCount).toBeGreaterThan(0);
    // Ratings only select among allowed sources; they never admit another voice.
    const rated = Object.fromEntries(
      fixed.exerciseSources.flatMap((source) =>
        source.skillIds.map((skillId) => [
          skillId,
          {
            rating: 1000,
            deviation: 60,
            volatility: 0.06,
            attempts: 4,
            updatedAt: 0,
          },
        ]),
      ),
    );
    const snapshot: RatingSnapshot = { skills: rated, buckets: {} };
    const adaptive = adaptiveLessonPlan(catalogue, id, snapshot, 1000);
    expect(adaptive?.planKey.startsWith('["flow:2"')).toBe(true);
    for (const plan of [fixed, adaptive]) {
      if (!plan) throw Error('Missing plan');
      expect(lessonPlan(catalogue, id, plan.planKey)).toEqual(plan);
      for (const index of plan.repetitionIndices) {
        const source = plan.exerciseSources[index];
        expect(source?.spec.type).not.toBe('CHOIR_PART');
        expect(source?.skillIds.every((skill) => !skill.startsWith(unitId))).toBe(true);
      }
      const peer = lessons.find((lesson) => lesson.id !== id);
      if (!peer) throw Error('Missing peer');
      const forged = JSON.stringify([
        'flow:2',
        id,
        27,
        [0, 1],
        Array.from({ length: plan.repetitionCount }, () => [peer.id, peer.contentVersion, 0]),
      ]);
      expect(lessonPlan(catalogue, id, forged)).toBeUndefined();
    }
  });

  it('restores a partially answered singing plan and reconstructs the complete evidence canonically', () => {
    const plan = lessonPlan(catalogue, id);
    if (!plan) throw Error('Missing choir plan');
    let session = createLessonSession(plan, 'choir-offline');
    const actions: LessonAction[] = [];
    for (let guard = 0; session.phase !== 'complete' && guard < 100; guard++) {
      const active = activeLessonSession(session);
      const item = active && currentItem(active);
      if (!item) throw Error('Missing current task');
      const answer: LessonAction = { type: 'answer', answer: expectedAnswer(item) };
      session = applyLessonAction(session, answer);
      actions.push(answer);
      const draft: LessonDraft = {
        schemaVersion: 1,
        id: 'synthetic-choir',
        lessonId: id,
        contentVersion: 27,
        planKey: plan.planKey,
        seed: 'choir-offline',
        startedAt: 1000,
        finishedAt: null,
        timeZone: 'Europe/Berlin',
        introCard: 0,
        started: true,
        actions: [...actions],
        answer: null,
      };
      expect(restoreLessonDraft(catalogue, draft).session).toEqual(session);
      expect(() => restoreLessonDraft(catalogue, { ...draft, contentVersion: 25 })).toThrow();
      session = applyLessonAction(session, { type: 'next' });
      actions.push({ type: 'next' });
    }
    expect(session.phase).toBe('complete');
    const event = lessonEvent('synthetic-choir', session, 1000, 2000);
    expect(validateLearningEvent(catalogue, event).lesson).toMatchObject({
      lessonId: id,
      contentVersion: 27,
      passed: true,
      eligibleCorrect: plan.exercises.length,
    });
    expect(() => validateLearningEvent(catalogue, { ...event, contentVersion: 25 })).toThrow();
    expect(() => validateLearningEvent(publicCatalogue(catalogue), event)).toThrow();
  });

  it('allows skipping but requires a sung task for the same mixed result on client and server', () => {
    const plan = lessonPlan(catalogue, id);
    if (!plan) throw Error('Missing choir plan');
    let session = createLessonSession(plan, 'choir-without-microphone');
    for (let guard = 0; session.phase !== 'complete' && guard < 100; guard++) {
      const active = activeLessonSession(session);
      const item = active && currentItem(active);
      if (!item) throw Error('Missing task');
      session =
        item.type === 'CHOIR_PART'
          ? applyLessonAction(session, { type: 'skipVoice' })
          : applyLessonAction(
              applyLessonAction(session, {
                type: 'answer',
                answer: expectedAnswer(item),
              }),
              { type: 'next' },
            );
    }
    expect(lessonProgress(session)).toMatchObject({
      passed: false,
      voiceSkipped: 2,
      choirCorrect: 0,
    });
    expect(
      validateLearningEvent(catalogue, lessonEvent('skip-fixture', session, 1000, 2000)).lesson,
    ).toEqual(lessonProgress(session));
  });
});
