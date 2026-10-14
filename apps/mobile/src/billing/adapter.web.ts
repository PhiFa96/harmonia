import type { Package, Purchases } from '@revenuecat/purchases-js';
import type * as WebModule from '@revenuecat/purchases-js';
import { billingConfig } from './config.ts';
import type { BillingOffer, BillingSdk } from './model.ts';
import { managementUrl, billingPair } from './model.ts';
export function billingAvailable() {
  return !!billingConfig().web;
}
export function createBillingSdk(
  loadSdk: () => Promise<typeof WebModule> = () => import('@revenuecat/purchases-js'),
): BillingSdk {
  let instance: Purchases | null = null;
  const packages = new Map<string, Package>();
  return {
    async bind(actor) {
      packages.clear();
      if (!actor) {
        instance?.close();
        instance = null;
        return;
      }
      const key = billingConfig().web;
      if (!key) throw new Error('Billing configuration');
      if (!instance)
        instance = (await loadSdk()).Purchases.configure({
          apiKey: key,
          appUserId: actor,
          flags: { autoCollectUTMAsMetadata: false },
        });
      else if (instance.getAppUserId() !== actor) await instance.changeUser(actor);
      if (instance.getAppUserId() !== actor) throw new Error('Billing identity');
    },
    async load() {
      if (!instance) throw new Error('Billing identity');
      const { PackageType } = await loadSdk();
      const [offerings, info] = await billingPair(
        instance.getOfferings(),
        instance.getCustomerInfo(),
      );
      packages.clear();
      const offers: BillingOffer[] = [];
      for (const tier of ['premium', 'max'] as const) {
        if (tier === 'max' && !billingConfig().maxEnabled) continue;
        for (const pkg of offerings.all[tier]?.availablePackages ?? []) {
          const period =
            pkg.packageType === PackageType.Monthly && pkg.product.normalPeriodDuration === 'P1M'
              ? 'monthly'
              : pkg.packageType === PackageType.Annual && pkg.product.normalPeriodDuration === 'P1Y'
                ? 'annual'
                : null;
          if (!period || !(pkg.product.price.amountMicros > 0) || !pkg.product.price.formattedPrice)
            continue;
          const id = tier + ':' + pkg.identifier;
          if (packages.has(id)) throw new Error('Duplicate package');
          packages.set(id, pkg);
          offers.push({ id, tier, period, price: pkg.product.price.formattedPrice });
        }
      }
      return {
        offers,
        customer: {
          active: !!info.entitlements.active['premium'] || !!info.entitlements.active['max'],
          managementUrl: managementUrl(info.managementURL),
        },
      };
    },
    async purchase(id, locale) {
      const pkg = packages.get(id);
      if (!instance || !pkg) throw new Error('Stale offer');
      await instance.purchase({
        rcPackage: pkg,
        selectedLocale: locale,
        defaultLocale: 'en',
        skipSuccessPage: true,
      });
    },
    // Web subscriptions belong to the same account; there is no device store receipt to restore.
    async restore() {
      if (!instance) throw new Error('Billing identity');
      await instance.getCustomerInfo();
    },
  };
}
