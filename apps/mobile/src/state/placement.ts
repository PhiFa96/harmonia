import { create } from 'zustand';
import { randomUUID } from 'expo-crypto';
import { actPlacement, currentPlacementTask } from '@harmonia/exercises';
import type { PlacementAction } from '@harmonia/exercises';
import { placementBank } from '@harmonia/content';
import { catalogue } from '@harmonia/content/catalogue';
import { EMPTY_PLACEMENT, restorePlacement } from '../placement/model.ts';
import type { PlacementData } from '../placement/model.ts';
import { getDeviceRepository } from '../storage/device.ts';
import { useDeviceState } from './device.ts';

export const bank = placementBank(catalogue);
interface PlacementStore {
  readonly phase: 'loading' | 'ready' | 'error';
  readonly data: PlacementData;
  readonly storage: 'saved' | 'saving' | 'error' | 'memory';
}
export const usePlacementState = create<PlacementStore>()(() => ({
  phase: 'loading',
  data: EMPTY_PLACEMENT,
  storage: 'saved',
}));
let initialization: Promise<void> | undefined;
let queue: Promise<void> = Promise.resolve();
let revision = 0;
let persist = async (data: PlacementData) => {
  await (await getDeviceRepository()).savePlacement(data);
};
/** P2.11 bindet den lokalen Test an das gewählte Konto; laufende Writes behalten ihr altes Ziel. */
export function configurePlacementStorage(
  data: PlacementData,
  saveData: (data: PlacementData) => Promise<void>,
  temporary = false,
) {
  revision++;
  persist = saveData;
  usePlacementState.setState({ phase: 'ready', data, storage: temporary ? 'memory' : 'saved' });
}
export function flushPlacementWrites() {
  return queue;
}
function memory() {
  return (
    useDeviceState.getState().storage === 'memory' ||
    usePlacementState.getState().storage === 'memory'
  );
}
function save(data: PlacementData): Promise<void> {
  if (memory()) {
    usePlacementState.setState({ storage: 'memory' });
    return Promise.resolve();
  }
  const current = ++revision;
  const target = persist;
  usePlacementState.setState({ storage: 'saving' });
  const operation = queue
    .catch(() => undefined)
    .then(async () => {
      await target(data);
    });
  queue = operation;
  void operation.then(
    () => {
      if (current === revision) usePlacementState.setState({ storage: 'saved' });
    },
    () => {
      if (current === revision) usePlacementState.setState({ storage: 'error' });
    },
  );
  return operation;
}
function update(data: PlacementData) {
  usePlacementState.setState({ data });
  void save(data).catch(() => undefined);
}
export function initializePlacement(): Promise<void> {
  if (usePlacementState.getState().phase === 'ready') return Promise.resolve();
  initialization ??= (async () => {
    if (memory()) {
      usePlacementState.setState({ phase: 'ready', data: EMPTY_PLACEMENT, storage: 'memory' });
      return;
    }
    try {
      const stored = await (await getDeviceRepository()).loadPlacement();
      usePlacementState.setState({
        phase: 'ready',
        data: stored ?? EMPTY_PLACEMENT,
        storage: 'saved',
      });
    } catch {
      initialization = undefined;
      usePlacementState.setState({ phase: 'error', storage: 'error' });
    }
  })();
  return initialization;
}
export function startPlacement(now = Date.now(), seed = `${String(now)}:${String(Math.random())}`) {
  if (usePlacementState.getState().phase !== 'ready' || !bank.areas.length) return;
  const active = {
    id: randomUUID(),
    bankKey: bank.key,
    seed,
    startedAt: now,
    endedAt: null,
    actions: [],
    answer: null,
  };
  restorePlacement(bank, active);
  update({ ...usePlacementState.getState().data, active });
}
export function selectPlacement(answer: string | null) {
  const data = usePlacementState.getState().data;
  if (data.active && !currentPlacementTask(restorePlacement(bank, data.active))?.session.result)
    update({ ...data, active: { ...data.active, answer } });
}
export function dispatchPlacement(action: PlacementAction, now = Date.now()) {
  const { data } = usePlacementState.getState();
  if (!data.active) return;
  const state = restorePlacement(bank, data.active),
    next = actPlacement(bank, state, action);
  if (next === state) return;
  const snapshot = {
    ...data.active,
    actions: [...data.active.actions, action],
    answer:
      action.type === 'answer' ? action.answer : action.type === 'hint' ? data.active.answer : null,
    endedAt: next.ended ? Math.max(now, data.active.startedAt) : null,
  };
  update(next.ended ? { ...data, active: null, last: snapshot } : { ...data, active: snapshot });
}
export function discardPlacement() {
  update({ ...usePlacementState.getState().data, active: null });
}
export function retryPlacementSave(): Promise<void> {
  const state = usePlacementState.getState();
  if (state.phase !== 'ready') return Promise.reject(new Error('Einstufung noch nicht geladen'));
  return save(state.data);
}
/** Expliziter Ausweg bei defektem Storage, ohne gespeicherte Tests zu überschreiben. */
export function startTemporaryPlacement() {
  usePlacementState.setState({ phase: 'ready', data: EMPTY_PLACEMENT, storage: 'memory' });
}
