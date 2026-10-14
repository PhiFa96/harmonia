import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { catalogue } from '../../../packages/content/src/published.ts';
import {
  accessPolicySchema,
  accessReserveSchema,
  accessSourceDetails,
  accessStatusSchema,
  accessGrantSchema,
  guestAccessStatus,
} from '../../../packages/content/src/index.ts';
import { billingBody } from '../_shared/billing.ts';
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers });
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!['GET', 'POST'].includes(request.method)) return json(405, { error: 'method' });
  try {
    const url = Deno.env.get('SUPABASE_URL') ?? '',
      client = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) }),
        },
      });
    const token = request.headers.get('Authorization') ?? '';
    if (new URL(request.url).searchParams.get('public') === 'true' && request.method === 'GET') {
      const config = await client
        .from('access_policy')
        .select('revision,policy')
        .eq('id', true)
        .single();
      if (config.error) throw new Error('Policy');
      return json(
        200,
        guestAccessStatus(
          accessPolicySchema.parse(config.data.policy),
          null,
          Date.now(),
          Number(config.data.revision),
        ),
      );
    }
    if (!token.startsWith('Bearer ')) return json(401, { error: 'auth' });
    const auth = await client.auth.getUser(token.slice(7));
    if (auth.error || auth.data.user.is_anonymous) return json(401, { error: 'auth' });
    if (request.method === 'GET') {
      const status = await client.rpc('access_status', { actor: auth.data.user.id });
      if (status.error) throw new Error('Status');
      return json(200, accessStatusSchema.parse(status.data));
    }
    let parsed;
    try {
      parsed = accessReserveSchema.safeParse(JSON.parse(await billingBody(request, 16384)));
    } catch {
      return json(400, { error: 'schema' });
    }
    if (!parsed.success) return json(400, { error: 'schema' });
    const current =
      Deno.env.get('HARMONIA_LOCAL_PREVIEW') === 'true' &&
      /^http:\/\/(?:127\.0\.0\.1|localhost|kong|supabase_kong_harmonia)(?::\d+)?$/.test(url)
        ? (await import('../../../packages/content/src/authoring.ts')).catalogue
        : catalogue;
    let details;
    try {
      details = accessSourceDetails(current, parsed.data.source);
    } catch {
      return json(409, { error: 'source' });
    }
    const result = await client.rpc('reserve_access', {
      actor: auth.data.user.id,
      client_id: parsed.data.id,
      source: parsed.data.source,
      ...details,
    });
    if (result.error) throw new Error('Reserve');
    const grant = accessGrantSchema.parse(result.data);
    return json(grant.allowed ? 200 : grant.reason === 'conflict' ? 409 : 403, grant);
  } catch {
    return json(503, { error: 'unavailable' });
  }
});
