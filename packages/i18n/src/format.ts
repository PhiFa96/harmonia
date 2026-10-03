// Zahlen und Daten über Intl in der App-Sprache.
// Hermes (iOS/Android) unterstützt NumberFormat und DateTimeFormat, aber nicht RelativeTimeFormat,
// ListFormat und PluralRules (dafür lädt die App ein Polyfill). Siehe docs/plan/i18n-und-glossar.md.

import type { AppLocale } from './locale.ts';

export function formatNumber(
  value: number,
  locale: AppLocale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatDate(
  value: Date,
  locale: AppLocale,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, options).format(value);
}
