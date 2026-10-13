import type { DeviceSnapshot } from '../onboarding/model.ts';
import { parseDeviceSnapshot } from '../onboarding/model.ts';
import type { LessonDatabase } from './lesson-repository.ts';

export async function initializeDeviceDatabase(db: LessonDatabase): Promise<void> {
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((version?.user_version ?? 0) > 1)
    throw new Error('Unbekannte lokale Einstellungs-Datenbankversion');
  await db.execAsync(`BEGIN;
    CREATE TABLE IF NOT EXISTS device_preferences (id INTEGER PRIMARY KEY CHECK(id = 1), payload TEXT NOT NULL);
    PRAGMA user_version = 1;
    COMMIT;`);
}
export function createDeviceRepository(db: LessonDatabase) {
  return {
    async load(): Promise<DeviceSnapshot | null> {
      const row = await db.getFirstAsync<{ payload: string }>(
        'SELECT payload FROM device_preferences WHERE id = 1',
      );
      return row ? parseDeviceSnapshot(row.payload) : null;
    },
    async save(snapshot: DeviceSnapshot): Promise<void> {
      const payload = JSON.stringify(parseDeviceSnapshot(JSON.stringify(snapshot)));
      await db.runAsync(
        'INSERT INTO device_preferences (id, payload) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload',
        payload,
      );
    },
  };
}
