import { DatabaseSync } from 'node:sqlite';
import type { ContentReport } from '@harmonia/content';
import type { LessonDatabase } from '@/storage/lesson-repository';
import { createReportRepository, initializeReportDatabase } from '@/storage/report-repository';
export const reportFixture = (id = '00000000-0000-4000-8000-000000000001'): ContentReport => ({
  id,
  createdAt: 1000,
  locale: 'de',
  category: 'audio',
  message: 'Beispiel',
  source: { kind: 'practice', set: 'mini', seed: 42, contentVersion: 1, index: 0 },
  answer: null,
  hintLevel: 1,
  checked: false,
});
let db: DatabaseSync;
function adapter(): LessonDatabase {
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
beforeEach(() => {
  db = new DatabaseSync(':memory:');
});
afterEach(() => {
  db.close();
});
async function repository() {
  await initializeReportDatabase(adapter());
  return createReportRepository(adapter());
}
it('speichert offline idempotent, lädt erneut und ordnet Gastmeldungen nur dem ersten Konto zu', async () => {
  const repo = await repository(),
    one = reportFixture();
  await Promise.all([repo.save('guest', one), repo.save('guest', one)]);
  expect((await repo.list('guest')).length).toBe(1);
  const restarted = createReportRepository(adapter());
  await restarted.claimGuest('a');
  await restarted.claimGuest('b');
  expect(await restarted.list('guest')).toEqual([]);
  expect(await restarted.list('b')).toEqual([]);
  expect((await restarted.list('a'))[0]).toEqual({ report: one, status: 'pending' });
  await expect(restarted.save('a', { ...one, message: 'verändert' })).rejects.toThrow('ID');
});
it('bestätigt nur exakte Meldungen atomar und bewahrt nicht verfügbare Quellen', async () => {
  const repo = await repository(),
    one = reportFixture(),
    two = reportFixture('00000000-0000-4000-8000-000000000002');
  await repo.save('a', one);
  await repo.save('a', two);
  await expect(
    repo.acknowledge('a', { accepted: [one.id], unavailable: [] }, [one, two]),
  ).rejects.toThrow();
  await expect(
    repo.acknowledge('a', { accepted: [one.id], unavailable: [one.id] }, [one, two]),
  ).rejects.toThrow();
  expect((await repo.list('a')).every((r) => r.status === 'pending')).toBe(true);
  await repo.acknowledge('a', { accepted: [one.id], unavailable: [two.id] }, [one, two]);
  expect((await repo.list('a')).map((r) => r.status)).toEqual(['sent', 'unavailable']);
  await repo.retry('a');
  expect((await repo.list('a')).map((r) => r.status)).toEqual(['sent', 'pending']);
  await expect(
    repo.acknowledge('b', { accepted: [one.id], unavailable: [] }, [one]),
  ).rejects.toThrow();
});
it('bewahrt beschädigte Daten und unbekannte Datenbankversionen', async () => {
  const repo = await repository();
  await repo.save('guest', reportFixture());
  db.exec("UPDATE content_report_outbox SET payload = '{}'");
  await expect(repo.list('guest')).rejects.toThrow();
  expect(db.prepare('SELECT count(*) AS n FROM content_report_outbox').get()).toEqual({ n: 1 });
  db.exec('PRAGMA user_version = 2');
  await expect(initializeReportDatabase(adapter())).rejects.toThrow('Unbekannte');
});
