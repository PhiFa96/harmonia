import type * as Zust from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { useAuthState } from '@/auth';
import { changeFriends, clearFriends, refreshFriends, useFriends } from '@/state/friends';

jest.mock('@/auth', () => {
  const { create } = jest.requireActual<typeof Zust>('zustand');
  return { useAuthState: create<{ session: Session | null }>()(() => ({ session: null })) };
});
jest.mock('@/auth/config', () => ({
  configuredAuth: () => ({ url: 'http://127.0.0.1:54321', key: 'local-test-key' }),
}));

const fetchBefore = globalThis.fetch;
const sessionBefore = useAuthState.getState().session;
const view = { invite: null, friends: [], blocked: [], questUsed: false, quest: null, badges: 0 };
const login = (id: string) => {
  useAuthState.setState({ session: { user: { id }, access_token: id } as Session });
};

afterEach(() => {
  globalThis.fetch = fetchBefore;
  useAuthState.setState({ session: sessionBefore });
  clearFriends();
});

it('drops an older account response and avoids a parallel request for the same account', async () => {
  login('friends-first');
  clearFriends();
  let oldReply: (response: Response) => void = () => {
    throw Error('Old request must be pending');
  };
  const pending = new Promise<Response>((resolve) => {
    oldReply = resolve;
  });
  const fetchFriends = jest
    .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
    .mockReturnValueOnce(pending)
    .mockResolvedValueOnce(new Response(JSON.stringify({ ...view, badges: 2 })));
  globalThis.fetch = (input, init) =>
    typeof input === 'string' && input.endsWith('/functions/v1/friends')
      ? fetchFriends(input, init)
      : Promise.resolve(new Response('{}'));
  const oldRequest = refreshFriends();
  await changeFriends({ action: 'refresh' });
  expect(fetchFriends).toHaveBeenCalledTimes(1);

  login('friends-second');
  await refreshFriends();
  oldReply(new Response(JSON.stringify({ ...view, badges: 17 })));
  await oldRequest;

  expect(fetchFriends).toHaveBeenCalledTimes(2);
  expect(useFriends.getState()).toMatchObject({
    owner: 'friends-second',
    view: { badges: 2 },
    loading: false,
  });
});
