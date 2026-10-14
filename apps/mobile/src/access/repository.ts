import { assertPrivacyWrite } from '@/privacy/guard';
import {
  accessGrantSchema,
  accessPolicySchema,
  accessSourceSchema,
  accessStatusSchema,
  guestAccessStatus,
  refillEnergy,
} from '@harmonia/content';
import type {
  AccessSource,
  AccessGrant,
  AccessPolicy,
  AccessStatus,
  EnergyState,
} from '@harmonia/content';
import type { LessonDatabase } from '@/storage/lesson-repository';
export async function initializeAccessDatabase(db: LessonDatabase) {
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS access_cache (scope TEXT NOT NULL,id TEXT NOT NULL,source TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(scope,id)); CREATE TABLE IF NOT EXISTS access_guest_energy(id INTEGER PRIMARY KEY CHECK(id=1),balance INTEGER NOT NULL,refilledAt INTEGER NOT NULL,revision INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS access_settings(id TEXT PRIMARY KEY,value TEXT NOT NULL);',
  );
}
export function createAccessRepository(db: LessonDatabase) {
  let queue: Promise<unknown> = Promise.resolve();
  const atomic = <T>(work: () => Promise<T>) => {
    const result = queue
      .catch(() => undefined)
      .then(async () => {
        await db.execAsync('BEGIN IMMEDIATE');
        try {
          const value = await work();
          await db.execAsync('COMMIT');
          return value;
        } catch (e) {
          await db.execAsync('ROLLBACK');
          throw e;
        }
      });
    queue = result;
    return result;
  };
  const sourceKey = (source: AccessSource) => JSON.stringify(accessSourceSchema.parse(source));
  const energy = async (policy: AccessPolicy, now: number, revision: number) => {
    const old = await db.getFirstAsync<EnergyState>(
      'SELECT balance,refilledAt,revision FROM access_guest_energy WHERE id=1',
    );
    const state = refillEnergy(policy, old, now, revision);
    await db.runAsync(
      'INSERT INTO access_guest_energy VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET balance=excluded.balance,refilledAt=excluded.refilledAt,revision=excluded.revision',
      state.balance,
      state.refilledAt,
      state.revision,
    );
    return state;
  };
  return {
    eraseIds(ids: readonly string[]) {
      return atomic(async () => {
        for (const id of ids) await db.runAsync('DELETE FROM access_cache WHERE id=?', id);
      });
    },
    eraseScope(scope: string) {
      return atomic(async () => {
        await db.runAsync('DELETE FROM access_cache WHERE scope=?', scope);
        await db.runAsync('DELETE FROM access_settings WHERE id=?', 'status:' + scope);
      });
    },

    async existing(scope: string, id: string, source: AccessSource) {
      const row = await db.getFirstAsync<{ source: string; payload: string }>(
        'SELECT source,payload FROM access_cache WHERE scope=? AND id=?',
        scope,
        id,
      );
      if (!row) return null;
      if (row.source !== sourceKey(source)) throw new Error('Access context conflict');
      return accessGrantSchema.parse(JSON.parse(row.payload));
    },
    async save(scope: string, source: AccessSource, grant: AccessGrant) {
      assertPrivacyWrite(scope, grant.id);
      if (!grant.allowed) return;
      await atomic(async () => {
        const old = await db.getFirstAsync<{ source: string }>(
          'SELECT source FROM access_cache WHERE scope=? AND id=?',
          scope,
          grant.id,
        );
        if (old && old.source !== sourceKey(source)) throw new Error('Access context conflict');
        await db.runAsync(
          'INSERT INTO access_cache VALUES(?,?,?,?) ON CONFLICT(scope,id) DO UPDATE SET payload=excluded.payload',
          scope,
          grant.id,
          sourceKey(source),
          JSON.stringify(grant),
        );
      });
    },
    async status(scope: string): Promise<AccessStatus | null> {
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM access_settings WHERE id=?',
        'status:' + scope,
      );
      return row ? accessStatusSchema.parse(JSON.parse(row.value)) : null;
    },
    async saveStatus(scope: string, status: AccessStatus) {
      await atomic(async () => {
        assertPrivacyWrite(scope);
        await db.runAsync(
          'INSERT INTO access_settings VALUES(?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value',
          'status:' + scope,
          JSON.stringify(status),
        );
      });
    },
    guestStatus(policy: AccessPolicy, now: number, revision = 1) {
      return atomic(async () =>
        guestAccessStatus(policy, await energy(policy, now, revision), now, revision),
      );
    },
    reserveGuest(
      id: string,
      source: AccessSource,
      cost: number,
      level: number,
      policy: AccessPolicy,
      now: number,
      revision = 1,
    ) {
      return atomic(async () => {
        accessPolicySchema.parse(policy);
        if (!Number.isInteger(cost) || cost < 1 || cost > 200)
          throw new Error('Invalid access cost');
        const row = await db.getFirstAsync<{ source: string; payload: string }>(
          'SELECT source,payload FROM access_cache WHERE scope=? AND id=?',
          'guest',
          id,
        );
        const current = await energy(policy, now, revision);
        let reason: AccessGrant['reason'] = 'allowed';
        if (row && row.source !== sourceKey(source)) reason = 'conflict';
        else if (!row && level > policy.freeMaxLevel) reason = 'premium';
        else if (!row && cost > current.balance) reason = 'limit';
        if (!row && reason === 'allowed') {
          current.balance -= cost;
          await db.runAsync('UPDATE access_guest_energy SET balance=? WHERE id=1', current.balance);
        }
        const grant = accessGrantSchema.parse({
          allowed: reason === 'allowed',
          reason,
          id,
          cost,
          status: guestAccessStatus(policy, current, now, revision),
        });
        if (!row && grant.allowed)
          await db.runAsync(
            'INSERT INTO access_cache VALUES(?,?,?,?)',
            'guest',
            id,
            sourceKey(source),
            JSON.stringify(grant),
          );
        return grant;
      });
    },
  };
}
