import { getLocales } from 'expo-localization';
import { resolveLocale } from '@harmonia/i18n';
import { create } from 'zustand';
import { randomUUID } from 'expo-crypto';
import { catalogue } from '@harmonia/content/catalogue';
import {
  DEFAULT_REWARD_RULE,
  motivationLocalSchema,
  motivationResponseSchema,
  motivationRejectionSchema,
  motivationPreferencesSchema,
  rewardRuleSchema,
  rewardRuleAt,
  motivationSummary,
  lessonReward,
  validateLearningEvent,
  lessonDay,
} from '@harmonia/content';
import type {
  MotivationLocal,
  MotivationDevice,
  MotivationPreferences,
  MotivationActivity,
} from '@harmonia/content';
import { getMotivationRepository } from '../storage/motivation.ts';
import { useAuthState, getAuthClient } from '../auth/index.ts';
import { useDeviceState } from './device.ts';
import { useSettings } from './settings.ts';
import { useLearningState, syncLearning } from './learning.ts';

export const motivationOwner = () => useAuthState.getState().session?.user.id ?? 'guest';
export function deviceTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
export const useMotivation = create<{
  phase: 'loading' | 'ready' | 'error';
  scope: string;
  data: MotivationLocal | null;
  device: MotivationDevice | null;
  memory: boolean;
  sync: 'idle' | 'syncing' | 'error';
  pushToken: string | null;
  permission: 'unknown' | 'granted' | 'denied' | 'unsupported';
  notificationError: boolean;
  writeError: boolean;
  retirePending: boolean;
}>()(() => ({
  phase: 'loading',
  scope: 'guest',
  data: null,
  device: null,
  memory: false,
  sync: 'idle',
  pushToken: null,
  permission: 'unknown',
  notificationError: false,
  writeError: false,
  retirePending: false,
}));
const memoryRows = new Map<string, MotivationLocal>();
let generation = 0,
  queue: Promise<unknown> = Promise.resolve(),
  syncing: Promise<void> | undefined,
  again = false;
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const work = queue.catch(() => undefined).then(fn);
  queue = work;
  return work;
}
function initial(first: boolean): MotivationLocal {
  const d = useDeviceState.getState().data,
    locale = useSettings.getState().locale ?? resolveLocale(getLocales());
  return {
    preferences: {
      dailyGoal: first ? (d?.dailyGoal ?? 20) : 20,
      reminderConsent: first ? (d?.reminderConsent ?? false) : false,
      reminderTime: first ? (d?.reminderTime ?? '18:00') : '18:00',
      locale,
      timeZone: deviceTimeZone(),
    },
    dirty: true,
    practicedAt: 0,
    rules: [DEFAULT_REWARD_RULE],
    purchases: [],
    server: null,
    serverEvidenceKey: null,
    preferencesEstablished: false,
  };
}
async function persist(owner: string, data: MotivationLocal, memory: boolean, token = generation) {
  const parsed = motivationLocalSchema.parse(data);
  try {
    if (memory) memoryRows.set(owner, parsed);
    else await (await getMotivationRepository()).save(owner, parsed);
    if (owner === motivationOwner() && token === generation)
      useMotivation.setState({ data: parsed, writeError: false });
  } catch (error) {
    if (owner === motivationOwner() && token === generation)
      useMotivation.setState({ writeError: true });
    throw error;
  }
}
export async function initializeMotivation() {
  const token = ++generation,
    owner = motivationOwner(),
    memory = useDeviceState.getState().storage === 'memory';
  useMotivation.setState({
    phase: 'loading',
    scope: owner,
    data: null,
    memory,
    sync: 'idle',
    pushToken: null,
    writeError: false,
  });
  try {
    await serialize(async () => {
      if (token !== generation || owner !== motivationOwner()) return;
      let data: MotivationLocal, device: MotivationDevice;
      if (memory) {
        data = memoryRows.get(owner) ?? initial(false);
        device = { id: randomUUID(), key: randomUUID(), revision: 0 };
      } else {
        const repo = await getMotivationRepository();
        device = await repo.device(() => ({ id: randomUUID(), key: randomUUID(), revision: 0 }));
        await repo.claimGuest(owner);
        data = (await repo.read(owner)) ?? initial(owner === 'guest' && device.revision === 1);
        await repo.save(owner, data);
      }
      if (token !== generation || owner !== motivationOwner()) return;
      useMotivation.setState({ phase: 'ready', data, device, retirePending: true });
    });
    void syncMotivation();
  } catch {
    if (token === generation && owner === motivationOwner())
      useMotivation.setState({ phase: 'error' });
  }
}
export async function changeMotivationPreferences(update: Partial<MotivationPreferences>) {
  const owner = motivationOwner();
  await serialize(async () => {
    const s = useMotivation.getState();
    if (s.phase !== 'ready' || s.scope !== owner || !s.data)
      throw new Error('Motivation nicht geladen');
    const preferences = motivationPreferencesSchema.parse({ ...s.data.preferences, ...update });
    await persist(
      owner,
      {
        ...s.data,
        preferences,
        dirty: true,
        preferencesEstablished: Object.keys(update).length > 0 || s.data.preferencesEstablished,
      },
      s.memory,
    );
  });
  void syncMotivation();
}
export async function recordPractice(at = Date.now()) {
  const owner = motivationOwner();
  await serialize(async () => {
    const s = useMotivation.getState();
    if (s.phase !== 'ready' || s.scope !== owner || !s.data) return;
    await persist(owner, { ...s.data, practicedAt: Math.max(s.data.practicedAt, at) }, s.memory);
  });
  void syncMotivation();
}
export function motivationActivities(): MotivationActivity[] {
  const rows =
      useLearningState.getState().scope === motivationOwner()
        ? useLearningState.getState().rows
        : [],
    rules = useMotivation.getState().data?.rules ?? [DEFAULT_REWARD_RULE],
    seen = new Set<string>();
  return [...rows]
    .sort(
      (a, b) =>
        (a.sequence ?? Number.MAX_SAFE_INTEGER) - (b.sequence ?? Number.MAX_SAFE_INTEGER) ||
        a.position - b.position,
    )
    .flatMap((row) => {
      const e = row.event;
      if (e.kind !== 'lesson' || !e.timeZone) return [];
      try {
        const key = `${e.lessonId}:${String(e.contentVersion)}`,
          repeat = seen.has(key),
          rule = rewardRuleAt(rules, e.finishedAt),
          proof = row.reward ? null : validateLearningEvent(catalogue, e),
          qualified = row.reward
            ? (row.reward.qualified ?? row.reward.amount > 0)
            : (proof?.lesson?.passed ?? false);
        if (qualified) seen.add(key);
        const amount =
          row.reward?.amount ??
          (proof && 'session' in proof ? lessonReward(proof.session, repeat, rule) : 0);
        return [
          {
            id: e.id,
            at: e.finishedAt,
            timeZone: e.timeZone,
            amount,
            qualified,
            coins:
              row.reward?.coins ?? (qualified ? (repeat ? rule.repeatCoins : rule.newCoins) : 0),
          },
        ];
      } catch {
        return [];
      }
    });
}
export function currentMotivation(now = Date.now(), extra?: MotivationActivity) {
  const state = useMotivation.getState(),
    owner = motivationOwner(),
    data = state.scope === owner ? state.data : null,
    prefs = data?.preferences ?? initial(false).preferences;
  const activities = motivationActivities();
  if (extra && !activities.some((a) => a.id === extra.id)) activities.push(extra);
  const pending =
    useLearningState.getState().rows.some((r) => r.pending) ||
    data?.purchases.some((p) => !p.acked && !p.rejected);
  const server = data?.server?.summary;
  const confirmed =
    !extra &&
    !pending &&
    server?.today === lessonDay(now, prefs.timeZone) &&
    server.timeZone === prefs.timeZone &&
    data?.serverEvidenceKey === evidenceKey() &&
    !(lessonDay(data.practicedAt, prefs.timeZone) === server.today && !server.practiced);
  return {
    summary: confirmed
      ? server
      : motivationSummary(
          activities,
          now,
          prefs.timeZone,
          data?.practicedAt ?? 0,
          data?.purchases.filter((p) => !p.rejected).map((p) => p.purchase) ?? [],
        ),
    preferences: prefs,
    rule: rewardRuleAt(data?.rules ?? [DEFAULT_REWARD_RULE], now),
    estimated: !confirmed,
  };
}
function evidenceKey() {
  const learning = useLearningState.getState();
  return JSON.stringify(
    learning.scope === motivationOwner()
      ? learning.rows.map((r) => [r.event.id, r.sequence, r.pending, r.reward])
      : [],
  );
}
export async function buyFreeze() {
  const owner = motivationOwner();
  await serialize(async () => {
    const s = useMotivation.getState();
    if (s.phase !== 'ready' || s.scope !== owner || !s.data)
      throw new Error('Motivation nicht geladen');
    const view = currentMotivation();
    if (view.summary.coins < view.rule.freezePrice || view.summary.streak.freezesAvailable >= 2)
      throw new Error('Schutz nicht kaufbar');
    const purchase = {
      id: randomUUID(),
      at: Date.now(),
      price: view.rule.freezePrice,
      ruleVersion: view.rule.version,
      timeZone: view.preferences.timeZone,
    };
    await persist(
      owner,
      { ...s.data, purchases: [...s.data.purchases, { purchase, acked: false }] },
      s.memory,
    );
  });
  void syncMotivation();
}
export function syncMotivation(): Promise<void> {
  if (syncing) {
    again = true;
    return syncing;
  }
  const state = useMotivation.getState(),
    owner = motivationOwner(),
    session = useAuthState.getState().session,
    client = getAuthClient(),
    token = generation;
  if (
    state.phase !== 'ready' ||
    state.scope !== owner ||
    state.memory ||
    !state.data ||
    !state.device ||
    !client
  )
    return Promise.resolve();
  const device = state.device,
    data = state.data;
  again = false;
  useMotivation.setState({ sync: 'syncing' });
  syncing = (async () => {
    if (state.retirePending) {
      const retired = await client.functions.invoke('motivation', {
        method: 'DELETE',
        body: { deviceId: device.id, deviceKey: device.key, deviceRevision: device.revision },
        timeout: 15000,
      });
      if (retired.error) throw new Error('Gerät nicht abgemeldet');
      if (token === generation && owner === motivationOwner())
        useMotivation.setState({ retirePending: false });
    }
    if (owner === 'guest' || !session) {
      const rules = await client
        .from('reward_rules')
        .select('rule')
        .order('effective_at')
        .overrideTypes<{ rule: unknown }[], { merge: false }>();
      if (rules.error) throw new Error('Regeln nicht geladen');
      const parsed = rewardRuleSchema
        .array()
        .min(1)
        .max(1000)
        .parse(rules.data.map((r) => r.rule));
      if (token === generation && owner === motivationOwner())
        await serialize(() =>
          persist(
            owner,
            { ...(useMotivation.getState().data ?? data), rules: parsed },
            state.memory,
            token,
          ),
        );
      return;
    }
    if (
      useLearningState.getState().phase !== 'ready' ||
      useLearningState.getState().scope !== owner
    )
      throw new Error('Lernnachweise nicht geladen');
    await syncLearning();
    if (token !== generation || owner !== motivationOwner()) return;
    if (
      useLearningState.getState().phase !== 'ready' ||
      useLearningState.getState().scope !== owner
    )
      throw new Error('Lernnachweise nicht geladen');
    // Käufe werden erst nach den zugrunde liegenden Lernnachweisen übertragen.
    if (useLearningState.getState().rows.some((r) => r.pending))
      throw new Error('Lernnachweise warten');
    const confirmedEvidence = evidenceKey();
    const reminderPlan = await (await getMotivationRepository()).reminderPlan();
    const pending = data.purchases
      .filter((p) => !p.acked && !p.rejected)
      .slice(0, 20)
      .map((p) => p.purchase);
    const result = await client.functions.invoke('motivation', {
      body: {
        deviceId: device.id,
        deviceKey: device.key,
        deviceRevision: device.revision,
        ...(data.dirty ? { preferences: data.preferences } : {}),
        initializePreferences: !data.preferencesEstablished,
        practicedAt: data.practicedAt,
        remindedAt: reminderPlan.lastRemindedAt,
        purchases: pending,
        pushToken: state.pushToken,
      },
      headers: { Authorization: `Bearer ${session.access_token}` },
      timeout: 15000,
    });
    if (result.error) {
      const error: unknown = result.error;
      if (
        error &&
        typeof error === 'object' &&
        'context' in error &&
        error.context instanceof Response &&
        error.context.status === 422
      ) {
        const rejection = motivationRejectionSchema.safeParse(
          (await error.context.json()) as unknown,
        );
        if (
          rejection.success &&
          pending.some((p) => p.id === rejection.data.id) &&
          rejection.data.accepted.every((id) => pending.some((p) => p.id === id))
        ) {
          await serialize(async () => {
            const latest =
              owner === motivationOwner()
                ? useMotivation.getState().data
                : await (await getMotivationRepository()).read(owner);
            if (!latest) return;
            await persist(
              owner,
              {
                ...latest,
                server: null,
                purchases: latest.purchases.map((p) =>
                  p.purchase.id === rejection.data.id
                    ? { ...p, rejected: true }
                    : rejection.data.accepted.includes(p.purchase.id)
                      ? { ...p, acked: true }
                      : p,
                ),
              },
              state.memory,
              token,
            );
          });
        }
      }
      throw new Error('Motivation nicht synchronisiert');
    }
    const response = motivationResponseSchema.parse(result.data);
    if (
      response.accepted.length !== pending.length ||
      new Set(response.accepted).size !== response.accepted.length ||
      response.accepted.some((id) => !pending.some((p) => p.id === id)) ||
      pending.some(
        (p) => !response.purchases.some((saved) => JSON.stringify(saved) === JSON.stringify(p)),
      )
    )
      throw new Error('Fremde Kaufbestätigung');
    await serialize(async () => {
      const latest =
        owner === motivationOwner()
          ? useMotivation.getState().data
          : await (await getMotivationRepository()).read(owner);
      if (!latest) return;
      const purchases = latest.purchases.map((p) => ({ ...p }));
      for (const purchase of response.purchases) {
        const old = purchases.find((p) => p.purchase.id === purchase.id);
        if (old) {
          if (JSON.stringify(old.purchase) !== JSON.stringify(purchase))
            throw new Error('Kauf verändert');
          old.acked = true;
        } else purchases.push({ purchase, acked: true });
      }
      await persist(
        owner,
        {
          ...latest,
          purchases,
          preferences:
            JSON.stringify(latest.preferences) === JSON.stringify(data.preferences)
              ? response.preferences
              : latest.preferences,
          dirty: JSON.stringify(latest.preferences) !== JSON.stringify(data.preferences),
          rules: response.rules,
          server: response,
          serverEvidenceKey: confirmedEvidence,
          preferencesEstablished: true,
        },
        state.memory,
        token,
      );
    });
  })()
    .then(() => {
      if (token === generation && owner === motivationOwner())
        useMotivation.setState({ sync: 'idle' });
    })
    .catch(() => {
      again = false;
      if (token === generation && owner === motivationOwner())
        useMotivation.setState({ sync: 'error' });
    })
    .finally(() => {
      syncing = undefined;
      if (again || token !== generation || owner !== motivationOwner()) void syncMotivation();
    });
  return syncing;
}
