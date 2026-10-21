import { createAudioEngine, createChoirSampler } from '@harmonia/audio';
import { AudioContext, AudioManager } from 'react-native-audio-api';
import { Platform } from 'react-native';

/** Dedicated instrument/context: a late piano download cannot replace the choir sound. */
export function createChoirAudio(referenceHz: number) {
  if (Platform.OS === 'ios')
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playback',
      iosMode: 'default',
      iosOptions: ['mixWithOthers'],
    });
  const context = new AudioContext();
  const engine = createAudioEngine(context, {
    referenceHz,
    volume: 0.65,
    instrument: createChoirSampler(context),
    timers: {
      setInterval: (cb, ms) => setInterval(cb, ms),
      clearInterval: (id) => {
        clearInterval(id as number);
      },
    },
    reportedLatency: () => {
      const inner = (
        context as unknown as { context?: { baseLatency?: number; outputLatency?: number } }
      ).context;
      return {
        ...(inner?.baseLatency !== undefined ? { base: inner.baseLatency } : {}),
        ...(inner?.outputLatency !== undefined ? { output: inner.outputLatency } : {}),
      };
    },
  });
  return { engine, close: () => context.close() };
}
