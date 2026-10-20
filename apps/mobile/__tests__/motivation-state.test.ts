import { waitFor } from '@testing-library/react-native';
import { DatabaseSync } from 'node:sqlite';
import type { Session } from '@supabase/supabase-js';
import { firstLesson } from '@harmonia/content/authoring';
import { lessonEvent, motivationSummary, DEFAULT_REWARD_RULE } from '@harmonia/content';
import type { MotivationRequest } from '@harmonia/content';
import {
  createLessonSession,
  activeLessonSession,
  currentItem,
  expectedAnswer,
  answerLesson,
  nextLessonExercise,
} from '@harmonia/exercises';
import { useAuthState } from '@/auth';
import { useDeviceState } from '@/state/device';
import { useLearningState } from '@/state/learning';
import {
  initializeMotivationDatabase,
  createMotivationRepository,
} from '@/storage/motivation-repository';
import type { LessonDatabase } from '@/storage/lesson-repository';
import type * as MotivationModule from '@/state/motivation';
import { motivationFixture, motivationResponse } from '../jest/motivation-fixture';
const motivation = jest.requireActual<typeof MotivationModule>('@/state/motivation');
let mockRepository: ReturnType<typeof createMotivationRepository>,
  db: DatabaseSync,
  mockCounter = 0;
const mockInvoke = jest.fn<
  Promise<{ data: unknown; error: Error | null }>,
  [string, { method?: string; body: MotivationRequest }]
