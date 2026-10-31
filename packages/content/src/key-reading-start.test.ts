import { describe, expect, it } from 'vitest';
import { catalogue } from './authoring.ts';
import {
  learningPath,
  publicCatalogue,
  resolveLesson,
  lessonEvent,
  lessonProgress,
  validateLearningEvent,
  lessonPlan,
  adaptiveLessonPlan,
} from './index.ts';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  evaluateExercise,
  expectedAnswer,
  nextLessonExercise,
  startLessonReview,
} from '@harmonia/exercises';
import { keyFifths } from '@harmonia/theory';

const unitId = 'scales.l2.key-reading';
const choirId = 'aural.l4.choir';
const skillId = 'key.signature-read-treble';
const lessonId = `${unitId}.lesson`;
const progress = catalogue.lessons
  .filter((lesson) => ![unitId, choirId].includes(lesson.unitId))
  .map((lesson) => ({
    lessonId: lesson.id,
    contentVersion: lesson.contentVersion,
    passed: true,
    eligibleCorrect: 10,
    total: 10,
  }));

describe('key-signature reading without a bass-clef prerequisite (C8)', () => {
  it('opens its own unit with only level-one foundations, while the existing writing route stays locked', () => {
    const levelOne = catalogue.lessons
      .filter((lesson) => {
        const unit = catalogue.units.find((unit) => unit.id === lesson.unitId);
        return catalogue.levels.find((level) => level.id === unit?.levelId)?.number === 1;
      })
      .map((lesson) => ({
        lessonId: lesson.id,
        contentVersion: lesson.contentVersion,
        passed: true,
        eligibleCorrect: 10,
        total: 10,
      }));
    const path = learningPath(catalogue, levelOne);
    expect(path.find((unit) => unit.id === unitId)?.lessons[0]?.status).toBe('open');
    expect(path.find((unit) => unit.id === 'scales.l2.keys')?.status).toBe('locked');
    expect(path.find((unit) => unit.id === 'notation.l2.clefs-registers')?.completed).toBe(0);
  });
  it('locks all choir voices without key-signature reading, including an isolated choir placement', () => {
    for (const tested of [[], [choirId]]) {
      const choir = learningPath(catalogue, progress, tested).find((unit) => unit.id === choirId);
      expect(choir?.lessons.map((lesson) => lesson.status)).toEqual([
        'locked',
        'locked',
        'locked',
        'locked',
      ]);
      for (const lesson of choir?.lessons ?? [])
        expect(lesson.prerequisiteUnitIds).toContain(unitId);
    }
  });
  it('has an actual lesson and a skill whose full prerequisites do not require bass reading or writing', () => {
    const skill = catalogue.skills.find((skill) => skill.id === skillId);
    expect(skill).toBeDefined();
    const visited = new Set<string>();
    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      for (const prerequisite of catalogue.skills.find((entry) => entry.id === id)?.prerequisites ??
        [])
        visit(prerequisite);
    };
    visit(skillId);
    expect(visited.has('notation.treble-natural')).toBe(true);
    expect(visited.has('notation.bass-natural')).toBe(false);
    expect(visited.has('notation.write-pitch')).toBe(false);
    expect(resolveLesson(catalogue, `${unitId}.lesson`)?.exercises).toHaveLength(10);
    expect(publicCatalogue(catalogue).units.some((unit) => unit.id === unitId)).toBe(false);
  });

  it('uses ten treble-only recognition questions, with independent C/G/D/F/B-flat answers', () => {
    const lesson = resolveLesson(catalogue, lessonId);
    if (!lesson) throw Error('Missing signature reading lesson');
    const answers = new Map([
      [-2, 'Bb'],
      [-1, 'F'],
      [0, 'C'],
      [1, 'G'],
      [2, 'D'],
    ]);
    const covered = new Set<number>();
    for (let seed = 0; seed < 100; seed++) {
      const session = createLessonSession(lesson, seed);
      expect(createLessonSession(lesson, seed)).toEqual(session);
      expect(session.initial.items).toHaveLength(10);
      for (const item of session.initial.items) {
        if (item.type !== 'KEYSIG_IDENTIFY') throw Error('Not a reading question');
        const fifths = keyFifths(item.key);
        covered.add(fifths);
        expect(item.clef).toBe('treble');
        expect(item.score.staves[0]?.keySignature.fifths).toBe(fifths);
        const answer = `tonality:major:${answers.get(fifths) ?? 'unsupported'}`;
        expect(expectedAnswer(item)).toBe(answer);
        expect(new Set(item.choices).size).toBe(4);
        for (const choice of item.choices)
          expect(evaluateExercise(item, choice).correct).toBe(choice === answer);
      }
    }
    expect([...covered].sort((a, b) => a - b)).toEqual([-2, -1, 0, 1, 2]);
  });

  it('fixed/adaptive repetitions cannot introduce bass reading or a writing exercise', () => {
    const fixed = lessonPlan(catalogue, lessonId);
    if (!fixed) throw Error('Missing reading plan');
    const rating = { rating: 1200, deviation: 60, volatility: 0.06, attempts: 4, updatedAt: 0 };
    const adaptive = adaptiveLessonPlan(
      catalogue,
      lessonId,
      {
        skills: {
          'key.signature-read-treble': rating,
          'notation.treble-natural': rating,
          'notation.bass-natural': rating,
        },
        buckets: {},
      },
      1000,
    );
    expect(adaptive?.planKey.startsWith('["flow:2"')).toBe(true);
    for (const plan of [fixed, adaptive]) {
      if (!plan) throw Error('Missing adaptive reading plan');
      expect(plan.newCount).toBe(10);
      expect(plan.exercises).toHaveLength(plan.newCount + plan.repetitionCount);
      expect(lessonPlan(catalogue, lessonId, plan.planKey)).toEqual(plan);
      for (const source of plan.exerciseSources) {
        expect(source.skillIds).not.toContain('notation.bass-natural');
        expect(['NOTE_PLACE', 'INTERVAL_BUILD', 'KEYSIG_BUILD', 'SCALE_BUILD']).not.toContain(
          source.spec.type,
        );
      }
    }
    const bass = catalogue.lessons.find(
      (lesson) => lesson.id === 'notation.l2.clefs-registers.bass',
    );
    if (!bass) throw Error('Missing bass source');
    const forged = JSON.stringify([
      'flow:2',
      lessonId,
      28,
      Array.from({ length: 10 }, (_, index) => index),
      Array.from({ length: fixed.repetitionCount }, () => [bass.id, bass.contentVersion, 0]),
    ]);
    expect(lessonPlan(catalogue, lessonId, forged)).toBeUndefined();
  });

  it.each([false, true])(
    'server-reconstructed reading result unlocks upper parts only when passed (wrong=%s)',
    (wrong) => {
      const definition = resolveLesson(catalogue, lessonId);
      if (!definition) throw Error('Missing reading lesson');
      let session = createLessonSession(definition, 'reading-evidence');
      for (let guard = 0; session.phase !== 'complete' && guard < 50; guard++) {
        if (session.phase === 'review-intro') session = startLessonReview(session);
        const active = activeLessonSession(session);
        const item = active && currentItem(active);
        if (!item) throw Error('Missing reading task');
        const correct = expectedAnswer(item);
        const chosen =
          wrong && session.phase === 'initial'
            ? item.choices.find((choice) => choice !== correct)
            : correct;
        if (!chosen) throw Error('Missing wrong option');
        session = nextLessonExercise(answerLesson(session, chosen));
      }
      expect(session.phase).toBe('complete');
      const event = lessonEvent('key-reading-result', session, 1000, 2000);
      const checked = validateLearningEvent(catalogue, event).lesson;
      expect(checked).toEqual(lessonProgress(session));
      expect(checked?.passed).toBe(!wrong);
      if (!checked) throw Error('Missing reading progress');
      const withoutBass = progress.filter(
        (row) =>
          catalogue.lessons.find((lesson) => lesson.id === row.lessonId)?.unitId !==
          'notation.l2.clefs-registers',
      );
      const path = learningPath(catalogue, [...withoutBass, checked]);
      expect(
        path.find((unit) => unit.id === choirId)?.lessons.map((lesson) => lesson.status),
      ).toEqual(
        wrong ? ['locked', 'locked', 'locked', 'locked'] : ['open', 'open', 'locked', 'locked'],
      );
      expect(() => validateLearningEvent(catalogue, { ...event, contentVersion: 27 })).toThrow();
      expect(() => validateLearningEvent(publicCatalogue(catalogue), event)).toThrow();
      const oldReading = { ...checked, passed: true, contentVersion: 27 };
      expect(
        learningPath(catalogue, [...withoutBass, oldReading])
          .find((unit) => unit.id === choirId)
          ?.lessons.every((lesson) => lesson.status === 'locked'),
      ).toBe(true);
    },
  );
});
