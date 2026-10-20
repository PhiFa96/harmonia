import { create } from 'zustand';
import { rushStatusSchema, rushViewSchema, rushLeaderboardSchema } from '@harmonia/content';
import type {
  RushStatus,
  RushView,
  RushMode,
  RushLeaderboard,
  RushRequest,
} from '@harmonia/content';
import { configuredAuth } from '@/auth/config';
import { useAuthState } from '@/auth';
import { assertPrivacyWrite } from '@/privacy/guard';
import { syncMotivation } from '@/state/motivation';
import { refreshLeagues } from '@/state/leagues';
export const useRush = create<{
  owner: string | null;
  status: RushStatus | null;
  run: RushView | null;
  board: RushLeaderboard | null;
  loading: boolean;
  error: string | null;
}>(() => ({ owner: null, status: null, run: null, board: null, loading: false, error: null }));
let generation = 0;
let busy = false;
export function clearRush() {
  generation++;
  busy = false;
  useRush.setState({
    owner: useAuthState.getState().session?.user.id ?? null,
    status: null,
    run: null,
    board: null,
    loading: false,
    error: null,
  });
}
const currentOwner = () => useAuthState.getState().session?.user.id ?? null;
export function rushTransport() {
  const session = useAuthState.getState().session,
    config = configuredAuth();
  if (!session || !config) throw new Error('auth');
  const actor = session.user.id;
  assertPrivacyWrite(actor);
  return async (path: string, body?: object) => {
    const response = await fetch(config.url + '/functions/v1/rush' + path, {
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
    if (currentOwner() !== actor) throw new Error('owner');
    if (!response.ok) {
      const code =
        typeof data === 'object' && data && 'error' in data ? String(data.error) : 'unavailable';
      throw new Error(
        ['auth', 'source', 'limit', 'active', 'conflict', 'fast'].includes(code)
          ? code
          : 'unavailable',
      );
    }
    return data;
  };
}
async function work(
  operation: (
    transport: ReturnType<typeof rushTransport>,
  ) => Promise<Partial<ReturnType<typeof useRush.getState>>>,
) {
  if (!currentOwner()) return;
  if (useRush.getState().owner !== currentOwner()) clearRush();
  if (busy) return;
  busy = true;
  const token = ++generation,
    actor = currentOwner();
  useRush.setState({ owner: actor, loading: true, error: null });
  try {
    const next = await operation(rushTransport());
    if (token !== generation || actor !== currentOwner()) return;
    useRush.setState({ ...next, loading: false });
    if (next.run?.state === 'finished') {
      void syncMotivation();
      void refreshLeagues();
    }
  } catch (error) {
    if (token === generation && actor === currentOwner())
      useRush.setState({
        loading: false,
        error: error instanceof Error ? error.message : 'unavailable',
      });
  } finally {
    if (token === generation) busy = false;
  }
}
export async function refreshRush() {
  if (!currentOwner()) {
    clearRush();
    return;
  }
  await work(async (transport) => {
    const status = rushStatusSchema.parse(await transport(''));
    return { status, run: status.run };
  });
}
export async function startRush(id: string, mode: RushMode) {
  await mutate({ action: 'start', id, mode });
}
export async function answerRush(id: string, index: number, answer: string) {
  await mutate({ action: 'answer', id, index, answer });
}
export async function endRush(id: string, abandon = false) {
  await mutate({ action: abandon ? 'abandon' : 'finish', id });
}
async function mutate(body: RushRequest) {
  await work(async (transport) => {
    const run = rushViewSchema.parse(await transport('', body));
    if (body.action === 'start' || run.state !== 'active') {
      const status = rushStatusSchema.parse(await transport(''));
      return { run: status.run, status, board: null };
    }
    return { run };
  });
}
export async function refreshRushBoard(mode: RushMode, scope: RushLeaderboard['scope']) {
  await work(async (transport) => ({
    board: rushLeaderboardSchema.parse(await transport('?board=' + scope + '&mode=' + mode)),
  }));
}
