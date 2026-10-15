import { create } from 'zustand';
import { randomUUID } from 'expo-crypto';
import {
  DEFAULT_CONSENTS,
  PRIVACY_VERSION,
  consentChoicesSchema,
  privacyReceiptSchema,
  PRIVACY_EXPORT_SECTIONS,
  privacyPolicySchema,
  ANALYTICS_CONSENT_VERSION,
} from '@harmonia/content';
import type { ConsentPurpose, ConsentEvent } from '@harmonia/content';
import { useAuthState, signOutDevice } from '@/auth';
import { configuredAuth } from '@/auth/config';
import { getPrivacyRepository } from './storage.ts';
import { eraseLocalAccount } from './local.ts';
import { downloadPrivateFile } from '@/privacy/download';
import { useDeviceState } from '@/state/device';
import { useSettings } from '@/state/settings';
export const privacyOwner = () => {
  const user = useAuthState.getState().session?.user;
  return user && !user.is_anonymous ? user.id : 'guest';
};
export const usePrivacy = create<{
  owner: string;
  choices: { analytics: boolean; push: boolean; marketing: boolean };
  phase: 'loading' | 'ready' | 'error';
  pending: boolean;
  busy: boolean;
  recentSignIn: boolean;
  analyticsConsentId: string | null;
  policy: ReturnType<typeof privacyPolicySchema.parse> | null;
  receipt: ReturnType<typeof privacyReceiptSchema.parse> | null;
}>(() => ({
  owner: 'guest',
  choices: { ...DEFAULT_CONSENTS },
  phase: 'loading',
  pending: false,
  busy: false,
  recentSignIn: false,
  analyticsConsentId: null,
  policy: null,
  receipt: null,
}));
let generation = 0,
  previous: string | undefined;
