import { describe, expect, it } from 'vitest';

import { startBeatClock } from './clock.ts';
import { FakeContext, FakeTimers } from './testing/fake-context.ts';

/** Lässt die Audio-Uhr in Timer-Schritten laufen (Standard 25 ms). */
function run(ctx: FakeContext, timers: FakeTimers, until: number, step = 0.025) {
  while (ctx.currentTime < until) {
    ctx.currentTime = Math.round((ctx.currentTime + step) * 1e6) / 1e6;
    timers.tick();
  }
}

describe('Schläge vorausplanen', () => {
  it('120 BPM: jeder Schlag genau einmal, exakt im Raster, rechtzeitig', () => {
    const ctx = new FakeContext();
    const timers = new FakeTimers();
    const beats: { beat: number; time: number; plannedAt: number }[] = [];
    startBeatClock(ctx, timers, {
      tempo: 120,
      startAt: 0.1,
      onBeat: (beat, time) => beats.push({ beat, time, plannedAt: ctx.currentTime }),
    });
    run(ctx, timers, 10);
    expect(beats.map((b) => b.beat)).toEqual([...Array(beats.length).keys()]);
    beats.forEach((b) => {
      expect(b.time).toBeCloseTo(0.1 + b.beat * 0.5, 9);
      expect(b.plannedAt).toBeLessThanOrEqual(b.time);
    });
    expect(beats.length).toBe(20);
  });

  it('kein Drift über lange Zeit (Zeit aus der Schlagnummer, nicht aufaddiert)', () => {
    const ctx = new FakeContext();
    const timers = new FakeTimers();
    let last = 0;
    startBeatClock(ctx, timers, {
      tempo: 97,
      startAt: 0,
      onBeat: (_, time) => (last = time),
    });
    run(ctx, timers, 600, 0.05);
    const beatsPlayed = Math.round(last / (60 / 97));
    expect(last).toBe((beatsPlayed * 60) / 97);
  });

  it('schwankender Timer ändert die Schlagzeiten nicht', () => {
    const ctx = new FakeContext();
    const timers = new FakeTimers();
    const times: number[] = [];
    startBeatClock(ctx, timers, { tempo: 100, startAt: 0, onBeat: (_, t) => times.push(t) });
    const steps = [0.01, 0.04, 0.02, 0.06, 0.03, 0.05];
    for (let i = 0; ctx.currentTime < 5; i++) {
      ctx.currentTime += steps[i % steps.length] ?? 0.025;
      timers.tick();
    }
    times.forEach((t, i) => {
      expect(t).toBeCloseTo(i * 0.6, 9);
    });
  });

  it('nach langer Pause (z. B. Hintergrund): verpasste Schläge auslassen, im Raster weiter', () => {
    const ctx = new FakeContext();
    const timers = new FakeTimers();
    const times: number[] = [];
    const clock = startBeatClock(ctx, timers, {
      tempo: 120,
      startAt: 0,
      onBeat: (_, t) => times.push(t),
    });
    run(ctx, timers, 1);
    ctx.currentTime = 3.2; // Timer kam 2,2 s lang nicht
    timers.tick();
    run(ctx, timers, 4.45); // plant bis 4,55 voraus
    expect(clock.skipped).toBe(4); // 1,5 2,0 2,5 3,0
    expect(times.filter((t) => t > 1.1 && t < 3.1)).toEqual([]);
    expect(times.filter((t) => t >= 3.1)).toEqual([3.5, 4, 4.5]);
  });

  it('endet nach der angegebenen Zahl von Schlägen und gibt den Timer frei', () => {
    const ctx = new FakeContext();
    const timers = new FakeTimers();
    const beats: number[] = [];
    startBeatClock(ctx, timers, { tempo: 60, startAt: 0, beats: 4, onBeat: (b) => beats.push(b) });
    run(ctx, timers, 10);
    expect(beats).toEqual([0, 1, 2, 3]);
    expect(timers.running).toBe(0);
  });

  it('stop beendet sofort', () => {
    const ctx = new FakeContext();
    const timers = new FakeTimers();
    const beats: number[] = [];
    const clock = startBeatClock(ctx, timers, {
      tempo: 60,
      startAt: 0,
      onBeat: (b) => beats.push(b),
    });
    run(ctx, timers, 1.5);
    clock.stop();
    run(ctx, timers, 5);
    expect(beats).toEqual([0, 1]);
    expect(timers.running).toBe(0);
  });
});