>();
const mockRules = jest.fn(() =>
  Promise.resolve({ data: [{ rule: DEFAULT_REWARD_RULE }], error: null }),
);
jest.mock('expo-crypto', () => ({
  randomUUID: () => `00000000-0000-4000-8000-${String(++mockCounter).padStart(12, '0')}`,
}));
jest.mock('@/storage/motivation', () => ({
  getMotivationRepository: () => Promise.resolve(mockRepository),
}));
jest.mock('@/auth', () => ({
  ...jest.requireActual<object>('@/auth'),
  getAuthClient: () => ({
    functions: { invoke: mockInvoke },
    from: () => ({ select: () => ({ order: () => ({ overrideTypes: mockRules }) }) }),
  }),
}));
function login(id: string | null) {
  useAuthState.setState({
    ready: true,
    session: id ? ({ user: { id }, access_token: id } as Session) : null,
  });
  useLearningState.setState({ scope: id ?? 'guest', rows: [] });
}
function earned(coins = 12) {
  let session = createLessonSession(firstLesson, 'earned');
  while (session.phase === 'initial') {
    const active = activeLessonSession(session),
      item = active && currentItem(active);
    if (!item) throw new Error('Aufgabe fehlt');
    session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
  }
  const event = lessonEvent(
    'earned',
    session,
    Date.now() - 60000,
    Date.now() - 1000,
    'Europe/Berlin',
  );
  useLearningState.setState({
    rows: [
      {
        event,
        sequence: 1,
        position: 1,
        pending: false,
        reward: { amount: 18, date: '2026-10-14', coins, qualified: true, ruleVersion: 1 },
      },
    ],
  });
}
function answer(body: MotivationRequest) {
  const purchases = body.purchases ?? [];
  return {
    error: null,
    data: {
      ...motivationResponse(),
      preferences:
        body.preferences ??
        motivation.useMotivation.getState().data?.preferences ??
        motivationFixture().preferences,
      summary: motivationSummary(
        motivation.motivationActivities(),
        Date.now(),
        'Europe/Berlin',
        body.practicedAt,
        purchases,
      ),
      accepted: purchases.map((p) => p.id),
      purchases,
    },
  };
}
async function settle() {
  await motivation.syncMotivation();
  await waitFor(() => {
    expect(motivation.useMotivation.getState().sync).not.toBe('syncing');
  });
}
beforeEach(async () => {
  jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-14T10:00:00Z'));
  login(null);
  db = new DatabaseSync(':memory:');
  const adapter: LessonDatabase = {
    execAsync: (sql) => {
      db.exec(sql);
      return Promise.resolve();
    },
    runAsync: (sql, ...params) => Promise.resolve(db.prepare(sql).run(...params)),
    getFirstAsync: <T>(sql: string, ...params: (number | string)[]) =>
      Promise.resolve((db.prepare(sql).get(...params) as T | undefined) ?? null),
  };
  await initializeMotivationDatabase(adapter);
  mockRepository = createMotivationRepository(adapter);
  mockCounter = 0;
  mockInvoke
    .mockReset()
    .mockImplementation((_name, o) =>
      Promise.resolve(
        o.method === 'DELETE' ? { data: { disabled: true }, error: null } : answer(o.body),
      ),
    );
  useDeviceState.setState({ storage: 'saved' });
  await motivation.initializeMotivation();
  await settle();
});
afterEach(async () => {
  await settle();
  await settle();
  db.close();
  jest.restoreAllMocks();
});
it('kauft offline aus Lernnachweisen und übernimmt Gastkäufe nur mit der nächsten Anmeldung', async () => {
  earned();
  await motivation.buyFreeze();
  await settle();
  expect(motivation.currentMotivation().summary.coins).toBe(2);
  expect(motivation.currentMotivation().summary.streak.freezesAvailable).toBe(1);
  expect(mockInvoke.mock.calls.filter(([, o]) => o.method !== 'DELETE')).toHaveLength(0);
  login('a');
  earned();
  await motivation.initializeMotivation();
  await settle();
  await settle();
  expect((await mockRepository.read('a'))?.purchases[0]?.acked).toBe(true);
  expect(await mockRepository.read('guest')).toBeNull();
  login('b');
  await motivation.initializeMotivation();
  await settle();
  expect(motivation.currentMotivation().summary.coins).toBe(0);
  expect(motivation.useMotivation.getState().data?.purchases).toEqual([]);
});
it('serialisiert Doppeltippen und darf vorhandenes Guthaben nur einmal ausgeben', async () => {
  earned();
  const results = await Promise.allSettled([motivation.buyFreeze(), motivation.buyFreeze()]);
  expect(results.map((r) => r.status)).toEqual(['fulfilled', 'rejected']);
  expect(motivation.useMotivation.getState().data?.purchases).toHaveLength(1);
});
it('wartet auf die Kontobestätigung der zugrunde liegenden Offline-Lektionen', async () => {
  login('a');
  await motivation.initializeMotivation();
  await settle();
  earned();
  useLearningState.setState((s) => ({ rows: s.rows.map((r) => ({ ...r, pending: true })) }));
  mockInvoke.mockClear();
  await settle();
  expect(mockInvoke).not.toHaveBeenCalled();
  expect(motivation.useMotivation.getState().sync).toBe('error');
});
it('behält Käufe bei Netzfehlern und weist unvollständige oder fremde Bestätigungen zurück', async () => {
  login('a');
  await motivation.initializeMotivation();
  await settle();
  earned();
  mockInvoke.mockResolvedValue({ data: null, error: new Error('offline') });
  await motivation.buyFreeze();
  await settle();
  expect((await mockRepository.read('a'))?.purchases[0]?.acked).toBe(false);
  mockInvoke.mockResolvedValue({
    data: { ...motivationResponse(), accepted: ['00000000-0000-4000-8000-000000000099'] },
    error: null,
  });
  await settle();
  expect(motivation.useMotivation.getState().sync).toBe('error');
  expect((await mockRepository.read('a'))?.purchases[0]?.acked).toBe(false);
});
it('entfernt abgelehnte Offline-Käufe aus dem Guthaben und sendet sie nicht erneut', async () => {
  login('a');
  await motivation.initializeMotivation();
  await settle();
  earned();
  mockInvoke.mockImplementation((_n, o) => {
    const p = o.body.purchases?.[0];
    return Promise.resolve(
      p
        ? {
            data: null,
            error: Object.assign(new Error('rejected'), {
              context: new Response(JSON.stringify({ error: 'balance', id: p.id, accepted: [] }), {
                status: 422,
              }),
            }),
          }
        : answer(o.body),
    );
  });
  await motivation.buyFreeze();
  await settle();
  expect(motivation.useMotivation.getState().data?.purchases[0]?.rejected).toBe(true);
  expect(motivation.currentMotivation().summary.coins).toBe(12);
  await settle();
  expect(mockInvoke.mock.calls.at(-1)?.[1].body.purchases).toEqual([]);
});
it('ordnet verspätete Bestätigungen dem ursprünglichen Konto zu und aktiviert keine Gastzustimmung nach Logout', async () => {
  login('a');
  await motivation.initializeMotivation();
  await settle();
  earned();
  await motivation.changeMotivationPreferences({ reminderConsent: true });
  await settle();
  let release: (r: { data: unknown; error: null }) => void = () => {
    throw new Error('Aufruf fehlt');
  };
  let captured: MotivationRequest | undefined;
  const entered = new Promise<void>((resolve) => {
    mockInvoke.mockImplementation((_n, o) => {
      captured = o.body;
      resolve();
      return new Promise((done) => {
        release = done;
      });
    });
  });
  await motivation.buyFreeze();
  await entered;
  if (!captured) throw new Error('Aufruf fehlt');
  const original = answer(captured);
  login('b');
  await motivation.initializeMotivation();
  mockInvoke.mockImplementation((_n, o) =>
    Promise.resolve(
      o.method === 'DELETE' ? { data: { disabled: true }, error: null } : answer(o.body),
    ),
  );
  release(original);
  await settle();
  await settle();
  expect(motivation.useMotivation.getState().scope).toBe('b');
  expect(motivation.useMotivation.getState().data?.purchases).toEqual([]);
  expect((await mockRepository.read('a'))?.purchases[0]?.acked).toBe(true);
  useDeviceState.setState((s) => ({ data: s.data ? { ...s.data, reminderConsent: true } : null }));
  login(null);
  await motivation.initializeMotivation();
  await settle();
  expect(motivation.useMotivation.getState().data?.preferences.reminderConsent).toBe(false);
});
it('freies Üben zählt unmittelbar als heute geübt, ohne XP, Münzen oder Serie zu erzeugen', async () => {
  login('a');
  await motivation.initializeMotivation();
  await settle();
  mockInvoke.mockResolvedValue({ data: null, error: new Error('offline') });
  await motivation.recordPractice();
  expect(motivation.currentMotivation().summary).toMatchObject({
    practiced: true,
    totalXP: 0,
    coins: 0,
    streak: { current: 0 },
  });
});
it('sendet in einer ausdrücklich vorübergehenden Sitzung weder Kontoänderungen noch Gerätebindungen', async () => {
  mockInvoke.mockClear();
  useDeviceState.setState({ storage: 'memory' });
  await motivation.initializeMotivation();
  await motivation.changeMotivationPreferences({ dailyGoal: 50 });
  await settle();
  expect(mockInvoke).not.toHaveBeenCalled();
  expect(motivation.useMotivation.getState().memory).toBe(true);
});

