import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { firstLesson, catalogue } from '@harmonia/content/authoring';
import { lessonEvent, lessonPlan } from '@harmonia/content';
import type { LearningEvent } from '@harmonia/content';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
  nextLessonExercise,
} from '@harmonia/exercises';
import type { LessonDatabase } from '@/storage/lesson-repository';
import {
  createLearningRepository,
  initializeLearningDatabase,
} from '@/storage/learning-repository';
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
function event(id = 'one'): LearningEvent {
  let lesson = createLessonSession(firstLesson, 'sqlite-learning');
  while (lesson.phase === 'initial') {
    const active = activeLessonSession(lesson),
      item = active && currentItem(active);
    if (!item) throw new Error('Aufgabe fehlt');
    lesson = nextLessonExercise(answerLesson(lesson, expectedAnswer(item)));
  }
  return lessonEvent(id, lesson, 1000, 2000);
}
let db: DatabaseSync;
beforeEach(() => {
  db = new DatabaseSync(':memory:');
});
afterEach(() => {
  db.close();
});
async function repository() {
  await initializeLearningDatabase(adapter(db));
  return createLearningRepository(adapter(db));
}

describe('Lernpfad mit echter SQLite', () => {
  it('ein beschädigter Rating-Cache verdeckt keine intakten Lernnachweise', async () => {
    const repo = await repository();
    await repo.save('a', event());
    db.prepare('INSERT INTO learning_meta VALUES (?,?)').run('ratings:a', '{broken');
    expect(await repo.ratings('a')).toBeNull();
    expect(await repo.list('a')).toHaveLength(1);
  });
  it('importiert alte Versuche einmal und überträgt Gastdaten nur in das erste gewählte Konto', async () => {
    const repo = await repository(),
      one = event();
    await repo.importLegacy([one]);
    await repo.importLegacy([event('not-imported')]);
    expect(await repo.imported()).toBe(true);
    await repo.claimGuest('account-a');
    expect(await repo.list('guest')).toEqual([]);
    expect((await repo.list('account-a')).map((r) => r.event)).toEqual([one]);
    await repo.claimGuest('account-b');
    expect(await repo.list('account-b')).toEqual([]);
    await repo.save('guest', event('new-guest'));
    await repo.claimGuest('account-b');
    expect((await repo.list('account-a')).map((r) => r.event.id)).toEqual(['one']);
    expect((await repo.list('account-b')).map((r) => r.event.id)).toEqual(['new-guest']);
  });
  it('weist veränderte IDs zurück und bewahrt die Warteschlange bei fehlgeschlagener Transaktion', async () => {
    const repo = await repository(),
      one = event();
    await repo.save('a', one);
    await expect(repo.save('a', { ...one, finishedAt: 3000 })).rejects.toThrow('ID');
    await repo.save('a', event('two'));
    expect((await repo.list('a')).map((r) => r.event.id)).toEqual(['one', 'two']);
    expect((await repo.list('a')).every((r) => r.pending && r.sequence === null)).toBe(true);
  });
  it('quittiert Uploads und Cursor atomar, lädt über mehrere Seiten und bleibt bei Wiederholung idempotent', async () => {
    const repo = await repository(),
      one = event();
    await repo.save('a', one);
    // Der Upload kann hinter der ersten Downloadseite liegen. ACK überlebt einen Neustart.
    await repo.merge('a', {
      accepted: ['one'],
      rows: [{ sequence: 2, event: event('older') }],
      cursor: 2,
      more: true,
    });
    expect((await repo.list('a')).find((r) => r.event.id === 'one')).toMatchObject({
      pending: false,
      sequence: null,
    });
    await repo.merge('a', {
      accepted: [],
      rows: [{ sequence: 5, event: one }],
      cursor: 5,
      more: false,
    });
    await repo.save('a', one);
    expect((await repo.list('a')).find((r) => r.event.id === 'one')).toMatchObject({
      pending: false,
      sequence: 5,
    });
    expect(await repo.cursor('a')).toBe(5);
    expect(await repo.cursor('b')).toBe(0);
    await expect(
      repo.merge('a', {
        accepted: [],
        rows: [{ sequence: 6, event: event('bad-page') }],
        cursor: 7,
        more: false,
      }),
    ).rejects.toThrow('Cursor');
    expect((await repo.list('a')).map((r) => r.event.id)).not.toContain('bad-page');
    expect(await repo.cursor('a')).toBe(5);
  });
  it('rollt eine widersprüchliche Serverzeile samt ACK und Cursor zurück', async () => {
    const repo = await repository(),
      one = event();
    await repo.save('a', one);
    await expect(
      repo.merge('a', {
        accepted: ['one'],
        rows: [{ sequence: 1, event: { ...one, finishedAt: 4000 } }],
        cursor: 1,
        more: false,
      }),
    ).rejects.toThrow('ID');
    expect((await repo.list('a'))[0]).toMatchObject({ pending: true, sequence: null });
    expect(await repo.cursor('a')).toBe(0);
  });
  it('überträgt bei einem Gast-Konflikt weder halbe Daten noch einen falschen Eigentümer', async () => {
    const repo = await repository(),
      one = event();
    await repo.importLegacy([event('earlier'), one]);
    await repo.save('a', { ...one, finishedAt: 4000 });
    await expect(repo.claimGuest('a')).rejects.toThrow();
    expect(await repo.list('guest')).toHaveLength(2);
    expect(await repo.list('a')).toHaveLength(1);
  });
  it('erhält Antworten, Konto-Cursor und Bereichsauswahl nach echtem Dateineustart', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'harmonia-learning-'));
    try {
      let disk = new DatabaseSync(join(dir, 'learning.db'));
      await initializeLearningDatabase(adapter(disk));
      let repo = createLearningRepository(adapter(disk));
      await repo.save('a', event());
      await repo.merge('a', {
        accepted: ['one'],
        rows: [{ sequence: 9, event: event() }],
        cursor: 9,
        more: false,
      });
      await repo.saveView('a', { areaId: 'rhythm', level: 2, expanded: ['rhythm.l2.compound'] });
      const ratings = {
        throughSequence: 9,
        skills: {
          read: { rating: 1600, deviation: 100, volatility: 0.06, attempts: 2, updatedAt: 2000 },
        },
        buckets: {},
      };
      await repo.saveRatings('a', ratings);
      disk.close();
      disk = new DatabaseSync(join(dir, 'learning.db'));
      repo = createLearningRepository(adapter(disk));
      expect((await repo.list('a'))[0]).toMatchObject({ sequence: 9, pending: false });
      expect(await repo.cursor('a')).toBe(9);
      expect(await repo.view('a')).toEqual({
        areaId: 'rhythm',
        level: 2,
        expanded: ['rhythm.l2.compound'],
      });
      expect(await repo.view('b')).toEqual({ areaId: null, level: null, expanded: [] });
      expect(await repo.exists('one')).toBe(true);
      expect(await repo.ratings('a')).toEqual(ratings);
      expect(await repo.ratings('b')).toBeNull();
      await repo.eraseScope('a');
      expect(await repo.ratings('a')).toBeNull();
      disk.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it('importiert den bisherigen Einstufungssnapshot einmal und überträgt ihn mit dem Gastkonto', async () => {
    const repo = await repository();
    const data = {
      schemaVersion: 1 as const,
      last: null,
      active: {
        bankKey: 'bank',
        seed: 'guest-test',
        startedAt: 1,
        endedAt: null,
        actions: [],
        answer: null,
      },
    };
    await repo.importPlacement('guest', data);
    await repo.importPlacement('b', data);
    await repo.claimGuest('a');
    expect(await repo.placement('guest')).toEqual({ schemaVersion: 1, active: null, last: null });
    expect(await repo.placement('a')).toEqual(data);
    expect(await repo.placement('b')).toEqual({ schemaVersion: 1, active: null, last: null });
    const restarted = createLearningRepository(adapter(db));
    expect(await restarted.placement('a')).toEqual(data);
  });
  it('beschädigte Payloads und unbekannte DB-Versionen werden nicht still gelöscht', async () => {
    const repo = await repository();
    await repo.save('a', event());
    db.exec("UPDATE learning_events SET payload = 'invalid'");
    await expect(repo.list('a')).rejects.toThrow();
    db.exec('PRAGMA user_version = 9');
    await expect(initializeLearningDatabase(adapter(db))).rejects.toThrow('version');
    expect(db.prepare('SELECT count(*) AS count FROM learning_events').get()?.['count']).toBe(1);
  });
});

