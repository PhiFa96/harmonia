import { z } from 'zod';
import { applyReviewEvent, reviewStateSchema } from '../../../packages/content/src/review.ts';
import {
  learningRowEventSchema,
  EvidenceError,
} from '../../../packages/content/src/learning-evidence.ts';
import type { ContentCatalogue } from '../../../packages/content/src/catalogue-schema.ts';

interface ReviewClient {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
}
const snapshotSchema = reviewStateSchema
  .extend({ revision: z.string().regex(/^\d{1,19}$/) })
  .strict();
const pendingSchema = z
  .object({
    actor: z.uuid(),
    id: z.string().min(1).max(256),
    hash: z.string().regex(/^[a-f0-9]{64}$/),
    receivedAt: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    event: z.unknown(),
  })
  .strict()
  .array()
  .max(50);
const commitSchema = z.enum(['applied', 'already', 'conflict', 'missing']);

/** The same replay/CAS processor is used by learning-sync and the resumable backfill. */
export async function processPendingReviews(
  client: ReviewClient,
  catalogue: ContentCatalogue,
  actor: string | null = null,
  limit = 50,
) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 50)
    throw new RangeError('Invalid review page');
  const pending = await client.rpc('review_pending', { actor, limit_count: limit });
  if (pending.error) throw new Error('Review queue unavailable');
  const rows = pendingSchema.parse(pending.data);
  const counts = {
    applied: 0,
    already: 0,
    missing: 0,
    deferred: 0,
    rated: 0,
    excluded: 0,
    scanned: rows.length,
  };
  for (const row of rows) {
    if (actor !== null && row.actor !== actor) throw new Error('Review account mismatch');

    let committed = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      const read = await client.rpc('review_snapshot', { actor: row.actor });
      if (read.error) throw new Error('Review snapshot unavailable');
      const snapshot = snapshotSchema.parse(read.data);
      let next = snapshot;
      try {
        const event = learningRowEventSchema.parse(row.event);
        const updated = applyReviewEvent(
          catalogue,
          snapshot,
          event,
          Math.min(row.receivedAt, event.finishedAt),
        );
        next = { ...snapshot, ...updated };
      } catch (error) {
        if (!(error instanceof EvidenceError || error instanceof z.ZodError)) throw error;
      }
      const updates = {
        skills: Object.fromEntries(
          Object.entries(next.skills).filter(
            ([id, state]) => JSON.stringify(state) !== JSON.stringify(snapshot.skills[id]),
          ),
        ),
        cards: Object.fromEntries(
          Object.entries(next.cards).filter(
            ([id, state]) => JSON.stringify(state) !== JSON.stringify(snapshot.cards[id]),
          ),
        ),
      };
      const write = await client.rpc('commit_review_period', {
        actor: row.actor,
        client_id: row.id,
        expected_hash: row.hash,
        expected_revision: snapshot.revision,
        updates,
      });
      if (write.error) throw new Error('Review commit unavailable');
      const result = commitSchema.parse(write.data);
      if (result === 'conflict') continue;
      counts[result]++;
      if (result === 'applied')
        counts[
          Object.keys(updates.skills).length || Object.keys(updates.cards).length
            ? 'rated'
            : 'excluded'
        ]++;
      committed = true;
      break;
    }
    if (!committed) {
      counts.deferred++;
      break;
    }
  }
  return counts;
}
