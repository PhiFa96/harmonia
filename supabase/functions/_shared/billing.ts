import { z } from 'zod';

export const billingUuid = z.uuid();
const date = z.iso.datetime({ offset: true });
const ids = z.array(z.string().min(1).max(256)).max(100);
export const billingEventSchema = z.object({
  api_version: z.literal('1.0'),
  event: z
    .object({
      id: z.string().min(1).max(256),
      type: z.string().min(1).max(80),
      app_id: z.string().min(1).max(256),
      environment: z.enum(['SANDBOX', 'PRODUCTION']).nullable().optional(),
      event_timestamp_ms: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
      app_user_id: z.string().max(256).optional(),
      original_app_user_id: z.string().max(256).optional(),
      aliases: ids.optional(),
      transferred_from: ids.optional(),
      transferred_to: ids.optional(),
    })
    .refine(
      (event) => !!event.environment || event.type === 'TRANSFER' || event.type === 'TEST',
      'Missing event environment',
    ),
});
export type BillingEvent = z.infer<typeof billingEventSchema>;
export function billingActors(event: BillingEvent['event']): string[] {
  // Original/alias identities must also be reconciled after transfers. Never grant from the event.
  return [
    ...new Set(
      [
        event.app_user_id,
        event.original_app_user_id,
        ...(event.aliases ?? []),
        ...(event.transferred_from ?? []),
        ...(event.transferred_to ?? []),
      ]
        .filter((id): id is string => billingUuid.safeParse(id).success)
        .map((id) => id.toLowerCase()),
    ),
  ].sort();
}
const entitlement = z.object({
  expires_date: date.nullable(),
  grace_period_expires_date: date.nullable().optional(),
  product_identifier: z.string().min(1).max(512),
});
const subscription = z.object({
  expires_date: date.nullable(),
  grace_period_expires_date: date.nullable().optional(),
  is_sandbox: z.boolean(),
  store: z.string(),
  refunded_at: date.nullable().optional(),
  unsubscribe_detected_at: date.nullable(),
  billing_issues_detected_at: date.nullable(),
});
export const subscriberSchema = z.object({
  request_date_ms: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  subscriber: z.object({
    entitlements: z.record(z.string(), entitlement),
    subscriptions: z.record(z.string(), subscription),
  }),
});
export interface BillingGrant {
  entitlement: 'premium' | 'max';
  active: boolean;
  expires_at: string;
  store: 'ios' | 'android' | 'web';
  product_id: string;
  will_renew: boolean;
  billing_issue: boolean;
}
export function billingSnapshot(raw: unknown, environment: 'SANDBOX' | 'PRODUCTION', now: number) {
  const data = subscriberSchema.parse(raw);
  if (data.request_date_ms > now + 300000) throw new Error('Invalid provider clock');
  const grants: BillingGrant[] = [];
  for (const name of ['premium', 'max'] as const) {
    const ent = data.subscriber.entitlements[name];
    if (!ent) continue;
    const sub = data.subscriber.subscriptions[ent.product_identifier];
    // This integration deliberately sells renewable monthly/annual subscriptions only.
    if (!sub || !ent.expires_date || !sub.expires_date) throw new Error('Unsupported subscription');
    if (sub.is_sandbox !== (environment === 'SANDBOX')) continue;
    const store =
      sub.store === 'app_store'
        ? 'ios'
        : sub.store === 'play_store'
          ? 'android'
          : sub.store === 'rc_billing' || sub.store === 'stripe'
            ? 'web'
            : null;
    if (!store) throw new Error('Unsupported store');
    const expiration = Math.max(
      Date.parse(ent.expires_date),
      Date.parse(ent.grace_period_expires_date ?? ent.expires_date),
      Date.parse(sub.grace_period_expires_date ?? ent.expires_date),
    );
    grants.push({
      entitlement: name,
      active: expiration > now && !sub.refunded_at,
      expires_at: new Date(expiration).toISOString(),
      store,
      product_id: ent.product_identifier,
      will_renew:
        !sub.unsubscribe_detected_at && !sub.billing_issues_detected_at && !sub.refunded_at,
      billing_issue: !!sub.billing_issues_detected_at,
    });
  }
  return { requestMs: data.request_date_ms, grants };
}
/** Bounded streaming reads also enforce a wall-clock limit through the caller's abort signal. */
export async function billingBody(request: Request | Response, limit = 65536): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return '';
  let size = 0,
    text = '';
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const reading = { timedOut: false };
  const timer = setTimeout(() => {
    reading.timedOut = true;
    void reader.cancel().catch(() => undefined);
  }, 10000);
  try {
    for (;;) {
      const chunk = await reader.read();
      if (reading.timedOut) throw new Error('Body timeout');
      if (chunk.done) return text + decoder.decode();
      size += chunk.value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error('Body limit');
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
  } finally {
    clearTimeout(timer);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
export async function billingAuthorization(header: string | null, token: string) {
  if (token.length < 32 || token.length > 512 || !header) return false;
  const encode = new TextEncoder();
  const [first, second] = await Promise.all([
    crypto.subtle.digest('SHA-256', encode.encode(header)),
    crypto.subtle.digest('SHA-256', encode.encode('Bearer ' + token)),
  ]);
  const a = new Uint8Array(first),
    b = new Uint8Array(second);
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return mismatch === 0;
}
