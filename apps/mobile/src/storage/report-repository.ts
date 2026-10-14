import { assertPrivacyWrite } from '@/privacy/guard';
import {
  storedContentReportSchema,
  contentReportSchema,
  contentReportsResponseSchema,
} from '@harmonia/content';
import type { ContentReport, StoredContentReport } from '@harmonia/content';
import type { LessonDatabase } from './lesson-repository.ts';

export type StoredReport = StoredContentReport;
export async function initializeReportDatabase(db: LessonDatabase) {
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((version?.user_version ?? 0) > 1) throw new Error('Unbekannte Meldungsdatenbank');
  await db.execAsync(`BEGIN;
    CREATE TABLE IF NOT EXISTS content_report_outbox (position INTEGER PRIMARY KEY AUTOINCREMENT, scope TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','unavailable')), UNIQUE(scope,id));
    PRAGMA user_version = 1; COMMIT;`);
}
export function createReportRepository(db: LessonDatabase) {
  let queue: Promise<unknown> = Promise.resolve();
  function transaction<T>(fn: () => Promise<T>): Promise<T> {
    const work = queue
      .catch(() => undefined)
      .then(async () => {
        await db.execAsync('BEGIN');
        try {
          const result = await fn();
          await db.execAsync('COMMIT');
          return result;
        } catch (e) {
          await db.execAsync('ROLLBACK');
          throw e;
        }
      });
    queue = work;
    return work;
  }
  const list = async (scope: string): Promise<StoredReport[]> => {
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT json_group_array(json_object('report',json(payload),'status',status)) AS value FROM (SELECT payload,status FROM content_report_outbox WHERE scope = ? ORDER BY position)`,
      scope,
    );
    return storedContentReportSchema.array().parse(JSON.parse(row?.value ?? '[]') as unknown);
  };
  return {
    pruneBefore: (cutoff: number) =>
      transaction(() =>
        db.runAsync(
          "DELETE FROM content_report_outbox WHERE json_extract(payload,'$.createdAt')<?",
          cutoff,
        ),
      ),
    eraseScope: (scope: string) =>
      transaction(() => db.runAsync('DELETE FROM content_report_outbox WHERE scope=?', scope)),
    list: (scope: string) => transaction(() => list(scope)),
    save: (scope: string, input: ContentReport) =>
      transaction(async () => {
        assertPrivacyWrite(scope, input.id);
        const report = contentReportSchema.parse(input),
          payload = JSON.stringify(report);
        const old = await db.getFirstAsync<{ payload: string }>(
          'SELECT payload FROM content_report_outbox WHERE scope = ? AND id = ?',
          scope,
          report.id,
        );
        if (
          old &&
          JSON.stringify(contentReportSchema.parse(JSON.parse(old.payload) as unknown)) !== payload
        )
          throw new Error('Meldungs-ID bereits anders verwendet');
        await db.runAsync(
          'INSERT INTO content_report_outbox(scope,id,payload) VALUES (?,?,?) ON CONFLICT(scope,id) DO NOTHING',
          scope,
          report.id,
          payload,
        );
      }),
    claimGuest: (scope: string) =>
      transaction(async () => {
        if (scope === 'guest') return;
        const guest = await list('guest'),
          own = await list(scope);
        for (const row of guest) {
          const duplicate = own.find((r) => r.report.id === row.report.id);
          if (duplicate && JSON.stringify(duplicate.report) !== JSON.stringify(row.report))
            throw new Error('Gastmeldung kollidiert');
          await db.runAsync(
            'INSERT INTO content_report_outbox(scope,id,payload,status) VALUES (?,?,?,?) ON CONFLICT(scope,id) DO NOTHING',
            scope,
            row.report.id,
            JSON.stringify(row.report),
            row.status,
          );
        }
        await db.runAsync("DELETE FROM content_report_outbox WHERE scope = 'guest'");
      }),
    acknowledge: (scope: string, input: unknown, submitted: readonly ContentReport[]) =>
      transaction(async () => {
        const result = contentReportsResponseSchema.parse(input),
          ids = [...result.accepted, ...result.unavailable];
        if (
          ids.length !== submitted.length ||
          new Set(ids).size !== ids.length ||
          ids.some((id) => !submitted.some((r) => r.id === id))
        )
          throw new Error('Fremde/unvollständige Meldungsbestätigung');
        for (const report of submitted) {
          const old = await db.getFirstAsync<{ payload: string }>(
            'SELECT payload FROM content_report_outbox WHERE scope = ? AND id = ?',
            scope,
            report.id,
          );
          if (
            !old ||
            JSON.stringify(contentReportSchema.parse(JSON.parse(old.payload) as unknown)) !==
              JSON.stringify(contentReportSchema.parse(report))
          )
            throw new Error('Meldung verändert');
          await db.runAsync(
            'UPDATE content_report_outbox SET status = ? WHERE scope = ? AND id = ?',
            result.accepted.includes(report.id) ? 'sent' : 'unavailable',
            scope,
            report.id,
          );
        }
      }),
    retry: (scope: string) =>
      transaction(async () => {
        await db.runAsync(
          "UPDATE content_report_outbox SET status = 'pending' WHERE scope = ? AND status = 'unavailable'",
          scope,
        );
      }),
  };
}
