import type { AudioBufferLike } from './context.ts';
import { createSampler } from './sampler.ts';

/** Original synthetic /ɑ/ sample bank. No recordings, downloads or third-party voice models. */
export function ahWave(midi: number, sampleRate = 22050): Float32Array {
  const hz = 440 * 2 ** ((midi - 69) / 12);
  // A periodic wavetable keeps construction cheap and exactly reproducible.
  const table = new Float32Array(2048);
  for (let harmonic = 1; harmonic * hz < Math.min(5000, sampleRate / 2); harmonic++) {
    const frequency = harmonic * hz;
    const formant = (centre: number, width: number) =>
      Math.exp(-0.5 * ((frequency - centre) / width) ** 2);
    const weight =
      (0.18 + formant(750, 130) + 0.6 * formant(1200, 180) + 0.3 * formant(2600, 250)) / harmonic;
    for (let n = 0; n < table.length; n++)
      table[n] = (table[n] ?? 0) + weight * Math.sin((2 * Math.PI * harmonic * n) / table.length);
  }
  const peak = table.reduce((max, n) => Math.max(max, Math.abs(n)), 0);
  // Six seconds cover every half note at the supported tempi, including pitch shifting/release.
  const data = new Float32Array(sampleRate * 6);
  for (let n = 0; n < data.length; n++) {
    const position = ((n * hz) / sampleRate) * table.length;
    const index = Math.floor(position),
      mix = position - index;
    const value =
      (table[index % table.length] ?? 0) * (1 - mix) +
      (table[(index + 1) % table.length] ?? 0) * mix;
    data[n] =
      (value / peak) *
      0.65 *
      Math.min(1, n / (sampleRate * 0.035), (data.length - n) / (sampleRate * 0.12));
  }
  return data;
}
export function createChoirSampler(factory: {
  createBuffer(channels: number, length: number, sampleRate: number): AudioBufferLike;
}) {
  return createSampler(
    [43, 48, 53, 58, 63, 68, 73].map((midi) => {
      const data = ahWave(midi);
      const buffer = factory.createBuffer(1, data.length, 22050);
      buffer.getChannelData(0).set(data);
      return { midi, cents: 0, buffer };
    }),
    { release: 0.12 },
  );
}
