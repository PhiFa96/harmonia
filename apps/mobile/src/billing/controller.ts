import type { BillingCustomer, BillingOffer, BillingSdk, BillingStatus } from './model.ts';
import { billingError, billingPair } from './model.ts';
export interface BillingState {
  actor: string | null;
  phase: 'guest' | 'unconfigured' | 'loading' | 'ready' | 'error';
  busy: boolean;
  offers: BillingOffer[];
  customer: BillingCustomer | null;
  status: BillingStatus | null;
  notice:
    'purchased' | 'pending' | 'restored' | 'none' | 'canceled' | 'storePending' | 'error' | null;
}
const initial = (actor: string | null): BillingState => ({
  actor,
  phase: actor ? 'loading' : 'guest',
  busy: false,
  offers: [],
  customer: null,
  status: null,
  notice: null,
});
/** Serialize identity changes with purchases. Clearing UI is synchronous; late results are discarded. */
export class BillingController {
  private generation = 0;
  private queue: Promise<unknown> = Promise.resolve();
  private state: BillingState = initial(null);
  constructor(
    private sdk: BillingSdk,
    private available: () => boolean,
    private server: (actor: string, sync: boolean) => Promise<BillingStatus>,
    private update: (state: BillingState) => void,
  ) {}
  private publish(state: BillingState) {
    this.state = state;
    this.update(state);
  }
  private enqueue(work: () => Promise<void>) {
    const result = this.queue.then(work);
    this.queue = result.catch(() => undefined);
    return result;
  }
  private current(actor: string | null, generation: number) {
    return actor === this.state.actor && generation === this.generation;
  }
  setActor(actor: string | null) {
    const generation = ++this.generation;
    this.publish(initial(actor));
    return this.enqueue(async () => {
      if (!this.current(actor, generation)) return;
      if (!this.available()) {
        this.publish({ ...this.state, phase: actor ? 'unconfigured' : 'guest' });
        return;
      }
      try {
        await this.sdk.bind(actor);
        if (actor && this.current(actor, generation)) await this.load(actor, generation, false);
      } catch {
        if (this.current(actor, generation)) this.publish({ ...this.state, phase: 'error' });
      }
    });
  }
  private async load(actor: string, generation: number, sync: boolean) {
    const [sdk, status] = await billingPair(this.sdk.load(), this.server(actor, sync));
    if (this.current(actor, generation))
      this.publish({ ...this.state, ...sdk, status, phase: 'ready' });
  }
  refresh() {
    return this.action('refresh');
  }
  restore() {
    return this.action('restore');
  }
  purchase(id: string, locale: string) {
    if (
      this.state.phase !== 'ready' ||
      !this.state.status?.configured ||
      this.state.customer?.active ||
      this.state.notice === 'pending' ||
      this.state.notice === 'storePending' ||
      this.state.status.entitlements.some((e) => e.active) ||
      !this.state.offers.some((o) => o.id === id)
    )
      return Promise.resolve();
    return this.action('purchase', id, locale);
  }
  private action(kind: 'refresh' | 'restore' | 'purchase', id?: string, locale?: string) {
    const { actor, busy } = this.state,
      generation = this.generation;
    const priorPending =
      this.state.notice === 'pending' || this.state.notice === 'storePending'
        ? this.state.notice
        : null;
    if (!actor || busy || !this.available()) return Promise.resolve();
    this.publish({ ...this.state, busy: true, notice: null });
    return this.enqueue(async () => {
      if (!this.current(actor, generation)) return;
      let purchased = false;
      try {
        if (kind !== 'purchase') await this.sdk.bind(actor);
        if (kind === 'purchase') {
          if (!id || !locale) throw new Error('Missing purchase');
          await this.sdk.purchase(id, locale);
          purchased = true;
        }
        if (kind === 'restore') await this.sdk.restore();
        await this.load(actor, generation, true);
        if (!this.current(actor, generation)) return;
        const active = this.state.status?.entitlements.some((e) => e.active);
        this.publish({
          ...this.state,
          busy: false,
          notice:
            kind === 'purchase'
              ? active
                ? 'purchased'
                : 'pending'
              : kind === 'restore'
                ? active
                  ? 'restored'
                  : this.state.customer?.active
                    ? 'pending'
                    : (priorPending ?? 'none')
                : priorPending && !active
                  ? priorPending
                  : null,
        });
      } catch (error) {
        if (this.current(actor, generation))
          this.publish({
            ...this.state,
            busy: false,
            notice: purchased ? 'pending' : (priorPending ?? billingError(error)),
            ...(kind === 'refresh' ? { phase: 'error' as const } : {}),
            ...(purchased ? { customer: { active: true, managementUrl: null }, offers: [] } : {}),
          });
      }
    });
  }
}
