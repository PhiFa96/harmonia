import { describe, expect, it } from 'vitest';
import { ahWave, createChoirSampler } from './choir.ts';
import { FakeBuffer, FakeContext } from './testing/fake-context.ts';
import { PitchTracker } from './pitch-detection.ts';

describe('own synthetic Ah sampler', () => {
  it('produces bounded, deterministic PCM with the intended fundamental', () => {
    const data = ahWave(57);
    expect(data).toEqual(ahWave(57));
    expect(data.every((n) => Number.isFinite(n) && Math.abs(n) <= 0.66)).toBe(true);
    const tracker = new PitchTracker();
    let reading;
    for (let ms = 200; ms <= 500; ms += 40)
      reading = tracker.analyze(
        data.slice(Math.floor(ms * 22.05), Math.floor(ms * 22.05) + 2048),
        22050,
        ms,
      );
    expect(reading?.state).toBe('stable');
    if (reading?.state === 'stable') {
      expect(reading.midi).toBe(57);
      expect(Math.abs(reading.cents)).toBeLessThan(3);
    }
  });
  it('uses actual buffer sources, retunes samples, and sustains supported note durations', () => {
    const instrument = createChoirSampler({
      createBuffer: (_channels, length, rate) => new FakeBuffer(new Float32Array(length), rate),
    });
    const ctx = new FakeContext();
    const voice = instrument.play(ctx, ctx.destination, 466, 2, 2, 0.5);
    expect(voice.end).toBeCloseTo(4.13);
    expect(ctx.sources).toHaveLength(1);
  });
});
