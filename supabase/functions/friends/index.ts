import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { friendsRequestSchema, friendsViewSchema } from '../../../packages/content/src/index.ts';
import { billingBody } from '../_shared/billing.ts';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
const json = (status: number, body: unknown, responseHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, ...responseHeaders } });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!['GET', 'POST'].includes(request.method)) return json(405, { error: 'method' });
  const bearer = request.headers.get('Authorization') ?? '';
  if (!bearer.startsWith('Bearer ') || bearer.length > 8192) return json(401, { error: 'auth' });
  try {
    const client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) }),
        },
      },
    );
    const auth = await client.auth.getUser(bearer.slice(7));
    if (auth.error || auth.data.user.is_anonymous) return json(401, { error: 'auth' });
    const actor = auth.data.user.id;
    let name = 'friend_status';
    let args: Record<string, unknown> = { actor };
    if (request.method === 'POST') {
      let parsed;
      try {
        parsed = friendsRequestSchema.safeParse(JSON.parse(await billingBody(request, 1024)));
      } catch {
        return json(400, { error: 'schema' });
      }
      if (!parsed.success) return json(400, { error: 'schema' });
      const body = parsed.data;
      if (body.action === 'invite') {
        name = 'friend_invite_create';
        args = { actor, new_token: body.token };
      } else if (body.action === 'accept') {
        const limit = await client.rpc('consume_friend_invite_attempt', { actor });
        const wait: unknown = limit.data;
        if (
          limit.error ||
          typeof wait !== 'number' ||
          !Number.isInteger(wait) ||
          wait < 0 ||
          wait > 3600
        )
          return json(503, { error: 'storage' });
        if (wait) return json(429, { error: 'rate' }, { 'Retry-After': String(wait) });
        name = 'friend_invite_accept';
        args = { actor, invite_token: body.token };
      } else if (body.action === 'revokeInvite') {
        name = 'friend_invite_revoke';
        args = { actor, invite_token: body.token };
      } else if (body.action === 'quest') {
        name = 'friend_quest_start';
        args = { actor, peer: body.friendId };
      } else if (body.action === 'questResponse') {
        name = 'friend_quest_respond';
        args = { actor, proposal: body.proposalId, decision: body.decision };
      } else if (body.action === 'unblock') {
        name = 'friend_unblock';
        args = { actor, peer: body.friendId };
      } else {
        name = 'friend_remove';
        args = { actor, peer: body.friendId, block_peer: body.action === 'block' };
      }
    }
    const result = await client.rpc(name, args);
    if (result.error) {
      const code = /friend_(missing|retry|limit|quest_active|quest_pending)/.exec(
        result.error.message,
      )?.[1];
      return code
        ? json(code === 'missing' ? 404 : 409, { error: code })
        : json(503, { error: 'storage' });
    }
    const view = friendsViewSchema.parse(result.data);
    if (new URL(request.url).searchParams.get('questOffers') === '1') {
      const offers = await client.rpc('friend_quest_offers', { actor });
      if (offers.error) return json(503, { error: 'storage' });
      const questOffers: unknown = offers.data;
      return json(200, friendsViewSchema.parse({ ...view, questOffers }));
    }
    return json(200, view);
  } catch {
    return json(503, { error: 'unavailable' });
  }
});
