import { create } from 'zustand';
import { catalogue } from '@harmonia/content/catalogue';
import {
  DEFAULT_ACCESS_POLICY,
  accessGrantSchema,
  accessStatusSchema,
  accessSourceDetails,
} from '@harmonia/content';
import type { AccessSource, AccessStatus, AccessGrant } from '@harmonia/content';
import { useAuthState } from '@/auth';
import { useDeviceState } from '@/state/device';
import { configuredAuth } from '@/auth/config';
import { getAccessRepository } from './storage.ts';
export const useAccess = create<{
  owner: string;
  status: AccessStatus | null;
  loading: boolean;
  error: boolean;
}>(() => ({ owner: 'guest', status: null, loading: true, error: false }));
export const accessOwner = () => {
  const user = useAuthState.getState().session?.user;
  return user && !user.is_anonymous ? user.id : 'guest';
};
let generation = 0,
  previous: string | undefined;
async function request(path: string, body?: unknown) {
  const config = configuredAuth(),
    owner = accessOwner(),
    session = useAuthState.getState().session;
  if (!config || (owner !== 'guest' && !session)) throw new Error('Access configuration');
  const response = await fetch(config.url + '/functions/v1/access' + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      apikey: config.key,
      ...(owner !== 'guest' && session ? { Authorization: 'Bearer ' + session.access_token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  const data: unknown = await response.json();
  if (response.status !== 200 && response.status !== 403) throw new Error('Access unavailable');
  if (owner !== accessOwner()) throw new Error('Access identity');
  return data;
}
export async function refreshAccess() {
  const owner = accessOwner(),
    token = ++generation;
  useAccess.setState({ owner, loading: true, error: false });
  try {
    const repo = await getAccessRepository();
    let status: AccessStatus;
    if (owner === 'guest') {
      let policy = DEFAULT_ACCESS_POLICY,
        revision = 1;
      try {
        if (configuredAuth()) {
          const remote = accessStatusSchema.parse(await request('?public=true'));
          policy = remote.policy;
          revision = remote.revision;
        }
      } catch {
        const cached = await repo.status(owner);
        if (cached) {
          policy = cached.policy;
          revision = cached.revision;
        }
      }
      status = await repo.guestStatus(policy, Date.now(), revision);
    } else status = accessStatusSchema.parse(await request(''));
    await repo.saveStatus(owner, status);
    if (token === generation && owner === accessOwner())
      useAccess.setState({ status, loading: false, error: false });
  } catch {
    if (token === generation && owner === accessOwner())
      useAccess.setState({ status: null, loading: false, error: true });
  }
}
export function initializeAccess() {
  const device = useDeviceState.getState();
  if (device.phase !== 'ready') return;
  const owner = accessOwner(),
    key = owner + '|' + (device.storage === 'memory' ? 'memory' : 'sqlite');
  if (previous !== key) {
    previous = key;
    generation++;
    useAccess.setState({ owner, status: null, loading: true, error: false });
    void refreshAccess();
  }
}
useAuthState.subscribe(initializeAccess);
/** Existing authorized runs can finish offline; new account starts require a server decision. */
export async function authorizeStart(id: string, source: AccessSource): Promise<AccessGrant> {
  const owner = accessOwner(),
    repo = await getAccessRepository(),
    cached = await repo.existing(owner, id, source);
  if (owner !== accessOwner()) throw new Error('Access identity');
  if (cached) return cached;
  let grant: AccessGrant;
  if (owner === 'guest') {
    let current = useAccess.getState().status;
    if (!current) {
      await refreshAccess();
      current = useAccess.getState().status;
    }
    if (!current) throw new Error('Access unavailable');
    const { cost, level } = accessSourceDetails(catalogue, source);
    grant = await repo.reserveGuest(
      id,
      source,
      cost,
      level,
      current.policy,
      Date.now(),
      current.revision,
    );
  } else grant = accessGrantSchema.parse(await request('', { id, source }));
  if (owner !== accessOwner()) throw new Error('Access identity');
  await repo.save(owner, source, grant);
  await repo.saveStatus(owner, grant.status);
  if (owner !== accessOwner()) throw new Error('Access identity');
  generation++;
  useAccess.setState({ owner, status: grant.status, loading: false, error: false });
  return grant;
}
