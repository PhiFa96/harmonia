// Haptik für Rückmeldungen. Abschaltbar (UiProvider); Fehler der Plattform werden ignoriert,
// weil Haptik nur Zusatz ist (im Web vibriert expo-haptics über den Browser, wo möglich).

import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Platform } from 'react-native';

import { useUiTheme } from './theme.tsx';

export interface HapticsApi {
  /** Antippen von Knöpfen, Antworten, Tasten */
  readonly tap: () => void;
  /** Richtige Antwort */
  readonly success: () => void;
  /** Falsche Antwort: Warn-Rückmeldung, kürzer und sanfter als die Fehler-Rückmeldung */
  readonly warning: () => void;
}

const ignore = (): void => undefined;

/**
 * Browser blockieren Vibration vor der ersten Nutzeraktion (und melden einen Fehler in der Konsole),
 * etwa wenn eine Rückmeldung ohne Tippen erscheint. Dann still bleiben.
 */
function allowed(): boolean {
  if (Platform.OS !== 'web') {
    return true;
  }
  const web = globalThis as { navigator?: { userActivation?: { hasBeenActive: boolean } } };
  return web.navigator?.userActivation?.hasBeenActive ?? true;
}

const SILENT: HapticsApi = { tap: ignore, success: ignore, warning: ignore };

const ACTIVE: HapticsApi = {
  tap: () => {
    if (allowed()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(ignore);
    }
  },
  success: () => {
    if (allowed()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignore);
    }
  },
  warning: () => {
    if (allowed()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(ignore);
    }
  },
};

export function useHaptics(): HapticsApi {
  const { hapticsEnabled } = useUiTheme();
  return useMemo(() => (hapticsEnabled ? ACTIVE : SILENT), [hapticsEnabled]);
}
