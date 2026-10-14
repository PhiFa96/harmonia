import {
  billingActors,
  billingAuthorization,
  billingBody,
  billingEventSchema,
  billingSnapshot,
} from '../supabase/functions/_shared/billing.ts';
let checks = 0;
const check = (condition: unknown, label: string) => {
  if (!condition) throw new Error(label);
  checks++;
};
const now = Date.parse('2026-10-14T12:00:00Z'),
  future = '2026-11-14T12:00:00Z',
  past = '2026-10-13T12:00:00Z';
const actor = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const make = (store = 'app_store', sandbox = true, expires = future) => ({
  request_date_ms: now,
  subscriber: {
    entitlements: { premium: { product_identifier: 'monthly', expires_date: expires } },
    subscriptions: {
      monthly: {
        expires_date: expires,
        is_sandbox: sandbox,
        store,
        unsubscribe_detected_at: null,
        billing_issues_detected_at: null,
        refunded_at: null,
      },
    },
  },
});
for (const [store, expected] of [
  ['app_store', 'ios'],
  ['play_store', 'android'],
  ['rc_billing', 'web'],
  ['stripe', 'web'],
]) {
  const raw = make(store);
  const grant = billingSnapshot(raw, 'SANDBOX', now).grants[0];
  if (!grant) throw new Error('Missing grant');
  check(grant.active && grant.store === expected, 'Store grant');
  check(grant.will_renew, 'Renewing');
  raw.subscriber.subscriptions.monthly.unsubscribe_detected_at = past as never;
  check(billingSnapshot(raw, 'SANDBOX', now).grants[0]?.active, 'Cancellation keeps paid access');
  check(!billingSnapshot(raw, 'SANDBOX', now).grants[0]?.will_renew, 'Cancellation stops renewal');
}
check(
  !billingSnapshot(make('app_store', true, past), 'SANDBOX', now).grants[0]?.active,
  'Expiration',
);
check(billingSnapshot(make(), 'PRODUCTION', now).grants.length === 0, 'No sandbox in production');
check(
  billingSnapshot(make('app_store', false), 'SANDBOX', now).grants.length === 0,
  'No production in sandbox',
);
const refunded = make();
refunded.subscriber.subscriptions.monthly.refunded_at = past as never;
check(!billingSnapshot(refunded, 'SANDBOX', now).grants[0]?.active, 'Refund removes access');
const grace = make('play_store', true, past) as ReturnType<typeof make> & {
  subscriber: { entitlements: { premium: { grace_period_expires_date: string } } };
};
grace.subscriber.entitlements.premium.grace_period_expires_date = future;
check(billingSnapshot(grace, 'SANDBOX', now).grants[0]?.active, 'Provider grace period');
const subGrace = make('play_store', true, past) as ReturnType<typeof make> & {
  subscriber: { subscriptions: { monthly: { grace_period_expires_date: string } } };
};
subGrace.subscriber.subscriptions.monthly.grace_period_expires_date = future;
check(
  billingSnapshot(subGrace, 'SANDBOX', now).grants[0]?.active,
  'Subscription-only provider grace period',
);
for (const raw of [
  {},
  { ...make(), request_date_ms: now + 400000 },
  make('test_store'),
  {
    ...make(),
    subscriber: {
      entitlements: { premium: { product_identifier: 'missing', expires_date: future } },
      subscriptions: {},
    },
  },
  {
    ...make(),
    subscriber: {
      entitlements: { premium: { product_identifier: 'monthly', expires_date: null } },
      subscriptions: make().subscriber.subscriptions,
    },
  },
]) {
  let failed = false;
  try {
    billingSnapshot(raw, 'SANDBOX', now);
  } catch {
    failed = true;
  }
  check(failed, 'Invalid snapshot fails before writes');
}
const receipt = billingEventSchema.parse({
  api_version: '1.0',
  event: {
    id: 'one',
    type: 'TRANSFER',
    app_id: 'fixture',
    environment: 'SANDBOX',
    event_timestamp_ms: now,
    app_user_id: actor,
    aliases: [actor, '$RCAnonymousID:xyz'],
    transferred_from: ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'],
    subscriber_attributes: { $email: 'private@example.invalid' },
  },
});
check(!JSON.stringify(receipt).includes('private@'), 'Subscriber PII removed');
check(billingActors(receipt.event).length === 2, 'Unique real account identities');
const token = 'local-test-only-token-0000000000000000';
check(await billingAuthorization('Bearer ' + token, token), 'Valid shared bearer');
for (const h of [null, 'Bearer forged', token, 'bearer ' + token])
  check(!(await billingAuthorization(h, token)), 'Forged bearer');
check(!(await billingAuthorization('Bearer x', 'x')), 'Short configured bearer rejected');
check(
  (await billingBody(new Request('https://example.invalid', { method: 'POST', body: '{}' }))) ===
    '{}',
  'Streaming body',
);
let failed = false;
try {
  await billingBody(
    new Request('https://example.invalid', { method: 'POST', body: 'x'.repeat(2048) }),
    1024,
  );
} catch {
  failed = true;
}
check(failed, 'Oversized body');
console.log(
  `${String(checks)} Billing-Proben bestanden; ausschließlich simulierte Anbieterantworten.`,
);
