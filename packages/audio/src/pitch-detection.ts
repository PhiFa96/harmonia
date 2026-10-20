import { PitchDetector } from 'pitchy';

export const PITCH_WINDOW = 2048;
export const PITCH_MIN_HZ = 75;
export const PITCH_MAX_HZ = 1200;
const MIN_RMS = 0.008;
const MIN_CLARITY = 0.88;
const STABLE_MS = 80;
const HISTORY_MS = 180;

export type PitchReading =
  | { readonly state: 'silent'; readonly rms: number }
  | { readonly state: 'unstable'; readonly rms: number; readonly clarity: number }
  | {
      readonly state: 'stable';
      readonly rms: number;
      readonly clarity: number;
      readonly hz: number;
      readonly midi: number;
      readonly cents: number;
    };

/** A 2048-sample mono window is processed locally; no audio or readings are persisted. */
export class PitchTracker {
  private readonly detector = PitchDetector.forFloat32Array(PITCH_WINDOW);
  private readonly history: { midi: number; atMs: number }[] = [];
  private candidate: number | null = null;
  private candidateSince = 0;
  private lastAtMs = -Infinity;

  constructor(private readonly referenceHz = 440) {
    if (!Number.isFinite(referenceHz) || referenceHz < 415 || referenceHz > 466)
      throw new RangeError('referenceHz');
    this.detector.minVolumeDecibels = -42;
    this.detector.clarityThreshold = 0.9;
  }

  reset() {
    this.history.length = 0;
    this.candidate = null;
    this.candidateSince = 0;
    this.lastAtMs = -Infinity;
  }

  analyze(frame: Float32Array, sampleRate: number, atMs: number): PitchReading {
    if (
      frame.length !== PITCH_WINDOW ||
      !Number.isFinite(sampleRate) ||
      sampleRate < 8000 ||
      sampleRate > 192000 ||
      !Number.isFinite(atMs)
    )
      throw new RangeError('pitch_frame');
    let energy = 0;
    for (const sample of frame) energy += sample * sample;
    const rms = Math.sqrt(energy / frame.length);
    if (!Number.isFinite(rms) || rms < MIN_RMS) {
      this.reset();
      return { state: 'silent', rms };
    }
    const [hz, clarity] = this.detector.findPitch(frame, sampleRate);
    if (
      !Number.isFinite(hz) ||
      hz < PITCH_MIN_HZ ||
      hz > PITCH_MAX_HZ ||
      !Number.isFinite(clarity) ||
      clarity < MIN_CLARITY
    ) {
      this.reset();
      return { state: 'unstable', rms, clarity };
    }
    if (atMs < this.lastAtMs || atMs - this.lastAtMs > HISTORY_MS) this.reset();
    this.lastAtMs = atMs;
    const midi = 69 + 12 * Math.log2(hz / this.referenceHz);
    this.history.push({ midi, atMs });
    while (this.history.length > 5 || (this.history[0] && atMs - this.history[0].atMs > HISTORY_MS))
      this.history.shift();
    const sorted = this.history.map((entry) => entry.midi).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] ?? midi;
    const rounded = Math.round(median);
    if (this.candidate !== rounded) {
      this.candidate = rounded;
      this.candidateSince = atMs;
    }
    if (this.history.length < 2 || atMs - this.candidateSince < STABLE_MS)
      return { state: 'unstable', rms, clarity };
    return {
      state: 'stable',
      rms,
      clarity,
      midi: rounded,
      hz: this.referenceHz * 2 ** ((median - 69) / 12),
      cents: (median - rounded) * 100,
    };
  }
}

/** Native callbacks may use a device-specific block size; form contiguous windows. */
export class PitchFramer {
  private readonly pending = new Float32Array(PITCH_WINDOW);
  private used = 0;
  private sampleRate = 0;

  push(
    samples: Float32Array,
    sampleRate: number,
    endingAtMs: number,
    onFrame: (frame: Float32Array, sampleRate: number, atMs: number) => void,
  ) {
    if (sampleRate !== this.sampleRate) {
      this.used = 0;
      this.sampleRate = sampleRate;
    }
    let offset = 0;
    while (offset < samples.length) {
      const count = Math.min(PITCH_WINDOW - this.used, samples.length - offset);
      this.pending.set(samples.subarray(offset, offset + count), this.used);
      this.used += count;
      offset += count;
      if (this.used === PITCH_WINDOW) {
        const frameAt = endingAtMs - ((samples.length - offset) / sampleRate) * 1000;
        onFrame(this.pending, sampleRate, frameAt);
        this.used = 0;
      }
    }
  }
}
