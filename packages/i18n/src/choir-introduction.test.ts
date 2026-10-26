import { describe, expect, it } from 'vitest';
import authored from './authored-content.json' with { type: 'json' };
import { createContentI18n } from './instance.ts';

describe.each(['de', 'en-US', 'en-GB'] as const)('choir introduction (%s)', (locale) => {
  it('renders every voice and piece with regional clef and duration terms', () => {
    const instance = createContentI18n(locale, authored);
    const intro = instance.t('content.choir.intro');
    expect(intro).toContain(locale === 'de' ? 'vollständige Einzelstimme' : 'complete part');
    expect(intro).toContain(
      locale === 'de' ? 'vier Takte' : locale === 'en-GB' ? 'four bars' : 'four measures',
    );
    for (const voice of ['soprano', 'alto', 'tenor', 'bass'] as const)
      for (const piece of ['Home', 'Arch'] as const) {
        const key = `${voice}${piece}Caption` as keyof typeof authored.de.choir;
        const text = instance.t(`content.choir.${key}` as never);
        expect(text).toContain(
          locale === 'de'
            ? 'acht halbe Noten'
            : locale === 'en-GB'
              ? 'eight minims'
              : 'eight half notes',
        );
        const low = voice === 'tenor' || voice === 'bass';
        expect(text).toContain(
          locale === 'de'
            ? low
              ? 'Bassschlüssel'
              : 'Violinschlüssel'
            : low
              ? 'bass clef'
              : 'treble clef',
        );
        expect(text).not.toMatch(/\$t\(|glossary:|\{\{/);
      }
  });
});
