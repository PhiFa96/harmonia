import {
  reminderPlanSchema,
  motivationLocalSchema,
  motivationDeviceSchema,
} from '@harmonia/content';
import type { MotivationLocal, MotivationDevice } from '@harmonia/content';
import type { LessonDatabase } from './lesson-repository.ts';
export async function initializeMotivationDatabase(db: LessonDatabase) {
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((version?.user_version ?? 0) > 1) throw new Error('Unbekannte Motivationsdatenbank');
  await db.execAsync(
    `BEGIN; CREATE TABLE IF NOT EXISTS motivation_records(scope TEXT PRIMARY KEY,payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS motivation_meta(id TEXT PRIMARY KEY,payload TEXT NOT NULL); PRAGMA user_version=1; COMMIT;`,
  );
}
export function createMotivationRepository(db: LessonDatabase) {
  let queue: Promise<unknown> = Promise.resolve();
  function transaction<T>(fn: () => Promise<T>): Promise<T> {
    const work = queue
      .catch(() => undefined)
      .then(async () => {
        await db.execAsync('BEGIN');
        try {
          const value = await fn();
          await db.execAsync('COMMIT');
          return value;
        } catch (e) {
          await db.execAsync('ROLLBACK');
          throw e;
        }
      });
    queue = work;
    return work;
  }
  const read = async (scope: string): Promise<MotivationLocal | null> => {
    const row = await db.getFirstAsync<{ payload: string }>(
      'SELECT payload FROM motivation_records WHERE scope=?',
      scope,
    );
    return row ? motivationLocalSchema.parse(JSON.parse(row.payload) as unknown) : null;
  };
  const put = async (scope: string, value: MotivationLocal) => {
    await db.runAsync(
      'INSERT INTO motivation_records VALUES (?,?) ON CONFLICT(scope) DO UPDATE SET payload=excluded.payload',
      scope,
      JSON.stringify(motivationLocalSchema.parse(value)),
    );
  };
  return {
    reminderPlan: () =>
      transaction(async () => {
        const row = await db.getFirstAsync<{ payload: string }>(
          "SELECT payload FROM motivation_meta WHERE id='reminders'",
        );
        return row
          ? reminderPlanSchema.parse(JSON.parse(row.payload) as unknown)
          : { lastRemindedAt: 0, entries: [] };
      }),
    saveReminderPlan: (input: unknown) =>
      transaction(async () => {
        const plan = reminderPlanSchema.parse(input);
        await db.runAsync(
          "INSERT INTO motivation_meta VALUES ('reminders',?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
          JSON.stringify(plan),
        );
      }),
    read: (scope: string) => transaction(() => read(scope)),
    save: (scope: string, value: MotivationLocal) => transaction(() => put(scope, value)),
    claimGuest: (scope: string) =>
      transaction(async () => {
        if (scope === 'guest') return;
        const guest = await read('guest');
        if (!guest) return;
        const own = await read(scope);
        if (!own) await put(scope, { ...guest, preferencesEstablished: false });
        else {
          const purchases = [...own.purchases];
          for (const row of guest.purchases) {
            const old = purchases.find((p) => p.purchase.id === row.purchase.id);
            if (old && JSON.stringify(old.purchase) !== JSON.stringify(row.purchase))
              throw new Error('Gastkauf kollidiert');
            if (!old) purchases.push(row);
          }
          await put(scope, {
            ...own,
            practicedAt: Math.max(own.practicedAt, guest.practicedAt),
            purchases,
          });
        }
        await db.runAsync("DELETE FROM motivation_records WHERE scope='guest'");
      }),
    device: (create: () => MotivationDevice) =>
      transaction(async () => {
        const row = await db.getFirstAsync<{ payload: string }>(
          "SELECT payload FROM motivation_meta WHERE id='device'",
        );
        const value = row
          ? motivationDeviceSchema.parse(JSON.parse(row.payload) as unknown)
          : create();
        const next = { ...value, revision: value.revision + 1 };
        await db.runAsync(
          "INSERT INTO motivation_meta VALUES ('device',?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
          JSON.stringify(next),
        );
        return next;
      }),
  };
}
