// Globaler Zustand für Einstellungen (Zustand). Serverdaten laufen später über TanStack Query.

import { create } from 'zustand';

import type { Language } from '@/i18n';

interface SettingsState {
  /** Gewählte Sprache; null = Gerätesprache */
  readonly language: Language | null;
  readonly setLanguage: (language: Language | null) => void;
}

export const useSettings = create<SettingsState>()((set) => ({
  language: null,
  setLanguage: (language) => {
    set({ language });
  },
}));
