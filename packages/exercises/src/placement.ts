import { createRng } from '@harmonia/theory';
import { generateExercise } from './generate.ts';
import { itemVariantKey } from './lesson.ts';
import { isAuralExercise } from './chords.ts';
import { answerSession, createSession, revealHint } from './session.ts';
import type { ExerciseSession } from './session.ts';
import type { ExerciseSpec } from './types.ts';

export interface PlacementCheckpoint {
  readonly id: string;
  readonly unitId: string;
  readonly lessonId: string;
  readonly level: number;
  readonly specs: readonly ExerciseSpec[];
}
export interface PlacementArea {
  readonly id: string;
  readonly titleKey: `content.${string}`;
  /** Vier geordnete Stichproben aus dem verfügbaren Stufe-1/2-Stoff. */
  readonly checkpoints: readonly PlacementCheckpoint[];
}
export interface PlacementBank {
  readonly key: string;
  readonly areas: readonly PlacementArea[];
}
export interface PlacementTask {
  readonly areaId: string;
  readonly tier: number;
  readonly checkpoint: PlacementCheckpoint;
  readonly session: ExerciseSession;
}
export type PlacementAction =
  | { readonly type: 'answer'; readonly answer: string }
  | { readonly type: 'hint' | 'next' | 'skip' | 'finish' };
export interface PlacementSession {
  readonly seed: string;
  readonly tasks: readonly PlacementTask[];
  readonly index: number;
  readonly skipAural: boolean;
  readonly ended: null | 'complete' | 'partial';
}
export interface PlacementEstimate {
  readonly areaId: string;
  /** -1 = Grundlagen noch nicht nachgewiesen; null = keine ausreichende unabhängige Evidenz. */
  readonly confirmedTier: number | null;
  readonly answered: number;
  readonly independent: number;
  readonly correct: number;
  readonly assisted: number;
  readonly skipped: number;
  readonly uncertain: boolean;
}
export const PLACEMENT_MIN = 15;
export const PLACEMENT_MAX = 25;

