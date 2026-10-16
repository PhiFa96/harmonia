import type { Session } from '@supabase/supabase-js';
import { useAuthState } from '@/auth';
import { clearLeagues, refreshLeagues, useLeagues, changeLeagueConsent } from '@/state/leagues';
import { blockErasedScope } from '@/privacy/guard';
const snapshot = {
  weekStart: '2026-10-12',
  weekEnd: '2026-10-19',
  tier: 0,
  pushConsent: false,
  cohort: null,
  result: null,
};
const originalFetch = globalThis.fetch;
const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL,
  originalKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const response = (body: unknown) =>
  ({ ok: true, text: () => Promise.resolve(JSON.stringify(body)) }) as Response;
const signIn = (id: string) => {
  useAuthState.setState({ session: { user: { id }, access_token: 'token-' + id } as Session });
};
beforeEach(() => {
  Object.assign(process.env, {
    EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_' + 'x'.repeat(24),
  });
  signIn('league-a');
  clearLeagues();
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalUrl === undefined) Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_SUPABASE_URL');
  else Object.assign(process.env, { EXPO_PUBLIC_SUPABASE_URL: originalUrl });
  if (originalKey === undefined)
    Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  else Object.assign(process.env, { EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: originalKey });
  useAuthState.setState({ session: null });
  clearLeagues();
});
it('captures the JWT and discards a late snapshot after account replacement', async () => {
  let release: (value: Response) => void = () => {
    throw Error('Request missing');
  };
  globalThis.fetch = jest.fn(
    () =>
      new Promise<Response>((resolve) => {
        release = resolve;
      }),
  );
  const pending = refreshLeagues();
  const call = jest.mocked(globalThis.fetch).mock.calls[0];
  expect(call?.[0]).toContain('/rpc/learner_league');
  expect((call?.[1]?.headers as Record<string, string>)['Authorization']).toBe(
    'Bearer token-league-a',
  );
  signIn('league-b');
  clearLeagues();
  release(response(snapshot));
  await pending;
  expect(useLeagues.getState()).toMatchObject({
    owner: 'league-b',
    data: null,
    error: false,
    loading: false,
  });
});
it('retains only an own previous snapshot offline and discards malformed public rosters', async () => {
  globalThis.fetch = jest.fn(() => Promise.resolve(response(snapshot)));
  await refreshLeagues();
  expect(useLeagues.getState().data).toEqual(snapshot);
  globalThis.fetch = jest.fn(() => Promise.reject(Error('Offline')));
  await refreshLeagues();
  expect(useLeagues.getState()).toMatchObject({ data: snapshot, error: true });
  signIn('league-b');
  globalThis.fetch = jest.fn(() => Promise.resolve(response({ ...snapshot, user_id: 'leaked' })));
  await refreshLeagues();
  expect(useLeagues.getState()).toMatchObject({ owner: 'league-b', data: null, error: true });
});
it('a newer refresh wins over an older response for the same account', async () => {
  let release: (value: Response) => void = () => {
    throw Error('Request missing');
  };
  globalThis.fetch = jest
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        }),
    )
    .mockResolvedValue(response({ ...snapshot, tier: 3 }));
  const pending = refreshLeagues();
  await refreshLeagues();
  release(response(snapshot));
  await pending;
  expect(useLeagues.getState().data?.tier).toBe(3);
});
it('an in-flight result opt-in cannot retarget another account', async () => {
  let release: (value: Response) => void = () => {
    throw Error('Request missing');
  };
  globalThis.fetch = jest.fn(
    () =>
      new Promise<Response>((resolve) => {
        release = resolve;
      }),
  );
  const pending = changeLeagueConsent(true);
  signIn('league-b');
  clearLeagues();
  release(response(true));
  await expect(pending).rejects.toThrow('League owner changed');
  expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  expect(useLeagues.getState().data).toBeNull();
});
it('erasure blocks reads and delayed results from repopulating memory', async () => {
  signIn('league-erased');
  clearLeagues();
  blockErasedScope('league-erased', []);
  globalThis.fetch = jest.fn();
  await refreshLeagues();
  expect(globalThis.fetch).not.toHaveBeenCalled();
  expect(useLeagues.getState().data).toBeNull();
});
