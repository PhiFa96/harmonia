import { describe, expect, it } from 'vitest';
import { catalogue, firstLesson } from './authoring.ts';
import { catalogue as published } from './published.ts';
import { lessonPlan, restoreLessonDraft, applyLessonAction } from './lesson-flow.ts';
import type { LessonAction, LessonDraft } from './lesson-flow.ts';
import { lessonEvent, validateLearningEvent, legacyLessonEvent } from './learning-evidence.ts';
import { lessonReward, lessonDay, lessonStreak } from './lesson-rewards.ts';
import {
  createLessonSession,
  currentItem,
  activeLessonSession,
  expectedAnswer,
  answerLesson,
  nextLessonExercise,
  revealLessonHint,
  startLessonReview,
  itemVariantKey,
} from '@harmonia/exercises';
import type { LessonSession } from '@harmonia/exercises';

const plan = lessonPlan(catalogue, 'notation.l1.staff.positions');
if (!plan) throw new Error('Plan fehlt');
const definition = plan;
function draft(actions: LessonAction[] = []): LessonDraft {
  return {
    schemaVersion: 1,
    id: 'attempt',
    lessonId: definition.id,
    contentVersion: definition.contentVersion,
    planKey: definition.planKey,
    seed: 'resume',
    startedAt: 1000,
    finishedAt: null,
    timeZone: 'Europe/Berlin',
    introCard: 0,
    started: true,
    actions,
    answer: null,
  };
}
function complete(session: LessonSession, hint = 0) {
  for (let guard = 0; session.phase !== 'complete' && guard < 100; guard++) {
    if (session.phase === 'review-intro') {
      session = startLessonReview(session);
      continue;
    }
    const active = activeLessonSession(session),
      item = active && currentItem(active);
    if (!item) throw new Error('Aufgabe fehlt');
    for (let n = 0; n < hint; n++) session = revealLessonHint(session);
    session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
  }
  expect(session.phase).toBe('complete');
  return session;
}
describe('Mischung mit vorausgesetztem Wissen', () => {
  it('behält den ganzen neuen Stoff, fügt bekannte Aufgaben ein und steigert deren Anteil', () => {
    const first = lessonPlan(catalogue, 'notation.l1.staff.anchor');
    expect(first?.repetitionCount).toBe(0);
    expect(definition.repetitionCount).toBeGreaterThan(0);
    expect(definition.repetitionIndices[0]).toBeGreaterThan(0);
    const advanced = lessonPlan(catalogue, 'notation.l2.clefs-registers.bass');
    expect(advanced?.repetitionCount).toBeGreaterThanOrEqual(definition.repetitionCount);
    expect(definition.exercises.length).toBe(definition.newCount + definition.repetitionCount);
    expect(
      definition.exercises.filter((_, i) => !definition.repetitionIndices.includes(i)),
    ).toHaveLength(definition.newCount);
    expect(lessonPlan(published, definition.id)).toBeUndefined();
  });
  it.each(catalogue.lessons.map((l) => [l.id]))(
    '%s lässt sich einschließlich der Mischung kanonisch nachrechnen',
    (id) => {
      const content = lessonPlan(catalogue, id);
      if (!content) throw new Error('Lektion fehlt');
      expect(content.exercises.length).toBeLessThanOrEqual(15);
      const session = complete(createLessonSession(content, 'mixed'));
      const event = lessonEvent(id, session, 1000, 2000, 'Europe/Berlin');
      expect(validateLearningEvent(catalogue, event).lesson?.passed).toBe(true);
      expect(validateLearningEvent(catalogue, event).lesson?.total).toBe(content.exercises.length);
      expect(() => validateLearningEvent(catalogue, { ...event, planKey: 'fake' })).toThrow();
    },
  );
  it('alte Nachweise bleiben ohne Mischplan unverändert gültig', () => {
    const session = complete(createLessonSession(firstLesson, 'legacy'));
    const event = lessonEvent('old', session, 1, 2);
    expect('planKey' in event).toBe(false);
    expect(validateLearningEvent(catalogue, event).lesson?.total).toBe(
      firstLesson.exercises.length,
    );
  });
  it('vollständige lokale Ergebnisse behalten beim Import Mischplan und Zeitzone', () => {
    const session = complete(createLessonSession(definition, 'raw-import'));
    const expected = lessonEvent('raw', session, 1000, 2000, 'Europe/Berlin');
    const imported = legacyLessonEvent({
      schemaVersion: 1,
      id: 'raw',
      session,
      timeZone: 'Europe/Berlin',
      startedAt: new Date(1000).toISOString(),
      finishedAt: new Date(2000).toISOString(),
    });
    expect(imported).toEqual(expected);
    expect(validateLearningEvent(catalogue, imported).lesson?.passed).toBe(true);
  });
});
describe('Wiederaufnahme anhand der Übergänge', () => {
  it('bewahrt Einführung, ungeprüfte Auswahl und Seed-Typ', () => {
    const input = { ...draft(), started: false, introCard: 1, answer: 'C', seed: 123 };
    const restored = restoreLessonDraft(catalogue, input);
    expect(restored.session).toBeNull();
    expect(restored.draft).toEqual(input);
  });
  it('rekonstruiert Hinweise und sichtbares Feedback ohne erneute Erstbewertung', () => {
    let session = createLessonSession(definition, 'resume');
    const item = session.initial.items[0];
    if (!item) throw new Error('Frage fehlt');
    const actions: LessonAction[] = [
      { type: 'hint' },
      { type: 'answer', answer: expectedAnswer(item) },
    ];
    actions.forEach((action) => {
      session = applyLessonAction(session, action);
    });
    const restored = restoreLessonDraft(catalogue, {
      ...draft(actions),
      answer: expectedAnswer(item),
    });
    expect(restored.session).toEqual(session);
    expect(restored.session?.initial.records).toHaveLength(1);
    expect(restored.session?.initial.hintLevel).toBe(1);
    expect(applyLessonAction(session, { type: 'answer', answer: expectedAnswer(item) })).toBe(
      session,
    );
  });
  it('setzt die Fehlerwiederholung mit ihrer neuen Variante fort', () => {
    let session = createLessonSession(definition, 'resume');
    const actions: LessonAction[] = [];
    while (session.phase === 'initial') {
      const item = currentItem(session.initial);
      if (!item) throw new Error('Frage fehlt');
      const answer =
        session.initial.index === 0
          ? item.choices.find((v) => v !== expectedAnswer(item))
          : expectedAnswer(item);
      if (!answer) throw new Error('Antwort fehlt');
      for (const action of [{ type: 'answer', answer }, { type: 'next' }] as const) {
        actions.push(action);
        session = applyLessonAction(session, action);
      }
    }
    expect(session.phase).toBe('review-intro');
    expect(restoreLessonDraft(catalogue, draft(actions)).session).toEqual(session);
    actions.push({ type: 'review' });
    session = applyLessonAction(session, { type: 'review' });
    const original = session.initial.items[0],
      variant = session.review?.items[0];
    if (!original || !variant) throw new Error('Variante fehlt');
    expect(itemVariantKey(variant)).not.toBe(itemVariantKey(original));
    expect(restoreLessonDraft(catalogue, draft(actions)).session).toEqual(session);
  });
  it.each([
    { ...draft([{ type: 'next' }]) },
    { ...draft(), planKey: 'old' },
    { ...draft(), contentVersion: 999 },
    { ...draft(), finishedAt: 2000 },
    { ...draft(), timeZone: 'invalid' },
    { ...draft(), introCard: 199 },
    { ...draft([{ type: 'hint' }]), started: false },
  ])('weist widersprüchliche und veraltete Zustände zurück', (input) => {
    expect(() => restoreLessonDraft(catalogue, input)).toThrow();
  });
});
describe('XP und Tagesgrenzen', () => {
  it.each([
    [0, 18, 13],
    [1, 14, 9],
    [2, 13, 9],
    [3, 0, 0],
  ])('Hinweis %i: erste XP %i, Wiederholung %i', (hint, initial, repeat) => {
    const session = complete(createLessonSession(definition, 'xp'), hint);
    expect(lessonReward(session, false)).toBe(initial);
    expect(lessonReward(session, true)).toBe(repeat);
  });
  it('unfertige oder nicht bestandene Durchgänge vergeben weder XP noch Bestehen', () => {
    const session = createLessonSession(definition, 'xp');
    expect(lessonReward(session, false)).toBe(0);
    const solved = complete(session, 3);
    expect(
      validateLearningEvent(catalogue, lessonEvent('shown', solved, 1, 2)).lesson?.passed,
    ).toBe(false);
    expect(lessonReward(solved, false)).toBe(0);
  });
  it('verwendet den lokalen Abschlusstag, auch bei Zeitumstellung', () => {
    const time = Date.parse('2026-03-29T22:30:00Z');
    expect(lessonDay(time, 'Europe/Berlin')).toBe('2026-03-30');
    expect(lessonDay(time, 'America/New_York')).toBe('2026-03-29');
  });
  it.each([
    [['2026-10-12', '2026-10-13', '2026-10-13'], 2],
    [['2026-10-11', '2026-10-12'], 2],
    [['2026-10-11'], 0],
    [['2026-10-10', '2026-10-12', '2026-10-13'], 2],
  ])('zählt Tage statt Versuche: %j → %i', (days, count) => {
    expect(lessonStreak(days, '2026-10-13')).toBe(count);
  });
});
