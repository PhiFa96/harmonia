import { describe, expect, it } from 'vitest';

import { PitchFramer, PitchTracker, PITCH_WINDOW } from './pitch-detection.ts';

function tone(hz: number, sampleRate: number, offset: number, harmonics = false) {
  return Float32Array.from({ length: PITCH_WINDOW }, (_, index) => {
    const phase = (2 * Math.PI * hz * (index + offset)) / sampleRate;
    return 0.35 * Math.sin(phase) + (harmonics ? 0.12 * Math.sin(phase * 2) : 0);
  });
}

describe('microphone pitch detection', () => {
  it.each([44100, 48000])('recognizes a held A4 at %i Hz after 80 ms', (sampleRate) => {
    const tracker = new PitchTracker();
    const stepMs = (PITCH_WINDOW / sampleRate) * 1000;
    expect(tracker.analyze(tone(440, sampleRate, 0), sampleRate, 0).state).toBe('unstable');
    let reading = tracker.analyze(tone(440, sampleRate, PITCH_WINDOW), sampleRate, stepMs);
    expect(reading.state).toBe('unstable');
    reading = tracker.analyze(tone(440, sampleRate, PITCH_WINDOW * 2), sampleRate, stepMs * 2);
    expect(reading.state).toBe('stable');
    if (reading.state === 'stable') {
      expect(reading.midi).toBe(69);
      expect(Math.abs(reading.cents)).toBeLessThan(3);
    }
  });

  it('uses the reference pitch and cents for a harmonic tone', () => {
    const tracker = new PitchTracker(442);
    const rate = 48000;
    let reading = tracker.analyze(tone(449, rate, 0, true), rate, 0);
    for (let i = 1; i < 4; i++)
      reading = tracker.analyze(tone(449, rate, i * PITCH_WINDOW, true), rate, i * 43);
    expect(reading.state).toBe('stable');
    if (reading.state === 'stable') {
      expect(reading.midi).toBe(69);
      expect(reading.cents).toBeGreaterThan(20);
      expect(reading.cents).toBeLessThan(40);
    }
  });

  it.each([82.41, 110, 523.25, 1046.5])('recognizes a sustained %.2f Hz tone', (hz) => {
    const tracker = new PitchTracker();
    const rate = 48000;
    let reading = tracker.analyze(tone(hz, rate, 0, true), rate, 0);
    for (let i = 1; i < 4; i++)
      reading = tracker.analyze(tone(hz, rate, i * PITCH_WINDOW, true), rate, i * 43);
    expect(reading.state).toBe('stable');
    if (reading.state === 'stable') {
      expect(Math.abs(reading.hz - hz) / hz).toBeLessThan(0.02);
    }
  });

  it.each([
    [74, 'unstable'],
    [76, 'stable'],
    [1199, 'stable'],
    [1202, 'unstable'],
  ] as const)('applies the frequency boundaries to %.0f Hz (%s)', (frequency, expected) => {
    const tracker = new PitchTracker();
    const rate = 48000;
    for (let index = 0; index < 3; index++)
      tracker.analyze(tone(frequency, rate, index * PITCH_WINDOW), rate, index * 43);
    expect(tracker.analyze(tone(frequency, rate, 3 * PITCH_WINDOW), rate, 129).state).toBe(
      expected,
    );
  });

  it('uses an absolute clarity floor distinct from the relative peak selection', () => {
    function measure(noise: number) {
      let seed = 6;
      const samples = tone(440, 48000, 0).map((sample) => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return sample + noise * (seed / 2 ** 31 - 1);
      });
      const tracker = new PitchTracker();
      tracker.analyze(samples, 48000, 0);
      tracker.analyze(samples, 48000, 43);
      return tracker.analyze(samples, 48000, 86);
    }
    const accepted = measure(0.15);
    expect(accepted.state).toBe('stable');
    if (accepted.state !== 'stable') throw new Error('Expected the calibrated synthetic tone');
    expect(accepted.clarity).toBeLessThan(0.9);
    expect(accepted.clarity).toBeGreaterThan(0.88);
    const rejected = measure(0.16);
    expect(rejected.state).toBe('unstable');
    if (rejected.state !== 'unstable') throw new Error('Expected rejected synthetic tone');
    expect(rejected.clarity).toBeLessThan(0.88);
  });

  it('restarts stability after a timestamp moves backwards', () => {
    const tracker = new PitchTracker();
    const samples = tone(440, 48000, 0, true);
    for (const time of [100, 143]) tracker.analyze(samples, 48000, time);
    expect(tracker.analyze(samples, 48000, 186).state).toBe('stable');
    expect(tracker.analyze(samples, 48000, 142).state).toBe('unstable');
    expect(tracker.analyze(samples, 48000, 185).state).toBe('unstable');
    expect(tracker.analyze(samples, 48000, 228).state).toBe('stable');
  });

  it('rejects one octave glitch and clears after silence', () => {
    const tracker = new PitchTracker();
    const rate = 48000;
    for (let i = 0; i < 4; i++) tracker.analyze(tone(220, rate, i * PITCH_WINDOW), rate, i * 43);
    const glitch = tracker.analyze(tone(440, rate, 4 * PITCH_WINDOW), rate, 172);
    expect(glitch.state).toBe('stable');
    if (glitch.state === 'stable') expect(glitch.midi).toBe(57);
    expect(tracker.analyze(new Float32Array(PITCH_WINDOW), rate, 215).state).toBe('silent');
    expect(tracker.analyze(tone(220, rate, 5 * PITCH_WINDOW), rate, 258).state).toBe('unstable');
  });

  it('forms contiguous 2048-sample frames from arbitrary recorder chunks', () => {
    const framer = new PitchFramer();
    const samples = Float32Array.from({ length: PITCH_WINDOW * 2 + 100 }, (_, i) => i);
    const frames: { data: Float32Array; atMs: number }[] = [];
    framer.push(samples.subarray(0, 1000), 48000, 1000 / 48, (data, _, atMs) =>
      frames.push({ data: data.slice(), atMs }),
    );
    framer.push(samples.subarray(1000), 48000, samples.length / 48, (data, _, atMs) =>
      frames.push({ data: data.slice(), atMs }),
    );
    expect(frames).toHaveLength(2);
    expect(frames[0]?.data[0]).toBe(0);
    expect(frames[1]?.data[0]).toBe(PITCH_WINDOW);
    expect(frames[1]?.atMs).toBeCloseTo((PITCH_WINDOW * 2) / 48);
  });
});
