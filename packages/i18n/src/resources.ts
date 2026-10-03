// Alle Texte als i18next-Ressourcen, dazu die Typen für typsichere Schlüssel.

// Lädt die i18next-Typen auch dort, wo nur diese Datei eingebunden ist (z. B. tools/), damit die Erweiterung unten greift.
import type {} from 'i18next';

import type { GlossaryResource } from './glossary.ts';
import { glossaryResource } from './glossary.ts';
import type { AppLocale } from './locale.ts';
import { de } from './messages/de.ts';
import { enGB } from './messages/en-gb.ts';
import { enUS } from './messages/en-us.ts';

export const NAMESPACES = ['translation', 'glossary'] as const;

export const RESOURCES = {
  de: { translation: de, glossary: glossaryResource('de') },
  'en-US': { translation: enUS, glossary: glossaryResource('en-US') },
  'en-GB': { translation: enGB, glossary: glossaryResource('en-GB') },
} satisfies Record<AppLocale, Record<(typeof NAMESPACES)[number], object>>;

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    // Deutsch gibt Schlüssel und Platzhalter vor; die Prüfung stellt sicher, dass Englisch dieselben hat.
    resources: { translation: typeof de; glossary: GlossaryResource };
    // Auch mit defaultValue nur bekannte Schlüssel
    strictKeyChecks: true;
  }
}
