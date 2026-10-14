import { create } from 'zustand';
import { useAuthState } from '@/auth';
import { configuredAuth } from '@/auth/config';
import { BillingController } from './controller.ts';
import type { BillingState } from './controller.ts';
import { billingAvailable, createBillingSdk } from '@/billing/adapter';
import { parseBillingStatus } from './model.ts';
export const useBilling = create<BillingState>(() => ({
  actor: null,
  phase: 'guest',
  busy: false,
  offers: [],
  customer: null,
  status: null,
  notice: null,
}));
const actor = () => {
  const user = useAuthState.getState().session?.user;
  return user && !user.is_anonymous ? user.id : null;
};
const controller = new BillingController(
  createBillingSdk(),
  billingAvailable,
  async (owner, sync) => {
    const config = configuredAuth(),
      session = useAuthState.getState().session;
    if (!config || actor() !== owner || !session) throw new Error('Billing identity');
    const response = await fetch(config.url + '/functions/v1/billing', {
      method: sync ? 'POST' : 'GET',
      headers: { apikey: config.key, Authorization: 'Bearer ' + session.access_token },
      ...(sync ? { body: '{}' } : {}),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok || actor() !== owner) throw new Error('Billing unavailable');
    return parseBillingStatus(await response.json());
  },
  (state) => {
    useBilling.setState(state, true);
  },
);
let previous: string | null | undefined;
export function initializeBilling() {
  const next = actor();
  if (next !== previous) {
    previous = next;
    void controller.setActor(next);
  }
}
useAuthState.subscribe(initializeBilling);
export const refreshBilling = () => controller.refresh();
export const restoreBilling = () => controller.restore();
export const purchaseBilling = (id: string, locale: string) => controller.purchase(id, locale);
