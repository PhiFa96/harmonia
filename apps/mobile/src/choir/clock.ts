import { MICROPHONE_GAP_TIMEOUT_MS } from '../microphone/health';
import type { PcmTiming } from '../microphone/types';

/** Maps window ends, before midpoint or physical-latency compensation. No PCM is retained. */
export function createChoirClock(maximumAheadSeconds: number) {
  if (!Number.isFinite(maximumAheadSeconds) || maximumAheadSeconds <= 0)
    throw new RangeError('choir_clock_budget');
  let offset: number | undefined,
    kind: PcmTiming | undefined,
    lastCapture = -Infinity,
    lastPlayback = -Infinity,
    failed = false;
  const check = (playbackNow: number) => {
    if (failed || !Number.isFinite(playbackNow) || playbackNow < 0 || playbackNow < lastPlayback) {
      failed = true;
      return false;
    }
    lastPlayback = playbackNow;
    return true;
  };
  return {
    check,
    position(
      atMs: number,
      playbackNow: number,
      calibrating: boolean,
      timing: PcmTiming = 'buffered',
    ) {
      if (
        !check(playbackNow) ||
        !Number.isFinite(atMs) ||
        atMs < lastCapture ||
        !['snapshot', 'buffered'].includes(timing) ||
        (kind !== undefined && kind !== timing)
      ) {
        failed = true;
        return null;
      }
      kind = timing;
      lastCapture = atMs;
      // The analyser is read in this synchronous callback, not delivered from a native queue.
      // Pair every fresh read with playback now instead of extrapolating either clock's rate.
      if (timing === 'snapshot') return playbackNow;
      const captureEnd = atMs / 1000,
        observed = playbackNow - captureEnd;
      // Arrival cannot distinguish native clock drift from bridge queuing. Preserve timestamps
      // after count-in; fitting arrival times would shift delayed batches into the wrong note.
      if (offset === undefined || calibrating) offset = Math.min(offset ?? observed, observed);
      const mapped = captureEnd + offset;
      if (
        mapped - playbackNow > maximumAheadSeconds ||
        playbackNow - mapped >= MICROPHONE_GAP_TIMEOUT_MS / 1000
      ) {
        failed = true;
        return null;
      }
      return mapped;
    },
  };
}
