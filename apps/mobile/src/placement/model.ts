import type { PlacementAction, PlacementBank, PlacementSession } from '@harmonia/exercises';
import { replayPlacement, actPlacement } from '@harmonia/exercises';

export interface PlacementSnapshot {
  readonly bankKey: string;
  readonly seed: string;
  readonly startedAt: number;
  readonly endedAt: number | null;
  readonly actions: readonly PlacementAction[];
  readonly answer: string | null;
}
export interface PlacementData {
  readonly schemaVersion: 1;
  readonly active: PlacementSnapshot | null;
  readonly last: PlacementSnapshot | null;
}
export const EMPTY_PLACEMENT: PlacementData = { schemaVersion: 1, active: null, last: null };
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Ungültiger Einstufungsdatensatz');
  return value as Record<string, unknown>;
}
function time(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    throw new Error('Ungültiger Einstufungszeitpunkt');
  return value;
}
function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > max)
    throw new Error('Ungültige Einstufungseingabe');
  return value;
}
function parseSnapshot(value: unknown): PlacementSnapshot | null {
  if (value === null) return null;
  const v = object(value),
    startedAt = time(v['startedAt']),
    endedAt = v['endedAt'] === null ? null : time(v['endedAt']);
  if (endedAt !== null && endedAt < startedAt)
    throw new Error('Widersprüchliche Einstufungszeitpunkte');
  if (!Array.isArray(v['actions']) || v['actions'].length > 150)
    throw new Error('Ungültiger Einstufungsverlauf');
  const actions = v['actions'].map((input: unknown): PlacementAction => {
    const action = object(input);
    if (action['type'] === 'answer')
      return { type: 'answer', answer: text(action['answer'], 4096) };
    if (
      action['type'] === 'hint' ||
      action['type'] === 'next' ||
      action['type'] === 'skip' ||
      action['type'] === 'finish'
    )
      return { type: action['type'] };
    throw new Error('Unbekannte Einstufungsaktion');
  });
  return {
    bankKey: text(v['bankKey'], 64),
    seed: text(v['seed'], 128),
    startedAt,
    endedAt,
    actions,
    answer: v['answer'] === null ? null : text(v['answer'], 4096),
  };
}
export function parsePlacementData(json: string): PlacementData {
  const root = object(JSON.parse(json) as unknown);
  if (root['schemaVersion'] !== 1) throw new Error('Unbekannte Einstufungsversion');
  const active = parseSnapshot(root['active']),
    last = parseSnapshot(root['last']);
  if (active?.endedAt != null || last?.endedAt === null)
    throw new Error('Ungültiger Einstufungsabschluss');
  return { schemaVersion: 1, active, last };
}
export function restorePlacement(bank: PlacementBank, snapshot: PlacementSnapshot) {
  if (snapshot.bankKey !== bank.key) throw new Error('Einstufungskatalog hat sich geändert');
  const state = replayPlacement(bank, snapshot.seed, snapshot.actions);
  if ((state.ended !== null) !== (snapshot.endedAt !== null))
    throw new Error('Unvollständiger Einstufungsabschluss');
  return state;
}
export interface PlacementReplay {
  readonly snapshot: PlacementSnapshot;
  readonly state: PlacementSession;
}
/** Neue Aktionen inkrementell anwenden: Eingaben/Hinweise dürfen die laufende Audioquelle nicht austauschen. */
export function resumePlacement(
  bank: PlacementBank,
  snapshot: PlacementSnapshot,
  previous?: PlacementReplay,
): PlacementReplay {
  if (snapshot.bankKey !== bank.key) throw new Error('Einstufungskatalog hat sich geändert');
  if (
    previous?.snapshot.bankKey !== snapshot.bankKey ||
    previous.snapshot.seed !== snapshot.seed ||
    previous.snapshot.actions.length > snapshot.actions.length ||
    !previous.snapshot.actions.every((action, i) => snapshot.actions[i] === action)
  )
    return { snapshot, state: restorePlacement(bank, snapshot) };
  let state = previous.state;
  for (const action of snapshot.actions.slice(previous.snapshot.actions.length)) {
    const next = actPlacement(bank, state, action);
    if (next === state) throw new Error('Widersprüchlicher Einstufungsverlauf');
    state = next;
  }
  if ((state.ended !== null) !== (snapshot.endedAt !== null))
    throw new Error('Unvollständiger Einstufungsabschluss');
  return { snapshot, state };
}
