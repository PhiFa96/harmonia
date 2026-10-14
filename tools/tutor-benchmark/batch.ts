import { cacheEntrySchema } from './schema.ts';
import type { CacheEntry, Pending } from './schema.ts';
import { measuredTutorUsage } from '../../supabase/functions/_shared/tutor-usage.ts';
import type { TutorTariff } from '../../packages/content/src/index.ts';

// Die SDK-Quittung ist typisiert, wird beim Wiederaufnehmen dennoch begrenzt und neu geprüft.
export function validateReceipts(
  requests: Pending[],
  receipts: { custom_id: string; result: unknown }[],
  modelFor: (episodeId: string) => string,
) {
  const expected = new Map(requests.map((r) => [r.id, r])),
    accepted: Record<string, CacheEntry> = {};
  if (expected.size !== requests.length) throw Error('Doppelte Batch-Aufträge');
  for (const row of receipts) {
    const request = expected.get(row.custom_id);
    if (!request || accepted[row.custom_id]) throw Error('Unbekannte oder doppelte Batch-Quittung');
    const raw = row.result;
    if (!raw || typeof raw !== 'object' || !('type' in raw)) throw Error('Batch-Quittung ungültig');
    const entry = cacheEntrySchema.parse(
      raw.type === 'succeeded' ? raw : { type: raw.type, reason: 'terminal-batch-result' },
    );
    if (entry.type === 'succeeded' && entry.message.model !== modelFor(request.episodeId))
      throw Error('Modellquittung passt nicht');
    accepted[row.custom_id] = entry;
  }
  if (Object.keys(accepted).length !== requests.length)
    throw Error('Batch-Ergebnisse unvollständig; fehlende Fälle werden nicht herausgefiltert');
  return accepted;
}
export function receiptCosts(
  requests: Pending[],
  entries: Record<string, CacheEntry>,
  tariff: TutorTariff,
) {
  let costNanoUsd = 0,
    estimated = false;
  for (const request of requests) {
    const entry = entries[request.id];
    if (!entry) throw Error('Quittung fehlt');
    if (entry.type === 'succeeded') {
      const usage = measuredTutorUsage(entry.message.usage, tariff);
      costNanoUsd += usage.costNanoUsd;
      estimated ||= usage.estimated;
    } else {
      costNanoUsd += request.reservationNanoUsd;
      estimated = true;
    }
  }
  return { costNanoUsd, estimated };
}
