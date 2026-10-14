import { accessSourceSchema, refillEnergy, guestAccessStatus } from '@harmonia/content';
import type { AccessSource, AccessStatus, AccessGrant, EnergyState } from '@harmonia/content';
import type { createAccessRepository } from './repository.ts';
/** Only used after the learner explicitly selects the temporary device session. */
export function createMemoryAccessRepository(): ReturnType<typeof createAccessRepository> {
  const grants = new Map<string, { source: string; grant: AccessGrant }>(),
    statuses = new Map<string, AccessStatus>();
  let energy: EnergyState | null = null;
  const key = (scope: string, id: string) => JSON.stringify([scope, id]);
  const sourceKey = (source: AccessSource) => JSON.stringify(accessSourceSchema.parse(source));
  return {
    existing(scope, id, source) {
      const previous = grants.get(key(scope, id));
      if (previous && previous.source !== sourceKey(source))
        return Promise.reject(new Error('Access context conflict'));
      return Promise.resolve(previous?.grant ?? null);
    },
    save(scope, source, grant) {
      if (grant.allowed) grants.set(key(scope, grant.id), { source: sourceKey(source), grant });
      return Promise.resolve();
    },
    status(scope) {
      return Promise.resolve(statuses.get(scope) ?? null);
    },
    saveStatus(scope, status) {
      statuses.set(scope, status);
      return Promise.resolve();
    },
    guestStatus(policy, now, revision = 1) {
      energy = refillEnergy(policy, energy, now, revision);
      return Promise.resolve(guestAccessStatus(policy, energy, now, revision));
    },
    reserveGuest(id, source, cost, level, policy, now, revision = 1) {
      const previous = grants.get(key('guest', id));
      energy = refillEnergy(policy, energy, now, revision);
      const reason = previous
        ? previous.source === sourceKey(source)
          ? 'allowed'
          : 'conflict'
        : level > policy.freeMaxLevel
          ? 'premium'
          : cost > energy.balance
            ? 'limit'
            : 'allowed';
      if (!previous && reason === 'allowed') energy.balance -= cost;
      const grant: AccessGrant = {
        allowed: reason === 'allowed',
        reason,
        id,
        cost,
        status: guestAccessStatus(policy, energy, now, revision),
      };
      if (!previous && grant.allowed)
        grants.set(key('guest', id), { source: sourceKey(source), grant });
      return Promise.resolve(grant);
    },
  };
}
