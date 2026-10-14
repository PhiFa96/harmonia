import { Platform } from 'react-native';
import type * as NativeModule from 'react-native-purchases';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { billingConfig } from './config.ts';
import type { BillingCustomer, BillingOffer, BillingSdk } from './model.ts';
import { managementUrl, billingPair } from './model.ts';

export function billingAvailable() {
  const config = billingConfig();
  return !!(Platform.OS === 'ios' ? config.ios : Platform.OS === 'android' ? config.android : null);
}
export function createBillingSdk(
  loadSdk: () => Promise<typeof NativeModule> = () => import('react-native-purchases'),
): BillingSdk {
  let initialized = false,
    owner: string | null = null;
  const packages = new Map<string, PurchasesPackage>();
  const sdk = async () => (await loadSdk()).default;
  const customer = (info: CustomerInfo): BillingCustomer => ({
    active: !!info.entitlements.active['premium'] || !!info.entitlements.active['max'],
    managementUrl: managementUrl(info.managementURL),
  });
  return {
    async bind(actor) {
      const Purchases = await sdk(),
        config = billingConfig(),
        key = Platform.OS === 'ios' ? config.ios : config.android;
      packages.clear();
      if (!actor) {
        if (initialized && !(await Purchases.isAnonymous())) await Purchases.logOut();
        owner = null;
        return;
      }
      if (!key) throw new Error('Billing configuration');
      if (!initialized) {
        Purchases.configure({ apiKey: key, appUserID: actor });
        initialized = true;
      } else if ((await Purchases.getAppUserID()) !== actor) await Purchases.logIn(actor);
      if ((await Purchases.getAppUserID()) !== actor) throw new Error('Billing identity');
      owner = actor;
    },
    async load() {
      if (!owner) throw new Error('Billing identity');
      const Purchases = await sdk();
      await Purchases.invalidateCustomerInfoCache();
      const [offerings, info] = await billingPair(
        Purchases.getOfferings(),
        Purchases.getCustomerInfo(),
      );
      const offers: BillingOffer[] = [];
      packages.clear();
      for (const tier of ['premium', 'max'] as const) {
        if (tier === 'max' && !billingConfig().maxEnabled) continue;
        for (const pkg of offerings.all[tier]?.availablePackages ?? []) {
          const period =
            pkg.packageType === Purchases.PACKAGE_TYPE.MONTHLY &&
            pkg.product.subscriptionPeriod === 'P1M'
              ? 'monthly'
              : pkg.packageType === Purchases.PACKAGE_TYPE.ANNUAL &&
                  pkg.product.subscriptionPeriod === 'P1Y'
                ? 'annual'
                : null;
          if (!period || !(pkg.product.price > 0) || !pkg.product.priceString) continue;
          const id = tier + ':' + pkg.identifier;
          if (packages.has(id)) throw new Error('Duplicate package');
          packages.set(id, pkg);
          offers.push({ id, tier, period, price: pkg.product.priceString });
        }
      }
      return { offers, customer: customer(info) };
    },
    async purchase(id) {
      const pkg = packages.get(id);
      if (!owner || !pkg) throw new Error('Stale offer');
      await (await sdk()).purchasePackage(pkg);
    },
    async restore() {
      if (!owner) throw new Error('Billing identity');
      await (await sdk()).restorePurchases();
    },
  };
}
