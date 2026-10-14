export type BillingTier = 'premium' | 'max';
export interface BillingOffer {
  id: string;
  tier: BillingTier;
  period: 'monthly' | 'annual';
  price: string;
}
export interface BillingCustomer {
  active: boolean;
  managementUrl: string | null;
}
export interface BillingSdk {
  bind: (actor: string | null) => Promise<void>;
  load: () => Promise<{ offers: BillingOffer[]; customer: BillingCustomer }>;
  purchase: (id: string, locale: string) => Promise<void>;
  restore: () => Promise<void>;
}
export interface BillingStatus {
  configured: boolean;
  simulation: boolean;
  entitlements: {
    entitlement: BillingTier;
    active: boolean;
    expires_at: string;
    store: 'ios' | 'android' | 'web' | 'manual';
    will_renew: boolean | null;
    billing_issue: boolean;
  }[];
}
/** Wait for both SDK/server reads even on failure, before allowing an identity change. */
export async function billingPair<A, B>(first: Promise<A>, second: Promise<B>): Promise<[A, B]> {
  const [one, two] = await Promise.allSettled([first, second]);
  if (one.status !== 'fulfilled' || two.status !== 'fulfilled')
    throw new Error('Billing read failed');
  return [one.value, two.value];
}
export function parseBillingStatus(raw: unknown): BillingStatus {
  if (
    !raw ||
    typeof raw !== 'object' ||
    !('configured' in raw) ||
    typeof raw.configured !== 'boolean' ||
    !('simulation' in raw) ||
    typeof raw.simulation !== 'boolean' ||
    !('entitlements' in raw) ||
    !Array.isArray(raw.entitlements) ||
    raw.entitlements.length > 2
  )
    throw new Error('Invalid billing status');
  const entitlements = raw.entitlements.map(
    (entry: unknown): BillingStatus['entitlements'][number] => {
      if (
        !entry ||
        typeof entry !== 'object' ||
        !('entitlement' in entry) ||
        (entry.entitlement !== 'premium' && entry.entitlement !== 'max') ||
        !('active' in entry) ||
        typeof entry.active !== 'boolean' ||
        !('expires_at' in entry) ||
        typeof entry.expires_at !== 'string' ||
        !Number.isFinite(Date.parse(entry.expires_at)) ||
        !('store' in entry) ||
        (entry.store !== 'ios' &&
          entry.store !== 'android' &&
          entry.store !== 'web' &&
          entry.store !== 'manual') ||
        !('will_renew' in entry) ||
        (entry.will_renew !== null && typeof entry.will_renew !== 'boolean') ||
        !('billing_issue' in entry) ||
        typeof entry.billing_issue !== 'boolean'
      )
        throw new Error('Invalid entitlement');
      return {
        entitlement: entry.entitlement,
        active: entry.active && Date.parse(entry.expires_at) > Date.now(),
        expires_at: entry.expires_at,
        store: entry.store,
        will_renew: entry.will_renew,
        billing_issue: entry.billing_issue,
      };
    },
  );
  if (new Set(entitlements.map((e) => e.entitlement)).size !== entitlements.length)
    throw new Error('Duplicate entitlement');
  return { configured: raw.configured, simulation: raw.simulation, entitlements };
}
export function managementUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  try {
    const url = new URL(raw);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      ![
        'apps.apple.com',
        'play.google.com',
        'billing.revenuecat.com',
        'sandbox.billing.revenuecat.com',
      ].includes(url.hostname)
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}
export function billingError(raw: unknown): 'canceled' | 'storePending' | 'error' {
  if (raw && typeof raw === 'object') {
    if (
      ('userCancelled' in raw && raw.userCancelled === true) ||
      ('errorCode' in raw && raw.errorCode === 1)
    )
      return 'canceled';
    if (
      ('code' in raw && String(raw.code) === '20') ||
      ('errorCode' in raw && raw.errorCode === 20)
    )
      return 'storePending';
  }
  return 'error';
}