const unsavedConsents = new Map<string, ConsentEvent[]>();
async function request(view: string, method = 'GET', body?: unknown) {
  const config = configuredAuth(),
    owner = privacyOwner(),
    session = useAuthState.getState().session;
  if (!config) throw new Error('Privacy unavailable');
  const response = await fetch(config.url + '/functions/v1/privacy?' + view, {
    method,
    headers: {
      apikey: config.key,
      ...(owner !== 'guest' && session ? { Authorization: 'Bearer ' + session.access_token } : {}),
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  const data: unknown = await response.json();
  if (!response.ok) throw new Error(response.status === 403 ? 'reauth' : 'Privacy unavailable');
  if (owner !== privacyOwner()) throw new Error('Privacy identity');
  return data;
}
export async function initializePrivacy() {
  if (useDeviceState.getState().phase !== 'ready') return;
  const owner = privacyOwner(),
    token = ++generation;
  usePrivacy.setState({
    owner,
    choices: { ...DEFAULT_CONSENTS },
    phase: 'loading',
    pending: false,
    policy: null,
    analyticsConsentId: null,
  });
  try {
    const repo = await getPrivacyRepository(),
      choices = await repo.choices(owner),
      events = await repo.list(owner);
    for (const event of unsavedConsents.get(owner) ?? [])
      if (!event.granted) choices[event.purpose] = false;
    if (owner !== privacyOwner() || token !== generation) return;
    usePrivacy.setState({
      choices,
      phase: 'ready',
      pending: events.some((row) => !row.acked) && owner !== 'guest',
    });
    if (owner !== 'guest') await syncPrivacy();
  } catch {
    if (owner === privacyOwner() && token === generation) usePrivacy.setState({ phase: 'error' });
  }
}
let syncing: Promise<void> | undefined;
export function syncPrivacy() {
  if (syncing) return syncing;
  const owner = privacyOwner(),
    token = generation;
  if (owner === 'guest') return Promise.resolve();
  syncing = (async () => {
    const repo = await getPrivacyRepository();
    for (const event of unsavedConsents.get(owner) ?? []) await repo.save(owner, event);
    unsavedConsents.delete(owner);
    for (const row of await repo.list(owner)) {
      if (row.acked) continue;
      if (owner !== privacyOwner() || token !== generation) return;
      await request('view=consent', 'POST', row.event);
      if (owner !== privacyOwner() || token !== generation) return;
      await repo.acknowledge(owner, row.event.id);
    }
    const result = (await request('view=status')) as {
      choices: unknown;
      recentSignIn: boolean;
      policy: unknown;
      analyticsConsentId?: string | null;
    };
    if (owner === privacyOwner() && token === generation)
      usePrivacy.setState({
        choices: consentChoicesSchema.parse(result.choices),
        policy: privacyPolicySchema.parse(result.policy),
        analyticsConsentId: result.analyticsConsentId ?? null,
        pending: false,
        recentSignIn: result.recentSignIn,
        phase: 'ready',
      });
  })()
    .catch(() => {
      if (owner === privacyOwner()) usePrivacy.setState({ pending: true });
    })
    .finally(() => {
      syncing = undefined;
      if (privacyOwner() !== 'guest' && token !== generation) void syncPrivacy();
    });
  return syncing;
}
export async function setPrivacyConsent(purpose: ConsentPurpose, granted: boolean) {
  const owner = privacyOwner(),
    event: ConsentEvent = {
      id: randomUUID(),
      purpose,
      granted,
      version: purpose === 'analytics' ? ANALYTICS_CONSENT_VERSION : PRIVACY_VERSION,
      locale: useSettings.getState().locale ?? 'en-US',
    };
  generation++;
  if (!granted)
    usePrivacy.setState((state) => ({ choices: { ...state.choices, [purpose]: false } }));
  unsavedConsents.set(owner, [...(unsavedConsents.get(owner) ?? []), event]);
  try {
    await (await getPrivacyRepository()).save(owner, event);
    unsavedConsents.set(
      owner,
      (unsavedConsents.get(owner) ?? []).filter((entry) => entry.id !== event.id),
    );
  } catch (e) {
    if (owner === privacyOwner()) usePrivacy.setState({ pending: true });
    throw e;
  }
  if (owner !== privacyOwner()) return;
  usePrivacy.setState((state) => ({
    choices: { ...state.choices, [purpose]: granted },
    pending: owner !== 'guest',
  }));
  void syncPrivacy();
}
useAuthState.subscribe(() => {
  const owner = privacyOwner();
  if (owner !== previous) {
    previous = owner;
    generation++;
    usePrivacy.setState({
      owner,
      choices: { ...DEFAULT_CONSENTS },
      phase: 'loading',
      receipt: null,
      pending: false,
      policy: null,
      analyticsConsentId: null,
    });
    if (useDeviceState.getState().phase === 'ready') void initializePrivacy();
  }
});
export function analyticsAllowed() {
  const state = usePrivacy.getState();
  return (
    state.owner === privacyOwner() &&
    state.phase === 'ready' &&
    state.choices.analytics &&
    state.policy?.analyticsEnabled === true &&
    state.policy.legalPublished
  );
}
export async function exportPrivacyData() {
  if (useDeviceState.getState().phase !== 'ready') throw new Error('Privacy storage not ready');
  if (usePrivacy.getState().busy) return;
  const owner = privacyOwner();
  usePrivacy.setState({ busy: true });
  try {
    const sections: Record<string, unknown> = {},
      repo = await getPrivacyRepository();
    if (owner === 'guest') {
      sections['consents'] = await repo.list(owner);
      const { exportLocalData } = await import('./export-local.ts');
      sections['local'] = await exportLocalData(owner);
    } else {
      let bytes = 0;
      for (const section of PRIVACY_EXPORT_SECTIONS) {
        const rows: unknown[] = [];
        let after: string | null = null;
        for (let page = 0; page < 10000; page++) {
          const response = (await request(
            'view=export&section=' + section + (after ? '&after=' + encodeURIComponent(after) : ''),
          )) as { rows: unknown[]; next: string | null };
          if (!Array.isArray(response.rows) || (response.next === after && after !== null))
            throw new Error('Export page');
          rows.push(...response.rows);
          bytes += JSON.stringify(response.rows).length;
          if (bytes > 50 * 1024 * 1024) throw new Error('Export size');
          after = response.next;
          if (after === null) break;
          if (page === 9999) throw new Error('Export pages');
        }
        sections[section] = rows;
      }
      const { exportLocalData } = await import('./export-local.ts');
      sections['local'] = await exportLocalData(owner);
    }
    if (owner !== privacyOwner()) throw new Error('Privacy identity');
    await downloadPrivateFile(
      JSON.stringify(
        { format: 'harmonia-privacy-v1', createdAt: new Date().toISOString(), sections },
        null,
        2,
      ),
      'harmonia-data-' + owner + '-' + randomUUID() + '.json',
    );
  } finally {
    usePrivacy.setState({ busy: false });
  }
}
export async function deletePrivacyAccount() {
  if (useDeviceState.getState().phase !== 'ready') throw new Error('Privacy storage not ready');
  const owner = privacyOwner();
  if (owner === 'guest' || usePrivacy.getState().busy) throw new Error('Privacy identity');
  usePrivacy.setState({ busy: true });
  try {
    const repo = await getPrivacyRepository(true);
    let id = await repo.meta('delete:' + owner);
    if (!id) {
      id = randomUUID();
      await repo.putMeta('delete:' + owner, id);
    }
    let receipt;
    try {
      receipt = privacyReceiptSchema.parse(
        await request('view=account', 'DELETE', {
          id,
          confirm: true,
          subscriptionsAcknowledged: true,
        }),
      );
    } catch (e) {
      try {
        receipt = privacyReceiptSchema.parse(await request('view=receipt&id=' + id));
        if (receipt.state !== 'deleted') throw e;
      } catch {
        throw e;
      }
    }
    await eraseLocalAccount(owner);
    unsavedConsents.delete(owner);
    if (owner === privacyOwner()) {
      await signOutDevice();
      usePrivacy.setState({ receipt, choices: { ...DEFAULT_CONSENTS } });
    }
    await repo.clearDeleteMeta(owner);
    return receipt;
  } finally {
    usePrivacy.setState({ busy: false });
  }
}

/** An earlier explicit deletion may have finished on the server while the app closed. */
export async function recoverPrivacyDeletions() {
  const repo = await getPrivacyRepository(true);
  for (const saved of await repo.pendingDeletions()) {
    try {
      const receipt = privacyReceiptSchema.parse(
        await request('view=receipt&id=' + encodeURIComponent(saved.id)),
      );
      if (receipt.state !== 'deleted') continue;
      await eraseLocalAccount(saved.scope);
      unsavedConsents.delete(saved.scope);
      if (saved.scope === privacyOwner()) await signOutDevice();
      await repo.clearDeleteMeta(saved.scope);
      if (privacyOwner() === 'guest') usePrivacy.setState({ receipt });
    } catch {
      /* Keep the marker; retry after connectivity or storage recovery. */
    }
  }
}

export function privacyPushAllowed() {
  const state = usePrivacy.getState();
  return state.owner === privacyOwner() && state.phase === 'ready' && state.choices.push;
}
