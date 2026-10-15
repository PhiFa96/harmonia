import { create } from 'zustand';
import {
  DEFAULT_ACCOUNT_SETTINGS,
  accountSettingsSchema,
  accountSettingsPatchSchema,
} from '@harmonia/content';
import type { AccountSettings, StoredAccountSettings } from '@harmonia/content';
import { getAuthClient, useAuthState } from '../auth/index.ts';
import { profileTransport } from '../auth/profile-transport.ts';
import { useDeviceState, updateOnboarding, flushDeviceWrites } from './device.ts';
import { useSettings } from './settings.ts';
import { getProfileRepository } from '../storage/profile.ts';
import { assertPrivacyWrite } from '../privacy/guard.ts';
type Patch = Partial<AccountSettings>;
export const useProfile = create<{
  scope: string;
  phase: 'loading' | 'ready' | 'error';
  sync: 'local' | 'pending' | 'syncing' | 'saved' | 'error';
  data: StoredAccountSettings | null;
}>(() => ({ scope: 'guest', phase: 'loading', sync: 'local', data: null }));
const currentScope = () => useAuthState.getState().session?.user.id ?? 'guest';
let generation = 0,
  suppressed = false,
  subscribed = false,
  flight: Promise<void> | undefined;
let queue: Promise<void> = Promise.resolve();
let guestBaseline: AccountSettings | undefined;
function serialize<T>(work: () => Promise<T>): Promise<T> {
  const next = queue.catch(() => undefined).then(work);
  queue = next.then(() => undefined);
  return next;
}
function deviceSettings(): AccountSettings {
  const s = useSettings.getState(),
    d = useDeviceState.getState().data;
  return accountSettingsSchema.parse({
    locale: s.locale,
    appearance: s.appearance,
    haptics: s.haptics,
    reduceMotion: s.reduceMotion,
    noteNaming: s.noteNaming,
    harmonySystem: s.harmonySystem,
    sound: s.sound,
    referenceHz: s.referenceHz,
    goal: d?.goal ?? 'hobby',
    experience: d?.experience ?? 'new',
    displayName: null,
  });
}
/** Capture before an auth event changes the actor. */
export async function captureGuestProfile() {
  if (currentScope() !== 'guest') return;
  guestBaseline = deviceSettings();
  const data: StoredAccountSettings = { version: 1, settings: guestBaseline, dirty: {} };
  try {
    await serialize(() => persist('guest', data));
  } catch {
    /* In-memory baseline remains; the profile loader exposes storage errors. */
  }
}
function apply(settings: AccountSettings) {
  suppressed = true;
  try {
    const { goal, experience } = settings;
    useSettings.setState({
      locale: settings.locale,
      appearance: settings.appearance,
      haptics: settings.haptics,
      reduceMotion: settings.reduceMotion,
      noteNaming: settings.noteNaming,
      harmonySystem: settings.harmonySystem,
      sound: settings.sound,
      referenceHz: settings.referenceHz,
    });
    updateOnboarding((data) => ({ ...data, goal, experience }));
  } finally {
    suppressed = false;
  }
}
async function persist(scope: string, data: StoredAccountSettings) {
  assertPrivacyWrite(scope);
  if (useDeviceState.getState().storage !== 'memory')
    await (await getProfileRepository()).save(scope, data);
}
export async function changeProfile(input: Patch) {
  const patch = accountSettingsPatchSchema.parse(input),
    s = useProfile.getState();
  if (s.phase !== 'ready' || !s.data || s.scope !== currentScope())
    throw new Error('Profile is not ready');
  assertPrivacyWrite(s.scope);
  const data: StoredAccountSettings = {
    version: 1,
    settings: accountSettingsSchema.parse({ ...s.data.settings, ...patch }),
    dirty: { ...s.data.dirty, ...patch },
  };
  useProfile.setState({ data, sync: 'pending' });
  apply(data.settings);
  await serialize(() => persist(s.scope, data));
  if (s.scope === 'guest') {
    await flushDeviceWrites();
    if (currentScope() === s.scope && useProfile.getState().data === data)
      useProfile.setState({ sync: 'local' });
  }
  if (s.scope !== 'guest') void syncProfile();
}
function subscribe() {
  if (subscribed) return;
  subscribed = true;
  const changed = () => {
    const s = useProfile.getState();
    if (suppressed || s.phase !== 'ready' || !s.data || s.scope !== currentScope()) return;
    const next = deviceSettings(),
      patch: Patch = {};
    for (const field of Object.keys(next) as (keyof AccountSettings)[]) {
      if (field === 'displayName') continue;
      if (next[field] !== s.data.settings[field]) Object.assign(patch, { [field]: next[field] });
    }
    if (Object.keys(patch).length)
      void changeProfile(patch).catch(() => {
        if (s.scope === currentScope()) useProfile.setState({ sync: 'error' });
      });
  };
  useSettings.subscribe(changed);
  useDeviceState.subscribe((s, p) => {
    if (s.data !== p.data) changed();
  });
}
export async function initializeProfile() {
  const scope = currentScope(),
    previous = useProfile.getState();
  if (previous.scope === scope && previous.phase === 'ready') {
    void syncProfile();
    return;
  }
  const token = ++generation;
  const sourceAtStart = deviceSettings();
  const initial =
    previous.scope === 'guest' && !useDeviceState.getState().data?.accountId
      ? deviceSettings()
      : { ...DEFAULT_ACCOUNT_SETTINGS };
  useProfile.setState({
    scope,
    phase: 'loading',
    data: null,
    sync: scope === 'guest' ? 'local' : 'pending',
  });
  try {
    await serialize(async () => {
      const repo =
        useDeviceState.getState().storage === 'memory' ? null : await getProfileRepository();
      const cached = await repo?.load(scope),
        guest = scope === 'guest' ? null : await repo?.load('guest');
      if (token !== generation || scope !== currentScope()) return;
      const sourceNow = deviceSettings();
      const edits = Object.fromEntries(
        Object.entries(sourceNow).filter(
          ([field, value]) =>
            field !== 'displayName' && value !== Reflect.get(sourceAtStart, field),
        ),
      );
      const plainGuest =
        scope === 'guest' &&
        previous.scope === 'guest' &&
        !useDeviceState.getState().data?.accountId;
      const settings = accountSettingsSchema.parse({
        ...(plainGuest
          ? sourceNow
          : (cached?.settings ?? guest?.settings ?? guestBaseline ?? initial)),
        ...edits,
      });
      if (scope !== 'guest' && !guest && previous.scope === 'guest')
        await repo?.save('guest', { version: 1, settings: initial, dirty: {} });
      const data: StoredAccountSettings = {
        version: 1,
        settings,
        dirty: { ...(cached?.dirty ?? {}), ...edits },
      };
      useProfile.setState({ phase: 'ready', data });
      apply(settings);
      subscribe();
      await persist(scope, data);
    });
    await syncProfile();
  } catch {
    if (token === generation && scope === currentScope())
      useProfile.setState({ phase: 'error', sync: 'error' });
  }
}
function remoteSettings(value: unknown): { settings: AccountSettings; revision: number } {
  if (
    !value ||
    typeof value !== 'object' ||
    !('settings' in value) ||
    !('display_name' in value) ||
    !('settings_revision' in value) ||
    typeof value.settings_revision !== 'number' ||
    !Number.isSafeInteger(value.settings_revision)
  )
    throw new Error('Invalid remote profile');
  const settings = accountSettingsSchema.parse({
    ...DEFAULT_ACCOUNT_SETTINGS,
    ...(typeof value.settings === 'object' ? value.settings : {}),
    displayName: value.display_name,
  });
  return { settings, revision: value.settings_revision };
}
export function syncProfile(): Promise<void> {
  if (flight) return flight;
  const s = useProfile.getState(),
    client = getAuthClient(),
    scope = currentScope(),
    token = generation,
    session = useAuthState.getState().session;
  if (
    !client ||
    !session ||
    scope === 'guest' ||
    s.scope !== scope ||
    s.phase !== 'ready' ||
    !s.data
  )
    return Promise.resolve();
  const transport = profileTransport(scope, session.access_token);
  const initialData = s.data;
  flight = (async () => {
    useProfile.setState({ sync: 'syncing' });
    await queue.catch(() => undefined);
    const loaded = await transport.load();
    if (token !== generation || scope !== currentScope()) return;
    let remote = remoteSettings(loaded);
    const sent = { ...useProfile.getState().data?.dirty };
    if (remote.revision === 0)
      remote = remoteSettings(
        await transport.save(
          {
            ...(useProfile.getState().data?.settings ?? initialData.settings),
            displayName: remote.settings.displayName,
          },
          true,
        ),
      );
    if (token !== generation || scope !== currentScope()) return;
    if (Object.keys(sent).length) remote = remoteSettings(await transport.save(sent));
    if (token !== generation || scope !== currentScope()) return;
    assertPrivacyWrite(scope);
    const latest = useProfile.getState().data;
    if (!latest) return;
    const dirty = { ...latest.dirty };
    for (const field of Object.keys(sent) as (keyof AccountSettings)[])
      if (dirty[field] === sent[field]) Reflect.deleteProperty(dirty, field);
    const data: StoredAccountSettings = {
      version: 1,
      settings: accountSettingsSchema.parse({ ...remote.settings, ...dirty }),
      dirty,
    };
    useProfile.setState({ data, sync: Object.keys(dirty).length ? 'pending' : 'saved' });
    apply(data.settings);
    await serialize(() => persist(scope, data));
  })()
    .catch(() => {
      if (token === generation && scope === currentScope()) useProfile.setState({ sync: 'error' });
    })
    .finally(() => {
      flight = undefined;
      if (token !== generation) void syncProfile();
    });
  return flight;
}
export async function eraseProfileScope(scope: string) {
  if (useProfile.getState().scope === scope) {
    generation++;
    useProfile.setState({ data: null, phase: 'loading' });
  }
  await serialize(async () => {
    await (await getProfileRepository()).erase(scope);
  });
}
