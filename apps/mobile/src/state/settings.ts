// Globaler Zustand für Einstellungen (Zustand). Serverdaten laufen später über TanStack Query.

import type { AppLocale } from '@harmonia/i18n';
import { create } from 'zustand';

interface SettingsState {
  /** Gewählte Sprache; null = wie das Gerät */
  readonly locale: AppLocale | null;
  readonly setLocale: (locale: AppLocale | null) => void;
}

export const useSettings = create<SettingsState>()((set) => ({
  locale: null,
  setLocale: (locale) => {
    set({ locale });
  },
}));
