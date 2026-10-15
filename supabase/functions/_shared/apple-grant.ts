import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import type { User, SupabaseClient } from 'npm:@supabase/supabase-js@2.117.3';
import { billingBody } from './billing.ts';
type Env = (key: string) => string | undefined;
function credentials(env: Env) {
  const id = env('APPLE_CLIENT_ID'),
    secret = env('APPLE_CLIENT_SECRET');
  if (!id || !secret) throw new Error('Apple provider unavailable');
  return { client_id: id, client_secret: secret };
}
async function apple(
  path: 'token' | 'revoke',
  body: Record<string, string>,
  transport: typeof fetch,
) {
  const response = await transport('https://appleid.apple.com/auth/' + path, {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  if (!response.ok) throw new Error('Apple provider unavailable');
  if (path === 'revoke') return null;
  const text = await response.text();
  if (text.length > 16384) throw new Error('Apple provider response');
  return JSON.parse(text) as unknown;
}
export function hasAppleIdentity(user: User) {
  return (
    user.identities?.some((identity) => identity.provider === 'apple') === true ||
    (Array.isArray(user.app_metadata.providers) && user.app_metadata.providers.includes('apple'))
  );
}
/** Verify ownership with Apple's refresh endpoint before storing any client-supplied credential. */
export async function saveAppleGrant(
  user: User,
  token: string,
  client: SupabaseClient,
  env: Env,
  transport: typeof fetch = fetch,
) {
  const identity = user.identities?.find((entry) => entry.provider === 'apple'),
    subject: unknown = identity?.identity_data?.['sub'];
  if (!identity || typeof subject !== 'string' || token.length < 10 || token.length > 8192)
    throw new Error('Apple identity unavailable');
  const config = credentials(env),
    result = await apple(
      'token',
      { ...config, grant_type: 'refresh_token', refresh_token: token },
      transport,
    );
  if (
    !result ||
    typeof result !== 'object' ||
    !('id_token' in result) ||
    typeof result.id_token !== 'string'
  )
    throw new Error('Apple identity verification failed');
  // This ID token comes directly from the fixed Apple TLS endpoint, not from the caller.
  const claims: unknown = JSON.parse(
    atob(result.id_token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/') ?? ''),
  );
  if (
    !claims ||
    typeof claims !== 'object' ||
    !('sub' in claims) ||
    claims.sub !== subject ||
    !('aud' in claims) ||
    claims.aud !== config.client_id ||
    !('iss' in claims) ||
    claims.iss !== 'https://appleid.apple.com' ||
    !('exp' in claims) ||
    typeof claims.exp !== 'number' ||
    claims.exp * 1000 <= Date.now()
  )
    throw new Error('Apple identity verification failed');
  const rotated: unknown = 'refresh_token' in result ? result.refresh_token : token;
  if (typeof rotated !== 'string' || rotated.length < 10 || rotated.length > 8192)
    throw new Error('Apple credential invalid');
  const saved = await client.rpc('save_apple_grant', { actor: user.id, refresh_token: rotated });
  if (saved.error) throw new Error('Provider storage unavailable');
}
/** Revoke before deleting Auth; a failed provider call leaves the account retryable. */
export async function revokeAppleGrant(
  user: User,
  client: SupabaseClient,
  env: Env,
  transport: typeof fetch = fetch,
) {
  if (!hasAppleIdentity(user)) return;
  const config = credentials(env),
    saved = await client.rpc('read_apple_grant', { actor: user.id });
  if (saved.error || typeof saved.data !== 'string' || !saved.data)
    throw new Error('Provider credential unavailable');
  await apple(
    'revoke',
    { ...config, token: saved.data, token_type_hint: 'refresh_token' },
    transport,
  );
}
export function appleGrantHandler(env: Env, transport: typeof fetch = fetch) {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
  };
  const reply = (status: number) =>
    new Response(JSON.stringify(status === 200 ? { saved: true } : { error: 'provider' }), {
      status,
      headers,
    });
  return async (request: Request) => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return reply(405);
    try {
      const bearer = request.headers.get('Authorization');
      if (!bearer?.startsWith('Bearer ') || bearer.length > 8192) return reply(401);
      const client = createClient(
        env('SUPABASE_URL') ?? '',
        env('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) =>
              transport(input, { ...init, signal: AbortSignal.timeout(10000) }),
          },
        },
      );
      const auth = await client.auth.getUser(bearer.slice(7));
      if (auth.error || auth.data.user.is_anonymous) return reply(401);
      const body: unknown = JSON.parse(await billingBody(request, 16384));
      if (
        !body ||
        typeof body !== 'object' ||
        Object.keys(body).join() !== 'refreshToken' ||
        !('refreshToken' in body) ||
        typeof body.refreshToken !== 'string'
      )
        return reply(400);
      await saveAppleGrant(auth.data.user, body.refreshToken, client, env, transport);
      return reply(200);
    } catch {
      return reply(503);
    }
  };
}
