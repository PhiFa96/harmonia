import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { analyticsRequestSchema } from '../../../packages/content/src/analytics.ts';
import { billingBody } from '../_shared/billing.ts';
import { catalogue } from '../../../packages/content/src/published.ts';
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers });
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return json(405, { error: 'method' });
  try {
    const bearer = request.headers.get('Authorization') ?? '';
    if (!bearer.startsWith('Bearer ') || bearer.length > 8192) return json(401, { error: 'auth' });
    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const client = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) }),
      },
    });
    const auth = await client.auth.getUser(bearer.slice(7));
    if (auth.error || auth.data.user.is_anonymous) return json(401, { error: 'auth' });
    const parsed = analyticsRequestSchema.safeParse(JSON.parse(await billingBody(request, 4096)));
    if (!parsed.success) return json(400, { error: 'schema' });
    if (parsed.data.event.name === 'lesson_started') {
      const local =
        Deno.env.get('HARMONIA_LOCAL_PREVIEW') === 'true' &&
        /^http:\/\/(?:127\.0\.0\.1|localhost|kong|supabase_kong_harmonia)(?::\d+)?$/.test(url);
      const current = local
        ? (await import('../../../packages/content/src/authoring.ts')).catalogue
        : catalogue;
      const event = parsed.data.event;
      if (
        !current.lessons.some(
          (lesson) =>
            lesson.id === event.lessonId && lesson.contentVersion === event.contentVersion,
        )
      )
        return json(422, { error: 'source' });
    }
    const saved = await client.rpc('analytics_ingest', {
      actor: auth.data.user.id,
      entry: parsed.data,
    });
    if (saved.error) return json(503, { error: 'storage' });
    return json(saved.data === true ? 200 : 403, { accepted: saved.data === true });
  } catch {
    return json(400, { error: 'request' });
  }
});
