import { Platform } from 'react-native';
import type * as NativeModule from 'react-native-purchases';
import type * as WebModule from '@revenuecat/purchases-js';
import { createBillingSdk as createNative } from '@/billing/adapter';
import { createBillingSdk as createWeb } from '@/billing/adapter.web';
const mockN = {
  configure: jest.fn<undefined, unknown[]>(),
  isAnonymous: jest.fn<Promise<boolean>, []>(),
  logOut: jest.fn<Promise<unknown>, []>(),
  logIn: jest.fn<Promise<unknown>, unknown[]>(),
  getAppUserID: jest.fn<Promise<string>, []>(),
  getOfferings: jest.fn<Promise<unknown>, []>(),
  getCustomerInfo: jest.fn<Promise<unknown>, []>(),
  invalidateCustomerInfoCache: jest.fn<Promise<unknown>, []>(),
  purchasePackage: jest.fn<Promise<unknown>, unknown[]>(),
  restorePurchases: jest.fn<Promise<unknown>, []>(),
};
const mockW = {
  configure: jest.fn<unknown, unknown[]>(),
  getAppUserId: jest.fn<string, []>(),
  changeUser: jest.fn<Promise<unknown>, unknown[]>(),
  getOfferings: jest.fn<Promise<unknown>, []>(),
  getCustomerInfo: jest.fn<Promise<unknown>, []>(),
  purchase: jest.fn<Promise<unknown>, unknown[]>(),
  close: jest.fn<undefined, []>(),
};
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    PACKAGE_TYPE: { MONTHLY: 'MONTHLY', ANNUAL: 'ANNUAL' },
    configure: (...a: unknown[]) => {
      mockN.configure(...a);
    },
    isAnonymous: () => mockN.isAnonymous(),
    logOut: () => mockN.logOut(),
    logIn: (...a: unknown[]) => mockN.logIn(...a),
    getAppUserID: () => mockN.getAppUserID(),
    getOfferings: () => mockN.getOfferings(),
    getCustomerInfo: () => mockN.getCustomerInfo(),
    invalidateCustomerInfoCache: () => mockN.invalidateCustomerInfoCache(),
    purchasePackage: (...a: unknown[]) => mockN.purchasePackage(...a),
    restorePurchases: () => mockN.restorePurchases(),
  },
}));
jest.mock('@revenuecat/purchases-js', () => ({
  PackageType: { Monthly: '$rc_monthly', Annual: '$rc_annual' },
  Purchases: { configure: (...a: unknown[]) => mockW.configure(...a) },
}));
const monthly = {
  identifier: '$rc_monthly',
  packageType: 'MONTHLY',
  product: { subscriptionPeriod: 'P1M', price: 9.99, priceString: '9,99 €' },
};
const annual = {
  identifier: '$rc_annual',
  packageType: 'ANNUAL',
  product: { subscriptionPeriod: 'P1Y', price: 99, priceString: '99,00 €' },
};
const webMonthly = {
  identifier: '$rc_monthly',
  packageType: '$rc_monthly',
  product: {
    normalPeriodDuration: 'P1M',
    price: { amountMicros: 9990000, formattedPrice: '€9.99' },
  },
};
const info = {
  entitlements: { active: {} },
  managementURL: 'https://billing.revenuecat.com/manage/local-test',
};
beforeEach(() => {
  jest.clearAllMocks();
  jest.replaceProperty(Platform, 'OS', 'ios');
  Reflect.set(process.env, 'EXPO_PUBLIC_REVENUECAT_IOS_KEY', 'appl_123456789');
  Reflect.set(process.env, 'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY', 'goog_123456789');
  Reflect.set(process.env, 'EXPO_PUBLIC_REVENUECAT_WEB_KEY', 'rcb_sb_123456789');
  Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_REVENUECAT_MAX_ENABLED');
  mockN.getAppUserID.mockResolvedValue('a');
  mockN.isAnonymous.mockResolvedValue(false);
  mockN.getOfferings.mockResolvedValue({
    all: {
      premium: { availablePackages: [monthly, annual] },
      max: { availablePackages: [monthly] },
    },
  });
  mockN.getCustomerInfo.mockResolvedValue(info);
  mockN.logIn.mockImplementation(() => {
    mockN.getAppUserID.mockResolvedValue('b');
    return Promise.resolve();
  });
  mockW.getAppUserId.mockReturnValue('a');
  mockW.changeUser.mockImplementation(() => {
    mockW.getAppUserId.mockReturnValue('b');
    return Promise.resolve();
  });
  mockW.getOfferings.mockResolvedValue({ all: { premium: { availablePackages: [webMonthly] } } });
  mockW.getCustomerInfo.mockResolvedValue(info);
  mockW.configure.mockReturnValue(mockW);
});
afterEach(() => {
  jest.restoreAllMocks();
  Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_REVENUECAT_IOS_KEY');
  Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY');
  Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_REVENUECAT_WEB_KEY');
  Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_REVENUECAT_MAX_ENABLED');
});
it('native configures with Supabase identity, uses platform price and actual cached package', async () => {
  const sdk = createNative(() =>
    Promise.resolve(jest.requireMock<typeof NativeModule>('react-native-purchases')),
  );
  await sdk.bind('a');
  const loaded = await sdk.load();
  expect(mockN.configure).toHaveBeenCalledWith({ apiKey: 'appl_123456789', appUserID: 'a' });
  expect(loaded.offers.map((p) => [p.period, p.price])).toEqual([
    ['monthly', '9,99 €'],
    ['annual', '99,00 €'],
  ]);
  expect(loaded.offers.every((p) => p.tier === 'premium')).toBe(true);
  await sdk.purchase('premium:$rc_monthly', 'de');
  expect(mockN.purchasePackage).toHaveBeenCalledWith(monthly);
  await sdk.restore();
  expect(mockN.restorePurchases).toHaveBeenCalledTimes(1);
});
it('native uses Android key and rejects invalid periods', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  mockN.getOfferings.mockResolvedValue({
    all: {
      premium: {
        availablePackages: [
          { ...monthly, product: { ...monthly.product, subscriptionPeriod: 'P1W' } },
        ],
      },
    },
  });
  const sdk = createNative(() =>
    Promise.resolve(jest.requireMock<typeof NativeModule>('react-native-purchases')),
  );
  await sdk.bind('a');
  expect(mockN.configure).toHaveBeenCalledWith({ apiKey: 'goog_123456789', appUserID: 'a' });
  expect((await sdk.load()).offers).toEqual([]);
  await expect(sdk.purchase('premium:$rc_monthly', 'de')).rejects.toThrow();
});
it('native binds a new identity and clears packages at logout', async () => {
  const sdk = createNative(() =>
    Promise.resolve(jest.requireMock<typeof NativeModule>('react-native-purchases')),
  );
  await sdk.bind('a');
  await sdk.load();
  await sdk.bind('b');
  expect(mockN.logIn).toHaveBeenCalledWith('b');
  await sdk.bind(null);
  expect(mockN.logOut).toHaveBeenCalledTimes(1);
  await expect(sdk.purchase('premium:$rc_monthly', 'de')).rejects.toThrow();
});
it('native refuses inconsistent provider identity', async () => {
  const sdk = createNative(() =>
    Promise.resolve(jest.requireMock<typeof NativeModule>('react-native-purchases')),
  );
  mockN.getAppUserID.mockResolvedValue('wrong');
  await expect(sdk.bind('a')).rejects.toThrow('Billing identity');
});
it('web uses its own SDK, localized checkout and account-based restore', async () => {
  const sdk = createWeb(() =>
    Promise.resolve(jest.requireMock<typeof WebModule>('@revenuecat/purchases-js')),
  );
  await sdk.bind('a');
  expect(mockW.configure).toHaveBeenCalledWith({
    apiKey: 'rcb_sb_123456789',
    appUserId: 'a',
    flags: { autoCollectUTMAsMetadata: false },
  });
  const loaded = await sdk.load();
  expect(loaded.offers[0]?.price).toBe('€9.99');
  await sdk.purchase('premium:$rc_monthly', 'en-GB');
  expect(mockW.purchase).toHaveBeenCalledWith({
    rcPackage: webMonthly,
    selectedLocale: 'en-GB',
    defaultLocale: 'en',
    skipSuccessPage: true,
  });
  await sdk.restore();
  expect(mockW.getCustomerInfo).toHaveBeenCalledTimes(2);
});
it('web changes identity without aliasing and closes its session at logout', async () => {
  const sdk = createWeb(() =>
    Promise.resolve(jest.requireMock<typeof WebModule>('@revenuecat/purchases-js')),
  );
  await sdk.bind('a');
  await sdk.bind('b');
  expect(mockW.changeUser).toHaveBeenCalledWith('b');
  await sdk.bind(null);
  expect(mockW.close).toHaveBeenCalledTimes(1);
  await expect(sdk.load()).rejects.toThrow();
});
it('Max requires explicit launch enablement', async () => {
  Reflect.set(process.env, 'EXPO_PUBLIC_REVENUECAT_MAX_ENABLED', 'true');
  const sdk = createNative(() =>
    Promise.resolve(jest.requireMock<typeof NativeModule>('react-native-purchases')),
  );
  await sdk.bind('a');
  expect((await sdk.load()).offers.some((o) => o.tier === 'max')).toBe(true);
});
