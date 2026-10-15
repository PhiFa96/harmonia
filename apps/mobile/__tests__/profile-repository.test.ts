import { DatabaseSync } from 'node:sqlite';
import { initializeProfileDatabase, createProfileRepository } from '@/storage/profile-repository';
import { DEFAULT_ACCOUNT_SETTINGS } from '@harmonia/content';
import type { LessonDatabase } from '@/storage/lesson-repository';
import { blockErasedScope } from '@/privacy/guard';
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
describe('Account-scoped profile SQLite', () => {
  it('preserves pending settings, isolates users, rejects corrupt payloads and erases one scope', async () => {
    const db = new DatabaseSync(':memory:');
    try {
      await initializeProfileDatabase(adapter(db));
      const repo = createProfileRepository(adapter(db));
      await repo.save('profile-a', {
        version: 1,
        settings: {
          ...DEFAULT_ACCOUNT_SETTINGS,
          noteNaming: 'intl',
          referenceHz: 442,
          displayName: 'Own alias',
        },
        dirty: { referenceHz: 442 },
      });
      await repo.save('profile-b', {
        version: 1,
        settings: { ...DEFAULT_ACCOUNT_SETTINGS, sound: false },
        dirty: { sound: false },
      });
      expect((await createProfileRepository(adapter(db)).load('profile-a'))?.dirty).toEqual({
        referenceHz: 442,
      });
      expect((await repo.load('profile-b'))?.settings.displayName).toBeNull();
      await repo.erase('profile-a');
      expect(await repo.load('profile-a')).toBeNull();
      expect((await repo.load('profile-b'))?.settings.sound).toBe(false);
      db.prepare('UPDATE account_settings SET payload=? WHERE scope=?').run(
        '{"version":99}',
        'profile-b',
      );
      await expect(repo.load('profile-b')).rejects.toThrow();
    } finally {
      db.close();
    }
  });
  it('cannot restore a deleted account through delayed local writes', async () => {
    const db = new DatabaseSync(':memory:');
    try {
      await initializeProfileDatabase(adapter(db));
      const repo = createProfileRepository(adapter(db));
      blockErasedScope('profile-erased-fixture', []);
      await expect(
        repo.save('profile-erased-fixture', {
          version: 1,
          settings: DEFAULT_ACCOUNT_SETTINGS,
          dirty: {},
        }),
      ).rejects.toThrow();
      expect(await repo.load('profile-erased-fixture')).toBeNull();
    } finally {
      db.close();
    }
  });
});
