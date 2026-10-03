import { describe, expect, it } from 'vitest';

import { engineLanguage, isAppLocale, resolveLocale } from './locale.ts';

const device = (languageCode: string | null, regionCode: string | null = null) => ({
  languageCode,
  regionCode,
});

describe('Sprache aus den Geräteeinstellungen', () => {
  it('Deutsch in allen Regionen', () => {
    expect(resolveLocale([device('de', 'DE')])).toBe('de');
    expect(resolveLocale([device('de', 'AT')])).toBe('de');
    expect(resolveLocale([device('de', 'CH')])).toBe('de');
    expect(resolveLocale([device('de')])).toBe('de');
  });

  it('britische Begriffe, wo der Musikunterricht sie nutzt', () => {
    for (const region of ['GB', 'IE', 'AU', 'NZ', 'ZA', 'IN']) {
      expect(resolveLocale([device('en', region)])).toBe('en-GB');
    }
  });

  it('sonst amerikanische Begriffe (auch Kanada)', () => {
    for (const region of ['US', 'CA', null]) {
      expect(resolveLocale([device('en', region)])).toBe('en-US');
    }
  });

  it('nimmt die erste unterstützte Sprache in der Reihenfolge des Geräts', () => {
    expect(resolveLocale([device('fr', 'FR'), device('de', 'DE'), device('en', 'US')])).toBe('de');
    expect(resolveLocale([device('es', 'ES'), device('en', 'GB')])).toBe('en-GB');
  });

  it('ohne Deutsch und Englisch: Englisch (US)', () => {
    expect(resolveLocale([device('fr', 'FR')])).toBe('en-US');
    expect(resolveLocale([device(null)])).toBe('en-US');
    expect(resolveLocale([])).toBe('en-US');
  });

  it('Groß- und Kleinschreibung der Codes egal', () => {
    expect(resolveLocale([device('EN', 'gb')])).toBe('en-GB');
  });
});

describe('Hilfsfunktionen', () => {
  it('erkennt App-Sprachen', () => {
    expect(isAppLocale('en-GB')).toBe(true);
    expect(isAppLocale('en')).toBe(false);
    expect(isAppLocale(undefined)).toBe(false);
  });

  it('Sprache und Variante für die Engine', () => {
    expect(engineLanguage('de')).toEqual({ language: 'de' });
    expect(engineLanguage('en-US')).toEqual({ language: 'en', variant: 'us' });
    expect(engineLanguage('en-GB')).toEqual({ language: 'en', variant: 'uk' });
  });
});
