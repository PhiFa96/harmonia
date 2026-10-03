import { describe, expect, it } from 'vitest';

import type { ResourceSet } from './check.ts';
import { checkTranslations } from './check.ts';
import type { MessageTree } from './messages/types.ts';

/** Kleine Testdaten: Deutsch, Englisch (US), Englisch (UK, nur Abweichungen). */
function set(
  de: MessageTree,
  en: MessageTree,
  gb: MessageTree = {},
  glossary: Partial<Record<'de' | 'en' | 'gb', MessageTree>> = {},
): ResourceSet {
  return {
    de: { translation: de, glossary: glossary.de ?? { bar: 'Takt' } },
    'en-US': { translation: en, glossary: glossary.en ?? { bar: 'measure' } },
    'en-GB': { translation: gb, glossary: glossary.gb ?? { bar: 'bar' } },
  };
}

describe('Prüfung der Übersetzungen', () => {
  it('die echten Texte sind vollständig', () => {
    expect(checkTranslations()).toEqual([]);
  });

  it('fehlende und überzählige Schlüssel', () => {
    const problems = checkTranslations(set({ a: 'A', b: { c: 'C' } }, { a: 'A', d: 'D' }));
    expect(problems).toEqual([
      'en-US translation:b.c: fehlt (vorhanden in de)',
      'en-US translation:d: gibt es in de nicht',
    ]);
  });

  it('leere Texte', () => {
    expect(checkTranslations(set({ a: 'A' }, { a: ' ' }))).toEqual([
      'en-US translation:a: leerer Text',
    ]);
  });

  it('fehlende Pluralformen', () => {
    const problems = checkTranslations(
      set({ n_one: 'eine Note', n_other: '{{count}} Noten' }, { n_other: '{{count}} notes' }),
    );
    expect(problems).toEqual(['en-US translation:n: Pluralformen fehlen (one)']);
  });

  it('Pluralformen nur in einer Sprache', () => {
    const problems = checkTranslations(set({ n_one: 'Note', n_other: 'Noten' }, { n: 'notes' }));
    expect(problems).toEqual(['en-US translation:n: Pluralformen nur in einer der Sprachen']);
  });

  it('abweichende Platzhalter', () => {
    const problems = checkTranslations(
      set({ a: 'Hallo {{name}}, {{count, number}} Punkte' }, { a: 'Hello {{nme}}, {{count}}' }),
    );
    expect(problems).toEqual([
      'en-US translation:a: Platzhalter {{nme}}, {{count}} statt {{name}}, {{count}} wie in de',
    ]);
  });

  it('en-GB: nur bekannte Schlüssel, Pluralgruppen vollständig, keine neuen Platzhalter', () => {
    const problems = checkTranslations(
      set(
        { a: 'A {{x}}', n_one: 'Takt', n_other: 'Takte' },
        { a: 'A {{x}}', n_one: 'measure', n_other: 'measures' },
        { a: 'A {{y}}', n_one: 'bar', z: 'Z' },
      ),
    );
    expect(problems).toEqual([
      'en-GB translation:n: Pluralformen fehlen (other)',
      'en-GB translation:a: unbekannte Platzhalter {{y}}',
      'en-GB translation:n: unvollständig überschrieben, es fehlt n_other',
      'en-GB translation:z: gibt es in en-US nicht',
    ]);
  });

  it('Verweise auf das Glossar', () => {
    const problems = checkTranslations(
      set(
        { a: 'Im $t(glossary:bar)', b: '$t(glossary:missing)' },
        { a: 'In the $t(glossary:bar)', b: '$t(glossary:missing)' },
      ),
    );
    expect(problems).toEqual([
      'de translation:b: Verweis auf unbekannten Text glossary:missing',
      'en-US translation:b: Verweis auf unbekannten Text glossary:missing',
    ]);
  });

  it('Verweise auf Pluralformen und mit Optionen', () => {
    const glossary = {
      de: { bar_one: 'Takt', bar_other: 'Takte' },
      en: { bar_one: 'measure', bar_other: 'measures' },
      gb: {},
    };
    const problems = checkTranslations(
      set(
        { a: '$t(glossary:bar_other)', b: '$t(glossary:bar, {"count": 2})' },
        { a: '$t(glossary:bar_other)', b: '$t(glossary:bar, {"count": 2})' },
        {},
        glossary,
      ),
    );
    expect(problems).toEqual([]);
  });
});
