import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { firstLesson, catalogue } from '@harmonia/content/authoring';
import { resolveLesson } from '@harmonia/content';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
  nextLessonExercise,
  revealLessonHint,
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
  it('bewahrt die Klaviaturparameter und begrenzten Vorzeichen unverändert neben der vorherigen Notationseinheit', async () => {
    await initializeLessonDatabase(adapter(db));
    const repository = createLessonRepository(adapter(db));
    for (const id of [
      'notation.l1.staff.anchor',
      'notation.l1.keyboard.keys',
      'notation.l1.keyboard.steps',
      'notation.l1.keyboard.accidentals',
    ]) {
      const content = required(resolveLesson(catalogue, id));
      let session = createLessonSession(content, 'sqlite-keyboard');
      while (session.phase === 'initial') {
        const item = required(currentItem(required(activeLessonSession(session))));
        session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
      }
      const attempt = createLessonAttempt(id + '-run', session, START, END);
      await repository.save(attempt);
      expect(
        JSON.parse(
          String(
            db.prepare('SELECT payload FROM lesson_attempts WHERE id = ?').get(attempt.id)?.[
              'payload'
            ],
          ),
        ),
      ).toEqual(attempt);
      expect(await repository.latest(id)).toMatchObject({
        lesson_id: id,
        content_version: id.includes('.keyboard.') ? 4 : 3,
        correct: content.exercises.length,
        answered: content.exercises.length,
      });
    }
    expect(db.prepare('SELECT COUNT(*) AS n FROM lesson_attempts').get()?.['n']).toBe(4);
    expect(db.prepare('PRAGMA user_version').get()?.['user_version']).toBe(1);
  });
  it('trennt drei neue Lektionen mit Version 3 von der bisherigen Lektion und ihren neuesten Ergebnissen', async () => {
    await initializeLessonDatabase(adapter(db));
    const repository = createLessonRepository(adapter(db));
    await repository.save(createLessonAttempt('previous-lesson', completed(), START, END));
    for (const [name, count] of [
      ['anchor', 8],
      ['positions', 10],
      ['reading', 12],
    ] as const) {
      const content = required(resolveLesson(catalogue, `notation.l1.staff.${name}`));
      let state = createLessonSession(content, 'sqlite-notation');
      while (state.phase === 'initial') {
        const item = required(currentItem(required(activeLessonSession(state))));
        state = nextLessonExercise(answerLesson(state, expectedAnswer(item)));
      }
      const attempt = createLessonAttempt(
        `notation-${name}`,
        state,
        START,
        '2026-10-09T10:05:00.000Z',
      );
      await repository.save(attempt);
      expect(await repository.latest(content.id)).toMatchObject({
        id: `notation-${name}`,
        lesson_id: content.id,
        content_version: 3,
        answered: count,
        correct: count,
      });
      expect(
        JSON.parse(
          String(
            db.prepare('SELECT payload FROM lesson_attempts WHERE id = ?').get(attempt.id)?.[
              'payload'
            ],
          ),
        ),
      ).toEqual(attempt);
    }
    expect(await repository.latest(firstLesson.id)).toMatchObject({
      id: 'previous-lesson',
      content_version: 1,
      answered: 10,
    });
    expect(await repository.latest('unknown.lesson')).toBeNull();
    expect(db.prepare('SELECT COUNT(*) AS total FROM lesson_attempts').get()?.['total']).toBe(4);
    expect(db.prepare('PRAGMA user_version').get()?.['user_version']).toBe(1);
  });
  it('speichert Wissensfrage, vertauschte Zuordnung und Reihenfolge mit Hilfe und neuer Wiederholung ohne Migration', async () => {
    let session = createLessonSession(
      {
        id: 'test.knowledge',
        contentVersion: 1,
        exercises: [
          { type: 'KNOWLEDGE_MC', params: { topics: ['intervals'] } },
          { type: 'MATCH', params: { topics: ['scales'], count: 3 } },
          { type: 'ORDER', params: { topics: ['pitches'], count: 4 } },
        ],
      },
      'sqlite-knowledge',
    );
    const first = required(currentItem(session.initial));
    session = nextLessonExercise(
      answerLesson(
        revealLessonHint(session),
        required(first.choices.find((id) => id !== expectedAnswer(first))),
      ),
    );
    while (
      session.phase === 'initial' ||
      session.phase === 'review' ||
      session.phase === 'review-intro'
    ) {
      if (session.phase === 'review-intro') session = startLessonReview(session);
      const item = required(currentItem(required(activeLessonSession(session)))),
        correct = expectedAnswer(item);
      const answer =
        session.phase === 'initial'
          ? correct.slice(0, 6) + correct.slice(6).split(',').reverse().join(',')
          : correct;
      session = nextLessonExercise(answerLesson(session, answer));
    }
    await initializeLessonDatabase(adapter(db));
    const attempt = createLessonAttempt('knowledge-id', session, START, END),
      repository = createLessonRepository(adapter(db));
    await repository.save(attempt);
    expect(
      JSON.parse(
        String(
          db.prepare('SELECT payload FROM lesson_attempts WHERE id = ?').get('knowledge-id')?.[
            'payload'
          ],
        ),
      ),
    ).toEqual(attempt);
    expect(await repository.latest(session.lesson.id)).toMatchObject({
      answered: 3,
      correct: 0,
      review_correct: 3,
      review_total: 3,
    });
    expect(attempt.session.initial.records[0]).toMatchObject({
      hintLevel: 1,
      result: { correct: false },
    });
    expect(db.prepare('PRAGMA user_version').get()?.['user_version']).toBe(1);
  });
  it('speichert Rhythmus-Zeitwerte, Erstfehler, Hilfe und Wiederholung ohne Migration', async () => {
    let session = createLessonSession(
      {
        id: 'test.rhythm',
        contentVersion: 1,
        exercises: [
          { type: 'RHYTHM_TAP', params: { meters: ['4/4'], tempos: [96] } },
          { type: 'METER_IDENTIFY', params: { meters: ['3/4', '6/8'] } },
        ],
      },
      'sqlite-rhythm',
    );
    const source = required(currentItem(session.initial));
    const correct = expectedAnswer(source),
      duplicate = correct.replace('taps:', 'taps:0,');
    session = nextLessonExercise(answerLesson(revealLessonHint(session), duplicate));
    while (
      session.phase === 'initial' ||
      session.phase === 'review' ||
      session.phase === 'review-intro'
    ) {
      if (session.phase === 'review-intro') session = startLessonReview(session);
      const item = required(currentItem(required(activeLessonSession(session))));
      session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
    }
    await initializeLessonDatabase(adapter(db));
    const attempt = createLessonAttempt('rhythm-id', session, START, END),
      repository = createLessonRepository(adapter(db));
    await repository.save(attempt);
    expect(
      JSON.parse(
        String(
          db.prepare('SELECT payload FROM lesson_attempts WHERE id = ?').get('rhythm-id')?.[
            'payload'
          ],
        ),
      ),
    ).toEqual(attempt);
    expect(await repository.latest(session.lesson.id)).toMatchObject({
      correct: 1,
      answered: 2,
      review_correct: 1,
      review_total: 1,
    });
    expect(attempt.session.initial.records[0]).toMatchObject({
      hintLevel: 1,
      result: { answer: duplicate, correct: false },
    });
    expect(db.prepare('PRAGMA user_version').get()?.['user_version']).toBe(1);
  });
  it('speichert Akkorde samt falscher Erstwertung, Hinweis und neuer Wiederholung ohne Migration', async () => {
    let session = createLessonSession(
      {
        id: 'test.chords',
        contentVersion: 1,
        exercises: [
          { type: 'CHORD_BUILD', params: { types: ['major', 'minor'], roots: ['C', 'D', 'F'] } },
          { type: 'CHORD_IDENTIFY', params: { types: ['major', 'minor'] } },
          { type: 'CHORD_IDENTIFY', params: { types: ['major', 'minor'], presentation: 'aural' } },
        ],
      },
      'sqlite-chords',
    );
    const answer = expectedAnswer(required(currentItem(session.initial))).split(',');
    answer[2] = answer[1] ?? 'C4';
    session = nextLessonExercise(answerLesson(revealLessonHint(session), answer.join(',')));
    while (
      session.phase === 'initial' ||
      session.phase === 'review' ||
      session.phase === 'review-intro'
    ) {
      if (session.phase === 'review-intro') session = startLessonReview(session);
      const item = required(currentItem(required(activeLessonSession(session))));
      session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
    }
    await initializeLessonDatabase(adapter(db));
    const repository = createLessonRepository(adapter(db));
    const attempt = createLessonAttempt('chord-id', session, START, END);
    await repository.save(attempt);
    const payload = db
      .prepare('SELECT payload FROM lesson_attempts WHERE id = ?')
      .get('chord-id')?.['payload'];
    expect(JSON.parse(String(payload))).toEqual(attempt);
    expect(await repository.latest(session.lesson.id)).toMatchObject({
      correct: 2,
      answered: 3,
      review_correct: 1,
      review_total: 1,
    });
    expect(attempt.session.initial.records[0]).toMatchObject({
      result: { answer: answer.join(','), correct: false },
      hintLevel: 1,
    });
    expect(db.prepare('PRAGMA user_version').get()?.['user_version']).toBe(1);
  });
  it('speichert Tonleitern und Vorzeichnungen mit Hilfen und Wiederholung verlustfrei im bestehenden Schema', async () => {
    let session = createLessonSession(
      {
        id: 'test.tonality',
        contentVersion: 1,
        exercises: [
          { type: 'SCALE_BUILD', params: { types: ['major', 'naturalMinor'], fifths: [-1, 0, 1] } },
          { type: 'SCALE_IDENTIFY', params: { types: ['major', 'naturalMinor'] } },
          { type: 'KEYSIG_IDENTIFY', params: { modes: ['major', 'minor'] } },
          { type: 'KEYSIG_BUILD', params: { fifths: [1, 2, 3] } },
        ],
      },
      'sqlite-tonality',
    );
    const item = required(currentItem(session.initial));
    const wrong = expectedAnswer(item).split(',');
    wrong[1] = wrong[0]?.slice(6) ?? 'C4';
    session = nextLessonExercise(answerLesson(revealLessonHint(session), wrong.join(',')));
    while (
      session.phase === 'initial' ||
      session.phase === 'review' ||
      session.phase === 'review-intro'
    ) {
      if (session.phase === 'review-intro') session = startLessonReview(session);
      const item = required(currentItem(required(activeLessonSession(session))));
      session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
    }
    await initializeLessonDatabase(adapter(db));
    const attempt = createLessonAttempt('tonality-id', session, START, END);
    const repository = createLessonRepository(adapter(db));
    await repository.save(attempt);
    const payload = db
      .prepare('SELECT payload FROM lesson_attempts WHERE id = ?')
      .get('tonality-id')?.['payload'];
    expect(JSON.parse(String(payload))).toEqual(attempt);
    expect(await repository.latest('test.tonality')).toMatchObject({
      correct: 3,
      answered: 4,
      review_correct: 1,
      review_total: 1,
    });
    expect(db.prepare('PRAGMA user_version').get()?.['user_version']).toBe(1);
  });
  it('speichert freie Eingaben samt falscher Erstwertung, Hilfen und neuer Wiederholungsvariante verlustfrei', async () => {
    let session = createLessonSession(
      {
        id: 'test.pitch-input',
        contentVersion: 1,
        exercises: [
          { type: 'NOTE_PLACE', params: { clefs: ['treble'] } },
          { type: 'KEY_FIND', params: {} },
          { type: 'INTERVAL_BUILD', params: { intervals: ['M3', 'P5'], direction: 'both' } },
        ],
      },
      'sqlite-pitch-input',
    );
    const first = required(currentItem(session.initial));
    session = nextLessonExercise(
      answerLesson(revealLessonHint(session), expectedAnswer(first) === 'C4' ? 'D4' : 'C4'),
    );
    while (
      session.phase === 'initial' ||
      session.phase === 'review' ||
      session.phase === 'review-intro'
    ) {
      if (session.phase === 'review-intro') session = startLessonReview(session);
      const item = required(currentItem(required(activeLessonSession(session))));
      session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
    }
    await initializeLessonDatabase(adapter(db));
    const attempt = createLessonAttempt('input-id', session, START, END);
    await createLessonRepository(adapter(db)).save(attempt);
    expect(
      JSON.parse(
        String(
          db.prepare('SELECT payload FROM lesson_attempts WHERE id = ?').get('input-id')?.[
            'payload'
          ],
        ),
      ),
    ).toEqual(attempt);
    expect(await createLessonRepository(adapter(db)).latest(session.lesson.id)).toMatchObject({
      correct: 2,
      answered: 3,
      review_total: 1,
      review_correct: 1,
    });
    expect(attempt.session.initial.records[0]?.hintLevel).toBe(1);
  });
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
