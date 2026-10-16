import { DatabaseSync } from 'node:sqlite';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { firstLesson, catalogue } from '@harmonia/content/authoring';
import {
  lessonEvent,
  placementBank,
  lessonPlan,
  weaknessPlan,
  localLearningRatings,
} from '@harmonia/content';
import type { PlacementAction } from '@harmonia/exercises';
import type { LearningEvent, LearningSyncResponse } from '@harmonia/content';
import {
  createPlacement,
  currentPlacementTask,
  actPlacement,
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
  nextLessonExercise,
} from '@harmonia/exercises';
import {
  createLearningRepository,
  initializeLearningDatabase,
} from '@/storage/learning-repository';
import { useAuthState } from '@/auth';
import {
  usePlacementState,
  startPlacement,
  selectPlacement,
  bank as localBank,
  flushPlacementWrites,
} from '@/state/placement';
import {
  expectedAnswer as placementAnswer,
  currentPlacementTask as placementTask,
} from '@harmonia/exercises';
import { restorePlacement } from '@/placement/model';
import type * as learningModule from '@/state/learning';
const learning = jest.requireActual<typeof learningModule>('@/state/learning');
let mockRepository: ReturnType<typeof createLearningRepository>;
interface InvokeOptions {
  body: { since: number; events: LearningEvent[] };
  headers: { Authorization: string };
  timeout: number;
}
const mockInvoke = jest.fn<
  Promise<{ data: unknown; error: Error | null }>,
  [string, InvokeOptions]
