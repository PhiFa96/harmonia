// i18next-Instanz mit allen Texten. Synchron initialisiert: Texte sind sofort verfügbar.

import type { i18n, Module } from 'i18next';
import i18next from 'i18next';

import type { AppLocale } from './locale.ts';
import { APP_LOCALES } from './locale.ts';
import { NAMESPACES, RESOURCES } from './resources.ts';

/**
 * Neue i18next-Instanz in der gewünschten Sprache.
 * Plugins (z. B. `initReactI18next` aus react-i18next) werden vor der Initialisierung eingebunden.
 */
export function createI18n(locale: AppLocale, plugins: readonly Module[] = []): i18n {
  const instance = i18next.createInstance();
  for (const plugin of plugins) {
    instance.use(plugin);
  }
  void instance.init({
    lng: locale,
    resources: RESOURCES,
    supportedLngs: APP_LOCALES,
    // en-GB enthält nur Abweichungen. Fehlt in Deutsch etwas (verhindert die Prüfung), lieber Englisch als den Schlüssel zeigen.
    fallbackLng: { 'en-GB': ['en-US'], default: ['en-US'] },
    // Nur die gewählte Sprache laden, nicht zusätzlich „en“ für „en-US“
    load: 'currentOnly',
    ns: NAMESPACES,
    defaultNS: 'translation',
    // Texte liegen im Paket: ohne Warten initialisieren
    initAsync: false,
    // React (Web) und React Native maskieren selbst; doppeltes Maskieren würde „&amp;“ zeigen.
    interpolation: { escapeValue: false },
  });
  return instance;
}

export function reminderMessages(locale: AppLocale) {
  const instance = createI18n(locale);
  return {
    title: instance.t('motivation.notificationTitle'),
    body: instance.t('motivation.notificationBody'),
    channel: instance.t('motivation.notificationChannel'),
  };
}
