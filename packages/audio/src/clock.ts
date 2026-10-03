// Schläge vorausplanen („Lookahead“): Ein JavaScript-Timer schaut regelmäßig nach vorn und plant alle
// Schläge der nächsten Zeitspanne fest auf der Audio-Uhr ein. Der Timer darf schwanken, die Schläge nicht.
// Prinzip nach Chris Wilson, „A Tale of Two Clocks“ (web.dev, 2013).

import type { AudioContextLike, Timers } from './context.ts';

export interface BeatClockOptions {
  /** Schläge pro Minute. */
  readonly tempo: number;
  /** Audio-Zeit des ersten Schlags. */
  readonly startAt: number;
  /** Wird für jeden Schlag einmal aufgerufen, rechtzeitig vor seiner Zeit. */
  readonly onBeat: (beat: number, time: number) => void;
  /** Nach so vielen Schlägen endet die Uhr von selbst (Standard: unbegrenzt). */
  readonly beats?: number;
  /** So weit (Sekunden) wird vorausgeplant. Standard: 0,1. */
  readonly lookahead?: number;
  /** So oft (Millisekunden) schaut der Timer nach. Standard: 25. */
  readonly intervalMs?: number;
}

export interface BeatClock {
  stop(): void;
  /** Ausgelassene Schläge (Timer kam zu spät, z. B. weil die App im Hintergrund war). */
  readonly skipped: number;
}

/** Schläge, die mehr als so viel (Sekunden) in der Vergangenheit lägen, werden ausgelassen statt verspätet gespielt. */
const LATE_TOLERANCE = 0.01;

export function startBeatClock(
  ctx: AudioContextLike,
  timers: Timers,
  options: BeatClockOptions,
): BeatClock {
  const period = 60 / options.tempo;
  const lookahead = options.lookahead ?? 0.1;
  const total = options.beats ?? Infinity;
  let next = 0;
  let skipped = 0;
  let running = true;

  const stop = (): void => {
    if (running) {
      running = false;
      timers.clearInterval(handle);
    }
  };

  const tick = (): void => {
    if (!running) {
      return;
    }
    const horizon = ctx.currentTime + lookahead;
    // Zeit aus der Schlagnummer berechnen (nicht aufaddieren), damit sich keine Rundungsfehler sammeln
    while (next < total && options.startAt + next * period < horizon) {
      const time = options.startAt + next * period;
      if (time < ctx.currentTime - LATE_TOLERANCE) {
        skipped++;
      } else {
        options.onBeat(next, time);
      }
      next++;
    }
    if (next >= total) {
      stop();
    }
  };

  const handle = timers.setInterval(tick, options.intervalMs ?? 25);
  tick();
  return {
    stop,
    get skipped() {
      return skipped;
    },
  };
}
