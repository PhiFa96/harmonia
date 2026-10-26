import { createChoirRunner } from '@/choir/runner';
import type { ChoirState } from '@/choir/runner';
import { createAudioEngine } from '@harmonia/audio';
import { assessChoir, createRng, generateChoir } from '@harmonia/exercises';
import { FakeContext, FakeTimers } from '../../../packages/audio/src/testing/fake-context';
import type { MicrophoneSession, OnMicrophoneError, OnPcmFrame } from '@/microphone/types';
import { MicrophoneError } from '@/microphone/types';

jest.mock('@harmonia/audio/pitch-detection', () => ({
  PITCH_WINDOW: 2048,
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
    active = true,
    clock = 0;
  const close = jest.fn(() => Promise.resolve()),
    answer = jest.fn((value: string | null) => value),
    error = jest.fn();
  const updates: ChoirState[] = [];
  const ticks: (() => void)[] = [];
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
      ticks.push(cb);
      tick = cb;
      return 1;
    },
    clear: () => {
      tick = () => {
        /* No callback installed yet. */
      };
    },
    now: () => clock,
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
    ticks,
    begin: async () => {
      const pending = runner.start('backing');
      for (let i = 0; i < 24; i++) await Promise.resolve();
      frame(new Float32Array(2048), 48000, 0);
      await pending;
    },
    advance: (ms: number) => {
      clock += ms;
    },
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
  await h.begin();
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
  await h.begin();
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
    await h.begin();
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

it('waits for PCM before any count-in and cancels missing input without grading', async () => {
  const h = harness(),
    pending = h.runner.start('backing');
  for (let i = 0; i < 24; i++) await Promise.resolve();
  expect(h.updates.at(-1)?.phase).toBe('checking');
  expect(h.ctx.oscillators).toHaveLength(0);
  h.advance(4999);
  h.tick();
  expect(h.error).not.toHaveBeenCalledWith('no-input');
  h.advance(1);
  h.tick();
  await pending;
  await h.runner.stop();
  expect(h.error).toHaveBeenLastCalledWith('no-input');
  expect(h.answer.mock.calls.every(([value]) => value === null)).toBe(true);
  expect(h.close).toHaveBeenCalledTimes(1);
});
it('stopping the input check resolves start and ignores late packets', async () => {
  const h = harness(),
    pending = h.runner.start('backing');
  for (let i = 0; i < 24; i++) await Promise.resolve();
  await h.runner.stop();
  await pending;
  h.frame(new Float32Array(2048), 48000, 0);
  expect(h.ctx.oscillators).toHaveLength(0);
  expect(h.close).toHaveBeenCalledTimes(1);
  expect(h.answer.mock.calls.every(([value]) => value === null)).toBe(true);
});
it('lost capture stops accompaniment, cannot yield a partial answer, and allows a fresh retry', async () => {
  const h = harness();
  await h.begin();
  expect(h.ctx.oscillators.filter((osc) => osc.type !== 'sine')).toHaveLength(24);
  const oldError = h.open.mock.calls[0]?.[1];
  const oldTick = h.ticks[0];
  h.advance(1000);
  h.tick();
  await h.runner.stop();
  expect(h.error).toHaveBeenLastCalledWith('interrupted');
  expect(h.answer.mock.calls.every(([value]) => value === null)).toBe(true);
  expect(h.ctx.oscillators.every((osc) => osc.stopTimes.length > 0)).toBe(true);
  await h.begin();
  oldError?.('interrupted');
  oldTick?.();
  expect(h.updates.at(-1)?.phase).toBe('countIn');
  await h.runner.stop();
  expect(h.close).toHaveBeenCalledTimes(2);
});
it('a malformed first packet does not start backing voices', async () => {
  const h = harness(),
    pending = h.runner.start('backing');
  for (let i = 0; i < 24; i++) await Promise.resolve();
  h.frame(new Float32Array(3), 48000, 0);
  await pending;
  await h.runner.stop();
  expect(h.error).toHaveBeenLastCalledWith('unavailable');
  expect(h.ctx.oscillators).toHaveLength(0);
  expect(h.answer).toHaveBeenLastCalledWith(null);
});

it('incomplete PCM coverage cannot be submitted even before the transport watchdog expires', async () => {
  const h = harness();
  await h.begin();
  const duration = 120 / item.bpm,
    start = 0.05 + (4 * 60) / item.bpm;
  for (let note = 0; note < 8; note++)
    for (let bin = 0; bin < 12; bin++) {
      if (note === 7 && bin > 8) continue;
      const frame = new Float32Array(2048);
      frame[0] = 64;
      h.ctx.currentTime =
        start + (note + 0.15 + ((bin + 0.5) / 12) * 0.7) * duration + 2048 / 48000 / 2;
      h.frame(frame, 48000, h.ctx.currentTime * 1000);
    }
  h.ctx.currentTime = start + duration * 8 + 0.4;
  h.tick();
  await h.runner.stop();
  expect(h.error).toHaveBeenLastCalledWith('interrupted');
  expect(h.answer.mock.calls.every(([value]) => value === null)).toBe(true);
});
