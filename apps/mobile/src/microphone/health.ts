import { PITCH_WINDOW } from '@harmonia/audio/pitch-detection';
import type { MicrophoneErrorReason } from './types';

// Technical transport limits, unrelated to singing accuracy or pitch confidence.
export const MICROPHONE_START_TIMEOUT_MS = 5000;
export const MICROPHONE_GAP_TIMEOUT_MS = 1000;

/** Holds timestamps only. Silence is valid PCM; pitch or loudness never determines readiness. */
export function createPcmHealth(startedAt: number) {
  if (!Number.isFinite(startedAt)) throw new RangeError('microphone_clock');
  let lastArrival: number | null = null,
    lastStamp = -Infinity,
    rate: number | null = null;
  let failure: MicrophoneErrorReason | null = null;
  const check = (now: number): MicrophoneErrorReason | null => {
    if (failure) return failure;
    if (!Number.isFinite(now) || now < (lastArrival ?? startedAt)) return (failure = 'interrupted');
    if (lastArrival === null && now - startedAt >= MICROPHONE_START_TIMEOUT_MS)
      return (failure = 'no-input');
    if (lastArrival !== null && now - lastArrival >= MICROPHONE_GAP_TIMEOUT_MS)
      return (failure = 'interrupted');
    return null;
  };
  return {
    check,
    frame(samples: Float32Array, sampleRate: number, atMs: number, now: number) {
      if (check(now)) return failure;
      if (
        samples.length !== PITCH_WINDOW ||
        !Number.isFinite(sampleRate) ||
        sampleRate < 8000 ||
        sampleRate > 192000 ||
        !Number.isFinite(atMs) ||
        atMs < lastStamp ||
        (rate !== null && rate !== sampleRate) ||
        samples.some((n) => !Number.isFinite(n))
      )
        return (failure = 'unavailable');
      lastArrival = now;
      lastStamp = atMs;
      rate = sampleRate;
      return null;
    },
  };
}
