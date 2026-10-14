import type { DeviceSnapshot, OnboardingData } from '../onboarding/model.ts';
import { parseDeviceSnapshot } from '../onboarding/model.ts';
import type { LessonDatabase } from './lesson-repository.ts';
import { parsePlacementData } from '../placement/model.ts';
import type { PlacementData } from '../placement/model.ts';

export async function initializeDeviceDatabase(db: LessonDatabase): Promise<void> {
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((version?.user_version ?? 0) > 2)
    throw new Error('Unbekannte lokale Einstellungs-Datenbankversion');
  await db.execAsync(`BEGIN;
    CREATE TABLE IF NOT EXISTS device_preferences (id INTEGER PRIMARY KEY CHECK(id = 1), payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS placement_state (id INTEGER PRIMARY KEY CHECK(id = 1), payload TEXT NOT NULL);
    PRAGMA user_version = 2;
    COMMIT;`);
}
export function createDeviceRepository(db: LessonDatabase) {
  return {
    async eraseAccount(scope: string, ids: readonly string[], empty: OnboardingData) {
      await db.runAsync(
        "UPDATE placement_state SET payload=json_set(payload,'$.active',NULL,'$.last',NULL) WHERE EXISTS(SELECT 1 FROM device_preferences WHERE json_extract(payload,'$.onboarding.accountId')=?)",
        scope,
      );
      for (const id of ids) {
        await db.runAsync(
          "UPDATE placement_state SET payload=json_set(payload,'$.active',NULL) WHERE json_extract(payload,'$.active.id')=?",
          id,
        );
        await db.runAsync(
          "UPDATE placement_state SET payload=json_set(payload,'$.last',NULL) WHERE json_extract(payload,'$.last.id')=?",
          id,
        );
      }
      await db.runAsync(
        "UPDATE device_preferences SET payload=json_set(payload,'$.onboarding',json(?)) WHERE json_extract(payload,'$.onboarding.accountId')=?",
        JSON.stringify(empty),
        scope,
      );
    },
    async loadPlacement(): Promise<PlacementData | null> {
      const row = await db.getFirstAsync<{ payload: string }>(
        'SELECT payload FROM placement_state WHERE id = 1',
      );
      return row ? parsePlacementData(row.payload) : null;
    },
    async savePlacement(data: PlacementData): Promise<void> {
      const payload = JSON.stringify(parsePlacementData(JSON.stringify(data)));
      await db.runAsync(
        'INSERT INTO placement_state (id, payload) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload',
        payload,
      );
    },
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
