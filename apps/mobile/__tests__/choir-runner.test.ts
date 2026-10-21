import { createChoirRunner } from '@/choir/runner';
import type { ChoirState } from '@/choir/runner';
import { createAudioEngine } from '@harmonia/audio';
import { assessChoir, createRng, generateChoir } from '@harmonia/exercises';
import { FakeContext, FakeTimers } from '../../../packages/audio/src/testing/fake-context';
import type { MicrophoneSession, OnMicrophoneError, OnPcmFrame } from '@/microphone/types';
import { MicrophoneError } from '@/microphone/types';

jest.mock('@harmonia/audio/pitch-detection', () => ({
  PitchTracker: class {
    analyze(frame: Float32Array) {
      return { state: 'stable', midi: frame[0], cents: 0 };
    }
  },
}));
const item = generateChoir({ voice: 'soprano', piece: 'home' }, createRng(1));
function harness() {
  const ctx = new FakeContext(),
    timers = new FakeTimers();
  let tick = () => {
      /* No callback installed yet. */
    },
    frame: OnPcmFrame = () => {
      /* No callback installed yet. */
    },
    fail: OnMicrophoneError = () => {
      /* No callback installed yet. */
    },
    active = true;
  const close = jest.fn(() => Promise.resolve()),
    answer = jest.fn((value: string | null) => value),
    error = jest.fn();
  const updates: ChoirState[] = [];
  const open = jest.fn(
    (onFrame: OnPcmFrame, onError: OnMicrophoneError): Promise<MicrophoneSession> => {
      frame = onFrame;
      fail = onError;
      return Promise.resolve({ stop: close });
    },
  );
  const engine = createAudioEngine(ctx, { timers });
  const runner = createChoirRunner(item, {
    engine,
    open,
    referenceHz: 440,
    active: () => active,
    answer,
    error,
    update: (next) => updates.push(next),
    interval: (cb) => {
      tick = cb;
      return 1;
    },
    clear: () => {
      tick = () => {
        /* No callback installed yet. */
      };
    },
  });
  return {
    runner,
    ctx,
    engine,
    open,
    close,
    answer,
    error,
    updates,
    frame: (...args: Parameters<OnPcmFrame>) => {
      frame(...args);
    },
    tick: () => {
      tick();
    },
    interrupt: () => {
      fail('interrupted');
    },
    hide: () => {
      active = false;
    },
  };
}
it('starts accompaniment only after permission, captures on the audio clock, and closes on completion', async () => {
  const h = harness();
  await h.runner.start('backing');
  expect(h.open).toHaveBeenCalledTimes(1);
  expect(h.ctx.oscillators.filter((osc) => osc.type !== 'sine')).toHaveLength(24); // exactly three pitches per note
  const duration = 120 / item.bpm,
    start = 0.05 + (4 * 60) / item.bpm;
  const pitches = [64, 67, 65, 65, 62, 62, 64, 64];
  for (let i = 0; i < 8; i++)
    for (let bin = 0; bin < 12; bin++) {
      const frame = new Float32Array(2048);
      const pitch = pitches[i];
      if (pitch === undefined) throw new Error('Missing test pitch');
      frame[0] = pitch;
      h.ctx.currentTime =
        start + (i + 0.15 + ((bin + 0.5) / 12) * 0.7) * duration + 2048 / 48000 / 2;
      h.frame(frame, 48000, h.ctx.currentTime * 1000);
      h.tick();
    }
  h.ctx.currentTime = start + duration * 8 + 0.4;
  h.tick();
  await h.runner.stop();
  const submitted: unknown = h.answer.mock.calls.at(-1)?.[0];
  expect(typeof submitted).toBe('string');
  expect(assessChoir(item, submitted as string).passed).toBe(true);
  expect(h.close).toHaveBeenCalledTimes(1);
});
it('cancels a pending permission and closes the late microphone without playing or submitting', async () => {
  const h = harness();
  let release!: (session: MicrophoneSession) => void;
  h.open.mockImplementation(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const pending = h.runner.start('backing');
  for (let i = 0; i < 8; i++) await Promise.resolve();
  expect(h.open).toHaveBeenCalledTimes(1);
  void h.runner.stop();
  release({ stop: h.close });
  await pending;
  expect(h.close).toHaveBeenCalledTimes(1);
  expect(h.ctx.oscillators).toHaveLength(0);
  expect(h.answer.mock.calls.every((call) => call[0] === null)).toBe(true);
});
it('permission denial and capture interruption clear the answer and stop playback', async () => {
  const h = harness();
  h.open.mockRejectedValueOnce(new MicrophoneError('permission'));
  await h.runner.start('backing');
  expect(h.error).toHaveBeenLastCalledWith('permission');
  expect(h.ctx.oscillators).toHaveLength(0);
  await h.runner.start('backing');
  h.interrupt();
  await h.runner.stop();
  expect(h.error).toHaveBeenLastCalledWith('interrupted');
  expect(h.close).toHaveBeenCalledTimes(1);
  expect(h.answer).toHaveBeenLastCalledWith(null);
  expect(h.ctx.oscillators.every((osc) => osc.stopTimes.length > 0)).toBe(true);
});
it('background and audio interruption never submit a partial take', async () => {
  for (const mode of ['background', 'suspended']) {
    const h = harness();
    await h.runner.start('backing');
    if (mode === 'background') h.hide();
    else h.ctx.state = 'suspended';
    h.tick();
    await h.runner.stop();
    expect(h.close).toHaveBeenCalledTimes(1);
    expect(h.answer).toHaveBeenLastCalledWith(null);
  }
});
it('preview needs no microphone, and failed audio resume cannot start a take', async () => {
  const h = harness();
  await h.runner.start('solo');
  expect(h.open).not.toHaveBeenCalled();
  expect(h.ctx.oscillators).toHaveLength(8);
  await h.runner.stop();
  jest.spyOn(h.engine, 'resume').mockRejectedValue(new Error('audio'));
  await h.runner.start('backing');
  expect(h.open).not.toHaveBeenCalled();
  expect(h.error).toHaveBeenLastCalledWith('unavailable');
});
