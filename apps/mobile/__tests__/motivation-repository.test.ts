import { DatabaseSync } from 'node:sqlite';
import {
  initializeMotivationDatabase,
  createMotivationRepository,
} from '@/storage/motivation-repository';
import type { LessonDatabase } from '@/storage/lesson-repository';
import { motivationFixture } from '../jest/motivation-fixture';
let db: DatabaseSync;
function adapter(): LessonDatabase {
  return {
    execAsync: (sql) => {
      db.exec(sql);
      return Promise.resolve();
    },
    runAsync: (sql, ...params) => Promise.resolve(db.prepare(sql).run(...params)),
    getFirstAsync: <T>(sql: string, ...params: (number | string)[]) =>
      Promise.resolve((db.prepare(sql).get(...params) as T | undefined) ?? null),
  };
}
async function repository() {
  await initializeMotivationDatabase(adapter());
  return createMotivationRepository(adapter());
}
beforeEach(() => {
  db = new DatabaseSync(':memory:');
});
afterEach(() => {
  db.close();
});
it('übernimmt Gastguthaben, Schutzkäufe und Wünsche dauerhaft in genau ein Konto', async () => {
  const repo = await repository(),
    data = motivationFixture();
  data.purchases.push({
    purchase: {
      id: '00000000-0000-4000-8000-000000000001',
      at: 1000,
      price: 10,
      ruleVersion: 1,
      timeZone: 'UTC',
    },
    acked: false,
  });
  await repo.save('guest', data);
  const restarted = createMotivationRepository(adapter());
  await restarted.claimGuest('a');
  await restarted.claimGuest('b');
  expect(await restarted.read('a')).toEqual(data);
  expect(await restarted.read('guest')).toBeNull();
  expect(await restarted.read('b')).toBeNull();
});
it('behält bestehende Kontowünsche und führt Gastkäufe ohne Doppelbuchung zusammen', async () => {
  const repo = await repository(),
    guest = motivationFixture(),
    own = motivationFixture();
  own.preferences.dailyGoal = 50;
  own.practicedAt = 200;
  guest.practicedAt = 500;
  await repo.save('a', own);
  await repo.save('guest', guest);
  await Promise.all([repo.claimGuest('a'), repo.claimGuest('a')]);
  expect(await repo.read('a')).toMatchObject({ practicedAt: 500, preferences: { dailyGoal: 50 } });
});
it('bewahrt eine Installationskennung und erhöht Revisionen atomar über Neustarts', async () => {
  const repo = await repository(),
    make = () => ({
      id: '00000000-0000-4000-8000-000000000001',
      key: '00000000-0000-4000-8000-000000000002',
      revision: 0,
    });
  const values = await Promise.all([repo.device(make), repo.device(make)]);
  expect(values.map((v) => v.revision)).toEqual([1, 2]);
  expect(await createMotivationRepository(adapter()).device(make)).toEqual({
    ...make(),
    revision: 3,
  });
});
it('speichert nur sieben konkrete Erinnerungen und behält den letzten Erinnerungszeitpunkt', async () => {
  const repo = await repository(),
    entry = { id: 'a', at: 500, date: '2026-10-14', owner: 'guest' };
  await repo.saveReminderPlan({ lastRemindedAt: 100, entries: [entry] });
  expect(await createMotivationRepository(adapter()).reminderPlan()).toEqual({
    lastRemindedAt: 100,
    entries: [entry],
  });
  await expect(
    repo.saveReminderPlan({ lastRemindedAt: 100, entries: Array(8).fill(entry) }),
  ).rejects.toThrow();
  expect((await repo.reminderPlan()).entries).toEqual([entry]);
});
it('weist beschädigte Daten und neuere Schema-Versionen ohne Löschen zurück', async () => {
  const repo = await repository();
  await repo.save('guest', motivationFixture());
  db.exec("UPDATE motivation_records SET payload='{}'");
  await expect(repo.read('guest')).rejects.toThrow();
  expect(db.prepare('SELECT count(*) n FROM motivation_records').get()).toEqual({ n: 1 });
  db.exec('PRAGMA user_version=2');
  await expect(initializeMotivationDatabase(adapter())).rejects.toThrow('Unbekannte');
});
it('erases one account and its notification plan while keeping another account', async () => {
  const repo = await repository();
  await repo.save('erase-motive-a', motivationFixture());
  await repo.save('erase-motive-b', motivationFixture());
  await repo.saveReminderPlan({
    lastRemindedAt: 1000,
    entries: [
      { id: 'a', at: 2000, date: '2026-10-14', owner: 'erase-motive-a' },
      { id: 'b', at: 3000, date: '2026-10-15', owner: 'erase-motive-b' },
    ],
  });
  await repo.eraseScope('erase-motive-a');
  expect(await repo.read('erase-motive-a')).toBeNull();
  expect(await repo.read('erase-motive-b')).not.toBeNull();
  expect((await repo.reminderPlan()).entries.map((entry) => entry.id)).toEqual(['b']);
});
