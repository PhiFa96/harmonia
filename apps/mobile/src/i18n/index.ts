// Übersetzungen in der App: i18next-Instanz aus @harmonia/i18n mit React-Anbindung.
// Die Sprache folgt der Einstellung im Profil, sonst dem Gerät; ein Wechsel wirkt sofort.

// Hermes (iOS/Android) hat kein Intl.PluralRules; i18next braucht es für Pluralformen.
// Das Polyfill greift nur, wo es fehlt oder unvollständig ist (in aktuellen Browsern und Node nicht).
import 'intl-pluralrules';

import type { AppLocale } from '@harmonia/i18n';
import { createI18n, resolveLocale } from '@harmonia/i18n';
import { getLocales } from 'expo-localization';
import { initReactI18next } from 'react-i18next';

import { useSettings } from '@/state/settings';

/** Sprache aus den bevorzugten Sprachen des Geräts. */
export function deviceLocale(): AppLocale {
  return resolveLocale(getLocales());
}

function effectiveLocale(choice: AppLocale | null): AppLocale {
  return choice ?? deviceLocale();
}

export const i18n = createI18n(effectiveLocale(useSettings.getState().locale), [initReactI18next]);

// Web: Sprache der Seite für Screenreader und Silbentrennung (WCAG 3.1.1)
function setDocumentLanguage(locale: string): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
}
setDocumentLanguage(i18n.language);
i18n.on('languageChanged', setDocumentLanguage);

useSettings.subscribe((state, previous) => {
  if (state.locale !== previous.locale) {
    void i18n.changeLanguage(effectiveLocale(state.locale));
  }
});

/** Wirksame Sprache: Einstellung oder Gerät. */
export function useLocale(): AppLocale {
  return effectiveLocale(useSettings((state) => state.locale));
}
