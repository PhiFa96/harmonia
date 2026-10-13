import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { catalogue } from '../../../packages/content/src/published.ts';
import {
  contentReportsRequestSchema,
  validateContentReport,
} from '../../../packages/content/src/index.ts';
import type { ContentCatalogue } from '../../../packages/content/src/index.ts';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers });
async function content(): Promise<ContentCatalogue> {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  if (
    Deno.env.get('HARMONIA_LOCAL_PREVIEW') === 'true' &&
    /^http:\/\/(?:127\.0\.0\.1|localhost|supabase_kong_harmonia|kong)(?::\d+)?$/.test(url)
  )
    return (await import('../../../packages/content/src/authoring.ts')).catalogue;
  return catalogue;
}
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return json(405, { error: 'method' });
  try {
    const authorization = request.headers.get('authorization') ?? '';
    if (!authorization.startsWith('Bearer ') || authorization.length > 8192)
      return json(401, { error: 'auth' });
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await client.auth.getUser(authorization.slice(7));
    if (error || data.user.is_anonymous) return json(401, { error: 'auth' });
    const body = await request.text();
    if (body.length > 262144) return json(413, { error: 'size' });
    const parsed = contentReportsRequestSchema.safeParse(JSON.parse(body) as unknown);
    if (!parsed.success) return json(400, { error: 'schema' });
    const current = await content(),
      accepted: string[] = [],
      unavailable: string[] = [],
      entries = [];
    for (const report of parsed.data.reports) {
      try {
        const resolved = validateContentReport(current, report);
        entries.push({
          report,
          content_id: resolved.contentId,
          content_version: resolved.contentVersion,
          item: resolved.item,
          evaluation: resolved.evaluation,
        });
        accepted.push(report.id);
      } catch {
        unavailable.push(report.id);
      }
    }
    if (entries.length) {
      const result = await client.rpc('append_content_reports', { actor: data.user.id, entries });
      if (result.error) return json(409, { error: 'conflict' });
    }
    return json(200, { accepted, unavailable });
  } catch {
    return json(400, { error: 'request' });
  }
});
