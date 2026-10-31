import { describe, expect, it } from 'vitest';
import { catalogue } from './authoring.ts';
import { activeLessonSession, currentItem, expectedAnswer } from '@harmonia/exercises';
import {
  createLevelFivePreview,
  restoreLevelFivePreview,
  changeLevelFivePreview,
  LEVEL_FIVE_PREVIEW_TTL,
} from './level-five-preview.ts';
const now = Date.UTC(2026, 9, 25, 12),
  lessonId = 'counterpoint.l5.species.lesson3';
const fresh = (id = lessonId) =>
  restoreLevelFivePreview(
    catalogue,
    createLevelFivePreview(catalogue, id, 'original-seed', now),
    now,
  );

describe('interne Stufe-5-Wiederaufnahme ohne Lernnachweis', () => {
  for (const lesson of catalogue.lessons.filter((l) =>
    /^(counterpoint|forms|analysis|contemporary|world)\.l5\./.test(l.id),
  ))
    it(`${lesson.id}: reproduziert Einführung, Auswahl, Hinweise und Wertung`, () => {
      let state = fresh(lesson.id);
      state = changeLevelFivePreview(state, { type: 'card', index: 1 }, now);
      expect(restoreLevelFivePreview(catalogue, state.draft, now).draft.introCard).toBe(1);
      state = changeLevelFivePreview(state, { type: 'start' }, now);
      const session = state.session && activeLessonSession(state.session),
        item = session && currentItem(session);
      if (!item) throw Error('Missing task');
      state = changeLevelFivePreview(state, { type: 'select', answer: expectedAnswer(item) }, now);
      state = changeLevelFivePreview(state, { type: 'act', action: { type: 'hint' } }, now);
      state = changeLevelFivePreview(
        state,
        { type: 'act', action: { type: 'answer', answer: expectedAnswer(item) } },
        now,
      );
      expect(
        restoreLevelFivePreview(catalogue, JSON.parse(JSON.stringify(state.draft)) as unknown, now),
      ).toEqual(state);
      expect(state.draft.answer).toBe(expectedAnswer(item));
    });
  it('reproduziert Fehlerwiederholung und Abschluss ausschließlich aus Originalantworten', () => {
    let state = changeLevelFivePreview(fresh(), { type: 'start' }, now);
    let wrong = true;
    for (let n = 0; n < 80 && state.session?.phase !== 'complete'; n++) {
      if (state.session?.phase === 'review-intro')
        state = changeLevelFivePreview(state, { type: 'act', action: { type: 'review' } }, now);
      const active = state.session && activeLessonSession(state.session),
        item = active && currentItem(active);
      if (!item) throw Error('Missing task');
      const answer = wrong
        ? item.choices.find((c) => c !== expectedAnswer(item))
        : expectedAnswer(item);
      if (!answer) throw Error('Missing answer');
      wrong = false;
      state = changeLevelFivePreview(
        state,
        { type: 'act', action: { type: 'answer', answer } },
        now,
      );
      state = changeLevelFivePreview(state, { type: 'act', action: { type: 'next' } }, now);
      expect(restoreLevelFivePreview(catalogue, state.draft, now)).toEqual(state);
    }
    expect(state.session?.phase).toBe('complete');
    expect(state.session?.review).toBeDefined();
    expect(Object.keys(state.draft)).not.toEqual(
      expect.arrayContaining(['points', 'xp', 'session']),
    );
  });
  it('bewahrt eine unvollständige Zuordnung, erlaubt damit aber keine Wertung', () => {
    let state = changeLevelFivePreview(
      fresh('counterpoint.l5.species.lesson2'),
      { type: 'start' },
      now,
    );
    const active = state.session && activeLessonSession(state.session),
      item = active && currentItem(active);
    if (item?.type !== 'MATCH') throw Error('Expected matching task');
    const partial =
      'match:' + item.facts.map((_fact, index) => (index === 0 ? item.choices[0] : '')).join(',');
    state = changeLevelFivePreview(state, { type: 'select', answer: partial }, now);
    expect(restoreLevelFivePreview(catalogue, state.draft, now).draft.answer).toBe(partial);
    expect(() =>
      changeLevelFivePreview(
        state,
        { type: 'act', action: { type: 'answer', answer: partial } },
        now,
      ),
    ).toThrow();
  });
  it('weist geänderte Quellen, neue Version, veröffentlichte Quellen und fremde Lektionen ab', () => {
    const draft = fresh().draft;
    for (const change of [
      (c: typeof catalogue) => {
        c.contentVersion++;
      },
      (c: typeof catalogue) => {
        const lesson = c.lessons.find((l) => l.id === lessonId);
        if (!lesson) throw Error('Missing lesson');
        lesson.status = 'freigegeben';
      },
      (c: typeof catalogue) => {
        const lesson = c.lessons.find((l) => l.id === lessonId);
        if (!lesson) throw Error('Missing lesson');
        lesson.titleKey = 'content.changed.title';
      },
    ]) {
      const changed = structuredClone(catalogue);
      change(changed);
      expect(() => restoreLevelFivePreview(changed, draft, now)).toThrow();
    }
    expect(() =>
      createLevelFivePreview(catalogue, 'notation.l1.staff.reading', 'foreign', now),
    ).toThrow();
    expect(() => restoreLevelFivePreview(catalogue, { ...draft, engineVersion: 2 }, now)).toThrow();
    expect(() => restoreLevelFivePreview(catalogue, { ...draft, points: 999 }, now)).toThrow();
  });
  it('sperrt ungültige Übergänge, falsche Auswahl, Zukunft und die exakte Siebentagesgrenze', () => {
    const state = fresh();
    expect(() =>
      restoreLevelFivePreview(catalogue, state.draft, now + LEVEL_FIVE_PREVIEW_TTL - 1),
    ).not.toThrow();
    expect(() =>
      restoreLevelFivePreview(catalogue, state.draft, now + LEVEL_FIVE_PREVIEW_TTL),
    ).toThrow();
    expect(() => restoreLevelFivePreview(catalogue, state.draft, now - 1)).toThrow();
    expect(() =>
      restoreLevelFivePreview(catalogue, { ...state.draft, actions: [{ type: 'next' }] }, now),
    ).toThrow();
    const started = changeLevelFivePreview(state, { type: 'start' }, now + 1);
    expect(() =>
      changeLevelFivePreview(started, { type: 'select', answer: 'injected' }, now + 1),
    ).toThrow();
    expect(() =>
      changeLevelFivePreview(started, { type: 'act', action: { type: 'next' } }, now + 1),
    ).toThrow();
    expect(() => changeLevelFivePreview(started, { type: 'card', index: 1 }, now + 1)).toThrow();
    expect(() => changeLevelFivePreview(started, { type: 'select', answer: null }, now)).toThrow();
  });
});
