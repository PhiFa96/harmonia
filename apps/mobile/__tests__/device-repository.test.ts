import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDeviceRepository, initializeDeviceDatabase } from '@/storage/device-repository';
import { DEFAULT_SETTINGS } from '@/onboarding/model';
import { completedDeviceFixture } from '../jest/device-fixture.ts';
import type { LessonDatabase } from '@/storage/lesson-repository';
function adapter(db: DatabaseSync): LessonDatabase {
  return {
    execAsync: (sql) => {
      db.exec(sql);
      return Promise.resolve();
    },
    runAsync: (sql, ...params) => Promise.resolve(db.prepare(sql).run(...params)),
    getFirstAsync: <T>(sql: string, ...params: (string | number)[]) =>
      Promise.resolve((db.prepare(sql).get(...params) as T | undefined) ?? null),
  };
}
describe('Geräteeinstellungen mit echter SQLite', () => {
  it('bewahrt Sprache, Ziel, Einwilligung und Mini-Antwort über einen echten Dateineustart', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'harmonia-device-')),
      path = join(dir, 'device.db');
    let db = new DatabaseSync(path);
    try {
      await initializeDeviceDatabase(adapter(db));
      const repo = createDeviceRepository(adapter(db));
      expect(await repo.load()).toBeNull();
      const snapshot = {
        schemaVersion: 1 as const,
        settings: { ...DEFAULT_SETTINGS, locale: 'en-GB' as const, appearance: 'dark' as const },
        onboarding: {
          ...completedDeviceFixture(),
          goal: 'ensemble' as const,
          dailyGoal: 30 as const,
          reminderConsent: true,
          reminderTime: '19:00' as const,
        },
      };
      await repo.save(snapshot);
      await repo.save(snapshot);
      expect(db.prepare('SELECT count(*) AS n FROM device_preferences').get()?.['n']).toBe(1);
      db.close();
      db = new DatabaseSync(path);
      await initializeDeviceDatabase(adapter(db));
      expect(await createDeviceRepository(adapter(db)).load()).toEqual(snapshot);
      expect(db.prepare('PRAGMA user_version').get()?.['user_version']).toBe(1);
      expect(
        db.prepare("SELECT name FROM sqlite_master WHERE name = 'lesson_attempts'").get(),
      ).toBeUndefined();
    } finally {
      db.close();
      rmSync(dir, { recursive: true });
    }
  });
  it('verwirft ungültige neue Writes, ohne einen bestehenden Datensatz zu überschreiben', async () => {
    const db = new DatabaseSync(':memory:');
    try {
      await initializeDeviceDatabase(adapter(db));
      const repo = createDeviceRepository(adapter(db)),
        snapshot = {
          schemaVersion: 1 as const,
          settings: DEFAULT_SETTINGS,
          onboarding: completedDeviceFixture(),
        };
      await repo.save(snapshot);
      await expect(
        repo.save({ ...snapshot, onboarding: { ...snapshot.onboarding, ageConfirmed: false } }),
      ).rejects.toThrow();
      expect(await repo.load()).toEqual(snapshot);
    } finally {
      db.close();
    }
  });
  it('überschreibt keine unbekannte Datenbankversion und keine defekten gespeicherten Daten', async () => {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec('PRAGMA user_version = 2');
      await expect(initializeDeviceDatabase(adapter(db))).rejects.toThrow();
      expect(db.prepare('PRAGMA user_version').get()?.['user_version']).toBe(2);
      db.exec('PRAGMA user_version = 0');
      await initializeDeviceDatabase(adapter(db));
      db.prepare('INSERT INTO device_preferences VALUES (1, ?)').run('{broken');
      await expect(createDeviceRepository(adapter(db)).load()).rejects.toThrow();
      expect(db.prepare('SELECT payload FROM device_preferences').get()?.['payload']).toBe(
        '{broken',
      );
    } finally {
      db.close();
    }
  });
});
