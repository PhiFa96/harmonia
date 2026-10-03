// Vorläufige Texte DE/EN für das Grundgerüst. P1.05 ersetzt das durch packages/i18n (i18next, typsichere Schlüssel).

import { getLocales } from 'expo-localization';

import { useSettings } from '@/state/settings';

export type Language = 'de' | 'en';

export interface Strings {
  readonly tabs: { readonly learn: string; readonly practice: string; readonly profile: string };
  readonly placeholder: string;
  readonly exampleScale: string;
  readonly licensesTitle: string;
  readonly bravuraLicense: string;
  readonly languageLabel: string;
  readonly languageOptions: Readonly<Record<Language | 'device', string>>;
}

const STRINGS: Readonly<Record<Language, Strings>> = {
  de: {
    tabs: { learn: 'Lernen', practice: 'Üben', profile: 'Profil' },
    placeholder: 'Hier entsteht gerade etwas.',
    exampleScale: 'Beispiel: C-Dur-Tonleiter',
    licensesTitle: 'Lizenzen',
    bravuraLicense:
      'Notenfont Bravura © Steinberg Media Technologies GmbH, SIL Open Font License 1.1',
    languageLabel: 'Sprache',
    languageOptions: { device: 'Wie das Gerät', de: 'Deutsch', en: 'English' },
  },
  en: {
    tabs: { learn: 'Learn', practice: 'Practice', profile: 'Profile' },
    placeholder: 'Something is being built here.',
    exampleScale: 'Example: C major scale',
    licensesTitle: 'Licences',
    bravuraLicense:
      'Music font Bravura © Steinberg Media Technologies GmbH, SIL Open Font License 1.1',
    languageLabel: 'Language',
    languageOptions: { device: 'Same as device', de: 'Deutsch', en: 'English' },
  },
};

/** Gerätesprache: Deutsch, sonst Englisch (getLocales liefert immer mindestens einen Eintrag). */
export function deviceLanguage(): Language {
  return getLocales()[0].languageCode === 'de' ? 'de' : 'en';
}

export function stringsFor(language: Language): Strings {
  return STRINGS[language];
}

/** Wirksame Sprache: Einstellung oder Gerätesprache. */
export function useLanguage(): Language {
  const language = useSettings((state) => state.language);
  return language ?? deviceLanguage();
}

/** Texte in der gewählten Sprache (Einstellung oder Gerät). */
export function useStrings(): Strings {
  return stringsFor(useLanguage());
}
