// Theme des Design-Systems: Farbschema, „Bewegung reduzieren“ und Haptik für alle Bausteine.

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import type { ColorScheme, ColorTokens } from '../tokens.ts';
import { COLORS, ELEVATION, SCRIM } from '../tokens.ts';

export interface UiTheme {
  readonly scheme: ColorScheme;
  readonly colors: ColorTokens;
  readonly scrim: string;
  /** Schatten für Karten (CSS-Syntax), im Dunkelmodus keiner */
  readonly cardShadow: string | undefined;
  /** Systemeinstellung oder App-Einstellung „Bewegung reduzieren“ */
  readonly reduceMotion: boolean;
  readonly hapticsEnabled: boolean;
}

const UiContext = createContext<UiTheme | null>(null);

/**
 * Systemeinstellung „Bewegung reduzieren“ (iOS, Android; im Web prefers-reduced-motion).
 * Reagiert auf Änderungen, während die App läuft.
 */
function useSystemReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) {
          setReduced(value);
        }
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}

export interface UiProviderProps {
  readonly scheme: ColorScheme;
  /** App-Einstellung; die Systemeinstellung gilt immer zusätzlich. Standard: aus */
  readonly reduceMotion?: boolean;
  /** Standard: an */
  readonly haptics?: boolean;
  readonly children: ReactNode;
}

export function UiProvider({
  scheme,
  reduceMotion = false,
  haptics = true,
  children,
}: UiProviderProps) {
  const systemReduced = useSystemReducedMotion();
  const value = useMemo<UiTheme>(
    () => ({
      scheme,
      colors: COLORS[scheme],
      scrim: SCRIM[scheme],
      cardShadow: ELEVATION[scheme].card,
      reduceMotion: reduceMotion || systemReduced,
      hapticsEnabled: haptics,
    }),
    [scheme, reduceMotion, systemReduced, haptics],
  );
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

/** Theme der nächsten UiProvider-Ebene. */
export function useUiTheme(): UiTheme {
  const theme = useContext(UiContext);
  if (!theme) {
    throw new Error('useUiTheme braucht einen UiProvider weiter oben im Baum');
  }
  return theme;
}
