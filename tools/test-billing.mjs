// Real local Auth/Postgres/Edge integration; current-provider responses are explicitly simulated.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
const status = JSON.parse(
  execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }),
);
const api = new URL(status.API_URL);
assert.ok(
  api.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(api.hostname),
  'Local API only',
);
let checks = 0,
  created = false;
const users = [],
  events = [];
const check = (actual, expected, label) => {
  assert.deepEqual(actual, expected, label);
  checks++;
};
const sql = (text) =>
  execFileSync(
    'docker',
    [
      'exec',
      '-i',
      'supabase_db_harmonia',
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-q',
    ],
    { input: text, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
  );
async function call(path, { method = 'GET', body, token, admin = false } = {}) {
  const response = await fetch(new URL(path, api), {
    method,
    headers: {
      apikey: admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY,
      Authorization: 'Bearer ' + (token ?? (admin ? status.SERVICE_ROLE_KEY : status.ANON_KEY)),
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
    signal: AbortSignal.timeout(20000),
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}
async function user() {
  const email = 'billing-' + randomUUID() + '@example.invalid',
    password = randomUUID() + 'A!';
  const result = await call('/auth/v1/admin/users', {
    method: 'POST',
    admin: true,
    body: { email, password, email_confirm: true },
  });
  check(result.status, 200, 'Created local user');
  users.push(result.data.id);
  const auth = await call('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
  check(auth.status, 200, 'Real JWT');
  return { id: result.data.id, token: auth.data.access_token };
}
function snapshot({
  tier = 'premium',
  store = 'app_store',
  sandbox = true,
  expires = Date.now() + 86400000,
  canceled = false,
  refunded = false,
  empty = false,
  issue = false,
  grace = null,
} = {}) {
  const expiration = new Date(expires).toISOString(),
    past = new Date(Date.now() - 86400000).toISOString();
  return {
    request_date_ms: Date.now(),
    subscriber: {
      entitlements: empty
        ? {}
        : {
            [tier]: {
              expires_date: expiration,
              grace_period_expires_date: grace,
              product_identifier: 'monthly',
            },
          },
      subscriptions: empty
        ? {}
        : {
            monthly: {
              expires_date: expiration,
              is_sandbox: sandbox,
              store,
              unsubscribe_detected_at: canceled ? past : null,
              billing_issues_detected_at: issue ? past : null,
              refunded_at: refunded ? past : null,
            },
          },
    },
  };
}
async function fixture(actor, payload) {
  check(
    (
      await call('/rest/v1/billing_test_snapshots?on_conflict=user_id', {
        method: 'POST',
        admin: true,
        body: { user_id: actor, payload },
      })
    ).status,
    201,
    'Provider fixture',
  );
}
// Explicit upsert header is separate to avoid hiding duplicates in other requests.
async function replace(actor, payload) {
  check(
    (
      await call('/rest/v1/billing_test_snapshots?user_id=eq.' + actor, {
        method: 'PATCH',
        admin: true,
        body: { payload },
      })
    ).status,
    200,
    'New provider state',
  );
}
function receipt(actor, type = 'INITIAL_PURCHASE', extra = {}) {
  const id = randomUUID();
  events.push(id);
  return {
    api_version: '1.0',
    event: {
      id,
      type,
      app_id: 'local-billing-fixture',
      environment: 'SANDBOX',
      event_timestamp_ms: Date.now(),
      app_user_id: actor,
      ...extra,
    },
  };
}
const webhook = (body, token = 'local-only-billing-test-token-000000000000') =>
  call('/functions/v1/billing-webhook', { method: 'POST', token, body });
const account = (who, method = 'GET', body) =>
  call('/functions/v1/billing', { token: who.token, method, body });
async function row(actor) {
  const result = await call('/rest/v1/entitlements?user_id=eq.' + actor, { admin: true });
  check(result.status, 200, 'Stored grants readable by server');
  return result.data;
}
async function send(who, payload, type = 'RENEWAL', extra = {}) {
  await replace(who.id, payload);
  const event = receipt(who.id, type, extra);
  check((await webhook(event)).status, 200, 'Accepted provider event');
  return event;
}
try {
  sql(
    "create table public.billing_test_snapshots(user_id uuid primary key references auth.users(id) on delete cascade,payload jsonb not null);alter table public.billing_test_snapshots enable row level security;revoke all on public.billing_test_snapshots from public,anon,authenticated;grant all on public.billing_test_snapshots to service_role;notify pgrst,'reload schema';",
  );
  created = true;
  for (let i = 0; i < 30; i++) {
    if ((await call('/rest/v1/billing_test_snapshots', { admin: true })).status === 200) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const a = await user(),
    b = await user();
  await fixture(a.id, snapshot());
  await fixture(b.id, snapshot({ empty: true }));
  // Wait for an actual billing Function response, never just an open port.
  for (let i = 0; i < 30; i++) {
    const response = await account(a);
    if (response.status === 200 && response.data.simulation) break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  const first = receipt(a.id);
  check((await webhook(first, 'forged')).status, 401, 'Forged webhook');
  check((await webhook('invalid-json')).status, 400, 'Malformed body');
  check(
    (await webhook({ ...first, event: { ...first.event, app_id: 'other-project' } })).status,
    403,
    'Other provider app',
  );
  check((await row(a.id)).length, 0, 'Unauthorized events create no entitlement');
  check(
    (await account(a, 'POST', { user_id: b.id, entitlement: 'max', active: true })).status,
    400,
    'Client cannot submit entitlement proof',
  );
  check((await webhook(first)).status, 200, 'Initial purchase');
  let rows = await row(a.id);
  check(rows[0].active, true, 'Purchase grants access');
  check(rows[0].store, 'ios', 'Apple store');
  check((await account(a)).data.entitlements[0].active, true, 'Own authenticated access');
  check((await account(b)).data.entitlements.length, 0, 'Other account remains free');
  check(
    (
      await call('/rest/v1/rpc/tutor_account_status', {
        method: 'POST',
        admin: true,
        body: { actor: a.id },
      })
    ).data.tier,
    'premium',
    'Tutor uses billing projection',
  );
  check((await webhook(first)).status, 200, 'Repeated event acknowledged');
  const log = await call('/rest/v1/billing_events?event_id=eq.' + first.event.id, { admin: true });
  check(log.data.length, 1, 'Receipt idempotency');
  check(log.data[0].outcome, 'processed', 'Processed marker');
  check(
    (await webhook({ ...first, event: { ...first.event, type: 'EXPIRATION' } })).status,
    409,
    'Event id collision',
  );
  await send(a, snapshot({ canceled: true }), 'CANCELLATION');
  rows = await row(a.id);
  check(rows[0].active, true, 'Canceled access continues until expiry');
  check(rows[0].will_renew, false, 'Renewal disabled');
  await send(a, snapshot({ canceled: true }), 'INITIAL_PURCHASE', { event_timestamp_ms: 1 });
  check((await row(a.id))[0].will_renew, false, 'Delayed purchase cannot undo cancellation');
  await send(a, snapshot({ expires: Date.now() - 1000 }), 'EXPIRATION');
  check((await account(a)).data.entitlements[0].active, false, 'Expired access removed');
  check(
    (
      await call('/rest/v1/rpc/tutor_account_status', {
        method: 'POST',
        admin: true,
        body: { actor: a.id },
      })
    ).data.tier,
    'free',
    'Tutor loses expired access',
  );
  await send(a, snapshot({ tier: 'max', store: 'play_store' }), 'PRODUCT_CHANGE');
  rows = await row(a.id);
  check(rows.find((r) => r.entitlement === 'max').active, true, 'Upgrade grants Max');
  check(
    rows.find((r) => r.entitlement === 'premium').active,
    false,
    'Missing previous grant removed',
  );
  check(
    (
      await call('/rest/v1/rpc/tutor_account_status', {
        method: 'POST',
        admin: true,
        body: { actor: a.id },
      })
    ).data.tier,
    'max',
    'Tutor gets Max',
  );
  await send(a, snapshot({ tier: 'max', store: 'play_store', refunded: true }), 'CANCELLATION');
  check((await row(a.id)).find((r) => r.entitlement === 'max').active, false, 'Refund revoked');
  await send(a, snapshot({ store: 'rc_billing' }));
  check(
    (await row(a.id)).find((r) => r.entitlement === 'premium').store,
    'web',
    'Web Billing access',
  );
  const ignored = receipt(a.id, 'RENEWAL', { environment: 'PRODUCTION' });
  await replace(a.id, snapshot({ empty: true }));
  check(
    (await webhook(ignored)).status,
    200,
    'Different environment acknowledged without granting',
  );
  check(
    (await row(a.id)).find((r) => r.entitlement === 'premium').active,
    true,
    'Ignored environment does not project',
  );
  await send(
    a,
    snapshot({
      store: 'play_store',
      expires: Date.now() - 1000,
      issue: true,
      grace: new Date(Date.now() + 60000).toISOString(),
    }),
    'BILLING_ISSUE',
  );
  check(
    (await row(a.id)).find((r) => r.entitlement === 'premium').active,
    true,
    'Verified grace access',
  );
  await replace(a.id, snapshot({ empty: true }));
  await replace(b.id, snapshot({ store: 'rc_billing' }));
  const transfer = receipt(b.id, 'TRANSFER', {
    transferred_from: [a.id],
    transferred_to: [b.id],
    environment: null,
  });
  check((await webhook(transfer)).status, 200, 'Transfer reconciles both sides');
  check(
    (await row(a.id)).some((r) => r.active),
    false,
    'Transferred source revoked',
  );
  check((await row(b.id))[0].active, true, 'Transferred destination from current provider state');
  await replace(b.id, { broken: true });
  const retry = receipt(b.id);
  check((await webhook(retry)).status, 503, 'Malformed provider response retryable');
  check(
    (await call('/rest/v1/billing_events?event_id=eq.' + retry.event.id, { admin: true })).data[0]
      .processed_at,
    null,
    'Failed receipt remains pending',
  );
  check((await row(b.id))[0].active, true, 'Failed provider does not erase access');
  await replace(b.id, snapshot({ empty: true }));
  check((await webhook(retry)).status, 200, 'Same event retry after provider recovery');
  check((await row(b.id))[0].active, false, 'Recovered snapshot applied');
  check((await account(a, 'POST', '{}')).status, 200, 'Authenticated explicit resync');
  check(
    (await call('/functions/v1/billing', { token: 'forged' })).status,
    401,
    'Forged user token',
  );
  check(
    (await call('/functions/v1/billing-webhook', { method: 'GET' })).status,
    405,
    'Webhook only POST',
  );
  check(
    (await call('/rest/v1/billing_events', { token: a.token })).status,
    403,
    'Billing receipts are server-only',
  );
  check(
    (await call('/rest/v1/billing_accounts', { token: a.token })).status,
    403,
    'Leases are server-only',
  );
  check(
    (
      await call('/rest/v1/rpc/billing_claim', {
        method: 'POST',
        token: a.token,
        body: { actor: b.id, throttled: false },
      })
    ).status,
    403,
    'Cannot claim another account',
  );
  const owned = await call('/rest/v1/entitlements', { token: a.token });
  check(
    owned.data.every((r) => r.user_id === a.id),
    true,
    'RLS hides other accounts',
  );
  console.log(`${checks} lokale Billing-API-/Datenbankprüfungen bestanden. Keine echten Käufe.`);
} finally {
  for (const id of events)
    await call('/rest/v1/billing_events?event_id=eq.' + id, { method: 'DELETE', admin: true });
  for (const id of users)
    await call('/auth/v1/admin/users/' + id, { method: 'DELETE', admin: true });
  if (created) sql("drop table public.billing_test_snapshots;notify pgrst,'reload schema';");
}
