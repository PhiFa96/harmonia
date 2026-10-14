import { consentEventSchema, consentChoicesSchema, DEFAULT_CONSENTS } from '@harmonia/content';
import type { ConsentEvent } from '@harmonia/content';
import type { LessonDatabase } from '@/storage/lesson-repository';
import { assertPrivacyWrite } from './guard.ts';
export async function initializePrivacyDatabase(db: LessonDatabase) {
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS privacy_events(position INTEGER PRIMARY KEY AUTOINCREMENT,scope TEXT NOT NULL,id TEXT NOT NULL,payload TEXT NOT NULL,acked INTEGER NOT NULL DEFAULT 0,UNIQUE(scope,id));CREATE TABLE IF NOT EXISTS privacy_meta(id TEXT PRIMARY KEY,value TEXT NOT NULL);',
  );
}
export function createPrivacyRepository(db: LessonDatabase) {
  let queue: Promise<unknown> = Promise.resolve();
  const atomic = <T>(work: () => Promise<T>) => {
    const task = queue
      .catch(() => undefined)
      .then(async () => {
        await db.execAsync('BEGIN IMMEDIATE');
        try {
          const result = await work();
          await db.execAsync('COMMIT');
          return result;
        } catch (e) {
          await db.execAsync('ROLLBACK');
          throw e;
        }
      });
    queue = task;
    return task;
  };
  const list = async (scope: string) => {
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT json_group_array(json_object('event',json(payload),'acked',acked)) as value FROM (SELECT payload,acked FROM privacy_events WHERE scope=? ORDER BY position)",
      scope,
    );
    const parsed: unknown = JSON.parse(row?.value ?? '[]');
    if (!Array.isArray(parsed)) throw new Error('Consent storage');
    return parsed.map((value: unknown) => {
      if (!value || typeof value !== 'object' || !('event' in value) || !('acked' in value))
        throw new Error('Consent storage');
      return { event: consentEventSchema.parse(value.event), acked: value.acked === 1 };
    });
  };
  return {
    list,
    async pendingDeletions() {
      const rows = await db.getFirstAsync<{ value: string }>(
        "SELECT json_group_array(json_object('scope',substr(id,8),'id',value)) AS value FROM privacy_meta WHERE substr(id,1,7)='delete:'",
      );
      const parsed: unknown = JSON.parse(rows?.value ?? '[]');
      if (!Array.isArray(parsed)) throw new Error('Deletion storage');
      return parsed.map((row: unknown) => {
        if (
          !row ||
          typeof row !== 'object' ||
          !('scope' in row) ||
          !('id' in row) ||
          typeof row.scope !== 'string' ||
          typeof row.id !== 'string'
        )
          throw new Error('Deletion storage');
        return { scope: row.scope, id: row.id };
      });
    },
    async choices(scope: string) {
      const choices = { ...DEFAULT_CONSENTS } as {
        analytics: boolean;
        push: boolean;
        marketing: boolean;
      };
      for (const row of await list(scope)) choices[row.event.purpose] = row.event.granted;
      return consentChoicesSchema.parse(choices);
    },
    save(scope: string, event: ConsentEvent) {
      return atomic(async () => {
        assertPrivacyWrite(scope, event.id);
        const payload = JSON.stringify(consentEventSchema.parse(event));
        const old = await db.getFirstAsync<{ payload: string }>(
          'SELECT payload FROM privacy_events WHERE scope=? AND id=?',
          scope,
          event.id,
        );
        if (old && old.payload !== payload) throw new Error('Consent conflict');
        await db.runAsync(
          'INSERT INTO privacy_events(scope,id,payload) VALUES(?,?,?) ON CONFLICT(scope,id) DO NOTHING',
          scope,
          event.id,
          payload,
        );
      });
    },
    acknowledge(scope: string, id: string) {
      return atomic(() =>
        db.runAsync('UPDATE privacy_events SET acked=1 WHERE scope=? AND id=?', scope, id),
      );
    },
    async meta(id: string) {
      return (
        (await db.getFirstAsync<{ value: string }>('SELECT value FROM privacy_meta WHERE id=?', id))
          ?.value ?? null
      );
    },
    putMeta(id: string, value: string) {
      return atomic(() =>
        db.runAsync(
          'INSERT INTO privacy_meta VALUES(?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value',
          id,
          value,
        ),
      );
    },
    clearDeleteMeta(scope: string) {
      return atomic(() => db.runAsync('DELETE FROM privacy_meta WHERE id=?', 'delete:' + scope));
    },
    erase(scope: string) {
      return atomic(async () => {
        await db.runAsync('DELETE FROM privacy_events WHERE scope=?', scope);
      });
    },
  };
}
