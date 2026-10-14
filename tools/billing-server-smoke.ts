import { billingServer } from '../supabase/functions/_shared/billing-server.ts';
const actor = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  lease = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const bearer = 'synthetic-incoming-test-token-000000000000000';
let checks = 0,
  providerStatus = 200,
  claim = 'claimed',
  commits = 0,
  releases = 0;
const check = (condition: unknown, label: string) => {
  if (!condition) throw new Error(label);
  checks++;
};
const config: Record<string, string> = {
  SUPABASE_URL: 'https://project.example.invalid',
  SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-fixture',
  REVENUECAT_SECRET_API_KEY: 'synthetic-private-provider-fixture',
  BILLING_WEBHOOK_AUTH_TOKEN: bearer,
  BILLING_REVENUECAT_ENVIRONMENT: 'PRODUCTION',
  BILLING_REVENUECAT_APP_IDS: 'apple-app, play-app, web-app',
};
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const transport: typeof fetch = (input, init) => {
  const url = new URL(
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
    ),
    headers = new Headers(init?.headers);
  if (url.hostname === 'api.revenuecat.com') {
    check(
      url.href === 'https://api.revenuecat.com/v1/subscribers/' + actor,
      'Fixed provider route',
    );
    check(
      headers.get('Authorization') === 'Bearer synthetic-private-provider-fixture',
      'Provider-only API binding',
    );
    check(init?.redirect === 'error', 'Reject redirects');
    check(!!init?.signal, 'Provider deadline');
    return Promise.resolve(
      providerStatus === 200
        ? response({
            request_date_ms: Date.now(),
            subscriber: {
              entitlements: {
                premium: { expires_date: '2099-01-01T00:00:00Z', product_identifier: 'monthly' },
              },
              subscriptions: {
                monthly: {
                  expires_date: '2099-01-01T00:00:00Z',
                  is_sandbox: false,
                  store: 'app_store',
                  unsubscribe_detected_at: null,
                  billing_issues_detected_at: null,
                },
              },
            },
          })
        : response({}, providerStatus),
    );
  }
  check(url.hostname === 'project.example.invalid', 'No client-selected upstream');
  check(
    headers.get('Authorization') === 'Bearer synthetic-service-fixture' ||
      url.pathname === '/auth/v1/user',
    'Private database transport',
  );
  if (url.pathname === '/auth/v1/user')
    return Promise.resolve(
      headers.get('Authorization') === 'Bearer synthetic-user-fixture'
        ? response({
            id: actor,
            aud: 'authenticated',
            app_metadata: {},
            user_metadata: {},
            created_at: '2026-10-14T00:00:00Z',
            is_anonymous: false,
          })
        : response({ msg: 'Invalid' }, 401),
    );
  if (url.pathname.endsWith('/billing_receive'))
    return Promise.resolve(response({ state: 'pending' }));
  if (url.pathname.endsWith('/billing_claim'))
    return Promise.resolve(
      response(claim === 'claimed' ? { state: claim, lease } : { state: claim }),
    );
  if (url.pathname.endsWith('/billing_commit')) {
    commits++;
    if (typeof init?.body !== 'string') throw new Error('Expected JSON transport');
    const body = JSON.parse(init.body) as {
      actor: string;
      grants: { entitlement: string; active: boolean }[];
    };
    check(body.actor === actor, 'Server actor');
    check(
      body.grants[0]?.entitlement === 'premium' && body.grants[0].active,
      'Current snapshot grant',
    );
    return Promise.resolve(response(true));
  }
  if (url.pathname.endsWith('/billing_release')) {
    releases++;
    return Promise.resolve(response(null));
  }
  if (url.pathname.endsWith('/entitlements')) return Promise.resolve(response([]));
  if (url.pathname.endsWith('/billing_events')) return Promise.resolve(response([]));
  throw new Error('Unexpected route');
};
const server = billingServer((key) => config[key], transport);
const receipt = {
  api_version: '1.0',
  event: {
    id: 'synthetic-provider-event',
    type: 'RENEWAL',
    app_id: 'apple-app',
    environment: 'PRODUCTION',
    event_timestamp_ms: Date.now(),
    app_user_id: actor,
  },
};
const webhook = () =>
  server.webhook(
    new Request('https://project.example.invalid/functions/v1/billing-webhook', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + bearer },
      body: JSON.stringify(receipt),
    }),
  );
check((await webhook()).status === 200, 'Production adapter projection');
check(commits === 1 && releases === 1, 'Commit and release');
providerStatus = 401;
check((await webhook()).status === 503, 'Provider rejection retryable');
check(commits === 1 && releases === 2, 'Failure never commits, releases own lease');
providerStatus = 404;
check((await webhook()).status === 503, 'Missing provider customer never grants/revokes');
providerStatus = 200;
claim = 'busy';
check((await webhook()).status === 503, 'Concurrent lease retryable');
claim = 'missing';
check((await webhook()).status === 200, 'Deleted Supabase account ignored');
claim = 'claimed';
const userRequest = () =>
  new Request('https://project.example.invalid/functions/v1/billing', {
    method: 'POST',
    headers: { Authorization: 'Bearer synthetic-user-fixture' },
    body: '{}',
  });
check(
  (await server.account(userRequest())).status === 200,
  'Authenticated sync uses real transport branch',
);
check(
  (
    await server.account(
      new Request('https://project.example.invalid/functions/v1/billing', {
        headers: { Authorization: 'Bearer forged' },
      }),
    )
  ).status === 401,
  'Invalid user rejected',
);
check(
  (
    await billingServer(
      (key) => (key === 'BILLING_WEBHOOK_AUTH_TOKEN' ? undefined : config[key]),
      transport,
    ).webhook(new Request('https://example.invalid', { method: 'POST' }))
  ).status === 503,
  'Missing incoming binding disables integration',
);
check(
  (
    await billingServer(
      (key) => (key === 'HARMONIA_BILLING_LOCAL_TEST' ? 'true' : config[key]),
      transport,
    ).account(userRequest())
  ).status === 200,
  'Remote URL cannot activate local provider',
);
console.log(
  `${String(checks)} Billing-Transportprüfungen bestanden; nur explizite HTTP-Attrappen, keine Anbieteraufrufe.`,
);
