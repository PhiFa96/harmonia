import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import type { User } from 'npm:@supabase/supabase-js@2.117.3';
import { appleGrantHandler, revokeAppleGrant } from '../supabase/functions/_shared/apple-grant.ts';
import { observeHandler } from '../supabase/functions/_shared/operations.ts';
const actor = '70000000-0000-4000-8000-000000000001';
const user = {
  id: actor,
  aud: 'authenticated',
  app_metadata: { providers: ['apple'] },
  user_metadata: {},
  created_at: '2026-10-15T00:00:00Z',
  identities: [
    {
      id: 'apple-subject',
      identity_id: '70000000-0000-4000-8000-000000000002',
      user_id: actor,
      provider: 'apple',
      identity_data: { sub: 'apple-subject' },
    },
  ],
} as User;
const config: Record<string, string> = {
  SUPABASE_URL: 'https://project.example.invalid',
  SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service',
  APPLE_CLIENT_ID: 'test.example.client',
  APPLE_CLIENT_SECRET: 'synthetic-client-secret',
  OPS_METRICS_ENABLED: 'true',
};
const env = (key: string) => config[key];
const check = (condition: unknown, label: string) => {
  if (!condition) throw new Error(label);
};
let subject = 'apple-subject',
  saved = 0,
  revoked = 0,
  metrics = 0,
  appleFailure = false,
  storageFailure = false;
const reply = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
const transport: typeof fetch = async (input, init) => {
  await Promise.resolve();
  const url = new URL(
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
  );
  if (url.hostname === 'appleid.apple.com') {
    check(init?.redirect === 'error' && !!init.signal, 'Provider redirect/deadline');
    check(init?.body instanceof URLSearchParams, 'Provider form');
    if (appleFailure) return reply({}, 503);
    if (url.pathname.endsWith('/token'))
      return reply({
        id_token:
          'header.' +
          btoa(
            JSON.stringify({
              iss: 'https://appleid.apple.com',
              aud: config['APPLE_CLIENT_ID'],
              sub: subject,
              exp: Math.floor(Date.now() / 1000) + 60,
            }),
          ) +
          '.signature',
      });
    check(url.pathname === '/auth/revoke', 'Fixed revocation route');
    check(
      init?.body instanceof URLSearchParams &&
        init.body.get('token') === 'synthetic-refresh-secret',
      'Stored credential revoked',
    );
    revoked++;
    return reply({});
  }
  check(url.hostname === 'project.example.invalid', 'Fixed database origin');
  if (url.pathname === '/auth/v1/user') return reply(user);
  check(typeof init?.body === 'string', 'RPC JSON');
  const body = JSON.parse(typeof init?.body === 'string' ? init.body : '{}') as Record<
    string,
    unknown
  >;
  if (url.pathname.endsWith('/save_apple_grant')) {
    saved++;
    check(body['actor'] === actor, 'Verified actor owns grant');
    return reply(null);
  }
  if (url.pathname.endsWith('/read_apple_grant')) return reply('synthetic-refresh-secret');
  if (url.pathname.endsWith('/record_operational_outcome')) {
    metrics++;
    check(
      Object.keys(body).sort().join() === 'duration_ms,response_status,service_name',
      'No request identity/content in metrics',
    );
    check(body['service_name'] === 'learning-sync', 'Allowlisted service');
    if (storageFailure) throw new Error('Synthetic recorder outage');
    return reply(null);
  }
  throw new Error('Unexpected route');
};
const handler = appleGrantHandler(env, transport);
const request = (body: unknown = { refreshToken: 'synthetic-refresh-secret' }) =>
  new Request('https://local.invalid/', {
    method: 'POST',
    headers: { Authorization: 'Bearer synthetic-user' },
    body: JSON.stringify(body),
  });
check((await handler(request())).status === 200 && saved === 1, 'Verified grant stored');
subject = 'another-account';
check(
  (await handler(request())).status === 503 && saved === 1,
  'Another Apple identity cannot be attached',
);
subject = 'apple-subject';
check(
  (await handler(request({ refreshToken: 'synthetic-refresh-secret', actor: 'another-account' })))
    .status === 400,
  'No caller-selected actor',
);
check(
  (await handler(new Request('https://local.invalid/', { method: 'POST' }))).status === 401,
  'No anonymous endpoint',
);
const client = createClient(
  config['SUPABASE_URL'] ?? '',
  config['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  { global: { fetch: transport }, auth: { persistSession: false } },
);
await revokeAppleGrant(user, client, env, transport);
check(revoked === 1, 'Revoke saved Apple grant');
appleFailure = true;
let failed = false;
try {
  await revokeAppleGrant(user, client, env, transport);
} catch {
  failed = true;
}
check(failed, 'Provider failure blocks deletion instead of claiming success');
const original = new Response('application response', { status: 409 }),
  wrapped = observeHandler('learning-sync', () => Promise.resolve(original), env, transport);
check(
  (await wrapped(new Request('https://local.invalid/?email=private'))) === original &&
    metrics === 1,
  'Original response preserved',
);
storageFailure = true;
check(
  (await wrapped(new Request('https://local.invalid/'))) === original,
  'Recorder outage cannot replace original response',
);
const thrown = new Error('Original handler failure');
try {
  await observeHandler(
    'learning-sync',
    () => Promise.reject(thrown),
    env,
    transport,
  )(new Request('https://local.invalid/'));
} catch (error) {
  check(error === thrown, 'Original error preserved');
}
const before = metrics;
await observeHandler(
  'learning-sync',
  () => Promise.resolve(original),
  () => undefined,
  transport,
)(new Request('https://local.invalid/'));
await wrapped(new Request('https://local.invalid/', { method: 'OPTIONS' }));
check(metrics === before, 'Default off and preflight do not collect');
console.log(
  'Apple grant ownership/revocation and anonymous operational recorder checks passed; HTTP mocks only, no provider calls.',
);
