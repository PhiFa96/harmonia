import { readFileSync } from 'node:fs';
import { isIP } from 'node:net';
export const locales = ['de-DE', 'en-US', 'en-GB'];
export const catalog = JSON.parse(
  readFileSync(new URL('../../packages/i18n/src/storefront.json', import.meta.url), 'utf8'),
);
export const readiness = JSON.parse(
  readFileSync(new URL('../../website/readiness.json', import.meta.url), 'utf8'),
);
export const slug = (locale) => ({ 'de-DE': 'de', 'en-US': 'en-us', 'en-GB': 'en-gb' })[locale];
export const pagePath = (locale, support = false) =>
  `/about/${support ? 'support-' : ''}${slug(locale)}.html`;
export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
function leaves(value, prefix = '') {
  if (typeof value === 'string') {
    if (!value.trim()) throw Error('Empty storefront text: ' + prefix);
    return [prefix];
  }
  if (!value || typeof value !== 'object') throw Error('Invalid storefront text: ' + prefix);
  return Object.entries(value)
    .flatMap(([key, child]) => leaves(child, prefix + '.' + key))
    .sort();
}
export function validateCatalog(input) {
  if (JSON.stringify(Object.keys(input).sort()) !== JSON.stringify([...locales].sort()))
    throw Error('Storefront locales must be de-DE, en-US and en-GB');
  const shape = JSON.stringify(leaves(input['de-DE']));
  for (const locale of locales) {
    const text = input[locale];
    if (JSON.stringify(leaves(text)) !== shape)
      throw Error('Storefront translation shape: ' + locale);
    if (text.lang !== (locale === 'de-DE' ? 'de' : locale)) throw Error('HTML language: ' + locale);
    for (const [field, max] of Object.entries({
      name: 30,
      subtitle: 30,
      promotionalText: 170,
      shortDescription: 80,
      description: 4000,
    }))
      if (Array.from(text.store[field]).length > max)
        throw Error(`Store length: ${locale}.${field} > ${max}`);
    // Conservative UTF-8 budget: also fits a 100-character keyword field.
    if (Buffer.byteLength(text.store.keywords, 'utf8') > 100)
      throw Error('Keyword byte budget: ' + locale);
    if (
      text.store.screenshots.map((s) => s.id).join(',') !==
      'learning-path,introduction,exercise,hint'
    )
      throw Error('Screenshot order: ' + locale);
  }
}
export function publicOrigin(value) {
  if (value === null) return null;
  if (typeof value !== 'string') throw Error('Public origin must be HTTPS');
  const u = new URL(value);
  if (
    u.protocol !== 'https:' ||
    u.username ||
    u.password ||
    u.port ||
    u.pathname !== '/' ||
    u.search ||
    u.hash ||
    isIP(u.hostname) ||
    !u.hostname.includes('.') ||
    /(?:^|\.)(localhost|local|test|invalid|example)$/.test(u.hostname)
  )
    throw Error('Public origin must be a public HTTPS origin without path');
  return u.origin;
}
export function validateConfig(config) {
  if (config.version !== 1) throw Error('Storefront configuration version');
  publicOrigin(config.publicOrigin);
  if (
    config.supportEmail !== null &&
    (typeof config.supportEmail !== 'string' ||
      !/^[A-Za-z0-9._+-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(
        config.supportEmail,
      ))
  )
    throw Error('Support email');
  for (const [key, host] of [
    ['appStore', 'apps.apple.com'],
    ['googlePlay', 'play.google.com'],
  ]) {
    const value = config.links?.[key];
    if (value !== null) {
      const u = new URL(value);
      if (
        u.protocol !== 'https:' ||
        u.hostname !== host ||
        u.username ||
        u.password ||
        u.port ||
        u.hash ||
        (key === 'appStore'
          ? !/\/id\d+(?:\/|$)/.test(u.pathname)
          : u.pathname !== '/store/apps/details' || !u.searchParams.get('id'))
      )
        throw Error('Store URL: ' + key);
    }
  }
  for (const key of ['ios', 'android']) {
    if (typeof config.availability?.[key] !== 'boolean') throw Error('Store availability: ' + key);
    if (config.availability[key] && !config.links[key === 'ios' ? 'appStore' : 'googlePlay'])
      throw Error('Available platform needs a real store URL: ' + key);
  }
  if (!config.approvals || typeof config.approvals !== 'object')
    throw Error('Storefront approvals');
}
export function releaseProblems(
  config,
  {
    target = 'store',
    legalMissing = ['not evaluated'],
    deviceMissing = ['not evaluated'],
    media = null,
  } = {},
) {
  validateConfig(config);
  if (!['store', 'website'].includes(target)) throw Error('Unknown release target');
  const missing = [];
  if (!config.publicOrigin) missing.push('publicOrigin');
  if (!config.supportEmail) missing.push('supportEmail');
  const keys =
    target === 'website'
      ? ['brand', 'domain', 'website']
      : ['brand', 'domain', 'storeMetadata', 'nativeStoreMedia', 'currentStoreRequirements'];
  for (const key of keys) {
    const approval = config.approvals[key];
    if (
      approval?.approved !== true ||
      typeof approval.evidenceReference !== 'string' ||
      !approval.evidenceReference.trim()
    )
      missing.push('approvals.' + key);
  }
  missing.push(...legalMissing.map((key) => 'legal.' + key));
  if (target === 'store') {
    missing.push(...deviceMissing.map((key) => 'device.' + key));
    if (
      media?.captureKind !== 'native-device' ||
      media?.reviewed !== true ||
      !media?.reviewReference?.trim()
    )
      missing.push('reviewedNativeMedia');
    for (const locale of locales) {
      for (const platform of ['ios', 'android']) {
        const assets =
          media?.assets?.filter(
            (asset) => asset.locale === locale && asset.platform === platform,
          ) ?? [];
        if (
          assets.filter((a) => a.kind === 'screenshot').length < 4 ||
          (platform === 'ios' && !assets.some((a) => a.kind === 'video'))
        )
          missing.push('media.' + locale + '.' + platform);
      }
    }
  }
  return missing;
}
