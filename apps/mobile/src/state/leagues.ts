import { create } from 'zustand';
import { leagueSnapshotSchema } from '@harmonia/content';
import type { LeagueSnapshot } from '@harmonia/content';
import { useAuthState } from '../auth/index.ts';
import { configuredAuth } from '../auth/config.ts';
import { assertPrivacyWrite } from '../privacy/guard.ts';

export const useLeagues = create<{
  owner: string | null;
  data: LeagueSnapshot | null;
  loading: boolean;
  error: boolean;
}>(() => ({ owner: null, data: null, loading: false, error: false }));
let generation = 0;
const owner = () => useAuthState.getState().session?.user.id ?? null;
/** Explicit captured JWT: account changes cannot retarget an in-flight write. */
export function leagueTransport(actor: string, token: string) {
  const config = configuredAuth();
  if (!config) throw new Error('Leagues unavailable');
  return async (
    name: 'learner_league' | 'set_league_result_consent' | 'ack_league_result',
    body: object = {},
  ) => {
    const response = await fetch(config.url + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: {
        apikey: config.key,
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('Leagues unavailable');
    const text = await response.text();
    const result: unknown = text ? JSON.parse(text) : null;
    if (owner() !== actor) throw new Error('League owner changed');
    return result;
  };
}
export function clearLeagues() {
  generation++;
  useLeagues.setState({ owner: owner(), data: null, loading: false, error: false });
}
export async function refreshLeagues() {
  const session = useAuthState.getState().session,
    id = session?.user.id ?? null;
  if (!session || !id) {
    clearLeagues();
    return;
  }
  try {
    assertPrivacyWrite(id);
  } catch {
    clearLeagues();
    return;
  }
  const token = ++generation;
  const old = useLeagues.getState();
  useLeagues.setState({
    owner: id,
    data: old.owner === id ? old.data : null,
    loading: true,
    error: false,
  });
  try {
    const data = leagueSnapshotSchema.parse(
      await leagueTransport(id, session.access_token)('learner_league'),
    );
    if (token === generation && owner() === id) useLeagues.setState({ data, loading: false });
  } catch {
    if (token === generation && owner() === id)
      useLeagues.setState({ loading: false, error: true });
  }
}
export async function changeLeagueConsent(enabled: boolean) {
  const session = useAuthState.getState().session;
  if (!session) throw new Error('Account required');
  assertPrivacyWrite(session.user.id);
  await leagueTransport(session.user.id, session.access_token)('set_league_result_consent', {
    enabled,
  });
  await refreshLeagues();
}
export async function acknowledgeLeagueResult(week: string) {
  const session = useAuthState.getState().session;
  if (!session) return;
  assertPrivacyWrite(session.user.id);
  await leagueTransport(session.user.id, session.access_token)('ack_league_result', { week });
  await refreshLeagues();
}
export function leaguePushAllowed() {
  const state = useLeagues.getState();
  return state.owner === owner() && state.data?.pushConsent === true;
}
