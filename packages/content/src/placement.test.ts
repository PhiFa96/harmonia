import { describe, expect, it } from 'vitest';
import {
  actPlacement,
  createPlacement,
  currentPlacementTask,
  expectedAnswer,
  evaluateExercise,
  isAuralExercise,
  placementEstimates,
  replayPlacement,
} from '@harmonia/exercises';
import type {
  ExerciseItem,
  PlacementAction,
  PlacementSession,
  PlacementTask,
} from '@harmonia/exercises';
import { catalogue } from './authoring.ts';
import { publicCatalogue } from './catalogue.ts';
import { placementBank, placementRecommendations, placementFirstLesson } from './placement.ts';

const bank = placementBank(catalogue);
function wrongAnswer(item: ExerciseItem): string {
  const expected = expectedAnswer(item);
  const candidates = [
    ...item.choices.filter((v) => v !== expected),
    'C4',
    'D4',
    'E4',
    'taps:',
    `key:${String(Number(expected.slice(4)) + 1)}`,
  ];
  if (expected.startsWith('notes:') || expected.startsWith('chord-notes:')) {
    const prefix = expected.startsWith('notes:') ? 'notes:' : 'chord-notes:';
    const parts = expected.slice(prefix.length).split(',');
    parts[parts.length - 1] = parts[0] ?? 'C4';
    candidates.push(prefix + parts.join(','));
  }
  if (expected.startsWith('match:') || expected.startsWith('order:'))
    candidates.push(expected.slice(0, 6) + expected.slice(6).split(',').reverse().join(','));
  const wrong = candidates.find((answer) => {
    const evaluation = evaluateExercise(item, answer);
    return evaluation.validAnswer && !evaluation.correct;
  });
  if (!wrong) throw new Error(`Falsche Antwort fehlt: ${item.type}`);
  return wrong;
}
function simulate(
  seed: string,
  ability: (task: PlacementTask) => boolean,
  assisted = false,
  skip = false,
) {
  let state = createPlacement(bank, seed);
  const actions: PlacementAction[] = [];
  const act = (action: PlacementAction) => {
    actions.push(action);
    state = actPlacement(bank, state, action);
  };
  for (let guard = 0; !state.ended && guard < 26; guard++) {
    const task = currentPlacementTask(state),
      item = task?.session.items[0];
    if (!task || !item) throw new Error('Testaufgabe fehlt');
    if (skip && isAuralExercise(item)) {
      act({ type: 'skip' });
      continue;
    }
    if (assisted) act({ type: 'hint' });
    const answer = ability(task) ? expectedAnswer(item) : wrongAnswer(item);
    if (!answer) throw new Error('Falsche Antwort fehlt');
    act({ type: 'answer', answer });
    if (!currentPlacementTask(state)?.session.result) throw new Error('Antwort nicht ausgewertet');
    act({ type: 'next' });
  }
  expect(state.ended).toBe('complete');
  return {
    state,
    actions,
    estimates: placementEstimates(bank, state),
    recommendations: placementRecommendations(
      catalogue,
      bank,
      placementEstimates(bank, state),
      true,
    ),
  };
}
describe('Adaptive Einstufung im vollständigen ausgelieferten MVP-Katalog', () => {
  it('prüft sieben Fachbereiche mit vier geordneten Stichproben, keine Prototyp-Einführung', () => {
    expect(bank.areas).toHaveLength(7);
    for (const area of bank.areas) {
      expect(area.checkpoints).toHaveLength(4);
      expect(area.checkpoints.map((c) => c.level)).toEqual(
        [...area.checkpoints.map((c) => c.level)].sort(),
      );
      for (const source of area.checkpoints)
        expect(catalogue.lessons.some((lesson) => lesson.id === source.lessonId)).toBe(true);
    }
  });
  it.each(Array.from({ length: 30 }, (_, i) => String(i)))(
    'Anfänger/Mittel/Fortgeschritten landen plausibel und reproduzierbar: Seed %s',
    (seed) => {
      const beginner = simulate(seed, () => false),
        middle = simulate(seed, (task) => task.checkpoint.level === 1),
        advanced = simulate(seed, () => true);
      expect(beginner.state.tasks.length).toBe(21);
      expect(beginner.estimates.every((e) => e.confirmedTier === -1)).toBe(true);
      expect(
        beginner.recommendations.every((r) => r.testedUnitIds.length === 0 && r.level === 0),
      ).toBe(true);
      expect(middle.estimates.filter((e) => e.confirmedTier === 1)).toHaveLength(5);
      expect(middle.estimates.filter((e) => e.confirmedTier === -1)).toHaveLength(2);
      expect(advanced.estimates.every((e) => e.confirmedTier === 2)).toBe(true);
      expect(advanced.recommendations.every((r) => r.level === 2)).toBe(true);
      expect(advanced.recommendations.some((r) => r.testedUnitIds.length > 0)).toBe(true);
      expect(replayPlacement(bank, seed, advanced.actions)).toEqual(advanced.state);
    },
  );
  it('erhöht/senkt Schwierigkeit unmittelbar innerhalb eines Bereichs; ungültige und zweite Antworten verändern nichts', () => {
    const initial = createPlacement(bank, 'adaptive'),
      task = currentPlacementTask(initial),
      item = task?.session.items[0];
    if (!task || !item) throw new Error('Aufgabe fehlt');
    expect(task.tier).toBe(1);
    expect(actPlacement(bank, initial, { type: 'next' })).toBe(initial);
    expect(actPlacement(bank, initial, { type: 'answer', answer: 'invalid' })).toBe(initial);
    const correct = actPlacement(bank, initial, { type: 'answer', answer: expectedAnswer(item) });
    expect(actPlacement(bank, correct, { type: 'answer', answer: expectedAnswer(item) })).toBe(
      correct,
    );
    expect(currentPlacementTask(actPlacement(bank, correct, { type: 'next' }))?.tier).toBe(2);
    const wrong = wrongAnswer(item);
    if (!wrong) throw new Error('Antwort fehlt');
    expect(
      currentPlacementTask(
        actPlacement(bank, actPlacement(bank, initial, { type: 'answer', answer: wrong }), {
          type: 'next',
        }),
      )?.tier,
    ).toBe(0);
  });
  it('mehr Hilfen erzeugen bis 25 Aufgaben, aber kein selbstständig nachgewiesenes Niveau', () => {
    const result = simulate('hints', () => true, true);
    expect(result.state.tasks).toHaveLength(25);
    expect(
      result.estimates.every((e) => e.confirmedTier === null && e.correct === 0 && e.assisted >= 3),
    ).toBe(true);
    expect(result.recommendations.every((r) => r.testedUnitIds.length === 0)).toBe(true);
  });
  it('Hör-Pause bleibt ohne Fehler und ohne Hörniveau; andere Bereiche können fortgeschritten sein', () => {
    const result = simulate('no-audio', () => true, false, true),
      hearing = result.estimates.find((e) => e.areaId === 'area.aural');
    expect(result.state.skipAural).toBe(true);
    expect(
      result.state.tasks
        .filter((task) => task.areaId === 'area.aural')
        .every((task) => task.tier === 1),
    ).toBe(true);
    expect(hearing).toMatchObject({
      answered: 0,
      correct: 0,
      independent: 0,
      skipped: 4,
      confirmedTier: null,
    });
    expect(
      result.estimates.filter((e) => e.skipped === 0).every((e) => e.confirmedTier === 2),
    ).toBe(true);
    expect(result.state.tasks.length).toBeLessThanOrEqual(25);
  });
  it('jederzeitiges vorzeitiges Ende behält Antworten und überspringt keine Einheiten', () => {
    let state: PlacementSession = createPlacement(bank, 'early');
    for (let n = 0; n < 4; n++) {
      const item = currentPlacementTask(state)?.session.items[0];
      if (!item) throw new Error('Aufgabe fehlt');
      state = actPlacement(
        bank,
        actPlacement(bank, state, { type: 'answer', answer: expectedAnswer(item) }),
        { type: 'next' },
      );
    }
    state = actPlacement(bank, state, { type: 'finish' });
    expect(state.ended).toBe('partial');
    expect(placementEstimates(bank, state).reduce((n, e) => n + e.answered, 0)).toBe(4);
    expect(
      placementRecommendations(catalogue, bank, placementEstimates(bank, state), false).every(
        (r) => r.level === null && r.testedUnitIds.length === 0,
      ),
    ).toBe(true);
  });
  it('öffentliche Builds bekommen weder Entwurfsfragen noch Empfehlungen oder Entwurfs-IDs', () => {
    const published = publicCatalogue(catalogue),
      publicBank = placementBank(published);
    expect(publicBank.areas).toEqual([]);
    expect(() => createPlacement(publicBank, 'public')).toThrow();
    expect(JSON.stringify(publicBank)).not.toContain('notation');
    expect(placementRecommendations(published, publicBank, [], true)).toEqual([]);
  });
  it('Sprachwechsel bewahrt, Parameterwechsel invalidiert einen begonnenen Test', () => {
    expect(
      placementBank({ ...catalogue, contentVersion: catalogue.contentVersion + 1 }).key,
    ).not.toBe(bank.key);
    expect(placementBank(catalogue).key).toBe(bank.key);
  });
  it('wiederholte identische Quellen erzeugen keine zusätzliche Einstufungsevidenz', () => {
    const spec = {
      type: 'NOTE_NAME' as const,
      params: {
        clefs: ['treble' as const],
        maxAccidentals: 0 as const,
        range: { minMidi: 60, maxMidi: 60 },
      },
    };
    const fixed = {
      key: 'fixed',
      areas: [
        {
          id: 'one',
          titleKey: 'content.test' as const,
          checkpoints: [0, 1, 2, 3].map((n) => ({
            id: String(n),
            lessonId: String(n),
            unitId: 'one',
            level: 1,
            specs: [spec],
          })),
        },
      ],
    };
    let state = createPlacement(fixed, 'fixed');
    while (!state.ended) {
      const item = currentPlacementTask(state)?.session.items[0];
      if (!item) throw new Error('Aufgabe fehlt');
      state = actPlacement(
        fixed,
        actPlacement(fixed, state, { type: 'answer', answer: expectedAnswer(item) }),
        { type: 'next' },
      );
    }
    expect(state.tasks).toHaveLength(15);
    expect(placementEstimates(fixed, state)[0]).toMatchObject({
      correct: 15,
      confirmedTier: null,
      uncertain: true,
    });
  });
  it('gute Theorie gleicht fehlende Notation nicht aus: Start und übersprungene Einheiten beachten den Graphen', () => {
    const result = simulate('uneven-profile', (task) => task.areaId !== 'area.notation');
    expect(placementFirstLesson(catalogue, result.recommendations)).toBe(
      'notation.l1.staff.anchor',
    );
    const intervals = result.recommendations.find((r) => r.areaId === 'area.intervals');
    expect(intervals?.prerequisiteUnitIds).toContain('notation.l1.staff');
    expect(intervals?.testedUnitIds).not.toContain('intervals.l1.size');
    expect(result.estimates.find((e) => e.areaId === 'area.notation')?.confirmedTier).toBe(-1);
    expect(result.estimates.find((e) => e.areaId === 'area.intervals')?.confirmedTier).toBe(2);
  });
});