describe('Kontogebundene laufende Lektionen und XP-Belege', () => {
  function running(id = 'active') {
    const plan = lessonPlan(catalogue, 'notation.l1.staff.positions');
    if (!plan) throw new Error('Plan fehlt');
    return {
      schemaVersion: 1 as const,
      id,
      lessonId: plan.id,
      contentVersion: plan.contentVersion,
      planKey: plan.planKey,
      seed: 456,
      startedAt: 1,
      finishedAt: null,
      timeZone: 'Europe/Berlin',
      introCard: 1,
      started: false,
      actions: [],
      answer: 'C',
    };
  }
  it('bewahrt Einführung und Auswahl nach Wiederöffnung, getrennt von anderen Konten', async () => {
    const repo = await repository(),
      draft = running();
    await repo.saveDraft('a', draft);
    const loaded = createLearningRepository(adapter(db));
    expect(await loaded.draft('a', draft.lessonId)).toEqual(draft);
    expect(await loaded.drafts('a')).toEqual({ [draft.lessonId]: draft });
    expect(await loaded.drafts('b')).toEqual({});
    expect(await loaded.drafts('guest')).toEqual({});
  });
  it('ein späteres Löschen des alten Ergebnisses entfernt niemals einen neuen Durchgang', async () => {
    const repo = await repository(),
      old = running(),
      next = { ...old, id: 'next', answer: 'D' };
    await repo.saveDraft('a', old);
    await Promise.all([repo.saveDraft('a', next), repo.clearDraft('a', old.lessonId, old.id)]);
    expect(await repo.draft('a', old.lessonId)).toEqual(next);
    await repo.clearDraft('a', next.lessonId, next.id);
    expect(await repo.drafts('a')).toEqual({});
    expect(await repo.list('a')).toEqual([]);
  });
  it('ein Fehler beim Speichern erhält den vorherigen Stand für erneutes Laden', async () => {
    const repo = await repository(),
      draft = running();
    await repo.saveDraft('a', draft);
    db.exec(
      "CREATE TRIGGER deny_draft BEFORE UPDATE ON learning_meta BEGIN SELECT RAISE(ABORT,'full'); END",
    );
    await expect(repo.saveDraft('a', { ...draft, answer: 'D' })).rejects.toThrow('full');
    expect(await repo.draft('a', draft.lessonId)).toEqual(draft);
  });
  it('XP und ACK werden gemeinsam übernommen und bleiben nach Wiederöffnung erhalten', async () => {
    const repo = await repository(),
      proof = event();
    await repo.save('a', proof);
    await repo.merge('a', {
      accepted: [proof.id],
      rows: [{ sequence: 1, event: proof, reward: { amount: 18, date: '2026-10-13' } }],
      cursor: 1,
      more: false,
    });
    expect(await repo.list('a')).toEqual([
      expect.objectContaining({ reward: { amount: 18, date: '2026-10-13' }, pending: false }),
    ]);
    const loaded = createLearningRepository(adapter(db));
    expect((await loaded.list('a'))[0]?.reward?.amount).toBe(18);
    expect(await loaded.list('b')).toEqual([]);
  });
  it('ein falscher Cursor rollt auch die XP-Buchung zurück', async () => {
    const repo = await repository(),
      proof = event();
    await repo.save('a', proof);
    await expect(
      repo.merge('a', {
        accepted: [proof.id],
        rows: [{ sequence: 1, event: proof, reward: { amount: 18, date: '2026-10-13' } }],
        cursor: 2,
        more: false,
      }),
    ).rejects.toThrow('Cursor');
    expect((await repo.list('a'))[0]?.reward).toBeUndefined();
    expect((await repo.list('a'))[0]?.pending).toBe(true);
  });
});
