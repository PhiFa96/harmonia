import type { PlacementAction } from '@harmonia/exercises';
import { describe, expect, it } from 'vitest';
import { catalogue } from './authoring.ts';
import { catalogue as published } from './published.ts';
import { lessonPlan } from './lesson-flow.ts';
import { placementBank } from './placement.ts';
import {
  contentReportSchema,
  contentReportsRequestSchema,
  resolveReportSource,
  validateContentReport,
} from './content-reports.ts';
import {
  createLessonSession,
  createFreePracticeSession,
  PRACTICE_SETS,
  currentPlacementTask,
  createPlacement,
  actPlacement,
  answerLesson,
  nextLessonExercise,
  startLessonReview,
  expectedAnswer,
  exerciseFeedback,
  exerciseHints,
  hintText,
  feedbackMedia,
  evaluateExercise,
  itemVariantKey,
} from '@harmonia/exercises';
import { resolveLesson } from './catalogue.ts';

const base = {
  id: '00000000-0000-4000-8000-000000000001',
  createdAt: 1000,
  locale: 'de' as const,
  category: 'feedback' as const,
  message: '  Beispiel  ',
  answer: null,
  hintLevel: 0,
  checked: false,
};
describe('Reproduzierbare Inhaltsmeldungen und Feedback', () => {
  it.each(catalogue.lessons)(
    'prüft $id samt Mischplan, Feedback und drei Hinweisen in DE/US/UK',
    (lesson) => {
      const plan = lessonPlan(catalogue, lesson.id);
      if (!plan) throw new Error('Plan fehlt');
      const session = createLessonSession(plan, 'report-all');
      session.initial.items.forEach((item, index) => {
        const source = {
          kind: 'lesson',
          lessonId: lesson.id,
          contentVersion: lesson.contentVersion,
          planKey: plan.planKey,
          seed: 'report-all',
          round: 'initial',
          index,
        };
        const resolved = validateContentReport(catalogue, {
          ...base,
          source,
          answer: expectedAnswer(item),
          checked: true,
        });
        expect(resolved.item).toEqual(item);
        expect(resolved.evaluation?.correct).toBe(true);
        for (const locale of ['de', 'en-US', 'en-GB'] as const) {
          const text = exerciseFeedback(item, evaluateExercise(item, expectedAnswer(item)), locale);
          expect(text.message.length).toBeGreaterThan(10);
          expect(text.message).not.toMatch(/\{\{|\$t\(|undefined/);
          for (const level of [1, 2, 3] as const) {
            const hint = hintText(item, exerciseHints(item, level), locale);
            expect(hint.length).toBeGreaterThan(5);
            expect(hint).not.toMatch(/\{\{|\$t\(|undefined/);
          }
        }
        const media = feedbackMedia(item);
        if (media.audio) expect(media.audio.staves.length).toBeGreaterThan(0);
        if (item.type === 'CONTEXT_CHOICE' && item.source.kind === 'document')
          expect(media).toEqual({});
      });
    },
  );
  it('prüft freie Sätze und die Abdeckung aller Aufgabentypen', () => {
    const types = new Set(
      catalogue.exerciseSets.flatMap((set) => set.exercises.map((e) => e.spec.type)),
    );
    for (const set of PRACTICE_SETS)
      for (const item of createFreePracticeSession(set, 'report-free').items) {
        types.add(item.type);
        for (const locale of ['de', 'en-US', 'en-GB'] as const) {
          expect(
            exerciseFeedback(item, evaluateExercise(item, expectedAnswer(item)), locale).message,
          ).not.toMatch(/\{\{|\$t\(|undefined/);
          for (const level of [1, 2, 3] as const)
            expect(hintText(item, exerciseHints(item, level), locale).length).toBeGreaterThan(5);
        }
      }
    expect(types.size).toBe(28);
  });
  it.each(PRACTICE_SETS)(
    'reproduziert den öffentlichen freien Satz %s ohne freigegebenen Kurs',
    (set) => {
      const session = createFreePracticeSession(set, 12345);
      session.items.forEach((item, index) => {
        const resolved = resolveReportSource(published, {
          kind: 'practice',
          set,
          seed: 12345,
          index,
          contentVersion: 1,
        });
        expect(resolved.item).toEqual(item);
        expect(resolved.contentId).toBe(`practice:${set}`);
      });
      expect(() =>
        resolveReportSource(published, {
          kind: 'practice',
          set,
          seed: 12345,
          index: session.items.length,
          contentVersion: 1,
        }),
      ).toThrow();
    },
  );
  it('rekonstruiert Fehlerwiederholungen anhand des ursprünglichen Index', () => {
    const lesson = resolveLesson(catalogue, 'notation.l1.staff.positions');
    if (!lesson) throw new Error('Lektion fehlt');
    let state = createLessonSession(lesson, 'review-report');
    const first = state.initial.items[0];
    if (!first) throw new Error('Aufgabe fehlt');
    state = answerLesson(state, first.choices.find((c) => c !== expectedAnswer(first)) ?? '');
    state = nextLessonExercise(state);
    while (state.phase === 'initial') {
      const item = state.initial.items[state.initial.index];
      if (!item) throw new Error('Aufgabe fehlt');
      state = nextLessonExercise(answerLesson(state, expectedAnswer(item)));
    }
    state = startLessonReview(state);
    const item = state.review?.items[0];
    if (!item) throw new Error('Wiederholung fehlt');
    const resolved = resolveReportSource(catalogue, {
      kind: 'lesson',
      lessonId: lesson.id,
      contentVersion: lesson.contentVersion,
      seed: 'review-report',
      round: 'review',
      index: state.reviewOrigins[0],
    });
    expect(resolved.item).toEqual(item);
    expect(itemVariantKey(item)).not.toBe(itemVariantKey(first));
  });
  it('rekonstruiert adaptive Einstufungsfragen vor und nach Bewertung', () => {
    const bank = placementBank(catalogue),
      seed = 'placement-report';
    let state = createPlacement(bank, seed);
    const actions: PlacementAction[] = [];
    for (let n = 0; n < 5; n++) {
      const task = currentPlacementTask(state),
        item = task?.session.items[0];
      if (!task || !item) throw new Error('Aufgabe fehlt');
      const source = { kind: 'placement', bankKey: bank.key, seed, actions: [...actions] };
      expect(resolveReportSource(catalogue, source)).toMatchObject({
        item,
        contentId: task.checkpoint.lessonId,
      });
      const action = { type: 'answer' as const, answer: expectedAnswer(item) };
      actions.push(action);
      state = actPlacement(bank, state, action);
      expect(resolveReportSource(catalogue, { ...source, actions: [...actions] }).item).toEqual(
        item,
      );
      actions.push({ type: 'next' as const });
      state = actPlacement(bank, state, { type: 'next' });
    }
  });
  it('weist fremde Felder, manipulierte oder veraltete Quellen und Entwurfskurse im öffentlichen Modus zurück', () => {
    const lesson = catalogue.lessons[0];
    if (!lesson) throw new Error('Lektion fehlt');
    const source = {
      kind: 'lesson',
      lessonId: lesson.id,
      contentVersion: lesson.contentVersion,
      seed: 1,
      round: 'initial',
      index: 0,
    };
    expect(() => resolveReportSource(published, source)).toThrow();
    expect(() => resolveReportSource(catalogue, { ...source, contentVersion: 9999 })).toThrow();
    expect(() => resolveReportSource(catalogue, { ...source, planKey: 'forged' })).toThrow();
    expect(() => resolveReportSource(catalogue, { ...source, index: 199 })).toThrow();
    const report = contentReportSchema.parse({ ...base, source });
    expect(report.message).toBe('Beispiel');
    expect(() => contentReportSchema.parse({ ...report, user_id: 'other' })).toThrow();
    expect(() => contentReportSchema.parse({ ...report, status: 'resolved' })).toThrow();
    expect(() => contentReportSchema.parse({ ...report, item: {} })).toThrow();
    expect(() => contentReportsRequestSchema.parse({ reports: [report, report] })).toThrow();
    expect(
      validateContentReport(catalogue, { ...report, answer: 'invalid-input', checked: true })
        .evaluation?.validAnswer,
    ).toBe(false);
  });
});
