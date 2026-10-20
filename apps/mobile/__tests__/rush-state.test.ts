import type { Session } from '@supabase/supabase-js';
import { useAuthState } from '@/auth';
import { blockErasedScope } from '@/privacy/guard';
import {
  clearRush,
  useRush,
  refreshRush,
  startRush,
  answerRush,
  refreshRushBoard,
} from '@/state/rush';
jest.mock('@/state/motivation', () => ({ syncMotivation: jest.fn(() => Promise.resolve()) }));
jest.mock('@/state/leagues', () => ({ refreshLeagues: jest.fn(() => Promise.resolve()) }));
const originalFetch = globalThis.fetch;
const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL,
  originalKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const id = 'b3050000-0000-4000-8000-000000000001';
const run = {
  id,
  mode: 'three',
  bank: 'a'.repeat(64),
  state: 'active',
  startedAt: 1000,
  deadline: 181000,
  serverNow: 1000,
  index: 0,
  correct: 0,
  mistakes: 0,
  score: 0,
  xp: 0,
  question: { spec: { type: 'NOTE_NAME', params: {} }, difficulty: 1, seed: 'server' },
  last: null,
};
const snapshot = { remaining: 1, limit: 1, resetAt: 86400000, run: null };
const response = (body: unknown, status = 200) =>
  ({ ok: status === 200, status, json: () => Promise.resolve(body) }) as Response;
const login = (actor: string | null) => {
  useAuthState.setState({
    session: actor ? ({ user: { id: actor }, access_token: 'token-' + actor } as Session) : null,
  });
};
beforeEach(() => {
  Object.assign(process.env, {
    EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_' + 'x'.repeat(24),
  });
  login('rush-a');
  clearRush();
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [name, value] of [
    ['EXPO_PUBLIC_SUPABASE_URL', originalUrl],
    ['EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', originalKey],
  ] as const) {
    if (value === undefined) Reflect.deleteProperty(process.env, name);
    else Object.assign(process.env, { [name]: value });
  }
  login(null);
  clearRush();
});
function requestBody() {
  const body = jest.mocked(globalThis.fetch).mock.calls[0]?.[1]?.body;
  if (typeof body !== 'string') throw Error('Missing JSON body');
  return body;
}
it('captures the JWT and ignores a response after account replacement', async () => {
  let release: (r: Response) => void = () => {
    throw Error('Missing request');
  };
  globalThis.fetch = jest.fn(
    () =>
      new Promise<Response>((resolve) => {
        release = resolve;
      }),
  );
  const pending = refreshRush();
  expect(jest.mocked(globalThis.fetch).mock.calls[0]?.[1]?.headers).toMatchObject({
    Authorization: 'Bearer token-rush-a',
  });
  login('rush-b');
  clearRush();
  release(response({ ...snapshot, run }));
  await pending;
  expect(useRush.getState()).toMatchObject({ owner: 'rush-b', run: null, error: null });
});
it('serializes starts and refreshes the actually spent quota', async () => {
  let release: (r: Response) => void = () => {
    throw Error('Missing request');
  };
  globalThis.fetch = jest
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        }),
    )
    .mockResolvedValueOnce(response({ ...snapshot, remaining: 0, run }));
  const first = startRush(id, 'three');
  await startRush(id, 'three');
  expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  release(response(run));
  await first;
  expect(useRush.getState()).toMatchObject({ run, status: { remaining: 0 }, loading: false });
  expect(JSON.parse(requestBody())).toEqual({
    action: 'start',
    id,
    mode: 'three',
  });
});
it('sends only the ordinal and answer and leaves confirmed progress intact offline', async () => {
  globalThis.fetch = jest.fn().mockResolvedValueOnce(response({ ...snapshot, run }));
  await refreshRush();
  globalThis.fetch = jest.fn().mockRejectedValue(Error('Offline'));
  await answerRush(id, 0, 'C');
  expect(JSON.parse(requestBody())).toEqual({
    action: 'answer',
    id,
    index: 0,
    answer: 'C',
  });
  expect(useRush.getState()).toMatchObject({ run, error: 'Offline' });
  globalThis.fetch = jest.fn().mockResolvedValue(
    response({
      ...snapshot,
      remaining: 0,
      run: {
        ...run,
        index: 1,
        correct: 1,
        score: 10,
        last: { index: 0, answer: 'C', correct: true },
      },
    }),
  );
  await refreshRush();
  expect(useRush.getState().run?.index).toBe(1);
  expect(useRush.getState().error).toBeNull();
});
it('rejects identifiers or profile data in a leaderboard response', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue(
    response({
      mode: 'three',
      scope: 'day',
      bank: 'a'.repeat(64),
      available: true,
      entries: [{ rank: 1, score: 10, isYou: false, email: 'private@example.invalid' }],
    }),
  );
  await refreshRushBoard('three', 'day');
  expect(useRush.getState().board).toBeNull();
  expect(useRush.getState().error).not.toBeNull();
});
it('does not revive erased data from a late request', async () => {
  login('rush-erased');
  clearRush();
  let release: (r: Response) => void = () => {
    throw Error('Missing request');
  };
  globalThis.fetch = jest.fn(
    () =>
      new Promise<Response>((resolve) => {
        release = resolve;
      }),
  );
  const pending = refreshRush();
  blockErasedScope('rush-erased', []);
  clearRush();
  release(response({ ...snapshot, run }));
  await pending;
  expect(useRush.getState().run).toBeNull();
  globalThis.fetch = jest.fn();
  await refreshRush();
  expect(globalThis.fetch).not.toHaveBeenCalled();
});
it('makes no request for a guest', async () => {
  login(null);
  globalThis.fetch = jest.fn();
  await refreshRush();
  await startRush(id, 'three');
  expect(globalThis.fetch).not.toHaveBeenCalled();
  expect(useRush.getState().run).toBeNull();
});
