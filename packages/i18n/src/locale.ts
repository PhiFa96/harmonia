// Sprachen der App: Deutsch und Englisch, Englisch als US- oder UK-Variante (ADR 0003, F02).

export const APP_LOCALES = ['de', 'en-US', 'en-GB'] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

/** Namen der Sprachen in der eigenen Sprache – gleich in jeder Oberfläche, deshalb nicht übersetzt. */
export const LOCALE_NAMES: Readonly<Record<AppLocale, string>> = {
  de: 'Deutsch',
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
};

/**
 * Regionen, deren Musikunterricht die britischen Begriffe nutzt (crotchet, quaver, bar, semitone).
 * Belege und Abwägung: docs/plan/i18n-und-glossar.md, Abschnitt „Standard für Englisch“.
 */
export const BRITISH_TERMINOLOGY_REGIONS: ReadonlySet<string> = new Set([
  'GB',
  'IE',
  'AU',
  'NZ',
  'ZA',
  'IN',
]);

/** Eine bevorzugte Sprache des Geräts (Auszug aus `expo-localization` bzw. `Intl.Locale`). */
export interface DeviceLocale {
  readonly languageCode: string | null;
  readonly regionCode: string | null;
}

/**
 * Sprache der App aus den bevorzugten Sprachen des Geräts, in deren Reihenfolge:
 * die erste deutsche oder englische gewinnt. Ohne Treffer: Englisch (US).
 */
export function resolveLocale(preferred: readonly DeviceLocale[]): AppLocale {
  for (const { languageCode, regionCode } of preferred) {
    const language = languageCode?.toLowerCase();
    if (language === 'de') {
      return 'de';
    }
    if (language === 'en') {
      return regionCode !== null && BRITISH_TERMINOLOGY_REGIONS.has(regionCode.toUpperCase())
        ? 'en-GB'
        : 'en-US';
    }
  }
  return 'en-US';
}

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (APP_LOCALES as readonly string[]).includes(value);
}

/** Sprache und Variante für die Benennungen der Engine (z. B. `durationName`, `describeEvent`). */
export interface MusicLocale {
  readonly locale: AppLocale;
  readonly noteNaming: 'de' | 'intl';
}
export type TextLocale = AppLocale | MusicLocale;
export function textLocale(value: TextLocale): AppLocale {
  return typeof value === 'string' ? value : value.locale;
}
export function notationSystem(value: TextLocale): 'de' | 'intl' {
  return typeof value === 'string' ? (value === 'de' ? 'de' : 'intl') : value.noteNaming;
}
export function engineLanguage(value: TextLocale): {
  readonly language: 'de' | 'en';
  readonly noteNaming?: 'de' | 'intl';
  /** Nur Englisch: US- oder UK-Begriffe. */
  readonly variant?: 'us' | 'uk';
} {
  const names = typeof value === 'string' ? {} : { noteNaming: value.noteNaming };
  switch (textLocale(value)) {
    case 'de':
      return { language: 'de', ...names };
    case 'en-US':
      return { language: 'en', variant: 'us', ...names };
    case 'en-GB':
      return { language: 'en', variant: 'uk', ...names };
  }
}
