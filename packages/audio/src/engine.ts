// Klang-Engine: Töne, Intervalle, Akkorde, Sequenzen und Metronom auf der Audio-Uhr.
// Plattformneutral: Die App übergibt den AudioContext (Browser oder react-native-audio-api).

import type { Pitch } from '@harmonia/theory';
import { frequency } from '@harmonia/theory';

import type { BeatClock } from './clock.ts';
import { startBeatClock } from './clock.ts';
import type { AudioContextLike, GainLike, Timers } from './context.ts';
import type { Voice } from './voice.ts';
import { scheduleTone } from './voice.ts';

export interface AudioEngineOptions {
  /** Kammerton a¹ in Hz. Standard: 440. */
  readonly referenceHz?: number;
  /** Gesamtlautstärke 0–1. Standard: 0,8. */
  readonly volume?: number;
  /** Timer der Plattform (setInterval/clearInterval); Tests übergeben eigene. */
  readonly timers: Timers;
  /** Vom System gemeldete Latenz, falls der Kontext sie nicht selbst anbietet (z. B. hinter einer Hülle). */
  readonly reportedLatency?: () => { readonly base?: number; readonly output?: number };
}

export interface PlayOptions {
  /** Audio-Zeit; ohne Angabe sofort. */
  readonly when?: number;
  /** Klingdauer in Sekunden. Standard: 1,5. */
  readonly duration?: number;
  /** Lautstärke 0–1. Standard: 0,8. */
  readonly velocity?: number;
}

export interface ChordOptions extends PlayOptions {
  /** Abstand zwischen den Tönen (Sekunden) für ein Arpeggio von unten nach oben; 0 = gleichzeitig. */
  readonly arpeggio?: number;
}

export interface SequenceEvent {
  /** Töne des Ereignisses; leer = Pause. */
  readonly pitches: readonly Pitch[];
  /** Dauer in Schlägen. */
  readonly beats: number;
}

export interface SequenceOptions {
  /** Schläge pro Minute. */
  readonly tempo: number;
  /** Metronom mitlaufen lassen; Zahl = Schläge pro Takt (erster Schlag betont). */
  readonly metronome?: number;
  /** Vorzähler in Schlägen (nur Metronom). Standard: 0. */
  readonly countIn?: number;
}

export interface Playback {
  /** Audio-Zeit des ersten Klangs. */
  readonly startTime: number;
  /** Audio-Zeit, zu der alles verklungen ist. */
  readonly endTime: number;
  stop(): void;
}

export interface LatencyInfo {
  readonly sampleRate: number;
  /** Vom System gemeldete Latenz in Sekunden (nur Browser). Ersetzt keine Messung am Gerät. */
  readonly base?: number;
  readonly output?: number;
}

export interface AudioEngine {
  readonly context: AudioContextLike;
  /** Nach einer Nutzeraktion aufrufen: Browser starten den Klang erst dann (Autoplay-Regeln). */
  resume(): Promise<void>;
  playPitch(pitch: Pitch, options?: PlayOptions): Playback;
  playInterval(
    lower: Pitch,
    upper: Pitch,
    mode: 'melodic' | 'harmonic',
    options?: PlayOptions,
  ): Playback;
  playChord(pitches: readonly Pitch[], options?: ChordOptions): Playback;
  playSequence(events: readonly SequenceEvent[], options: SequenceOptions): Playback;
  startMetronome(tempo: number, beatsPerBar: number): Playback;
  /** Alles sofort beenden (mit kurzer Ausblendung gegen Knacken). */
  stopAll(): void;
  latency(): LatencyInfo;
}

const DEFAULT_DURATION = 1.5;
const DEFAULT_VELOCITY = 0.8;
const CLICK = { duration: 0.05, peak: 0.6, wave: 'sine', attack: 0.001 } as const;
const CLICK_HZ = { accent: 1500, beat: 1000 } as const;
/** Kleiner Vorlauf für geplante Abläufe, damit der erste Ton nicht schon vorbei ist. */
const LEAD = 0.05;

