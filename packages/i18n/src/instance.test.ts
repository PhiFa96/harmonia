import { describe, expect, it } from 'vitest';

import { createI18n, contentTranslator } from './instance.ts';

describe('i18next-Instanz', () => {
  it('Texte sofort nach dem Erzeugen verfügbar', () => {
    const i18n = createI18n('de');
    expect(i18n.t('tabs.learn')).toBe('Lernen');
    expect(createI18n('en-US').t('tabs.learn')).toBe('Learn');
  });

  it('Sprachwechsel zur Laufzeit', async () => {
    const i18n = createI18n('de');
    await i18n.changeLanguage('en-US');
    expect(i18n.t('profile.licenses')).toBe('Licenses');
    await i18n.changeLanguage('en-GB');
    expect(i18n.t('profile.licenses')).toBe('Licences');
    await i18n.changeLanguage('de');
    expect(i18n.t('profile.licenses')).toBe('Lizenzen');
  });

  it('en-GB übernimmt nicht überschriebene Texte aus en-US', () => {
    expect(createI18n('en-GB').t('tabs.practice')).toBe('Practice');
  });

  it('Fachbegriffe in Texten kommen aus dem Glossar der jeweiligen Variante', () => {
    expect(createI18n('de').t('learn.exampleScale')).toBe(
      'Beispiel: C-Dur-Tonleiter in Viertelnoten',
    );
    expect(createI18n('en-US').t('learn.exampleScale')).toBe(
      'Example: C major scale in quarter notes',
    );
    expect(createI18n('en-GB').t('learn.exampleScale')).toBe('Example: C major scale in crotchets');
  });

  it('Pluralformen nach Intl.PluralRules', () => {
    const de = createI18n('de');
    expect(de.t('glossary:measure', { count: 1 })).toBe('Takt');
    expect(de.t('glossary:measure', { count: 0 })).toBe('Takte');
    expect(de.t('glossary:measure', { count: 2 })).toBe('Takte');
    const gb = createI18n('en-GB');
    expect(gb.t('glossary:measure', { count: 1 })).toBe('bar');
    expect(gb.t('glossary:measure', { count: 4 })).toBe('bars');
    expect(gb.t('glossary:interval', { count: 2 })).toBe('intervals');
  });

  it('typsichere Schlüssel', () => {
    const i18n = createI18n('de');
    // @ts-expect-error: unbekannter Schlüssel ist ein Compilerfehler
    expect(i18n.t('tabs.lern')).toBe('tabs.lern');
    // @ts-expect-error: unbekannter Glossarbegriff
    expect(i18n.t('glossary:crotchet')).toBe('crotchet');
  });
});

describe('Explizite Inhaltsbindung ohne Ressourcen-Leck', () => {
  it('löst Glossarbegriffe in DE/US/UK auf und lässt globale Inhalte unverändert', () => {
    const content = {
      de: { probe: { body: '$t(glossary:notes.quarter_one)' } },
      'en-US': { probe: { body: '$t(glossary:notes.quarter_one)' } },
      'en-GB': { probe: { body: '$t(glossary:notes.quarter_one)' } },
    };
    expect(createI18n('de').exists('content.probe.body')).toBe(false);
    expect(contentTranslator('de', content)('content.probe.body')).toBe('Viertelnote');
    expect(contentTranslator('en-US', content)('content.probe.body')).toBe('quarter note');
    expect(contentTranslator('en-GB', content)('content.probe.body')).toBe('crotchet');
    expect(createI18n('de').exists('content.probe.body')).toBe(false);
    expect(createI18n('en-US').exists('content.probe.body')).toBe(false);
  });
});
