// Klavier-Sampler (P1.17): Proben in kleinen Terzen, dazwischen Tonhöhenverschiebung über die
// Abspielrate (höchstens ein Halbton, klanglich unauffällig). Die gemessene Stimmung jeder Probe wird
// ausgeglichen, damit jeder Ton gleichstufig zur Engine passt.

import type { AudioBufferLike } from './context.ts';
import type { Instrument } from './voice.ts';
import { SILENCE } from './voice.ts';

export interface Sample {
  /** MIDI-Nummer der aufgenommenen Taste (A0 = 21). */
  readonly midi: number;
  /** Gemessene Stimmung der Aufnahme in Cent gegenüber gleichstufig mit a¹ = 440 Hz. */
  readonly cents: number;
  readonly buffer: AudioBufferLike;
}

export interface SamplerOptions {
  /** Ausklingen nach dem Ende des Notenwerts (Sekunden). Standard: 0,25. */
  readonly release?: number;
}

/** Einblenden ab dem Anschlag: verhindert ein Knacken, falls der Puffer nicht genau bei 0 beginnt. */
const FADE_IN = 0.003;
/** Ab diesem Pegel (−60 dBFS) beginnt der Klang einer Probe. */
const ONSET_LEVEL = 0.001;

/** Tatsächliche Frequenz einer Aufnahme. */
export function sampleFrequency(sample: Pick<Sample, 'midi' | 'cents'>): number {
  return 440 * 2 ** ((sample.midi - 69 + sample.cents / 100) / 12);
}

/**
 * Beginn des Klangs im Puffer (Sekunden): erstes Sample über −60 dBFS, 1 ms davor.
 * Gleicht Stille und Kodierverzögerung (z. B. bei MP3) aus, egal welcher Decoder sie stehen lässt.
 */
export function onsetOffset(buffer: AudioBufferLike): number {
  const data = buffer.getChannelData(0);
  const index = data.findIndex((x) => Math.abs(x) > ONSET_LEVEL);
  return index <= 0 ? 0 : Math.max(0, index / buffer.sampleRate - 0.001);
}

/** Nächste Probe zur Frequenz (Abstand in Cent) und die nötige Abspielrate. */
export function choose(
  samples: readonly Pick<Sample, 'midi' | 'cents'>[],
  frequency: number,
): { readonly index: number; readonly rate: number } {
  let index = 0;
  let best = Infinity;
  samples.forEach((s, i) => {
    const distance = Math.abs(Math.log2(frequency / sampleFrequency(s)));
    if (distance < best) {
      best = distance;
      index = i;
    }
  });
  const sample = samples[index];
  if (!sample) {
    throw new RangeError('Sampler ohne Proben');
  }
  return { index, rate: frequency / sampleFrequency(sample) };
}

export function createSampler(
  samples: readonly Sample[],
  options: SamplerOptions = {},
): Instrument {
  if (samples.length === 0) {
    throw new RangeError('Sampler ohne Proben');
  }
  const release = options.release ?? 0.25;
  const offsets = samples.map((s) => onsetOffset(s.buffer));

  return {
    play: (ctx, output, frequency, when, duration, peak) => {
      const { index, rate } = choose(samples, frequency);
      const sample = samples[index];
      const offset = offsets[index] ?? 0;
      if (!sample) {
        throw new RangeError('Sampler ohne Proben');
      }
      // Nicht länger als die Probe (bei höherer Abspielrate ist sie kürzer)
      const available = (sample.buffer.duration - offset) / rate;
      const hold = Math.max(FADE_IN, Math.min(duration, available - release));
      const end = when + hold + release;

      const source = ctx.createBufferSource();
      source.buffer = sample.buffer;
      source.playbackRate.setValueAtTime(rate, when);
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(0, when);
      envelope.gain.linearRampToValueAtTime(peak, when + FADE_IN);
      envelope.gain.setValueAtTime(peak, when + hold);
      envelope.gain.exponentialRampToValueAtTime(SILENCE, end);
      source.connect(envelope);
      envelope.connect(output);
      source.start(when, offset);
      source.stop(end + 0.01);
      return { source, envelope, end: end + 0.01 };
    },
  };
}
