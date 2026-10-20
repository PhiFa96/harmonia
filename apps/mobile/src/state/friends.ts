import { create } from 'zustand';
import { friendsViewSchema } from '@harmonia/content';
import type { FriendsRequest, FriendsView } from '@harmonia/content';
import { configuredAuth } from '@/auth/config';
import { useAuthState } from '@/auth';
import { assertPrivacyWrite } from '@/privacy/guard';

export const useFriends = create<{
  owner: string | null;
  view: FriendsView | null;
  loading: boolean;
  error: string | null;
}>(() => ({ owner: null, view: null, loading: false, error: null }));
let revision = 0;
let busy = false;
const owner = () => useAuthState.getState().session?.user.id ?? null;
export function clearFriends() {
  revision++;
  busy = false;
  useFriends.setState({ owner: owner(), view: null, loading: false, error: null });
}
export async function refreshFriends() {
  await send();
}
export async function changeFriends(body: FriendsRequest) {
  await send(body);
}
async function send(body?: FriendsRequest) {
  const session = useAuthState.getState().session;
  if (!session) {
    clearFriends();
    return;
  }
  if (busy) return;
  const actor = session.user.id;
  if (useFriends.getState().owner !== actor) clearFriends();
  const config = configuredAuth();
  if (!config) {
    useFriends.setState({ error: 'auth' });
    return;
  }
  busy = true;
  const ticket = ++revision;
  useFriends.setState({ owner: actor, loading: true, error: null });
  try {
    assertPrivacyWrite(actor);
    const response = await fetch(config.url + '/functions/v1/friends', {
      method: body ? 'POST' : 'GET',
      headers: {
        apikey: config.key,
        Authorization: 'Bearer ' + session.access_token,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
    const data: unknown = await response.json();
    assertPrivacyWrite(actor);
    if (owner() !== actor || ticket !== revision) return;
    if (!response.ok) {
      const code = data && typeof data === 'object' && 'error' in data ? String(data.error) : '';
      throw new Error(
        ['missing', 'retry', 'limit', 'quest_active'].includes(code) ? code : 'unavailable',
      );
    }
    useFriends.setState({ view: friendsViewSchema.parse(data), loading: false });
  } catch (error) {
    if (ticket === revision && owner() === actor)
      useFriends.setState({
        loading: false,
        error: error instanceof Error ? error.message : 'unavailable',
      });
  } finally {
    if (ticket === revision) busy = false;
  }
}