export function placementEstimates(
  bank: PlacementBank,
  state: PlacementSession,
): PlacementEstimate[] {
  return bank.areas.map((area) => {
    const tasks = state.tasks.filter((task) => task.areaId === area.id);
    const answered = tasks.filter((task) => task.session.result);
    const independent = answered.filter((task) => task.session.hintLevel === 0);
    const seen = new Set<string>();
    const evidence = independent.filter((task) => {
      const item = task.session.items[0];
      if (!item) return false;
      const key = itemVariantKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const wins = evidence.filter((task) => task.session.result?.correct);
    const losses = evidence.filter((task) => !task.session.result?.correct);
    let confirmedTier: number | null = null;
    for (let tier = 0; tier < 4; tier++)
      if (
        wins.filter((task) => task.tier >= tier).length >= 2 &&
        !losses.some((task) => task.tier <= tier)
      )
        confirmedTier = tier;
    if (confirmedTier === null && losses.filter((task) => task.tier === 0).length >= 2)
      confirmedTier = -1;
    const inconsistent = losses.some((loss) => wins.some((win) => win.tier > loss.tier));
    return {
      areaId: area.id,
      confirmedTier,
      answered: answered.length,
      independent: independent.length,
      correct: independent.filter((task) => task.session.result?.correct).length,
      assisted: answered.length - independent.length,
      skipped: tasks.filter((task) => task.session.skipped.length > 0).length,
      uncertain: confirmedTier === null || inconsistent,
    };
  });
}

export function currentPlacementTask(state: PlacementSession): PlacementTask | undefined {
  return state.ended ? undefined : state.tasks[state.index];
}
function appendTask(bank: PlacementBank, state: PlacementSession): PlacementSession {
  const counts = new Map(
    bank.areas.map((area) => [area.id, state.tasks.filter((t) => t.areaId === area.id).length]),
  );
  const estimates = placementEstimates(bank, state);
  const area =
    bank.areas.find((a) => (counts.get(a.id) ?? 0) < 3) ??
    (state.tasks.length < PLACEMENT_MIN
      ? [...bank.areas].sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0))[0]
      : bank.areas.find(
          (a) => estimates.find((e) => e.areaId === a.id)?.uncertain && (counts.get(a.id) ?? 0) < 4,
        ));
  if (!area || state.tasks.length >= PLACEMENT_MAX) return { ...state, ended: 'complete' };
  const previous = state.tasks.filter((task) => task.areaId === area.id).at(-1);
  const tier = previous
    ? Math.max(
        0,
        Math.min(
          3,
          previous.tier +
            (previous.session.skipped.length > 0
              ? 0
              : previous.session.result?.correct && previous.session.hintLevel === 0
                ? 1
                : -1),
        ),
      )
    : 1;
  const checkpoint = area.checkpoints[tier];
  if (!checkpoint?.specs.length) throw new Error('Einstufungs-Stichprobe fehlt');
  const rng = createRng(`${state.seed}:${String(state.tasks.length)}:${area.id}`);
  const spec = rng.pick(checkpoint.specs);
  let item = generateExercise(spec, rng);
  // Eine Kontrollfrage muss eine andere tatsächliche Quelle verwenden, sofern der Typ Varianten hat.
  const prior = state.tasks.map((task) => task.session.items[0]).filter((i) => i !== undefined);
  for (
    let attempt = 0;
    attempt < 64 && prior.some((p) => itemVariantKey(p) === itemVariantKey(item));
    attempt++
  )
    item = generateExercise(spec, rng);
  let session = createSession([item]);
  if (state.skipAural && isAuralExercise(item))
    session = { ...session, index: 1, skipped: [0], skipAural: true };
  const next: PlacementSession = {
    ...state,
    index: state.tasks.length,
    tasks: [...state.tasks, { areaId: area.id, tier, checkpoint, session }],
  };
  return session.skipped.length ? appendTask(bank, next) : next;
}
export function createPlacement(bank: PlacementBank, seed: string): PlacementSession {
  if (
    !bank.areas.length ||
    bank.areas.length > 8 ||
    bank.areas.some((a) => a.checkpoints.length !== 4)
  )
    throw new Error('Kein vollständiger Einstufungskatalog verfügbar');
  return appendTask(bank, { seed, tasks: [], index: 0, skipAural: false, ended: null });
}
export function actPlacement(
  bank: PlacementBank,
  state: PlacementSession,
  action: PlacementAction,
): PlacementSession {
  const current = currentPlacementTask(state);
  if (!current) return state;
  if (action.type === 'finish') return { ...state, ended: 'partial' };
  if (action.type === 'next') return current.session.result ? appendTask(bank, state) : state;
  const item = current.session.items[0];
  if (action.type === 'skip') {
    if (!item || !isAuralExercise(item) || current.session.result) return state;
    const tasks = [...state.tasks];
    tasks[state.index] = {
      ...current,
      session: { ...current.session, index: 1, skipped: [0], skipAural: true },
    };
    return appendTask(bank, { ...state, tasks, skipAural: true });
  }
  const session =
    action.type === 'answer'
      ? answerSession(current.session, action.answer)
      : revealHint(current.session);
  if (session === current.session) return state;
  const tasks = [...state.tasks];
  tasks[state.index] = { ...current, session };
  return { ...state, tasks };
}
/** Replay statt gespeicherter Richtig-/Rating-Flags: die Engine wertet dieselben Quellaufgaben erneut aus. */
export function replayPlacement(
  bank: PlacementBank,
  seed: string,
  actions: readonly PlacementAction[],
): PlacementSession {
  let state = createPlacement(bank, seed);
  for (const action of actions) {
    const next = actPlacement(bank, state, action);
    if (next === state) throw new Error('Widersprüchlicher Einstufungsverlauf');
    state = next;
  }
  return state;
}
