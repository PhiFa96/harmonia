import { licenseText } from '../../packages/i18n/src/school-license.ts';
import type { AppLocale } from '../../packages/i18n/src/locale.ts';
import type { LicenseInvoice } from './license-protocol.ts';
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
export function licenseInvoiceHtml(invoice: LicenseInvoice, locale: AppLocale) {
  const t = (key: Parameters<typeof licenseText>[1]) => escape(licenseText(locale, key));
  const money = (cents: number) =>
    escape(
      new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100),
    );
  return `<!doctype html><html lang="${locale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${t('invoiceTitle')}</title><style>body{font:18px/1.5 system-ui;max-width:800px;margin:2rem auto;padding:1rem;color:#111;background:white}h1{font-size:1.7rem}td,th{padding:.5rem;text-align:left;border-bottom:1px solid #777}p{overflow-wrap:anywhere}</style><main><h1>${t('invoiceTitle')}</h1><p>${t('invoiceNote')}</p><p>${t('reference')}: ${escape(invoice.reference)}</p><p>${t('organization')}: ${escape(invoice.organization)}</p><p>${escape(licenseText(locale, 'period', { start: invoice.startsAt, end: invoice.endsAt }))}</p><p>${t(invoice.state)}</p><table><thead><tr><th>${t('quantity')}</th><th>${t('unitAmount')}</th><th>${t('total')}</th></tr></thead><tbody><tr><td>${String(invoice.seats)}</td><td>${money(invoice.unitCents)}</td><td>${money(invoice.totalCents)}</td></tr></tbody></table></main></html>`;
}
