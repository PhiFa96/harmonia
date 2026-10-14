import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_ACCESS_POLICY as policy } from '@harmonia/content';
import type { AccessSource } from '@harmonia/content';
import { initializeAccessDatabase, createAccessRepository } from '@/access/repository';
import type { LessonDatabase } from '@/storage/lesson-repository';
let db: DatabaseSync, repo: ReturnType<typeof createAccessRepository>;
const source: AccessSource = { kind: 'practice', set: 'reading', seed: 1, contentVersion: 1 };
beforeEach(async () => {
  db = new DatabaseSync(':memory:');
  const adapter: LessonDatabase = {
    execAsync: (sql) => {
      db.exec(sql);
      return Promise.resolve();
    },
    runAsync: (sql, ...params) => Promise.resolve(db.prepare(sql).run(...params)),
    getFirstAsync: <T>(sql: string, ...params: (string | number)[]) =>
      Promise.resolve((db.prepare(sql).get(...params) as T | undefined) ?? null),
  };
  await initializeAccessDatabase(adapter);
  repo = createAccessRepository(adapter);
});
afterEach(() => {
  db.close();
});
it('charges once across concurrent retries and retains the exact saved source', async () => {
  const grants = await Promise.all([
    repo.reserveGuest('a', source, 12, 1, policy, 0),
    repo.reserveGuest('a', source, 12, 1, policy, 0),
  ]);
  expect(grants.map((g) => g.status.remaining)).toEqual([18, 18]);
  expect((await repo.existing('guest', 'a', source))?.status.remaining).toBe(18);
  expect((await repo.reserveGuest('a', { ...source, seed: 2 }, 12, 1, policy, 0)).reason).toBe(
    'conflict',
  );
  expect((await repo.guestStatus(policy, 0)).remaining).toBe(18);
});
it('blocks a whole new run, then regenerates with fractional time preserved', async () => {
  await repo.reserveGuest('a', source, 20, 1, policy, 0);
  expect((await repo.reserveGuest('b', source, 12, 1, policy, 0)).reason).toBe('limit');
  expect((await repo.guestStatus(policy, 1199999)).remaining).toBe(11);
  expect((await repo.reserveGuest('b', source, 12, 1, policy, 1200000)).status.remaining).toBe(0);
  expect((await repo.guestStatus(policy, 1800000)).remaining).toBe(1);
});
it('keeps level boundaries and owner caches isolated without spending on denial', async () => {
  expect((await repo.reserveGuest('premium', source, 9, 3, policy, 0)).reason).toBe('premium');
  expect((await repo.guestStatus(policy, 0)).remaining).toBe(30);
  const grant = await repo.reserveGuest('a', source, 9, 0, policy, 0);
  await repo.save('account-a', source, grant);
  expect(await repo.existing('account-b', 'a', source)).toBeNull();
  await expect(repo.existing('account-a', 'a', { ...source, seed: 2 })).rejects.toThrow('conflict');
});
