// Bewegung aus den Tokens. Bei „Bewegung reduzieren“ nur kurze Überblendungen bzw. sofortige Werte.

import { Easing, ReduceMotion, withSpring, withTiming } from 'react-native-reanimated';

import { DURATION, EASING, SPRING } from '../tokens.ts';

export type SpringName = keyof typeof SPRING;

/**
 * Animation zu einem Zielwert: Feder aus den Tokens, reduziert ohne Bewegung (sofort).
 * Für Größen, Positionen und Breiten.
 */
export function moveTo(target: number, spring: SpringName, reduced: boolean): number {
  if (reduced) {
    return withTiming(target, { duration: 0, reduceMotion: ReduceMotion.Never });
  }
  return withSpring(target, { ...SPRING[spring] });
}

/** Überblenden (Deckkraft): normal 280 ms, reduziert 150 ms. Läuft auch bei Systemeinstellung (kein Weg über Strecke). */
export function fadeTo(target: number, reduced: boolean): number {
  const [x1, y1, x2, y2] = EASING.inOut;
  return withTiming(target, {
    duration: reduced ? DURATION.reduced : DURATION.fade,
    easing: Easing.bezier(x1, y1, x2, y2),
    reduceMotion: ReduceMotion.Never,
  });
}
