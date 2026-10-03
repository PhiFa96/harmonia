// Klavierproben laden und als Sampler bereitstellen (P1.17).

import type { Instrument, Sample } from '@harmonia/audio';
import { createSampler } from '@harmonia/audio';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import type { AudioContext } from 'react-native-audio-api';

import { PIANO_SAMPLES } from './piano-samples';

/**
 * Dekodiert alle Proben. iOS/Android: react-native-audio-api nimmt das gebündelte Asset direkt
 * (auch den Sonderfall Android-Release). Web: Die Hülle braucht eine URL, die liefert expo-asset.
 */
export async function loadPiano(context: AudioContext): Promise<Instrument> {
  const samples = await Promise.all(
    PIANO_SAMPLES.map(async ({ midi, asset, cents }): Promise<Sample> => {
      const source = Platform.OS === 'web' ? Asset.fromModule(asset).uri : asset;
      const buffer = await context.decodeAudioData(source);
      return { midi, cents, buffer };
    }),
  );
  return createSampler(samples);
}
