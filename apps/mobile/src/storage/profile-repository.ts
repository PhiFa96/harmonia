import { storedAccountSettingsSchema } from '@harmonia/content';
import type { StoredAccountSettings } from '@harmonia/content';
import type { LessonDatabase } from './lesson-repository.ts';
import { assertPrivacyWrite } from '../privacy/guard.ts';
export async function initializeProfileDatabase(db: LessonDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((row?.user_version ?? 0) > 1) throw new Error('Unknown profile database');
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS account_settings(scope TEXT PRIMARY KEY,payload TEXT NOT NULL); PRAGMA user_version=1;',
  );
}
export function createProfileRepository(db: LessonDatabase) {
  return {
    async load(scope: string): Promise<StoredAccountSettings | null> {
      const row = await db.getFirstAsync<{ payload: string }>(
        'SELECT payload FROM account_settings WHERE scope=?',
        scope,
      );
      return row ? storedAccountSettingsSchema.parse(JSON.parse(row.payload) as unknown) : null;
    },
    async save(scope: string, value: StoredAccountSettings) {
      assertPrivacyWrite(scope);
      const json = JSON.stringify(storedAccountSettingsSchema.parse(value));
      await db.runAsync(
        'INSERT INTO account_settings VALUES(?,?) ON CONFLICT(scope) DO UPDATE SET payload=excluded.payload',
        scope,
        json,
      );
    },
    async erase(scope: string) {
      await db.runAsync('DELETE FROM account_settings WHERE scope=?', scope);
    },
  };
}
