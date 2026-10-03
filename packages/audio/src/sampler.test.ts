import { parsePitch } from '@harmonia/theory';
import { describe, expect, it } from 'vitest';

import { createAudioEngine } from './engine.ts';
import type { Sample } from './sampler.ts';
import { choose, createSampler, onsetOffset, sampleFrequency } from './sampler.ts';
import { FakeBuffer, FakeContext, FakeTimers } from './testing/fake-context.ts';
import { SILENCE } from './voice.ts';

/** Probe mit 4 s Länge; Klang beginnt nach `silence` Sekunden. */
function buffer(silence = 0, seconds = 4, rate = 48000) {
  const data = new Float32Array(seconds * rate);
  data.fill(0.5, Math.round(silence * rate));
  return new FakeBuffer(data, rate);
}

/** Stützstellen in kleinen Terzen wie bei Salamander: A, C, Dis, Fis. */
const minorThirds = (cents: (midi: number) => number = () => 0): Sample[] =>
  [57, 60, 63, 66, 69, 72].map((midi) => ({ midi, cents: cents(midi), buffer: buffer() }));

const cents = (ratio: number) => 1200 * Math.log2(ratio);

describe('Wahl der Probe und Abspielrate', () => {
  it('nächste Stützstelle, höchstens ein Halbton verschoben', () => {
    const samples = minorThirds();
    for (let midi = 57; midi <= 72; midi++) {
      const f = 440 * 2 ** ((midi - 69) / 12);
      const { index, rate } = choose(samples, f);
      expect(Math.abs(cents(rate))).toBeLessThanOrEqual(100 + 1e-9);
      // Die gewählte Probe mal Rate ergibt genau die Zielfrequenz
      expect(sampleFrequency(samples[index] ?? { midi: 0, cents: 0 }) * rate).toBeCloseTo(f, 9);
    }
  });

  it('Cis4 aus C4 (+1 Halbton), D4 aus Dis4 (−1 Halbton)', () => {
    const samples = minorThirds();
    const cis = choose(samples, 440 * 2 ** ((61 - 69) / 12));
    expect(samples[cis.index]?.midi).toBe(60);
    expect(cents(cis.rate)).toBeCloseTo(100, 9);
    const d = choose(samples, 440 * 2 ** ((62 - 69) / 12));
    expect(samples[d.index]?.midi).toBe(63);
    expect(cents(d.rate)).toBeCloseTo(-100, 9);
  });

  it('gleicht die gemessene Stimmung der Aufnahme aus', () => {
    // a¹-Probe ist 6 Cent zu hoch: für genau 440 Hz etwas langsamer abspielen
    const samples = minorThirds((midi) => (midi === 69 ? 6 : 0));
    const { rate } = choose(samples, 440);
    expect(cents(rate)).toBeCloseTo(-6, 9);
  });
});

describe('Beginn der Probe', () => {
  it('überspringt Stille und Kodierverzögerung (1 ms Vorlauf)', () => {
    expect(onsetOffset(buffer(0.025))).toBeCloseTo(0.024, 4);
    expect(onsetOffset(buffer(0))).toBe(0);
  });
});

describe('Klavier in der Engine', () => {
  function setup(samples = minorThirds(), referenceHz?: number) {
    const ctx = new FakeContext();
    const engine = createAudioEngine(ctx, {
      timers: new FakeTimers(),
      instrument: createSampler(samples),
      ...(referenceHz ? { referenceHz } : {}),
    });
    return { ctx, engine };
  }

  it('spielt a¹ aus der a¹-Probe mit Rate 1, ab dem Anschlag, ohne Knacken', () => {
    const { ctx, engine } = setup();
    ctx.currentTime = 1;
    engine.playPitch(parsePitch('A4'), { duration: 1 });
    const [source] = ctx.sources;
    expect(source?.playbackRate.events[0]?.value).toBeCloseTo(1, 12);
    expect(source?.startTime).toBe(1);
    expect(source?.startOffset).toBe(0);
    const envelope = ctx.gains.at(-1)?.gain.events ?? [];
    expect(envelope[0]).toEqual({ kind: 'set', value: 0, time: 1 });
    expect(envelope[1]?.kind).toBe('linear');
    // Halten bis zum Ende des Notenwerts, dann ausklingen
    expect(envelope[2]).toEqual({ kind: 'set', value: envelope[1]?.value, time: 2 });
    expect(envelope[3]).toEqual({ kind: 'exponential', value: SILENCE, time: 2.25 });
    expect(source?.stopTimes.at(-1)).toBeCloseTo(2.26, 9);
  });

  it('Kammerton 442 Hz verschiebt alle Proben entsprechend', () => {
    const { ctx, engine } = setup(minorThirds(), 442);
    engine.playPitch(parsePitch('A4'));
    expect(cents(ctx.sources[0]?.playbackRate.events[0]?.value ?? 0)).toBeCloseTo(
      cents(442 / 440),
      9,
    );
  });

  it('lange Noten enden spätestens mit der Probe', () => {
    const { ctx, engine } = setup();
    engine.playPitch(parsePitch('C5'), { duration: 10 });
    const end = ctx.gains.at(-1)?.gain.events.at(-1)?.time ?? 0;
    expect(end).toBeLessThanOrEqual(4 + 1e-9);
  });

  it('Akkord: eine Quelle je Ton, alle zur selben Zeit', () => {
    const { ctx, engine } = setup();
    engine.playChord([parsePitch('C4'), parsePitch('E4'), parsePitch('G4')]);
    expect(ctx.sources.map((s) => s.startTime)).toEqual([0, 0, 0]);
    expect(ctx.sources.map((s) => Math.round(cents(s.playbackRate.events[0]?.value ?? 1)))).toEqual(
      [0, 100, 100],
    );
  });

  it('Instrument zur Laufzeit wechseln (Synth bis die Proben geladen sind)', () => {
    const ctx = new FakeContext();
    const engine = createAudioEngine(ctx, { timers: new FakeTimers() });
    engine.playPitch(parsePitch('A4'));
    expect(ctx.oscillators).toHaveLength(1);
    engine.setInstrument(createSampler(minorThirds()));
    engine.playPitch(parsePitch('A4'));
    expect(ctx.sources).toHaveLength(1);
  });

  it('ohne Proben: Fehler', () => {
    expect(() => createSampler([])).toThrow(RangeError);
  });
});
