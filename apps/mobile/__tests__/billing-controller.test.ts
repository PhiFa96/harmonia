import { BillingController } from '@/billing/controller';
import type { BillingState } from '@/billing/controller';
import type { BillingSdk, BillingStatus } from '@/billing/model';
import { billingError, managementUrl, parseBillingStatus } from '@/billing/model';
import { publicBillingKey } from '@/billing/config';
const status: BillingStatus = { configured: true, simulation: true, entitlements: [] };
let state: BillingState,
  controller: BillingController,
  sdk: jest.Mocked<BillingSdk>,
  server: jest.Mock;
beforeEach(() => {
  sdk = {
    bind: jest.fn<Promise<void>, [string | null]>(() => Promise.resolve()),
    load: jest.fn(() =>
      Promise.resolve({
        offers: [{ id: 'premium:monthly', tier: 'premium', period: 'monthly', price: '9,99 €' }],
        customer: { active: false, managementUrl: null },
      }),
    ),
    purchase: jest.fn<Promise<void>, [string, string]>(() => Promise.resolve()),
    restore: jest.fn(() => Promise.resolve(undefined)),
  };
  server = jest.fn(() => Promise.resolve(status));
  controller = new BillingController(
    sdk,
    () => true,
    server,
    (s) => {
      state = s;
    },
  );
});
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};
it('guests cannot buy or restore', async () => {
  await controller.setActor(null);
  await controller.purchase('premium:monthly', 'de');
  await controller.restore();
  expect(sdk.purchase).not.toHaveBeenCalled();
  expect(sdk.restore).not.toHaveBeenCalled();
  expect(state.phase).toBe('guest');
});
it('unconfigured accounts never contact provider', async () => {
  controller = new BillingController(
    sdk,
    () => false,
    server,
    (s) => {
      state = s;
    },
  );
  await controller.setActor('a');
  expect(state.phase).toBe('unconfigured');
  expect(sdk.bind).not.toHaveBeenCalled();
});
it('binds before loading, passes locale, and trusts server confirmation', async () => {
  await controller.setActor('a');
  await controller.purchase('premium:monthly', 'en-GB');
  expect(sdk.purchase).toHaveBeenCalledWith('premium:monthly', 'en-GB');
  expect(server).toHaveBeenLastCalledWith('a', true);
  expect(state.notice).toBe('pending');
});
it('prevents unknown offers and double taps', async () => {
  await controller.setActor('a');
  const wait = deferred();
  sdk.purchase.mockReturnValue(wait.promise);
  const buy = controller.purchase('premium:monthly', 'de');
  await controller.purchase('premium:monthly', 'de');
  await controller.purchase('forged', 'de');
  wait.resolve();
  await buy;
  expect(sdk.purchase).toHaveBeenCalledTimes(1);
});
it('clears ownership synchronously and serializes SDK logout after pending purchase', async () => {
  await controller.setActor('a');
  const wait = deferred();
  sdk.purchase.mockReturnValue(wait.promise);
  const buy = controller.purchase('premium:monthly', 'de');
  await Promise.resolve();
  const logout = controller.setActor(null);
  expect(state.actor).toBeNull();
  expect(state.offers).toEqual([]);
  expect(sdk.bind).toHaveBeenLastCalledWith('a');
  wait.resolve();
  await buy;
  await logout;
  expect(sdk.bind).toHaveBeenLastCalledWith(null);
  expect(state.status).toBeNull();
  expect(state.notice).toBeNull();
});
it('discards late results when switching directly between accounts', async () => {
  await controller.setActor('a');
  const wait = deferred();
  server.mockImplementationOnce(async () => {
    await wait.promise;
    return status;
  });
  const refresh = controller.refresh();
  await Promise.resolve();
  const switcher = controller.setActor('b');
  expect(state.actor).toBe('b');
  expect(state.status).toBeNull();
  wait.resolve();
  await refresh;
  await switcher;
  expect(server).toHaveBeenLastCalledWith('b', false);
  expect(sdk.bind).toHaveBeenLastCalledWith('b');
});
it('prevents duplicate subscriptions from either server or SDK', async () => {
  sdk.load.mockResolvedValue({ offers: [], customer: { active: true, managementUrl: null } });
  await controller.setActor('a');
  await controller.purchase('premium:monthly', 'de');
  expect(sdk.purchase).not.toHaveBeenCalled();
});
it('never retries a completed purchase when reconciliation fails', async () => {
  await controller.setActor('a');
  server.mockRejectedValue(new Error('offline'));
  await controller.purchase('premium:monthly', 'de');
  expect(state.notice).toBe('pending');
  await controller.purchase('premium:monthly', 'de');
  expect(sdk.purchase).toHaveBeenCalledTimes(1);
  expect(state.offers).toEqual([]);
});
it.each([
  [{ userCancelled: true }, 'canceled'],
  [{ errorCode: 1 }, 'canceled'],
  [{ code: '20' }, 'storePending'],
  [{ errorCode: 20 }, 'storePending'],
  [new Error('secret'), 'error'],
])('maps SDK errors without exposing their messages', async (error, expected) => {
  await controller.setActor('a');
  sdk.purchase.mockRejectedValue(error);
  await controller.purchase('premium:monthly', 'de');
  expect(state.notice).toBe(expected);
});
it('restore uses same signed-in account and reports no active purchase', async () => {
  await controller.setActor('a');
  await controller.restore();
  expect(sdk.restore).toHaveBeenCalledTimes(1);
  expect(server).toHaveBeenLastCalledWith('a', true);
  expect(state.notice).toBe('none');
});
it('refresh failure preserves access data but disables purchases', async () => {
  await controller.setActor('a');
  server.mockRejectedValue(new Error('network'));
  await controller.refresh();
  expect(state.phase).toBe('error');
  await controller.purchase('premium:monthly', 'de');
  expect(sdk.purchase).not.toHaveBeenCalled();
});
it.each(['sk_secret', 'goog_wrongplatform', 'test_123456789', 'appl_x', 'Bearer appl_123456789'])(
  'rejects secret, wrong-platform and test-store public keys',
  (key) => {
    expect(() => publicBillingKey(key, 'ios')).toThrow();
  },
);
it('accepts public platform keys and disabled configuration', () => {
  expect(publicBillingKey('appl_123456789', 'ios')).toBeTruthy();
  expect(publicBillingKey('goog_123456789', 'android')).toBeTruthy();
  expect(publicBillingKey('rcb_sb_123456789', 'web')).toBeTruthy();
  expect(publicBillingKey(undefined, 'web')).toBeNull();
});
it.each([
  'http://billing.revenuecat.com/manage',
  'https://billing.revenuecat.com.evil.invalid',
  'https://evil.invalid',
  'https://x@billing.revenuecat.com/manage',
  'javascript:alert(1)',
  'https://billing.revenuecat.com:444/manage',
])('rejects unsafe management links', (url) => {
  expect(managementUrl(url)).toBeNull();
});
it('allows official account management hosts', () => {
  expect(managementUrl('https://billing.revenuecat.com/manage/token')).toBeTruthy();
});
it('validates status rather than accepting forged shapes', () => {
  expect(parseBillingStatus(status)).toEqual(status);
  expect(() => parseBillingStatus({ ...status, entitlements: [{ active: true }] })).toThrow();
  expect(billingError('raw provider secret')).toBe('error');
});
it('waits for the SDK read after an early server error before switching identity', async () => {
  await controller.setActor('a');
  const wait = deferred();
  sdk.load.mockImplementationOnce(async () => {
    await wait.promise;
    return { offers: [], customer: { active: false, managementUrl: null } };
  });
  server.mockRejectedValueOnce(new Error('network'));
  const refresh = controller.refresh();
  await Promise.resolve();
  await Promise.resolve();
  const switcher = controller.setActor('b');
  expect(state.actor).toBe('b');
  expect(sdk.bind).not.toHaveBeenCalledWith('b');
  wait.resolve();
  await refresh;
  await switcher;
  expect(sdk.bind).toHaveBeenLastCalledWith('b');
  expect(state.actor).toBe('b');
});
it('refresh keeps a pending payment warning until access is confirmed', async () => {
  await controller.setActor('a');
  sdk.purchase.mockRejectedValue({ code: '20' });
  await controller.purchase('premium:monthly', 'de');
  await controller.refresh();
  expect(state.notice).toBe('storePending');
  await controller.purchase('premium:monthly', 'de');
  expect(sdk.purchase).toHaveBeenCalledTimes(1);
  await controller.restore();
  expect(state.notice).toBe('storePending');
  server.mockRejectedValue(new Error('network'));
  await controller.refresh();
  expect(state.notice).toBe('storePending');
});

it('requires a fresh checkout gate before invoking the payment SDK', async () => {
  const sdk: BillingSdk = {
    bind: () => Promise.resolve(),
    load: () =>
      Promise.resolve({
        customer: { active: false, managementUrl: null },
        offers: [{ id: 'p', tier: 'premium', period: 'monthly', price: 'fixture' }],
      }),
    purchase: jest.fn(() => Promise.resolve()),
    restore: () => Promise.resolve(),
  };
  const gate = jest.fn(() => Promise.resolve(false));
  const controller = new BillingController(
    sdk,
    () => true,
    () => Promise.resolve({ configured: true, simulation: false, entitlements: [] }),
    () => undefined,
    gate,
  );
  await controller.setActor('a');
  await controller.purchase('p', 'de');
  expect(gate).toHaveBeenCalledTimes(1);
  expect(sdk.purchase).not.toHaveBeenCalled();
});