it('meldet lokale Schreibfehler und bestätigt eine Einstellung erst nach erfolgreichem Speichern', async () => {
  jest.spyOn(mockRepository, 'save').mockRejectedValueOnce(new Error('Datenträger'));
  await expect(motivation.changeMotivationPreferences({ dailyGoal: 50 })).rejects.toThrow();
  expect(motivation.useMotivation.getState().writeError).toBe(true);
  expect(motivation.useMotivation.getState().data?.preferences.dailyGoal).toBe(20);
  await motivation.changeMotivationPreferences({ dailyGoal: 50 });
  expect(motivation.useMotivation.getState().writeError).toBe(false);
  expect((await mockRepository.read('guest'))?.preferences.dailyGoal).toBe(50);
});

it('sendet einen übernommenen Schutzkauf erst bei vollständig geladenem Lernstand', async () => {
  login('a');
  await motivation.initializeMotivation();
  await settle();
  earned();
  mockInvoke.mockResolvedValue({ data: null, error: new Error('offline') });
  await motivation.buyFreeze();
  await settle();
  useLearningState.setState({ phase: 'loading', rows: [] });
  mockInvoke.mockClear();
  mockInvoke.mockImplementation((_n, o) => Promise.resolve(answer(o.body)));
  await settle();
  expect(mockInvoke).not.toHaveBeenCalled();
  expect(motivation.useMotivation.getState().data?.purchases[0]).toMatchObject({ acked: false });
  expect(motivation.useMotivation.getState().data?.purchases[0]?.rejected).toBeUndefined();
  useLearningState.setState({ phase: 'ready' });
  earned();
  await settle();
  expect(motivation.useMotivation.getState().data?.purchases[0]?.acked).toBe(true);
});

it('behält bestätigte Rush-Aggregate bei Offline-Schätzung und Tageswechsel ohne Serienqualifikation', async () => {
  login('rush-offline');
  await motivation.initializeMotivation();
  await settle();
  const now = Date.now();
  const state = motivation.useMotivation.getState();
  if (!state.data) throw Error('Missing motivation fixture');
  motivation.useMotivation.setState({
    data: {
      ...state.data,
      server: {
        ...motivationResponse(),
        rushActivities: [
          {
            id: 'rush:verified',
            at: now - 1000,
            timeZone: 'UTC',
            amount: 12,
            qualified: false,
            coins: 0,
          },
        ],
      },
      serverEvidenceKey: null,
    },
  });
  expect(motivation.currentMotivation(now).summary).toMatchObject({
    totalXP: 12,
    coins: 0,
    streak: { current: 0 },
  });
  expect(motivation.currentMotivation(now + 86400000).summary).toMatchObject({
    totalXP: 12,
    todayXP: 0,
    streak: { current: 0 },
  });
  login('other-rush-owner');
  expect(motivation.currentMotivation(now).summary.totalXP).toBe(0);
});
