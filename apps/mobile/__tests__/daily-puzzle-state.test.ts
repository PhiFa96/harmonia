import type { Session } from '@supabase/supabase-js';
import { useAuthState } from '@/auth';
import {
  answerDailyPuzzle,
  clearDailyPuzzle,
  refreshDailyPuzzle,
  useDailyPuzzle,
} from '@/state/daily-puzzle';

const originalFetch = globalThis.fetch;
const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const originalKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const day = '2026-10-19';
const view = {
  day,
  resetAt: 1_800_000_000_000,
  available: true,
  difficulty: 1,
  streak: 0,
  completed: false,
  correct: null,
  question: { spec: { type: 'NOTE_NAME', params: {} }, seed: 'puzzle-test' },
};
const response = (body: unknown) => ({ ok: true, json: () => Promise.resolve(body) }) as Response;
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
  login('puzzle-a');
  clearDailyPuzzle();
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
  clearDailyPuzzle();
});
it('recovers the confirmed daily result after a lost answer response', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue(response(view));
  await refreshDailyPuzzle('Europe/Berlin');
  globalThis.fetch = jest.fn().mockRejectedValue(Error('Offline'));
  await answerDailyPuzzle(day, 'Europe/Berlin', 'C');
  const body = jest.mocked(globalThis.fetch).mock.calls[0]?.[1]?.body;
  if (typeof body !== 'string') throw Error('Missing JSON body');
  expect(JSON.parse(body) as unknown).toEqual({
    action: 'answer',
    day,
    timeZone: 'Europe/Berlin',
    answer: 'C',
  });
  expect(useDailyPuzzle.getState()).toMatchObject({ view, error: 'Offline' });
  globalThis.fetch = jest
    .fn()
    .mockResolvedValue(
      response({ ...view, completed: true, correct: true, streak: 1, question: null }),
    );
  await refreshDailyPuzzle('Europe/Berlin');
  expect(useDailyPuzzle.getState().view).toMatchObject({ completed: true, streak: 1 });
});
it('discards a response after an account switch', async () => {
  let release: (value: Response) => void = () => {
    throw Error('pending');
  };
  globalThis.fetch = jest.fn(
    () =>
      new Promise<Response>((resolve) => {
        release = resolve;
      }),
  );
  const pending = refreshDailyPuzzle('UTC');
  login('puzzle-b');
  clearDailyPuzzle();
  release(response(view));
  await pending;
  expect(useDailyPuzzle.getState()).toMatchObject({ owner: 'puzzle-b', view: null });
});
