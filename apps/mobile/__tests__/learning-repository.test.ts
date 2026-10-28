import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { firstLesson, catalogue } from '@harmonia/content/authoring';
import {
  lessonEvent,
  lessonPlan,
  localReviewState,
  createLevelFivePreview,
  LEVEL_FIVE_PREVIEW_TTL,
  validateLearningEvent,
  lessonProgress,
} from '@harmonia/content';
import { blockErasedScope } from '@/privacy/guard';
import type { LearningEvent } from '@harmonia/content';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
  nextLessonExercise,
  skipLessonVoice,
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
  it.each([false, true])(
    'verdichtet Chor-Evidenz mit Gesang=%s ohne den Abschluss umzudeuten',
    async (sing) => {
      const plan = lessonPlan(catalogue, 'aural.l4.choir.alto.lesson');
      if (!plan) throw Error('Missing choir plan');
      let session = createLessonSession(plan, 'sqlite-choir');
      let sung = false;
      while (session.phase === 'initial') {
        const active = activeLessonSession(session);
        const item = active && currentItem(active);
        if (!item) throw Error('Missing task');
        if (item.type === 'CHOIR_PART' && (!sing || sung)) session = skipLessonVoice(session);
        else {
          if (item.type === 'CHOIR_PART') sung = true;
          session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
        }
      }
      const repo = await repository();
      const proof = lessonEvent('choir-retention', session, 1000, 2000, 'Europe/Berlin');
      await repo.save('choir-owner', proof);
      await repo.compact('choir-owner', catalogue, 3000);
      const row = (await repo.list('choir-owner'))[0];
      expect(row?.event.kind).toBe('retained');
      expect(validateLearningEvent(catalogue, row?.event).lesson).toEqual(lessonProgress(session));
      expect(row?.reward).toMatchObject({
        qualified: sing,
        ...(sing ? {} : { amount: 0, coins: 0 }),
      });
      expect(JSON.stringify(row?.event)).not.toContain('choir:[');
      expect(await repo.list('another-choir-owner')).toEqual([]);
      await repo.compact('choir-owner', catalogue, 3000);
      expect(
        validateLearningEvent(catalogue, (await repo.list('choir-owner'))[0]?.event).lesson?.passed,
      ).toBe(sing);
    },
  );
  it('trennt interne Vorschauen von Lernnachweisen, anderen Konten und Gastübernahme', async () => {
    const repo = await repository(),
      now = Date.now();
    const a = JSON.stringify(
      createLevelFivePreview(catalogue, 'counterpoint.l5.species.lesson3', 'preview-a', now),
    );
    expect(await repo.comparePreview('preview-alice', null, a)).toBe(true);
    expect(await repo.preview('preview-bob')).toBeNull();
    expect(await repo.drafts('preview-alice')).toEqual({});
    expect(await repo.list('preview-alice')).toEqual([]);
    await repo.claimGuest('preview-bob', catalogue);
    expect(await repo.preview('preview-bob')).toBeNull();
    expect(await repo.preview('preview-alice')).toBe(a);
  });
  it('verhindert veraltetes Überschreiben und Löschen durch zwei Tabs', async () => {
    const repo = await repository(),
      draft = createLevelFivePreview(
        catalogue,
        'counterpoint.l5.species.lesson3',
        'preview-cas',
        Date.now(),
      );
    const first = JSON.stringify(draft),
      next = JSON.stringify({ ...draft, introCard: 1 });
    expect(await repo.comparePreview('preview-tabs', null, first)).toBe(true);
    const results = await Promise.all([
      repo.comparePreview('preview-tabs', first, next),
      repo.comparePreview('preview-tabs', first, null),
    ]);
    expect(results).toEqual([true, false]);
    expect(await repo.preview('preview-tabs')).toBe(next);
    expect(await repo.comparePreview('preview-tabs', first, first)).toBe(false);
  });
  it('löscht Vorschauen bei Kontolöschung und sperrt verzögerte Schreibversuche', async () => {
    const repo = await repository(),
      raw = JSON.stringify(
        createLevelFivePreview(
          catalogue,
          'counterpoint.l5.species.lesson3',
          'preview-erase',
          Date.now(),
        ),
      );
    await repo.comparePreview('preview-erased', null, raw);
    await repo.comparePreview('preview-kept', null, raw);
    blockErasedScope('preview-erased', []);
    await repo.eraseScope('preview-erased');
    expect(await repo.preview('preview-erased')).toBeNull();
    expect(await repo.preview('preview-kept')).toBe(raw);
    await expect(repo.comparePreview('preview-erased', null, raw)).rejects.toThrow('Erased');
  });
  it('entfernt abgelaufene und beschädigte Vorschauen, erhält übrige lokale Metadaten', async () => {
    const repo = await repository(),
      now = Date.now();
    const draft = createLevelFivePreview(
      catalogue,
      'counterpoint.l5.species.lesson3',
      'preview-retain',
      now,
    );
    await repo.comparePreview('preview-new', null, JSON.stringify(draft));
    await repo.comparePreview(
      'preview-old',
      null,
      JSON.stringify({ ...draft, createdAt: now - LEVEL_FIVE_PREVIEW_TTL }),
    );
    db.prepare('INSERT INTO learning_meta VALUES(?,?)').run('preview:damaged', 'invalid-json');
    db.prepare('INSERT INTO learning_meta VALUES(?,?)').run('unrelated', 'keep');
    await repo.prunePreviews(now);
    expect(await repo.preview('preview-old')).toBeNull();
    expect(await repo.preview('damaged')).toBeNull();
    expect(await repo.preview('preview-new')).not.toBeNull();
    expect(db.prepare('SELECT value FROM learning_meta WHERE id=?').get('unrelated')).toEqual({
      value: 'keep',
    });
  });
  it('bewahrt FSRS-Termine atomar beim Entfernen alter Detailantworten', async () => {
    const repo = await repository();
    await repo.save('guest', event());
    const before = localReviewState(catalogue, await repo.list('guest'));
    await repo.compact('guest', catalogue, 3000);
    const cache = await repo.reviews('guest');
    expect(cache).not.toBeNull();
    expect((await repo.list('guest'))[0]?.event.kind).toBe('retained');
    expect(localReviewState(catalogue, await repo.list('guest'), cache)).toEqual(before);
    expect(await repo.reviews('other')).toBeNull();
    await repo.compact('guest', catalogue, 3000);
    expect(
      localReviewState(catalogue, await repo.list('guest'), await repo.reviews('guest')),
    ).toEqual(before);
    await repo.eraseScope('guest');
    expect(await repo.reviews('guest')).toBeNull();
  });
  it('übernimmt verdichtete Gast-Termine genau in das erste gewählte Konto', async () => {
    const repo = await repository();
    await repo.save('guest', event());
    const expected = localReviewState(catalogue, await repo.list('guest'));
    await repo.compact('guest', catalogue, 3000);
    await repo.claimGuest('a', catalogue);
    expect(localReviewState(catalogue, await repo.list('a'), await repo.reviews('a'))).toEqual(
      expected,
    );
    expect(await repo.reviews('guest')).toBeNull();
    await repo.claimGuest('b', catalogue);
    expect(await repo.reviews('b')).toBeNull();
  });
  it('übernimmt frische Gast-Nachweise ohne doppeltes lokales FSRS-Fortschreiben', async () => {
    const repo = await repository();
    await repo.save('guest', event());
    const expected = localReviewState(catalogue, await repo.list('guest'));
    await repo.claimGuest('a', catalogue);
    expect(localReviewState(catalogue, await repo.list('a'), await repo.reviews('a'))).toEqual(
      expected,
    );
  });
  it('ein beschädigter FSRS-Cache verdeckt keine intakten Antworten', async () => {
    const repo = await repository();
    await repo.save('a', event());
    db.prepare('INSERT INTO learning_meta VALUES (?,?)').run('reviews:a', '{broken');
    expect(await repo.reviews('a')).toBeNull();
    expect(await repo.list('a')).toHaveLength(1);
  });
  it('ein beschädigter Rating-Cache verdeckt keine intakten Lernnachweise', async () => {
    const repo = await repository();
    await repo.save('a', event());
    db.prepare('INSERT INTO learning_meta VALUES (?,?)').run('ratings:a', '{broken');
    expect(await repo.ratings('a')).toBeNull();
    expect(await repo.reviews('a')).toBeNull();
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
      const reviews = {
        ...localReviewState(catalogue, await repo.list('a')),
        throughSequence: 9,
        throughPosition: 0,
      };
      await repo.saveReviews('a', reviews);
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
      expect(await repo.reviews('a')).toEqual(reviews);
      expect(await repo.reviews('b')).toBeNull();
      expect(await repo.ratings('b')).toBeNull();
      await repo.eraseScope('a');
      expect(await repo.ratings('a')).toBeNull();
      expect(await repo.reviews('a')).toBeNull();
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
