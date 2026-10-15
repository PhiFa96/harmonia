import { z } from 'zod';
import { ratePeriod } from '../../../packages/exercises/src/index.ts';
import { learningRatingEvidence } from '../../../packages/content/src/learning-ratings.ts';
import type { ContentCatalogue } from '../../../packages/content/src/catalogue-schema.ts';

interface RatingClient {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
}
const state = z
  .object({
    rating: z.number().min(-1_000_000).max(1_000_000),
    deviation: z.number().positive().max(350),
    volatility: z.number().positive().max(10),
    attempts: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
    updatedAt: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  })
  .strict();
const snapshotSchema = z
  .object({
    revision: z.string().regex(/^\d{1,19}$/),
    tau: z.number().min(0.01).max(2),
    skills: z.record(z.string(), state),
    buckets: z.record(z.string(), state),
  })
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
export async function processPendingRatings(
  client: RatingClient,
  catalogue: ContentCatalogue,
  actor: string | null = null,
  limit = 50,
) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 50)
    throw new RangeError('Invalid rating page');
  const pending = await client.rpc('rating_pending', { actor, limit_count: limit });
  if (pending.error) throw new Error('Rating queue unavailable');
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
    if (actor !== null && row.actor !== actor) throw new Error('Rating account mismatch');
    const evidence = learningRatingEvidence(catalogue, row.event);
    const ids = [...new Set(evidence.observations.map((observation) => observation.bucketId))];
    let committed = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      const read = await client.rpc('rating_snapshot', { actor: row.actor, bucket_ids: ids });
      if (read.error) throw new Error('Rating snapshot unavailable');
      const snapshot = snapshotSchema.parse(read.data);
      const updates = ratePeriod(snapshot, evidence.observations, row.receivedAt, snapshot.tau);
      const write = await client.rpc('commit_rating_period', {
        actor: row.actor,
        client_id: row.id,
        expected_hash: row.hash,
        expected_revision: snapshot.revision,
        updates,
        outcome: evidence.outcome,
      });
      if (write.error) throw new Error('Rating commit unavailable');
      const result = commitSchema.parse(write.data);
      if (result === 'conflict') continue;
      counts[result]++;
      if (result === 'applied') counts[evidence.outcome === 'rated' ? 'rated' : 'excluded']++;
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
