import {
  learningEventSchema,
  learningSyncResponseSchema,
  learningViewSchema,
  lessonDraftSchema,
  learningRowSchema,
} from '@harmonia/content';
import type {
  LearningEvent,
  LearningSyncResponse,
  LessonDraft,
  LessonRewardReceipt,
} from '@harmonia/content';
import type { LessonDatabase } from './lesson-repository.ts';
import { parsePlacementData, EMPTY_PLACEMENT } from '../placement/model.ts';
import type { PlacementData } from '../placement/model.ts';

export interface StoredLearningEvent {
  readonly event: LearningEvent;
  readonly sequence: number | null;
  readonly position: number;
  readonly pending: boolean;
  readonly reward?: LessonRewardReceipt;
}
export type LearningScope = string;
export const GUEST_SCOPE = 'guest';
export async function initializeLearningDatabase(db: LessonDatabase) {
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((version?.user_version ?? 0) > 1) throw new Error('Unbekannte Lernpfad-Datenbankversion');
  await db.execAsync(`BEGIN;
    CREATE TABLE IF NOT EXISTS learning_events (position INTEGER PRIMARY KEY AUTOINCREMENT, scope TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL, sequence INTEGER NOT NULL DEFAULT -1, acked INTEGER NOT NULL DEFAULT 0, UNIQUE(scope,id));
    CREATE TABLE IF NOT EXISTS learning_cursors (scope TEXT PRIMARY KEY, cursor INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS learning_meta (id TEXT PRIMARY KEY, value TEXT NOT NULL);
    COMMIT; PRAGMA user_version = 1;`);
}
export function createLearningRepository(db: LessonDatabase) {
  let queue: Promise<unknown> = Promise.resolve();
  const transaction = <T>(fn: () => Promise<T>): Promise<T> => {
    const work = queue
      .catch(() => undefined)
      .then(async () => {
        await db.execAsync('BEGIN');
        try {
          const value = await fn();
          await db.execAsync('COMMIT');
          return value;
        } catch (e) {
          await db.execAsync('ROLLBACK');
          throw e;
        }
      });
    queue = work;
    return work;
  };
  const insert = async (
    scope: LearningScope,
    event: LearningEvent,
    sequence: number | null = null,
  ) => {
    const payload = JSON.stringify(learningEventSchema.parse(event));
    const existing = await db.getFirstAsync<{ payload: string; sequence: number }>(
      'SELECT payload,sequence FROM learning_events WHERE scope = ? AND id = ?',
      scope,
      event.id,
    );
    if (
      existing &&
      JSON.stringify(learningEventSchema.parse(JSON.parse(existing.payload) as unknown)) !== payload
    )
      throw new Error('Lernnachweis-ID wurde bereits anders verwendet');
    if (existing && existing.sequence > 0 && sequence !== null && existing.sequence !== sequence)
      throw new Error('Widersprüchliche Reihenfolge des Lernnachweises');
    await db.runAsync(
      'INSERT INTO learning_events (scope,id,payload,sequence,acked) VALUES (?,?,?,?,?) ON CONFLICT(scope,id) DO UPDATE SET sequence = CASE WHEN excluded.sequence < 0 THEN learning_events.sequence ELSE excluded.sequence END, acked = max(learning_events.acked,excluded.acked)',
      scope,
      event.id,
      payload,
      sequence ?? -1,
      sequence === null ? 0 : 1,
    );
  };
  const list = async (scope: LearningScope): Promise<StoredLearningEvent[]> => {
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT json_group_array(json_object('payload',payload,'sequence',sequence,'position',position,'acked',acked,'reward',(SELECT value FROM learning_meta WHERE id = 'reward:' || learning_events.scope || ':' || learning_events.id))) AS value FROM (SELECT * FROM learning_events WHERE scope = ? ORDER BY position) AS learning_events`,
      scope,
    );
    const values: unknown = JSON.parse(row?.value ?? '[]');
    if (!Array.isArray(values)) throw new Error('Lernnachweise beschädigt');
    return values.map((input: unknown) => {
      if (
        !input ||
        typeof input !== 'object' ||
        !('payload' in input) ||
        typeof input.payload !== 'string' ||
        !('position' in input) ||
        typeof input.position !== 'number' ||
        !Number.isSafeInteger(input.position) ||
        input.position < 1 ||
        !('sequence' in input) ||
        typeof input.sequence !== 'number' ||
        !Number.isSafeInteger(input.sequence) ||
        (input.sequence !== -1 && input.sequence < 1) ||
        !('acked' in input) ||
        (input.acked !== 0 && input.acked !== 1)
      )
        throw new Error('Lernnachweise beschädigt');
      return {
        event: learningEventSchema.parse(JSON.parse(input.payload) as unknown),
        position: input.position,
        sequence: input.sequence < 0 ? null : input.sequence,
        pending: input.acked === 0,
        ...('reward' in input && typeof input.reward === 'string'
          ? {
              reward: learningRowSchema.shape.reward
                .unwrap()
                .parse(JSON.parse(input.reward) as unknown),
            }
          : {}),
      };
    });
  };
  const placement = async (scope: LearningScope) => {
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM learning_meta WHERE id = ?',
      `placement:${scope}`,
    );
    return row ? parsePlacementData(row.value) : EMPTY_PLACEMENT;
  };
  const putPlacement = async (scope: LearningScope, data: PlacementData) => {
    const json = JSON.stringify(parsePlacementData(JSON.stringify(data)));
    await db.runAsync(
      'INSERT INTO learning_meta VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value = excluded.value',
      `placement:${scope}`,
      json,
    );
  };
  return {
    list,
    async drafts(scope: LearningScope): Promise<Record<string, LessonDraft>> {
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT json_group_array(value) AS value FROM learning_meta WHERE substr(id,1,length(?)) = ?',
        `lesson:${scope}:`,
        `lesson:${scope}:`,
      );
      const values: unknown = JSON.parse(row?.value ?? '[]');
      if (!Array.isArray(values)) throw new Error('Lektionsspeicher beschädigt');
      return Object.fromEntries(
        values.map((value: unknown) => {
          if (typeof value !== 'string') throw new Error('Lektionsspeicher beschädigt');
          const draft = lessonDraftSchema.parse(JSON.parse(value) as unknown);
          return [draft.lessonId, draft];
        }),
      );
    },
    async draft(scope: LearningScope, lessonId: string) {
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM learning_meta WHERE id = ?',
        `lesson:${scope}:${lessonId}`,
      );
      return row ? lessonDraftSchema.parse(JSON.parse(row.value) as unknown) : null;
    },
    saveDraft(scope: LearningScope, draft: LessonDraft) {
      const payload = JSON.stringify(lessonDraftSchema.parse(draft));
      return transaction(async () => {
        await db.runAsync(
          'INSERT INTO learning_meta VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value = excluded.value',
          `lesson:${scope}:${draft.lessonId}`,
          payload,
        );
      });
    },
    clearDraft(scope: LearningScope, lessonId: string, id?: string) {
      return transaction(async () => {
        await db.runAsync(
          "DELETE FROM learning_meta WHERE id = ? AND (? = '' OR json_extract(value,'$.id') = ?)",
          `lesson:${scope}:${lessonId}`,
          id ?? '',
          id ?? '',
        );
      });
    },
    placement,
    savePlacement: (scope: LearningScope, data: PlacementData) =>
      transaction(() => putPlacement(scope, data)),
    async importPlacement(scope: LearningScope, data: PlacementData) {
      await transaction(async () => {
        if (
          await db.getFirstAsync<{ value: string }>(
            "SELECT value FROM learning_meta WHERE id = 'placement-import'",
          )
        )
          return;
        await putPlacement(scope, data);
        await db.runAsync("INSERT INTO learning_meta VALUES ('placement-import','1')");
      });
    },
    async exists(id: string) {
      return (
        (await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM learning_events WHERE id = ? LIMIT 1',
          id,
        )) !== null
      );
    },
    async view(scope: LearningScope) {
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM learning_meta WHERE id = ?',
        `view:${scope}`,
      );
      return row
        ? learningViewSchema.parse(JSON.parse(row.value) as unknown)
        : { areaId: null, level: null, expanded: [] };
    },
    async saveView(scope: LearningScope, value: unknown) {
      const payload = JSON.stringify(learningViewSchema.parse(value));
      await transaction(async () => {
        await db.runAsync(
          'INSERT INTO learning_meta VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value = excluded.value',
          `view:${scope}`,
          payload,
        );
      });
    },
    save: (scope: LearningScope, event: LearningEvent) => transaction(() => insert(scope, event)),
    async importLegacy(events: readonly LearningEvent[]) {
      return transaction(async () => {
        const marker = await db.getFirstAsync<{ value: string }>(
          "SELECT value FROM learning_meta WHERE id = 'legacy-import'",
        );
        if (marker) return;
        for (const event of events) await insert(GUEST_SCOPE, event);
        await db.runAsync("INSERT INTO learning_meta VALUES ('legacy-import','1')");
      });
    },
    async imported() {
      return (
        (await db.getFirstAsync<{ value: string }>(
          "SELECT value FROM learning_meta WHERE id = 'legacy-import'",
        )) !== null
      );
    },
    async claimGuest(scope: LearningScope) {
      if (scope === GUEST_SCOPE) return;
      await transaction(async () => {
        for (const row of await list(GUEST_SCOPE)) await insert(scope, row.event);
        await db.runAsync('DELETE FROM learning_events WHERE scope = ?', GUEST_SCOPE);
        const guest = await placement(GUEST_SCOPE),
          own = await placement(scope);
        if (guest.active || guest.last)
          await putPlacement(scope, {
            schemaVersion: 1,
            active: guest.active ?? own.active,
            last: guest.last ?? own.last,
          });
        await db.runAsync('DELETE FROM learning_meta WHERE id = ?', `placement:${GUEST_SCOPE}`);
      });
    },
    async cursor(scope: LearningScope) {
      return (
        (
          await db.getFirstAsync<{ cursor: number }>(
            'SELECT cursor FROM learning_cursors WHERE scope = ?',
            scope,
          )
        )?.cursor ?? 0
      );
    },
    async merge(scope: LearningScope, input: LearningSyncResponse) {
      const response = learningSyncResponseSchema.parse(input);
      await transaction(async () => {
        for (const row of response.rows) {
          await insert(scope, row.event, row.sequence);
          if (row.reward)
            await db.runAsync(
              'INSERT INTO learning_meta VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value = excluded.value',
              `reward:${scope}:${row.event.id}`,
              JSON.stringify(row.reward),
            );
        }
        const previous =
          (
            await db.getFirstAsync<{ cursor: number }>(
              'SELECT cursor FROM learning_cursors WHERE scope = ?',
              scope,
            )
          )?.cursor ?? 0;
        if (
          response.cursor !== (response.rows.at(-1)?.sequence ?? previous) ||
          response.rows.some(
            (r, i) => r.sequence <= (response.rows[i - 1]?.sequence ?? previous),
          ) ||
          new Set(response.rows.map((r) => r.event.id)).size !== response.rows.length
        )
          throw new Error('Widersprüchlicher Sync-Cursor');
        // ACKs dürfen erst mit den heruntergeladenen Zeilen dauerhaft quittiert werden.
        for (const id of response.accepted)
          await db.runAsync(
            'UPDATE learning_events SET acked = 1 WHERE scope = ? AND id = ?',
            scope,
            id,
          );
        await db.runAsync(
          'INSERT INTO learning_cursors VALUES (?,?) ON CONFLICT(scope) DO UPDATE SET cursor = excluded.cursor',
          scope,
          response.cursor,
        );
      });
    },
  };
}
