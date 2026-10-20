import { create } from 'zustand';
import { duelViewSchema } from '@harmonia/content';
import type { DuelRequest, DuelView } from '@harmonia/content';
import { configuredAuth } from '@/auth/config';
import { getAuthClient, useAuthState } from '@/auth';
import { assertPrivacyWrite } from '@/privacy/guard';
import { syncMotivation } from '@/state/motivation';
import { refreshLeagues } from '@/state/leagues';

export const useDuel = create<{
  owner: string | null;
  view: DuelView | null;
  loading: boolean;
  error: string | null;
}>(() => ({ owner: null, view: null, loading: false, error: null }));
let revision = 0;
let busy = false;
let syncedGame: string | null = null;
const owner = () => useAuthState.getState().session?.user.id ?? null;
export function clearDuel() {
  revision++;
  busy = false;
  syncedGame = null;
  useDuel.setState({ owner: owner(), view: null, loading: false, error: null });
}
export async function refreshDuel() {
  await sendDuel();
}
export async function findDuel() {
  await sendDuel({ action: 'find' });
}
export async function inviteDuel(token: string) {
  await sendDuel({ action: 'invite', token });
}
export async function acceptDuel(token: string) {
  await sendDuel({ action: 'accept', token });
}
export async function cancelDuel() {
  await sendDuel({ action: 'cancel' });
}
export async function answerDuel(game: string, index: number, answer: string) {
  await sendDuel({ action: 'answer', game, index, answer });
}
async function sendDuel(body?: DuelRequest) {
  const session = useAuthState.getState().session;
  if (!session) {
    clearDuel();
    return;
  }
  if (busy) return;
  const actor = session.user.id;
  if (useDuel.getState().owner !== actor) clearDuel();
  const config = configuredAuth();
  if (!config) {
    useDuel.setState({ error: 'auth' });
    return;
  }
  busy = true;
  const ticket = ++revision;
  useDuel.setState({ owner: actor, loading: true, error: null });
  try {
    assertPrivacyWrite(actor);
    const response = await fetch(config.url + '/functions/v1/duel', {
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
      const code =
        data && typeof data === 'object' && 'error' in data ? String(data.error) : 'unavailable';
      throw new Error(
        ['source', 'active', 'conflict', 'fast', 'missing', 'retry'].includes(code)
          ? code
          : 'unavailable',
      );
    }
    const view = duelViewSchema.parse(data);
    useDuel.setState({ view, loading: false });
    if (
      view.phase === 'game' &&
      view.state === 'finished' &&
      view.kind === 'live' &&
      syncedGame !== view.id
    ) {
      syncedGame = view.id;
      void syncMotivation();
      void refreshLeagues();
    }
  } catch (error) {
    if (ticket === revision && owner() === actor)
      useDuel.setState({
        loading: false,
        error: error instanceof Error ? error.message : 'unavailable',
      });
  } finally {
    if (ticket === revision) busy = false;
  }
}

/** Broadcast is only a prompt to reload the authoritative server state. */
export function watchDuel(game: string, onProgress: () => void): () => void {
  const session = useAuthState.getState().session;
  const client = getAuthClient();
  if (!session || !client) return () => undefined;
  const channel = client.channel('duel:' + game, {
    config: { private: true, broadcast: { self: false } },
  });
  channel.on('broadcast', { event: 'progress' }, onProgress);
  let alive = true;
  void client.realtime
    .setAuth(session.access_token)
    .then(() => {
      if (alive) channel.subscribe();
    })
    .catch(() => undefined);
  return () => {
    alive = false;
    void client.removeChannel(channel);
  };
}
export async function broadcastDuel(game: string) {
  const session = useAuthState.getState().session;
  const client = getAuthClient();
  if (!session || !client) return;
  await client.realtime.setAuth(session.access_token);
  const channel = client.getChannels().find((c) => c.topic === 'realtime:duel:' + game);
  if (channel) await channel.send({ type: 'broadcast', event: 'progress', payload: {} });
}
