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
