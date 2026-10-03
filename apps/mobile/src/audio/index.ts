// Klang in der App: eine Engine aus @harmonia/audio auf dem AudioContext von react-native-audio-api
// (iOS/Android nativ, im Web die Web Audio API des Browsers).

import type { AudioEngine } from '@harmonia/audio';
import { createAudioEngine } from '@harmonia/audio';
import { Platform } from 'react-native';
import { AudioContext, AudioManager } from 'react-native-audio-api';

let engine: AudioEngine | undefined;

/**
 * Im Web hüllt react-native-audio-api den AudioContext des Browsers ein (Feld `context`) und reicht
 * baseLatency/outputLatency nicht durch. Auf iOS/Android gibt es diese Werte nicht.
 */
function webLatency(context: object): { base?: number; output?: number } {
  if (Platform.OS !== 'web' || !('context' in context)) {
    return {};
  }
  const inner: unknown = context.context;
  if (typeof inner !== 'object' || inner === null) {
    return {};
  }
  const read = (key: string): number | undefined => {
    const value: unknown = (inner as Record<string, unknown>)[key];
    return typeof value === 'number' ? value : undefined;
  };
  const base = read('baseLatency');
  const output = read('outputLatency');
  return { ...(base !== undefined ? { base } : {}), ...(output !== undefined ? { output } : {}) };
}

/**
 * Klang-Engine, beim ersten Aufruf erzeugt. Im Web erst aus einer Nutzeraktion heraus aufrufen
 * (Autoplay-Regeln), danach `resume()`.
 */
export function getAudioEngine(): AudioEngine {
  if (!engine) {
    if (Platform.OS === 'ios') {
      // F12: Ton klingt auch bei Stummschalter („playback“), wie es die Human Interface Guidelines für
      // ausdrücklich gestartete Wiedergabe vorsehen. Wer gerade nicht hören kann, überspringt Hörübungen
      // in der Übung selbst (P1.19). „mixWithOthers“: andere Musik läuft weiter.
      AudioManager.setAudioSessionOptions({
        iosCategory: 'playback',
        iosMode: 'default',
        iosOptions: ['mixWithOthers'],
      });
    }
    const context = new AudioContext();
    engine = createAudioEngine(context, {
      // Als Pfeilfunktionen: Browser verlangen beim Aufruf `window` als `this` („Illegal invocation“)
      timers: {
        setInterval: (callback, ms) => setInterval(callback, ms),
        clearInterval: (handle) => {
          clearInterval(handle as number);
        },
      },
      reportedLatency: () => webLatency(context),
    });
  }
  return engine;
}
