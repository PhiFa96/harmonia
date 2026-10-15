// Globaler Zustand für Einstellungen (Zustand). Serverdaten laufen später über TanStack Query.

import type { AppLocale } from '@harmonia/i18n';
import { create } from 'zustand';

/** Erscheinungsbild: wie das System, immer hell oder immer dunkel */
export type Appearance = 'system' | 'light' | 'dark';

interface SettingsState {
  readonly noteNaming: 'auto' | 'de' | 'intl';
  readonly harmonySystem: 'functions' | 'roman' | 'both';
  readonly sound: boolean;
  readonly referenceHz: number;
  readonly setNoteNaming: (value: SettingsState['noteNaming']) => void;
  readonly setHarmonySystem: (value: SettingsState['harmonySystem']) => void;
  readonly setSound: (value: boolean) => void;
  readonly setReferenceHz: (value: number) => void;
  /** Gewählte Sprache; null = wie das Gerät */
  readonly locale: AppLocale | null;
  readonly appearance: Appearance;
  /** „Bewegung reduzieren“ in der App; die Systemeinstellung gilt zusätzlich */
  readonly reduceMotion: boolean;
  readonly haptics: boolean;
  readonly setLocale: (locale: AppLocale | null) => void;
  readonly setAppearance: (appearance: Appearance) => void;
  readonly setReduceMotion: (reduceMotion: boolean) => void;
  readonly setHaptics: (haptics: boolean) => void;
}

export const useSettings = create<SettingsState>()((set) => ({
  noteNaming: 'auto',
  harmonySystem: 'both',
  sound: true,
  referenceHz: 440,
  setNoteNaming: (noteNaming) => {
    set({ noteNaming });
  },
  setHarmonySystem: (harmonySystem) => {
    set({ harmonySystem });
  },
  setSound: (sound) => {
    set({ sound });
  },
  setReferenceHz: (referenceHz) => {
    if (Number.isInteger(referenceHz) && referenceHz >= 415 && referenceHz <= 466)
      set({ referenceHz });
  },
  locale: null,
  appearance: 'system',
  reduceMotion: false,
  haptics: true,
  setLocale: (locale) => {
    set({ locale });
  },
  setAppearance: (appearance) => {
    set({ appearance });
  },
  setReduceMotion: (reduceMotion) => {
    set({ reduceMotion });
  },
  setHaptics: (haptics) => {
    set({ haptics });
  },
}));
