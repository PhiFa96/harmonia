// Klang für den Spike (P1.16): ein Oszillator mit Hüllkurve. Der Klavier-Sampler folgt in P1.17
// und ersetzt diese Stimme, die Schnittstelle bleibt.

import type {
  AudioContextLike,
  AudioNodeLike,
  GainLike,
  OscillatorLike,
  WaveForm,
} from './context.ts';

export interface ToneOptions {
  /** Länge bis zum Ausklingen (Sekunden). */
  readonly duration: number;
  /** Spitzenlautstärke 0–1. */
  readonly peak: number;
  readonly wave?: WaveForm;
  /** Einschwingzeit (Sekunden); kurz, aber nicht null, sonst knackt es. */
  readonly attack?: number;
}

/** Leiser als das: Ton gilt als verklungen (exponentielle Rampen können nicht bei 0 enden). */
export const SILENCE = 0.0001;

/** Eine geplante Stimme: zum vorzeitigen Stoppen und zum Aufräumen nach `end`. */
export interface Voice {
  /** Klangquelle (Oszillator oder Puffer). */
  readonly source: Pick<OscillatorLike, 'stop' | 'disconnect'>;
  readonly envelope: GainLike;
  /** Audio-Zeit, ab der die Stimme verklungen und gestoppt ist. */
  readonly end: number;
}

/** Ein Instrument plant Töne: Frequenz in Hz (aus der Engine, gleichstufig), Länge, Spitzenlautstärke. */
export interface Instrument {
  play(
    ctx: AudioContextLike,
    output: AudioNodeLike,
    frequency: number,
    when: number,
    duration: number,
    peak: number,
  ): Voice;
}

/** Einfacher Klang ohne Proben (Spike, Rückfallebene, solange die Proben laden). */
export const SYNTH: Instrument = {
  play: (ctx, output, frequency, when, duration, peak) =>
    scheduleTone(ctx, output, frequency, when, { duration, peak }),
};

/**
 * Plant einen Ton auf der Audio-Uhr. Aufräumen übernimmt der Aufrufer nach `end`: Das Ende-Ereignis
 * heißt im Browser `onended`, in react-native-audio-api `onEnded`, deshalb wird es nicht genutzt.
 */
export function scheduleTone(
  ctx: AudioContextLike,
  output: AudioNodeLike,
  frequency: number,
  when: number,
  options: ToneOptions,
): Voice {
  const attack = options.attack ?? 0.005;
  const osc = ctx.createOscillator();
  osc.type = options.wave ?? 'triangle';
  osc.frequency.setValueAtTime(frequency, when);
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0, when);
  envelope.gain.linearRampToValueAtTime(options.peak, when + attack);
  envelope.gain.exponentialRampToValueAtTime(SILENCE, when + options.duration);
  osc.connect(envelope);
  envelope.connect(output);
  const end = when + options.duration + 0.02;
  osc.start(when);
  osc.stop(end);
  return { source: osc, envelope, end };
}
