import { describe, expect, it } from 'vitest';

import { formatDate, formatNumber } from './format.ts';

describe('Zahlen und Daten über Intl', () => {
  it('Tausender- und Dezimaltrennzeichen je Sprache', () => {
    expect(formatNumber(1234.5, 'de')).toBe('1.234,5');
    expect(formatNumber(1234.5, 'en-US')).toBe('1,234.5');
    expect(formatNumber(1234.5, 'en-GB')).toBe('1,234.5');
  });

  it('Prozent', () => {
    expect(formatNumber(0.75, 'de', { style: 'percent' })).toBe('75\u00a0%'); // geschütztes Leerzeichen vor dem Prozentzeichen;
    expect(formatNumber(0.75, 'en-US', { style: 'percent' })).toBe('75%');
  });

  it('Datum: Reihenfolge von Tag und Monat je Sprache', () => {
    const date = new Date(Date.UTC(2026, 9, 3, 12));
    const options = { timeZone: 'UTC' } as const;
    expect(formatDate(date, 'de', options)).toBe('3.10.2026');
    expect(formatDate(date, 'en-US', options)).toBe('10/3/2026');
    expect(formatDate(date, 'en-GB', options)).toBe('03/10/2026');
  });
});
