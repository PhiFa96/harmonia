export function publicBillingKey(raw: unknown, platform: 'ios' | 'android' | 'web'): string | null {
  if (raw === undefined || raw === null || raw === '') return null;
  const prefix =
    platform === 'ios' ? 'appl_' : platform === 'android' ? 'goog_' : '(?:rcb_|rcb_sb_)';
  if (typeof raw !== 'string' || !new RegExp('^' + prefix + '[A-Za-z0-9]{8,128}$').test(raw))
    throw new Error('Öffentlicher plattformspezifischer RevenueCat-Schlüssel erwartet');
  return raw;
}
export function billingConfig() {
  return {
    ios: publicBillingKey(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY, 'ios'),
    android: publicBillingKey(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY, 'android'),
    web: publicBillingKey(process.env.EXPO_PUBLIC_REVENUECAT_WEB_KEY, 'web'),
    maxEnabled: process.env.EXPO_PUBLIC_REVENUECAT_MAX_ENABLED === 'true',
  };
}
