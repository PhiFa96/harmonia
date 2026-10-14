import { assertPrivacyWrite } from '@/privacy/guard';
import type { LessonSession } from '@harmonia/exercises';
import { lessonSummary } from '@harmonia/exercises';

export interface LessonAttempt {
  readonly timeZone?: string;
  readonly id: string;
  readonly schemaVersion: 1;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly session: LessonSession;
  readonly summary: ReturnType<typeof lessonSummary>;
}
export interface SavedLessonSummary {
  readonly id: string;
  readonly lesson_id: string;
  readonly content_version: number;
  readonly finished_at: string;
  readonly correct: number;
  readonly answered: number;
  readonly skipped: number;
  readonly review_correct: number;
  readonly review_total: number;
  readonly review_answered: number;
  readonly review_skipped: number;
}
/** Kleine Schnittstelle: Expo SQLite im Betrieb, echte Node-SQLite-Datenbank im Test. */
export interface LessonDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: (string | number)[]): Promise<unknown>;
  getFirstAsync<T>(sql: string, ...params: (string | number)[]): Promise<T | null>;
}
export async function initializeLessonDatabase(db: LessonDatabase): Promise<void> {
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((version?.user_version ?? 0) > 1) throw new Error('Unbekannte lokale Datenbankversion');
  await db.execAsync(`
    BEGIN;
    CREATE TABLE IF NOT EXISTS lesson_attempts (
      id TEXT PRIMARY KEY NOT NULL,
      lesson_id TEXT NOT NULL,
      content_version INTEGER NOT NULL CHECK(content_version > 0),
      finished_at TEXT NOT NULL,
      correct INTEGER NOT NULL CHECK(correct >= 0 AND correct <= answered),
      answered INTEGER NOT NULL CHECK(answered >= 0),
      skipped INTEGER NOT NULL CHECK(skipped >= 0),
      review_correct INTEGER NOT NULL CHECK(review_correct >= 0 AND review_correct <= review_total),
      review_total INTEGER NOT NULL CHECK(review_total >= 0),
      review_answered INTEGER NOT NULL CHECK(review_answered >= 0 AND review_answered <= review_total),
      review_skipped INTEGER NOT NULL CHECK(review_skipped >= 0 AND review_skipped <= review_total),
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS lesson_attempts_lesson_finished ON lesson_attempts(lesson_id, finished_at DESC);
    PRAGMA user_version = 1;
    COMMIT;
  `);
}
export function createLessonAttempt(
  id: string,
  session: LessonSession,
  startedAt: string,
  finishedAt: string,
  timeZone?: string,
): LessonAttempt {
  if (session.phase !== 'complete') throw new Error('Nur abgeschlossene Lektionen speichern');
  const durationMs = Date.parse(finishedAt) - Date.parse(startedAt);
  if (!id || !Number.isFinite(durationMs)) throw new Error('Ungültiger Lektionsversuch');
  return {
    id,
    schemaVersion: 1,
    session,
    summary: lessonSummary(session),
    startedAt,
    finishedAt,
    ...(timeZone ? { timeZone } : {}),
    durationMs: Math.max(0, durationMs),
  };
}
export function createLessonRepository(db: LessonDatabase) {
  return {
    async eraseIds(ids: readonly string[]) {
      for (const id of ids) await db.runAsync('DELETE FROM lesson_attempts WHERE id=?', id);
    },
    async allAttempts(): Promise<readonly unknown[]> {
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT json_group_array(json(payload)) AS value FROM lesson_attempts',
      );
      const values: unknown = JSON.parse(row?.value ?? '[]');
      if (!Array.isArray(values)) throw new Error('Lokale Lektionsversuche beschädigt');
      return values as unknown[];
    },
    async save(attempt: LessonAttempt): Promise<void> {
      assertPrivacyWrite('legacy', attempt.id);
      if (attempt.session.phase !== 'complete') throw new Error('Lektion nicht abgeschlossen');
      const { summary, session } = attempt;
      await db.runAsync(
        `INSERT INTO lesson_attempts
        (id, lesson_id, content_version, finished_at, correct, answered, skipped, review_correct, review_total, review_answered, review_skipped, payload)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO NOTHING`,
        attempt.id,
        session.lesson.id,
        session.lesson.contentVersion,
        attempt.finishedAt,
        summary.correct,
        summary.answered,
        summary.skipped,
        summary.reviewCorrect,
        summary.reviewTotal,
        summary.reviewAnswered,
        summary.reviewSkipped,
        JSON.stringify(attempt),
      );
    },
    async latest(lessonId: string): Promise<SavedLessonSummary | null> {
      return db.getFirstAsync<SavedLessonSummary>(
        `SELECT id, lesson_id, content_version, finished_at,
        correct, answered, skipped, review_correct, review_total, review_answered, review_skipped FROM lesson_attempts
        WHERE lesson_id = ? ORDER BY finished_at DESC, rowid DESC LIMIT 1`,
        lessonId,
      );
    },
  };
}
