import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { firstLesson } from '@harmonia/content';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
  nextLessonExercise,
  skipLessonAural,
  startLessonReview,
} from '@harmonia/exercises';
import {
  createLessonAttempt,
  createLessonRepository,
  initializeLessonDatabase,
} from '@/storage/lesson-repository';
import type { LessonAttempt, LessonDatabase } from '@/storage/lesson-repository';

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
function completed(skipHearing = false) {
  let session = createLessonSession(firstLesson, 120);
  while (session.phase === 'initial' || session.phase === 'review') {
    const active = required(activeLessonSession(session));
    const item = required(currentItem(active));
    if (skipHearing && item.type === 'INTERVAL_IDENTIFY_AURAL') session = skipLessonAural(session);
    else session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
    if (session.phase === 'review-intro') session = startLessonReview(session);
  }
  return session;
}
const START = '2026-10-04T10:00:00.000Z';
const END = '2026-10-04T10:03:12.000Z';
let db: DatabaseSync;
beforeEach(() => {
  db = new DatabaseSync(':memory:');
});
afterEach(() => {
  db.close();
});

describe('Lokale Ergebnisse mit echter SQLite', () => {
  it('legt das Schema wiederholbar an und weist neuere Datenbankversionen zurück', async () => {
    await initializeLessonDatabase(adapter(db));
    await initializeLessonDatabase(adapter(db));
    expect(db.prepare('PRAGMA user_version').get()?.['user_version']).toBe(1);
    db.exec('PRAGMA user_version = 2');
    await expect(initializeLessonDatabase(adapter(db))).rejects.toThrow('Unbekannte');
    expect(db.prepare('PRAGMA user_version').get()?.['user_version']).toBe(2);
  });
  it('speichert Inhaltsversion, Seed, Antworten, Hinweise, Aufgaben und Zeit verlustfrei', async () => {
    await initializeLessonDatabase(adapter(db));
    const repo = createLessonRepository(adapter(db));
    const attempt = createLessonAttempt('id-1', completed(), START, END);
    await repo.save(attempt);
    const row = db.prepare('SELECT payload FROM lesson_attempts WHERE id = ?').get('id-1');
    const saved: unknown = JSON.parse(String(row?.['payload']));
    expect(saved).toEqual(attempt);
    expect(attempt.durationMs).toBe(192000);
    expect(await repo.latest(firstLesson.id)).toMatchObject({
      content_version: 1,
      correct: 10,
      answered: 10,
      review_total: 0,
    });
  });
  it('ein wiederholter Schreibversuch mit derselben Client-ID erzeugt kein Duplikat und überschreibt nichts', async () => {
    await initializeLessonDatabase(adapter(db));
    const repo = createLessonRepository(adapter(db));
    const attempt = createLessonAttempt('same-id', completed(), START, END);
    await repo.save(attempt);
    await repo.save({ ...attempt, finishedAt: '2026-10-04T11:00:00.000Z' });
    expect(db.prepare('SELECT COUNT(*) AS count FROM lesson_attempts').get()?.['count']).toBe(1);
    expect((await repo.latest(firstLesson.id))?.finished_at).toBe(END);
  });
  it('lädt nach Schließen und erneutem Öffnen derselben Datei den letzten Durchgang', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'harmonia-sqlite-'));
    const file = join(directory, 'results.db');
    let disk = new DatabaseSync(file);
    try {
      await initializeLessonDatabase(adapter(disk));
      await createLessonRepository(adapter(disk)).save(
        createLessonAttempt('persisted', completed(), START, END),
      );
      disk.close();
      disk = new DatabaseSync(file);
      await initializeLessonDatabase(adapter(disk));
      expect((await createLessonRepository(adapter(disk)).latest(firstLesson.id))?.id).toBe(
        'persisted',
      );
    } finally {
      disk.close();
      rmSync(directory, { recursive: true });
    }
  });
  it('zeigt bei gleichem Zeitstempel den zuletzt gespeicherten Durchgang', async () => {
    await initializeLessonDatabase(adapter(db));
    const repo = createLessonRepository(adapter(db));
    await repo.save(createLessonAttempt('zzz-first', completed(), START, END));
    await repo.save(createLessonAttempt('aaa-last', completed(), START, END));
    expect((await repo.latest(firstLesson.id))?.id).toBe('aaa-last');
  });
  it('sortiert Versuche nach Ende und trennt Lektionen; IDs und SQL-Zeichen bleiben gebundene Werte', async () => {
    await initializeLessonDatabase(adapter(db));
    const repo = createLessonRepository(adapter(db));
    const quoted = "other'; DROP TABLE lesson_attempts; --";
    const other = completed();
    await repo.save(createLessonAttempt('new', completed(), START, END));
    await repo.save(createLessonAttempt('old', completed(), START, START));
    await repo.save(
      createLessonAttempt(
        'other',
        { ...other, lesson: { ...other.lesson, id: quoted } },
        START,
        END,
      ),
    );
    expect((await repo.latest(firstLesson.id))?.id).toBe('new');
    expect((await repo.latest(quoted))?.id).toBe('other');
    expect(await repo.latest('unknown')).toBeNull();
  });
  it('übersprungene Hörfragen zählen nicht als Fehler und bleiben im gespeicherten Ergebnis erkennbar', async () => {
    await initializeLessonDatabase(adapter(db));
    const repo = createLessonRepository(adapter(db));
    await repo.save(createLessonAttempt('paused', completed(true), START, END));
    expect(await repo.latest(firstLesson.id)).toMatchObject({
      correct: 7,
      answered: 7,
      skipped: 3,
    });
  });
  it('weist unvollständige Versuche und ungültige Zeiten zurück; negative Dauer wird auf null begrenzt', async () => {
    const session = createLessonSession(firstLesson, 1);
    expect(() => createLessonAttempt('x', session, START, END)).toThrow('abgeschlossene');
    expect(() => createLessonAttempt('x', completed(), START, 'invalid')).toThrow('Ungültiger');
    expect(createLessonAttempt('x', completed(), END, START).durationMs).toBe(0);
    const bad = {
      ...createLessonAttempt('x', completed(), START, END),
      session,
    } satisfies LessonAttempt;
    await expect(createLessonRepository(adapter(db)).save(bad)).rejects.toThrow(
      'nicht abgeschlossen',
    );
  });
});

function required<T>(value: T | undefined | null): T {
  if (value == null) throw new Error('Erwarteter Testwert fehlt');
  return value;
}