>();
const mockRpc = jest.fn<Promise<{ data: unknown; error: Error | null }>, []>();
const mockRpcHeader = jest.fn<undefined, [string, string]>();
jest.mock('@/storage/learning', () => ({
  getLearningRepository: () => Promise.resolve(mockRepository),
}));
jest.mock('@/storage/lessons', () => ({
  getLessonRepository: () => Promise.resolve({ allAttempts: () => Promise.resolve([]) }),
}));
jest.mock('@/auth', () => ({
  ...jest.requireActual<object>('@/auth'),
  getAuthClient: () =>
    ({
      functions: { invoke: mockInvoke },
      rpc: () => ({
        setHeader: (name: string, value: string) => {
          mockRpcHeader(name, value);
          return { abortSignal: () => mockRpc() };
        },
      }),
    }) as unknown as SupabaseClient,
}));
let db: DatabaseSync;
function login(id: string | null) {
  useAuthState.setState({
    ready: true,
    session:
      id === null
        ? null
        : ({
            user: { id, aud: 'authenticated', created_at: '2026-01-01' },
            access_token: id,
            refresh_token: 'local-test',
            expires_in: 3600,
            token_type: 'bearer',
          } as Session),
  });
}
function event(id = 'one'): LearningEvent {
  let lesson = createLessonSession(firstLesson, 'state-learning');
  while (lesson.phase === 'initial') {
    const active = activeLessonSession(lesson),
      item = active && currentItem(active);
    if (!item) throw new Error('Aufgabe fehlt');
    lesson = nextLessonExercise(answerLesson(lesson, expectedAnswer(item)));
  }
  return lessonEvent(id, lesson, 1, 2);
}
function placement(id: string, advanced: boolean): LearningEvent {
  const bank = placementBank(catalogue),
    seed = id,
    actions: PlacementAction[] = [];
  let state = createPlacement(bank, seed);
  const act = (action: PlacementAction) => {
    actions.push(action);
    state = actPlacement(bank, state, action);
  };
  if (!advanced) act({ type: 'finish' });
  for (let guard = 0; !state.ended && guard < 26; guard++) {
    const item = currentPlacementTask(state)?.session.items[0];
    if (!item) throw new Error('Einstufungsfrage fehlt');
    act({ type: 'answer', answer: expectedAnswer(item) });
    act({ type: 'next' });
  }
  return { kind: 'placement', id, seed, bankKey: bank.key, actions, startedAt: 1, finishedAt: 2 };
}
function ok(
  events: readonly LearningEvent[] = [],
  rows: LearningSyncResponse['rows'] = [],
  since = 0,
) {
  return {
    data: {
      accepted: events.map((e) => e.id),
      rows,
      cursor: rows.at(-1)?.sequence ?? since,
      more: false,
    },
    error: null,
  };
}
beforeEach(async () => {
  await learning.syncLearning();
  login(null);
  db = new DatabaseSync(':memory:');
  const adapter = {
    execAsync: (sql: string) => {
      db.exec(sql);
      return Promise.resolve();
    },
    runAsync: (sql: string, ...params: (string | number)[]) =>
      Promise.resolve(db.prepare(sql).run(...params)),
    getFirstAsync: <T>(sql: string, ...params: (string | number)[]) =>
      Promise.resolve((db.prepare(sql).get(...params) as T | undefined) ?? null),
  };
  await initializeLearningDatabase(adapter);
  mockRepository = createLearningRepository(adapter);
  mockInvoke.mockReset().mockResolvedValue({ data: null, error: new Error('Offline') });
  mockRpc.mockReset().mockResolvedValue({ data: null, error: new Error('Offline') });
  mockRpcHeader.mockReset();
  await learning.initializeLearning();
});
afterEach(async () => {
  await learning.syncLearning();
  db.close();
});
describe('Kontogebundene Lernpfad-Synchronisation', () => {
  it('eine verzögerte Rating-Antwort schreibt nach Kontowechsel weder Snapshot noch erfolgreichen Status ins neue Konto', async () => {
    let reply: (value: { data: unknown; error: null }) => void = () => {
      throw new Error('Missing reply');
    };
    let reached: () => void = () => {
      throw new Error('Missing signal');
    };
    const arrived = new Promise<void>((resolve) => {
      reached = resolve;
    });
    const delayed = new Promise<{ data: unknown; error: null }>((resolve) => {
      reply = resolve;
    });
    mockRpc.mockImplementation(() => {
      reached();
      return delayed;
    });
    mockInvoke.mockResolvedValue(ok());
    login('a');
    await learning.initializeLearning();
    await arrived;
    expect(mockRpcHeader).toHaveBeenCalledWith('Authorization', 'Bearer a');
    const phases: string[] = [];
    const unsubscribe = learning.useLearningState.subscribe((s) => {
      if (s.scope === 'b') phases.push(s.sync);
    });
    try {
      login('b');
      learning.useLearningState.setState({ scope: 'b', sync: 'error', ratings: null });
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Offline') });
      reply({
        data: {
          throughSequence: 0,
          skills: {
            foreign: { rating: 1700, deviation: 100, volatility: 0.06, attempts: 2, updatedAt: 0 },
          },
          buckets: {},
        },
        error: null,
      });
      await learning.syncLearning();
      await learning.syncLearning();
      expect(learning.useLearningState.getState().ratings).toBeNull();
      expect(await mockRepository.ratings('b')).toBeNull();
      expect(phases).not.toContain('idle');
    } finally {
      reply({ data: null, error: null });
      unsubscribe();
    }
  });
  it('gezieltes Üben ersetzt keine ältere gültige Einstufung', async () => {
    await learning.recordLearningEvent(placement('valid-placement', true));
    expect(learning.useLearningState.getState().path.some((u) => u.status === 'tested')).toBe(true);
    const anchor = lessonPlan(catalogue, 'notation.l1.staff.anchor');
    if (!anchor) throw new Error('Missing anchor');
    let prior = createLessonSession(anchor, 'weak-prior');
    for (const item of prior.initial.items)
      prior = nextLessonExercise(answerLesson(prior, expectedAnswer(item)));
    const ratings = localLearningRatings(catalogue, [lessonEvent('prior', prior, 1, 2)]);
    const weak = weaknessPlan(catalogue, ratings, [anchor.id], 2);
    if (!weak) throw new Error('Missing weak plan');
    let practice = createLessonSession(weak, 'weak-practice');
    for (const item of practice.initial.items)
      practice = nextLessonExercise(answerLesson(practice, expectedAnswer(item)));
    await learning.recordLearningEvent(lessonEvent('weak-complete', practice, 3, 4));
    expect(learning.useLearningState.getState().path.some((u) => u.status === 'tested')).toBe(true);
  });
  it('Gastfortschritt bleibt lokal und wird erst bei Anmeldung genau einem Konto zugeordnet', async () => {
    await learning.recordLearningEvent(event());
    expect(mockInvoke).not.toHaveBeenCalled();
    expect(await mockRepository.list('guest')).toHaveLength(1);
    login('a');
    await learning.initializeLearning();
    await learning.syncLearning();
    expect(await mockRepository.list('guest')).toHaveLength(0);
    expect(await mockRepository.list('a')).toHaveLength(1);
    expect(learning.useLearningState.getState().sync).toBe('error');
    login('b');
    await learning.initializeLearning();
    await learning.syncLearning();
    expect(learning.useLearningState.getState().rows).toHaveLength(0);
    expect(await mockRepository.list('b')).toHaveLength(0);
  });
  it('Netzfehler erhalten die Warteschlange; erneute Verbindung übernimmt geprüfte Antworten', async () => {
    login('a');
    await learning.initializeLearning();
    await learning.syncLearning();
    const one = event();
    await learning.recordLearningEvent(one);
    await learning.syncLearning();
    expect((await mockRepository.list('a'))[0]?.pending).toBe(true);
    mockInvoke.mockImplementation(
      (_name: string, options: { body: { since: number; events: LearningEvent[] } }) =>
        Promise.resolve(ok(options.body.events, [{ sequence: 3, event: one }])),
    );
    await learning.syncLearning();
    expect(learning.useLearningState.getState().sync).toBe('idle');
    expect((await mockRepository.list('a'))[0]).toMatchObject({ pending: false, sequence: 3 });
    expect(
      learning.useLearningState
        .getState()
        .path.flatMap((u) => u.lessons)
        .find((l) => l.id === firstLesson.id)?.status,
    ).toBe('completed');
  });
  it('fehlende ACKs und ungeprüfte Serverdaten quittieren keinen lokalen Versuch', async () => {
    login('a');
    await learning.initializeLearning();
    await learning.syncLearning();
    await learning.recordLearningEvent(event());
    await learning.syncLearning();
    mockInvoke.mockResolvedValue(ok());
    await learning.syncLearning();
    expect(learning.useLearningState.getState().sync).toBe('error');
    expect((await mockRepository.list('a'))[0]?.pending).toBe(true);
    const bad = event('bad');
    if (bad.kind !== 'lesson') throw new Error('Typ');
    mockInvoke.mockResolvedValue(
      ok([event()], [{ sequence: 1, event: { ...bad, initial: { answers: [], skipped: [] } } }]),
    );
    await learning.syncLearning();
    expect(await mockRepository.cursor('a')).toBe(0);
    expect(await mockRepository.list('a')).toHaveLength(1);
  });
  it('ein verspäteter Abschluss gehört dem Konto vom Lektionsstart; temporäre fremde Antworten werden verworfen', async () => {
    login('b');
    await learning.initializeLearning();
    await learning.syncLearning();
    await learning.recordLearningEvent(event('late-a'), false, 'a');
    await learning.recordLearningEvent(event('temporary-a'), true, 'a');
    expect((await mockRepository.list('a')).map((r) => r.event.id)).toEqual(['late-a']);
    expect(learning.useLearningState.getState().rows).toHaveLength(0);
  });
  it('laufender Sync verwendet das eingefangene Token und landet bei Kontowechsel ausschließlich beim ursprünglichen Eigentümer', async () => {
    let release: ((value: ReturnType<typeof ok>) => void) | undefined;
    let began: () => void = () => {
      throw new Error('Sync-Start fehlt');
    };
    const started = new Promise<void>((resolve) => {
      began = resolve;
    });
    mockInvoke.mockImplementationOnce(() => {
      began();
      return new Promise((resolve) => {
        release = resolve;
      });
    });
    login('a');
    await learning.initializeLearning();
    const old = learning.syncLearning();
    await started;
    login('b');
    await learning.initializeLearning();
    mockInvoke.mockImplementation(
      (_name: string, options: { body: { since: number; events: LearningEvent[] } }) =>
        Promise.resolve(ok(options.body.events, [], options.body.since)),
    );
    if (!release) throw new Error('Sync noch nicht gestartet');
    release(ok([], [{ sequence: 1, event: event('remote-a') }]));
    await old;
    await learning.syncLearning();
    expect(await mockRepository.list('a')).toHaveLength(1);
    expect(await mockRepository.list('b')).toHaveLength(0);
    expect(learning.useLearningState.getState().scope).toBe('b');
    expect(learning.useLearningState.getState().rows).toHaveLength(0);
    expect(mockInvoke.mock.calls[0]?.[1].headers.Authorization).toBe('Bearer a');
    expect(mockInvoke.mock.calls.at(-1)?.[1].headers.Authorization).toBe('Bearer b');
  });
  it('verwendet nach Sync die Serverreihenfolge der Einstufungen und davor einen neuen lokalen Abschluss', async () => {
    login('a');
    await learning.initializeLearning();
    await learning.syncLearning();
    const advanced = placement('advanced', true),
      partial = placement('partial', false);
    await learning.recordLearningEvent(advanced);
    await learning.syncLearning();
    await learning.recordLearningEvent(partial);
    await learning.syncLearning();
    expect(learning.useLearningState.getState().path.some((u) => u.status === 'tested')).toBe(
      false,
    );
    mockInvoke.mockImplementation((_name, options) => {
      const rows = [
        { sequence: 1, event: partial },
        { sequence: 2, event: advanced },
      ].filter((row) => row.sequence > options.body.since);
      return Promise.resolve(ok(options.body.events, rows, options.body.since));
    });
    await learning.syncLearning();
    expect(learning.useLearningState.getState().path.some((u) => u.status === 'tested')).toBe(true);
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Offline') });
    await learning.recordLearningEvent(placement('new-local', false));
    await learning.syncLearning();
    expect(learning.useLearningState.getState().path.some((u) => u.status === 'tested')).toBe(
      false,
    );
  });
  it('hält pausierte Tests und Antworten beim Konto vom Teststart und stellt sie nach Rückkehr wieder her', async () => {
    login('a');
    await learning.initializeLearning();
    await learning.syncLearning();
    startPlacement(1000, 'private-a');
    const active = usePlacementState.getState().data.active;
    if (!active) throw new Error('Test fehlt');
    const state = restorePlacement(localBank, active),
      item = placementTask(state)?.session.items[0];
    if (!item) throw new Error('Frage fehlt');
    selectPlacement(placementAnswer(item));
    await flushPlacementWrites();
    login('b');
    await learning.initializeLearning();
    await learning.syncLearning();
    expect(usePlacementState.getState().data).toEqual({
      schemaVersion: 1,
      active: null,
      last: null,
    });
    startPlacement(2000, 'private-b');
    await flushPlacementWrites();
    login('a');
    await learning.initializeLearning();
    await learning.syncLearning();
    expect(usePlacementState.getState().data.active).toMatchObject({
      seed: 'private-a',
      answer: placementAnswer(item),
    });
    login(null);
    await learning.initializeLearning();
    expect(usePlacementState.getState().data.active).toBeNull();
  });
  it('temporäres Lernen schreibt weder SQLite noch Backend', async () => {
    learning.startTemporaryLearning();
    await learning.recordLearningEvent(event(), true);
    expect(learning.useLearningState.getState().rows).toHaveLength(1);
    expect(await mockRepository.list('guest')).toHaveLength(0);
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});
