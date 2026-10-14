// i18next-Instanz mit allen Texten. Synchron initialisiert: Texte sind sofort verfügbar.

import type { i18n, Module, Resource, ParseKeys } from 'i18next';
import i18next from 'i18next';

import type { AppLocale } from './locale.ts';
import { APP_LOCALES } from './locale.ts';
import { NAMESPACES, RESOURCES } from './resources.ts';
import type { MessageTree } from './messages/types.ts';

/**
 * Neue i18next-Instanz in der gewünschten Sprache.
 * Plugins (z. B. `initReactI18next` aus react-i18next) werden vor der Initialisierung eingebunden.
 */
export function createI18n(locale: AppLocale, plugins: readonly Module[] = []): i18n {
  return initialize(locale, RESOURCES, plugins);
}
/** Explizite Inhaltsbindung für veröffentlichte Daten oder lokale Vorschau; keine globalen Ressourcen ändern. */
export function createContentI18n(
  locale: AppLocale,
  content: Readonly<Record<AppLocale, MessageTree>>,
): i18n {
  const resources = Object.fromEntries(
    APP_LOCALES.map((code) => [
      code,
      {
        ...RESOURCES[code],
        translation: { ...RESOURCES[code].translation, content: content[code] },
      },
    ]),
  );
  return initialize(locale, resources, []);
}
export function contentTranslator(
  locale: AppLocale,
  content: Readonly<Record<AppLocale, MessageTree>>,
) {
  const instance = createContentI18n(locale, content);
  return (key: `content.${string}`): string => {
    if (!instance.exists(key)) throw new Error('Content translation unavailable');
    return instance.t(key as unknown as ParseKeys);
  };
}
function initialize(locale: AppLocale, resources: Resource, plugins: readonly Module[]): i18n {
  const instance = i18next.createInstance();
  for (const plugin of plugins) {
    instance.use(plugin);
  }
  void instance.init({
    lng: locale,
    resources,
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
