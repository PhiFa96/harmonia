import { create } from 'zustand';
import type { DeviceSnapshot, OnboardingData } from '../onboarding/model.ts';
import { completeOnboarding, newOnboarding } from '../onboarding/model.ts';
import { getDeviceRepository } from '../storage/device.ts';
import { useSettings } from './settings.ts';
import { getAuthClient, useAuthState, signOutDevice } from '../auth/index.ts';

interface DeviceState {
  readonly phase: 'loading' | 'ready' | 'error';
  readonly data: OnboardingData | null;
  readonly completed: boolean;
  readonly storage: 'saved' | 'saving' | 'error' | 'memory';
  readonly completing: boolean;
}
export const useDeviceState = create<DeviceState>()(() => ({
  phase: 'loading',
  data: null,
  completed: false,
  storage: 'saved',
  completing: false,
}));
let initialization: Promise<void> | undefined;
let queue: Promise<void> = Promise.resolve();
let revision = 0;
let subscribed = false;
let suppress = false;
function snapshot(data = useDeviceState.getState().data): DeviceSnapshot {
  if (!data) throw new Error('Onboarding nicht geladen');
  const {
    locale,
    appearance,
    reduceMotion,
    haptics,
    noteNaming,
    harmonySystem,
    sound,
    referenceHz,
  } = useSettings.getState();
  return {
    schemaVersion: 1,
    settings: {
      locale,
      appearance,
      reduceMotion,
      haptics,
      noteNaming,
      harmonySystem,
      sound,
      referenceHz,
    },
    onboarding: data,
  };
}
function save(value: DeviceSnapshot): Promise<void> {
  if (useDeviceState.getState().storage === 'memory') return Promise.resolve();
  const current = ++revision;
  useDeviceState.setState({ storage: 'saving' });
  const operation = queue
    .catch(() => undefined)
    .then(async () => {
      const repo = await getDeviceRepository();
      await repo.save(value);
    });
  queue = operation;
  void operation.then(
    () => {
      if (current === revision) useDeviceState.setState({ storage: 'saved' });
    },
    () => {
      if (current === revision) useDeviceState.setState({ storage: 'error' });
    },
  );
  return operation;
}
function subscribe() {
  if (subscribed) return;
  subscribed = true;
  const write = () => {
    if (!suppress && useDeviceState.getState().phase === 'ready')
      void save(snapshot()).catch(() => undefined);
  };
  useSettings.subscribe(write);
  useDeviceState.subscribe((next, previous) => {
    if (next.data !== previous.data) write();
  });
}
export function initializeDeviceState(): Promise<void> {
  initialization ??= (async () => {
    useDeviceState.setState({ phase: 'loading' });
    try {
      const repo = await getDeviceRepository();
      const stored = await repo.load();
      if (stored) useSettings.setState(stored.settings);
      const data = stored?.onboarding ?? newOnboarding(Date.now());
      useDeviceState.setState({
        phase: 'ready',
        data,
        completed: data.step === 'complete',
        storage: 'saved',
      });
      subscribe();
      if (!stored) void save(snapshot()).catch(() => undefined);
    } catch {
      useDeviceState.setState({ phase: 'error', storage: 'error' });
      initialization = undefined;
    }
  })();
  return initialization;
}
export function startTemporarySession() {
  useDeviceState.setState({
    phase: 'ready',
    data: newOnboarding(Date.now()),
    completed: false,
    storage: 'memory',
  });
  subscribe();
}
export function updateOnboarding(update: (data: OnboardingData) => OnboardingData) {
  const state = useDeviceState.getState();
  if (state.data && !state.completing) useDeviceState.setState({ data: update(state.data) });
}
export async function retryDeviceSave(): Promise<void> {
  await save(snapshot());
}
export function flushDeviceWrites() {
  return queue;
}
/** Navigation erst nach dem gespeicherten Abschluss freigeben; fehlgeschlagene Writes bleiben wiederholbar. */
export async function finishOnboarding(): Promise<void> {
  const state = useDeviceState.getState();
  if (!state.data || state.completing) return;
  const data = completeOnboarding(state.data, Date.now());
  useDeviceState.setState({ completing: true });
  try {
    if (data.account === 'email') {
      const client = getAuthClient();
      if (!client) throw new Error('Bestätigte Anmeldung fehlt');
      const { data: user, error } = await client.auth.getUser();
      if (error || user.user.id !== data.accountId) throw new Error('Bestätigte Anmeldung fehlt');
    } else if (useAuthState.getState().session) await signOutDevice();
    await save(snapshot(data));
    suppress = true;
    useDeviceState.setState({ data, completed: true });
    suppress = false;
  } finally {
    useDeviceState.setState({ completing: false });
  }
}
