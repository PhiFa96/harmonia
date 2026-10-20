import type { Session } from '@supabase/supabase-js';
import { useAuthState } from '@/auth';
import { answerDuel, clearDuel, findDuel, refreshDuel, useDuel } from '@/state/duel';
jest.mock('@/state/motivation', () => ({ syncMotivation: jest.fn(() => Promise.resolve()) }));
jest.mock('@/state/leagues', () => ({ refreshLeagues: jest.fn(() => Promise.resolve()) }));
const originalFetch = globalThis.fetch;
const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const originalKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const id = 'c3060000-0000-4000-8000-000000000001';
const game = {
  phase: 'game',
  id,
  kind: 'live',
  state: 'active',
  startsAt: 1000,
  deadline: 181000,
  serverNow: 1000,
  own: { index: 0, correct: 0, mistakes: 0, score: 0 },
  rival: { index: 0, score: 0 },
  ghostScore: null,
  outcome: null,
  ratingBefore: null,
  ratingAfter: null,
  question: { spec: { type: 'NOTE_NAME', params: {} }, difficulty: 1, seed: 'duel-test' },
  last: null,
} as const;
const response = (body: unknown, status = 200) =>
  ({ ok: status === 200, status, json: () => Promise.resolve(body) }) as Response;
const login = (actor: string | null) => {
  useAuthState.setState({
    session: actor ? ({ user: { id: actor }, access_token: 'token-' + actor } as Session) : null,
  });
};
function requestBody() {
  const body = jest.mocked(globalThis.fetch).mock.calls[0]?.[1]?.body;
  if (typeof body !== 'string') throw Error('Missing JSON body');
  return JSON.parse(body) as unknown;
}
beforeEach(() => {
  Object.assign(process.env, {
    EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_' + 'x'.repeat(24),
  });
  login('duel-a');
  clearDuel();
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of [
    ['EXPO_PUBLIC_SUPABASE_URL', originalUrl],
    ['EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', originalKey],
  ] as const) {
    if (value === undefined) Reflect.deleteProperty(process.env, key);
    else Object.assign(process.env, { [key]: value });
  }
  login(null);
  clearDuel();
});
it('sends only the action and keeps verified progress after a lost answer response', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue(response({ phase: 'idle' }));
  await findDuel();
  expect(requestBody()).toEqual({
    action: 'find',
  });
  globalThis.fetch = jest.fn().mockResolvedValue(response(game));
  await refreshDuel();
  globalThis.fetch = jest.fn().mockRejectedValue(Error('Offline'));
  await answerDuel(id, 0, 'C');
  expect(requestBody()).toEqual({
    action: 'answer',
    game: id,
    index: 0,
    answer: 'C',
  });
  expect(useDuel.getState()).toMatchObject({ view: game, error: 'Offline' });
  globalThis.fetch = jest.fn().mockResolvedValue(
    response({
      ...game,
      own: { index: 1, correct: 1, mistakes: 0, score: 10 },
      last: { index: 0, answer: 'C', correct: true },
    }),
  );
  await refreshDuel();
  expect(useDuel.getState().view).toMatchObject({ phase: 'game', own: { index: 1, score: 10 } });
});
it('discards a response for a signed-out account', async () => {
  let release: (r: Response) => void = () => {
    throw Error('pending');
  };
  globalThis.fetch = jest.fn(
    () =>
      new Promise<Response>((resolve) => {
        release = resolve;
      }),
  );
  const pending = refreshDuel();
  login('duel-b');
  clearDuel();
  release(response(game));
  await pending;
  expect(useDuel.getState()).toMatchObject({ owner: 'duel-b', view: null });
});
it('rejects unrecognized server fields, including another account identity', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue(response({ ...game, opponentId: 'secret' }));
  await refreshDuel();
  expect(useDuel.getState().view).toBeNull();
  expect(useDuel.getState().error).not.toBeNull();
});
