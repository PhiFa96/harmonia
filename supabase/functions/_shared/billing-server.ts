import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.3';
import {
  billingActors,
  billingAuthorization,
  billingBody,
  billingEventSchema,
  billingSnapshot,
  billingUuid,
} from './billing.ts';
import { z } from 'zod';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
const reply = (status: number, body: unknown, web = true) =>
  new Response(JSON.stringify(body), {
    status,
    headers: web ? cors : { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
const claimSchema = z.discriminatedUnion('state', [
  z.object({ state: z.literal('claimed'), lease: z.uuid() }),
  ...['missing', 'busy', 'recent'].map((state) => z.object({ state: z.literal(state) })),
]);
export function billingServer(
  get: (key: string) => string | undefined,
  fetcher: typeof fetch = fetch,
) {
  const url = get('SUPABASE_URL') ?? '';
  const local =
    get('HARMONIA_BILLING_LOCAL_TEST') === 'true' &&
    /^http:\/\/(?:127\.0\.0\.1|localhost|kong|supabase_kong_harmonia)(?::\d+)?$/.test(url);
  const mode = local ? 'SANDBOX' : get('BILLING_REVENUECAT_ENVIRONMENT');
  const environment = mode === 'SANDBOX' || mode === 'PRODUCTION' ? mode : null;
  const apiKey = get('REVENUECAT_SECRET_API_KEY');
  const appIds = local
    ? ['local-billing-fixture']
    : (get('BILLING_REVENUECAT_APP_IDS') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  const webhookToken = local
    ? 'local-only-billing-test-token-000000000000'
    : (get('BILLING_WEBHOOK_AUTH_TOKEN') ?? '');
  const configured =
    !!environment &&
    !!appIds.length &&
    webhookToken.length >= 32 &&
    webhookToken.length <= 512 &&
    (local || !!apiKey);
  const client = createClient(url, get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetcher(input, {
          ...init,
          signal: AbortSignal.any([
            AbortSignal.timeout(10000),
            ...(init?.signal ? [init.signal] : []),
          ]),
        }),
    },
  });
  async function rpc(name: string, args: Record<string, unknown>): Promise<unknown> {
    const result = await client.rpc(name, args);
    if (result.error) throw new Error('Billing database');
    return result.data as unknown;
  }
  async function provider(actor: string): Promise<unknown> {
    if (local) {
      // Only the explicit loopback-only test runner creates this table, never a migration.
      const result = await client
        .from('billing_test_snapshots')
        .select('payload')
        .eq('user_id', actor)
        .single();
      if (result.error) throw new Error('Local fixture unavailable');
      return result.data.payload;
    }
    const response = await fetcher(
      'https://api.revenuecat.com/v1/subscribers/' + encodeURIComponent(actor),
      {
        headers: { Authorization: 'Bearer ' + (apiKey ?? ''), Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
        redirect: 'error',
      },
    );
    if (!response.ok) throw new Error('Billing provider unavailable');
    return JSON.parse(await billingBody(response, 1048576)) as unknown;
  }
  async function reconcile(actor: string, throttled: boolean) {
    const claim = claimSchema.parse(await rpc('billing_claim', { actor, throttled }));
    if (claim.state === 'missing' || claim.state === 'recent') return;
    if (claim.state !== 'claimed' || !('lease' in claim)) throw new Error('Billing busy');
    try {
      if (!environment) throw new Error('Billing environment');
      const snapshot = billingSnapshot(await provider(actor), environment, Date.now());
      if (
        (await rpc('billing_commit', {
          actor,
          token: claim.lease,
          request_ms: snapshot.requestMs,
          grants: snapshot.grants,
        })) !== true
      )
        throw new Error('Billing lease expired');
    } finally {
      await rpc('billing_release', { actor, token: claim.lease });
    }
  }
  return {
    async webhook(request: Request) {
      if (request.method !== 'POST') return reply(405, { error: 'method' }, false);
      if (!configured) return reply(503, { error: 'unavailable' }, false);
      if (!(await billingAuthorization(request.headers.get('Authorization'), webhookToken)))
        return reply(401, { error: 'authorization' }, false);
      let receipt;
      try {
        receipt = billingEventSchema.parse(JSON.parse(await billingBody(request)));
      } catch {
        return reply(400, { error: 'schema' }, false);
      }
      if (!appIds.includes(receipt.event.app_id)) return reply(403, { error: 'app' }, false);
      // Persist no email, subscriber attributes, advertising ids, prices or authorization headers.
      try {
        const received = z
          .object({ state: z.enum(['pending', 'done', 'conflict']) })
          .parse(await rpc('billing_receive', { receipt }));
        if (received.state === 'conflict') return reply(409, { error: 'conflict' }, false);
        if (received.state === 'done') return reply(200, { received: true }, false);
        const ignored =
          (!!receipt.event.environment && receipt.event.environment !== environment) ||
          receipt.event.type === 'TEST';
        if (!ignored)
          for (const actor of billingActors(receipt.event)) await reconcile(actor, false);
        const result = await client
          .from('billing_events')
          .update({
            processed_at: new Date().toISOString(),
            outcome: ignored ? 'ignored' : 'processed',
          })
          .eq('event_id', receipt.event.id);
        if (result.error) throw new Error('Receipt commit');
        return reply(200, { received: true }, false);
      } catch {
        return reply(503, { error: 'retry' }, false);
      }
    },
    async account(request: Request) {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
      if (!['GET', 'POST'].includes(request.method)) return reply(405, { error: 'method' });
      const authorization = request.headers.get('Authorization') ?? '';
      if (!authorization.startsWith('Bearer ')) return reply(401, { error: 'authorization' });
      try {
        const auth = await client.auth.getUser(authorization.slice(7));
        if (
          auth.error ||
          auth.data.user.is_anonymous ||
          !billingUuid.safeParse(auth.data.user.id).success
        )
          return reply(401, { error: 'authorization' });
        const actor = auth.data.user.id;
        if (request.method === 'POST') {
          if (!configured) return reply(503, { error: 'unavailable' });
          // Client submits no receipt, entitlement, identity or provider proof.
          const body = await billingBody(request, 1024);
          if (body !== '' && body !== '{}') return reply(400, { error: 'schema' });
          await reconcile(actor, true);
        }
        return await accountStatus(client, actor, configured, local);
      } catch {
        return reply(503, { error: 'retry' });
      }
    },
  };
}
async function accountStatus(
  client: SupabaseClient,
  actor: string,
  configured: boolean,
  simulation: boolean,
) {
  const result = await client
    .from('entitlements')
    .select('entitlement,active,expires_at,store,will_renew,billing_issue')
    .eq('user_id', actor);
  if (result.error) throw new Error('Billing status');
  const rows = z
    .array(
      z.object({
        entitlement: z.enum(['premium', 'max']),
        active: z.boolean(),
        expires_at: z.string(),
        store: z.enum(['ios', 'android', 'web', 'manual']),
        will_renew: z.boolean().nullable(),
        billing_issue: z.boolean(),
      }),
    )
    .parse(result.data);
  return reply(200, {
    configured,
    simulation,
    entitlements: rows.map((row) => ({
      ...row,
      active: row.active && Date.parse(row.expires_at) > Date.now(),
    })),
  });
}
