// Farbschema der App aus Einstellung und System; Navigations-Theme aus den Design-Tokens.

import type { ColorScheme } from '@harmonia/ui';
import { COLORS, FONT_FAMILIES } from '@harmonia/ui';
import type { Theme } from 'expo-router';
import { DarkTheme, DefaultTheme } from 'expo-router';
import { useColorScheme } from 'react-native';

import { useSettings } from '@/state/settings';

/** Wirksames Farbschema: Einstellung im Profil, sonst System. */
export function useAppColorScheme(): ColorScheme {
  const appearance = useSettings((state) => state.appearance);
  const system = useColorScheme();
  if (appearance !== 'system') {
    return appearance;
  }
  return system === 'dark' ? 'dark' : 'light';
}

/** Navigation (Kopfzeilen, Tab-Leiste) in den Farben und Schriften des Design-Systems. */
export function navigationTheme(scheme: ColorScheme): Theme {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const c = COLORS[scheme];
  return {
    ...base,
    colors: {
      primary: c.primaryText,
      background: c.background,
      card: c.surface,
      text: c.text,
      border: c.border,
      notification: c.danger,
    },
    fonts: {
      regular: { fontFamily: FONT_FAMILIES.regular, fontWeight: '400' },
      medium: { fontFamily: FONT_FAMILIES.semibold, fontWeight: '600' },
      bold: { fontFamily: FONT_FAMILIES.bold, fontWeight: '700' },
      heavy: { fontFamily: FONT_FAMILIES.extrabold, fontWeight: '800' },
    },
  };
}