export function createAudioEngine(ctx: AudioContextLike, options: AudioEngineOptions): AudioEngine {
  const referenceHz = options.referenceHz ?? 440;
  const timers = options.timers;
  const master: GainLike = ctx.createGain();
  master.gain.value = options.volume ?? 0.8;
  master.connect(ctx.destination);

  const active = new Set<Voice>();
  const clocks = new Set<BeatClock>();

  /** Verklungene Stimmen abhängen, damit sie freigegeben werden können. */
  const prune = (): void => {
    const now = ctx.currentTime;
    for (const voice of active) {
      if (voice.end < now) {
        voice.oscillator.disconnect();
        voice.envelope.disconnect();
        active.delete(voice);
      }
    }
  };

  const tone = (hz: number, when: number, duration: number, peak: number): void => {
    prune();
    active.add(scheduleTone(ctx, master, hz, when, { duration, peak }));
  };

  const click = (accent: boolean, when: number): void => {
    prune();
    active.add(scheduleTone(ctx, master, accent ? CLICK_HZ.accent : CLICK_HZ.beat, when, CLICK));
  };

  const playback = (startTime: number, endTime: number, stop: () => void): Playback => ({
    startTime,
    endTime,
    stop,
  });

  const playChord = (pitches: readonly Pitch[], opts: ChordOptions = {}): Playback => {
    const start = opts.when ?? ctx.currentTime;
    const duration = opts.duration ?? DEFAULT_DURATION;
    const arpeggio = opts.arpeggio ?? 0;
    // Gleichzeitige Töne leiser, damit die Summe nicht übersteuert
    const peak = (opts.velocity ?? DEFAULT_VELOCITY) / Math.sqrt(Math.max(1, pitches.length));
    const sorted = [...pitches].sort((a, b) => frequency(a) - frequency(b));
    sorted.forEach((p, i) => {
      tone(frequency(p, referenceHz), start + i * arpeggio, duration, peak);
    });
    const end = start + Math.max(0, sorted.length - 1) * arpeggio + duration;
    return playback(start, end, stopAll);
  };

  function stopAll(): void {
    for (const clock of clocks) {
      clock.stop();
    }
    clocks.clear();
    const now = ctx.currentTime;
    for (const voice of active) {
      // Kurz ausblenden statt hart abschneiden (sonst knackt es), dann stoppen
      voice.envelope.gain.cancelScheduledValues(now);
      voice.envelope.gain.setValueAtTime(voice.envelope.gain.value, now);
      voice.envelope.gain.linearRampToValueAtTime(0, now + 0.02);
      voice.oscillator.stop(now + 0.03);
    }
    active.clear();
  }

  const startClock = (
    tempo: number,
    startAt: number,
    beats: number | undefined,
    beatsPerBar: number,
    offset = 0,
  ): BeatClock => {
    const clock = startBeatClock(ctx, timers, {
      tempo,
      startAt,
      ...(beats !== undefined ? { beats } : {}),
      onBeat: (beat, time) => {
        click((beat + offset) % beatsPerBar === 0, time);
      },
    });
    clocks.add(clock);
    return clock;
  };

  return {
    context: ctx,
    resume: async () => {
      if (ctx.state !== 'running') {
        await ctx.resume();
      }
    },
    playPitch: (pitch, opts = {}) => playChord([pitch], opts),
    playInterval: (lower, upper, mode, opts = {}) => {
      if (mode === 'harmonic') {
        return playChord([lower, upper], opts);
      }
      const duration = opts.duration ?? 1;
      const start = opts.when ?? ctx.currentTime;
      const peak = opts.velocity ?? DEFAULT_VELOCITY;
      tone(frequency(lower, referenceHz), start, duration, peak);
      tone(frequency(upper, referenceHz), start + duration, duration, peak);
      return playback(start, start + 2 * duration, stopAll);
    },
    playChord,
    playSequence: (events, opts) => {
      const period = 60 / opts.tempo;
      const countIn = opts.countIn ?? 0;
      const clickStart = ctx.currentTime + LEAD;
      const start = clickStart + countIn * period;
      let beat = 0;
      let end = start;
      for (const event of events) {
        const when = start + beat * period;
        const duration = event.beats * period;
        const peak = DEFAULT_VELOCITY / Math.sqrt(Math.max(1, event.pitches.length));
        for (const p of event.pitches) {
          // Etwas kürzer als der Notenwert, damit gleiche Töne hintereinander getrennt klingen
          tone(frequency(p, referenceHz), when, duration * 0.95, peak);
        }
        beat += event.beats;
        end = Math.max(end, when + duration);
      }
      if (opts.metronome !== undefined) {
        startClock(opts.tempo, clickStart, countIn + Math.ceil(beat), opts.metronome);
      }
      return playback(start, end, stopAll);
    },
    startMetronome: (tempo, beatsPerBar) => {
      const start = ctx.currentTime + LEAD;
      const clock = startClock(tempo, start, undefined, beatsPerBar);
      return playback(start, Infinity, () => {
        clock.stop();
        clocks.delete(clock);
      });
    },
    stopAll,
    latency: () => {
      const reported = options.reportedLatency?.() ?? {
        base: ctx.baseLatency,
        output: ctx.outputLatency,
      };
      return {
        sampleRate: ctx.sampleRate,
        ...(reported.base !== undefined ? { base: reported.base } : {}),
        ...(reported.output !== undefined ? { output: reported.output } : {}),
      };
    },
  };
}
