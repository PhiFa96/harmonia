import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import {
  learningEventSchema,
  retainLearningEvent,
  unavailableRetainedEvent,
} from '../../../packages/content/src/learning-evidence.ts';
import { catalogue } from '../../../packages/content/src/published.ts';
import { retentionCutoff } from '../../../packages/content/src/privacy.ts';
import { hash } from '../_shared/hash.ts';
const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers });
Deno.serve(async (request) => {
  if (request.method !== 'POST') return json(405, { error: 'method' });
  const expected = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    auth = request.headers.get('Authorization') ?? '';
  if (!expected || auth.length > 8192 || (await hash(auth)) !== (await hash('Bearer ' + expected)))
    return json(401, { error: 'auth' });
  try {
    const url = Deno.env.get('SUPABASE_URL') ?? '',
      client = createClient(url, expected, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) }),
        },
      });
    const local =
      Deno.env.get('HARMONIA_LOCAL_PREVIEW') === 'true' &&
      /^http:\/\/(?:127\.0\.0\.1|localhost|kong|supabase_kong_harmonia)(?::\d+)?$/.test(url);
    const current = local
      ? (await import('../../../packages/content/src/authoring.ts')).catalogue
      : catalogue;
    const rows = await client
      .from('learning_events')
      .select('user_id,client_id,event,event_hash,retained_summary')
      .is('retained_at', null)
      .lt('received_at', new Date(retentionCutoff(Date.now())).toISOString())
      .order('sequence')
      .limit(100)
      .overrideTypes<
        {
          user_id: string;
          client_id: string;
          event: unknown;
          event_hash: string;
          retained_summary: unknown;
        }[],
        { merge: false }
      >();
    if (rows.error) return json(503, { error: 'storage' });
    let retained = 0;
    for (const row of rows.data) {
      const raw = learningEventSchema.parse(row.event);
      let summary = row.retained_summary;
      if (!summary) {
        try {
          summary = retainLearningEvent(current, raw);
        } catch {
          summary = unavailableRetainedEvent(raw);
        }
      }
      const result = await client.rpc('retain_learning_event', {
        actor: row.user_id,
        client_id: row.client_id,
        expected_hash: row.event_hash,
        summary,
      });
      if (result.error) return json(503, { error: 'retention' });
      if (result.data) retained++;
    }
    const cutoff = new Date(retentionCutoff(Date.now())).toISOString();
    const analytics = await client.rpc('analytics_retention');
    if (analytics.error) return json(503, { error: 'retention' });
    const details = await client.rpc('privacy_retention_details');
    if (details.error) return json(503, { error: 'retention' });
    const detailResult = details.data as { changed: number; more: boolean };
    const audit = await client
      .from('billing_events')
      .select('event_id,payload')
      .lt('received_at', cutoff)
      .is('payload->>retained', null)
      .limit(100)
      .overrideTypes<{ event_id: string; payload: unknown }[], { merge: false }>();
    if (audit.error) return json(503, { error: 'retention' });
    for (const entry of audit.data) {
      const original = entry.payload as { event?: { id?: string; type?: string } };
      const compact = {
        event: { id: entry.event_id, type: original.event?.type ?? 'UNKNOWN' },
        retained: true,
      };
      const updated = await client
        .from('billing_events')
        .update({ payload: compact })
        .eq('event_id', entry.event_id);
      if (updated.error) return json(503, { error: 'retention' });
    }
    return json(200, {
      retained,
      details: detailResult.changed,
      analytics: analytics.data as number,
      more:
        rows.data.length === 100 ||
        audit.data.length === 100 ||
        detailResult.more ||
        analytics.data === 100,
    });
  } catch {
    return json(503, { error: 'retention' });
  }
});
