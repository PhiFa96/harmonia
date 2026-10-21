import type { AudioEngine, Playback } from '@harmonia/audio';
import { PitchTracker } from '@harmonia/audio/pitch-detection';
import { choirEvents, createChoirCollector } from '@harmonia/exercises';
import type { ChoirItem } from '@harmonia/exercises';
import type { MicrophoneSession, OnMicrophoneError, OnPcmFrame } from '../microphone/types';

export type ChoirPhase =
  'idle' | 'requesting' | 'countIn' | 'singing' | 'preview' | 'done' | 'error';
export interface ChoirState {
  readonly phase: ChoirPhase;
  readonly note: number;
  readonly beat: number;
}
interface Dependencies {
  readonly engine: AudioEngine;
  readonly open: (frame: OnPcmFrame, error: OnMicrophoneError) => Promise<MicrophoneSession>;
  readonly referenceHz: number;
  readonly active: () => boolean;
  readonly update: (state: ChoirState) => void;
  readonly answer: (answer: string | null) => void;
  readonly error: (reason: string) => void;
  readonly interval: (callback: () => void) => unknown;
  readonly clear: (handle: unknown) => void;
}
// Serialize permission/open/close across trainer instances, including navigation during permission.
let microphoneLifecycle: Promise<void> = Promise.resolve();
export function createChoirRunner(item: ChoirItem, deps: Dependencies) {
  let revision = 0,
    timer: unknown,
    microphone: MicrophoneSession | undefined;
  let playback: Playback | undefined;
  const update = (phase: ChoirPhase, note = -1, beat = 0) => {
    deps.update({ phase, note, beat });
  };
  const stop = () => {
    revision++;
    if (timer !== undefined) deps.clear(timer);
    timer = undefined;
    playback?.stop();
    playback = undefined;
    const current = microphone;
    microphone = undefined;
    if (current)
      microphoneLifecycle = microphoneLifecycle
        .catch(() => undefined)
        .then(() => current.stop())
        .catch(() => undefined);
    update('idle');
    return microphoneLifecycle;
  };
  const fail = (reason: string) => {
    void stop();
    deps.answer(null);
    deps.error(reason);
    update('error');
  };
  const start = async (mode: 'backing' | 'all' | 'solo', delayMs = 0) => {
    const closing = stop();
    const ticket = revision;
    deps.error('');
    if (mode === 'backing') deps.answer(null);
    update('requesting');
    const current = () => ticket === revision && deps.active();
    const collector = createChoirCollector(item);
    const tracker = new PitchTracker(deps.referenceHz);
    try {
      // Resume during the user gesture, before the asynchronous microphone permission dialog.
      await deps.engine.resume();
      await closing;
      if (!current()) return;
      if (mode === 'backing') {
        const opening = microphoneLifecycle
          .catch(() => undefined)
          .then(async () => {
            if (!current()) return;
            const opened = await deps.open(
              (samples, rate, atMs) => {
                if (!current() || !playback) return;
                const reading = tracker.analyze(samples, rate, atMs);
                const latency = deps.engine.latency();
                const outputDelay = Math.max(0, (latency.base ?? 0) + (latency.output ?? 0));
                const seconds =
                  deps.engine.context.currentTime -
                  playback.startTime -
                  samples.length / rate / 2 -
                  outputDelay -
                  Math.max(0, Math.min(300, delayMs)) / 1000;
                collector.add(
                  seconds,
                  reading.state === 'stable' ? reading.midi * 100 + reading.cents : null,
                );
              },
              (reason) => {
                if (current()) fail(reason);
              },
            );
            if (!current()) await opened.stop();
            else microphone = opened;
          });
        microphoneLifecycle = opening.catch(() => undefined);
        await opening;
        if (!current()) return;
        if (!microphone) throw new Error('interrupted');
      }
      await deps.engine.resume();
      if (!current()) return;
      // Three backing voices only. Metronome provides the count-in and a quiet time reference.
      playback = deps.engine.playSequence(choirEvents(item, mode), {
        tempo: item.bpm,
        ...(mode === 'backing' ? { countIn: 4, metronome: 4 } : {}),
      });
      const startTime = playback.startTime,
        endTime = playback.endTime;
      update(mode === 'backing' ? 'countIn' : 'preview');
      timer = deps.interval(() => {
        if (!current() || deps.engine.context.state !== 'running') {
          fail('interrupted');
          return;
        }
        const now = deps.engine.context.currentTime;
        if (now >= endTime + 0.35) {
          const answer = mode === 'backing' ? collector.answer() : null;
          void stop();
          if (answer) {
            deps.answer(answer);
            update('done');
          }
          return;
        }
        if (mode !== 'backing') return;
        if (now < startTime)
          update(
            'countIn',
            -1,
            Math.max(1, 4 - Math.ceil((startTime - now) / (60 / item.bpm)) + 1),
          );
        else update('singing', Math.min(7, Math.floor((now - startTime) / (120 / item.bpm))));
      });
    } catch (error) {
      if (current())
        fail(error instanceof Error && 'reason' in error ? String(error.reason) : 'unavailable');
    }
  };
  return { start, stop };
}
