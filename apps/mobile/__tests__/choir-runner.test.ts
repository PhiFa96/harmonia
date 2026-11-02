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
      if (frame[0] === 0) return { state: 'silent' };
      if (frame[0] === -1) return { state: 'unstable' };
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
    begin: async (atMs = ctx.currentTime * 1000) => {
      const pending = runner.start('backing');
      for (let i = 0; i < 24; i++) await Promise.resolve();
      frame(new Float32Array(2048), 48000, atMs);
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
function finishInput(h: ReturnType<typeof harness>, pitch: (note: number, bin: number) => number) {
  const duration = 120 / item.bpm,
    start = h.ctx.currentTime + 0.05 + (4 * 60) / item.bpm;
  for (let note = 0; note < 8; note++)
    for (let bin = 0; bin < 12; bin++) {
      const samples = new Float32Array(2048);
      samples[0] = pitch(note, bin);
      h.ctx.currentTime =
        start + (note + 0.15 + ((bin + 0.5) / 12) * 0.7) * duration + 2048 / 48000 / 2;
      h.frame(samples, 48000, h.ctx.currentTime * 1000);
      h.tick();
    }
  h.ctx.currentTime = start + duration * 8 + 0.4;
  h.tick();
}

it.each([
  ['silent', 0],
  ['unstable', -1],
] as const)(
  '%s input with full PCM coverage stays unanswered, ignores old callbacks and permits a fresh take',
  async (_, marker) => {
    const h = harness();
    await h.begin();
    const oldFrame = h.open.mock.calls[0]?.[0],
      oldError = h.open.mock.calls[0]?.[1],
      oldTick = h.ticks.at(-1);
    finishInput(h, () => marker);
    await h.runner.stop();
    expect(h.answer.mock.calls.every(([value]) => value === null)).toBe(true);
    expect(h.error).toHaveBeenLastCalledWith('no-pitch');
    expect(h.close).toHaveBeenCalledTimes(1);
    await h.begin();
    oldFrame?.(new Float32Array(3), 48000, 0);
    oldError?.('interrupted');
    oldTick?.();
    expect(h.updates.at(-1)?.phase).toBe('countIn');
    expect(h.error).toHaveBeenLastCalledWith('');
    const pitches = [64, 67, 65, 65, 62, 62, 64, 64];
    finishInput(h, (note) => {
      const pitch = pitches[note];
      if (pitch === undefined) throw Error('Missing pitch fixture');
      return pitch;
    });
    await h.runner.stop();
    const answer = h.answer.mock.calls.at(-1)?.[0];
    if (typeof answer !== 'string') throw Error('Missing fresh answer');
    expect(assessChoir(item, answer).passed).toBe(true);
    expect(h.close).toHaveBeenCalledTimes(2);
  },
);

it('keeps even a sparse detected take gradable under the unchanged coverage rules', async () => {
  const h = harness();
  await h.begin();
  finishInput(h, (note, bin) => (note === 0 && bin === 0 ? 64 : 0));
  await h.runner.stop();
  const answer = h.answer.mock.calls.at(-1)?.[0];
  if (typeof answer !== 'string') throw Error('Missing sparse answer');
  const report = assessChoir(item, answer);
  expect(report).toMatchObject({ valid: true, passed: false });
  expect(report.notes.reduce((sum, note) => sum + note.detectedWindows, 0)).toBe(1);
  expect(h.error).toHaveBeenLastCalledWith('');
});

function finishTake(h: ReturnType<typeof harness>) {
  const duration = 120 / item.bpm,
    start = h.ctx.currentTime + 0.05 + (4 * 60) / item.bpm;
  const pitches = [64, 67, 65, 65, 62, 62, 64, 64];
  for (let i = 0; i < 8; i++)
    for (let bin = 0; bin < 12; bin++) {
      const samples = new Float32Array(2048);
      const pitch = pitches[i];
      if (pitch === undefined) throw new Error('Missing test pitch');
      samples[0] = pitch;
      h.ctx.currentTime =
        start + (i + 0.15 + ((bin + 0.5) / 12) * 0.7) * duration + 2048 / 48000 / 2;
      h.frame(samples, 48000, h.ctx.currentTime * 1000);
      h.tick();
    }
  h.ctx.currentTime = start + duration * 8 + 0.4;
  h.tick();
}

for (const mode of ['solo', 'all'] as const) {
  it.each(['resume', 'schedule', 'interrupted'] as const)(
    `${mode}: preserves a completed ungraded take after a %s failure and allows another preview`,
    async (problem) => {
      const h = harness();
      await h.begin();
      finishTake(h);
      await h.runner.stop();
      const saved = h.answer.mock.calls.at(-1)?.[0];
      if (typeof saved !== 'string') throw new Error('Missing completed take');
      expect(assessChoir(item, saved).passed).toBe(true);
      h.answer.mockClear();
      if (problem === 'resume')
        jest.spyOn(h.engine, 'resume').mockRejectedValueOnce(new Error('resume failed'));
      if (problem === 'schedule')
        jest.spyOn(h.engine, 'playSequence').mockImplementationOnce(() => {
          throw new Error('playback failed');
        });
      await h.runner.start(mode);
      const oldTick = h.ticks.at(-1);
      if (problem === 'interrupted') {
        h.ctx.state = 'suspended';
        h.tick();
      }
      expect(h.answer).not.toHaveBeenCalled();
      expect(h.error).toHaveBeenLastCalledWith('preview');
      expect(h.updates.at(-1)?.phase).toBe('error');
      expect(h.open).toHaveBeenCalledTimes(1);
      expect(h.close).toHaveBeenCalledTimes(1);
      expect(h.ctx.oscillators.every((osc) => osc.stopTimes.length > 0)).toBe(true);
      await h.runner.start(mode);
      oldTick?.();
      expect(h.updates.at(-1)?.phase).toBe('preview');
      expect(h.error).toHaveBeenLastCalledWith('');
      expect(h.answer).not.toHaveBeenCalled();
      expect(h.open).toHaveBeenCalledTimes(1);
      await h.runner.stop();
    },
  );
}

it('only a new singing take replaces the old answer, and a failed retry cannot restore it', async () => {
  const h = harness();
  await h.begin();
  finishTake(h);
  await h.runner.stop();
  h.answer.mockClear();
  h.open.mockRejectedValueOnce(new MicrophoneError('permission'));
  await h.runner.start('backing');
  expect(h.answer.mock.calls).toEqual([[null]]);
  expect(h.error).toHaveBeenLastCalledWith('permission');
  await h.begin();
  finishTake(h);
  await h.runner.stop();
  const saved = h.answer.mock.calls.at(-1)?.[0];
  if (typeof saved !== 'string') throw new Error('Missing completed take');
  expect(assessChoir(item, saved).passed).toBe(true);
  expect(h.close).toHaveBeenCalledTimes(2);
});

it('waits for an interrupted microphone to close before retrying and ignores its late callbacks', async () => {
  const h = harness();
  await h.begin();
  const oldFrame = h.open.mock.calls[0]?.[0],
    oldError = h.open.mock.calls[0]?.[1],
    oldTick = h.ticks.at(-1);
  let closed!: () => void;
  h.close.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        closed = resolve;
      }),
  );
  h.interrupt();
  const retry = h.runner.start('backing');
  for (let i = 0; i < 24; i++) await Promise.resolve();
  expect(h.close).toHaveBeenCalledTimes(1);
  expect(h.open).toHaveBeenCalledTimes(1);
  closed();
  for (let i = 0; i < 24; i++) await Promise.resolve();
  expect(h.open).toHaveBeenCalledTimes(2);
  h.frame(new Float32Array(2048), 48000, h.ctx.currentTime * 1000);
  await retry;
  oldFrame?.(new Float32Array(3), 48000, 0);
  oldError?.('interrupted');
  oldTick?.();
  expect(h.updates.at(-1)?.phase).toBe('countIn');
  expect(h.error).toHaveBeenLastCalledWith('');
  expect(h.answer.mock.calls.every(([value]) => value === null)).toBe(true);
  finishTake(h);
  await h.runner.stop();
  const saved = h.answer.mock.calls.at(-1)?.[0];
  if (typeof saved !== 'string') throw new Error('Missing completed take');
  expect(assessChoir(item, saved).passed).toBe(true);
  expect(h.close).toHaveBeenCalledTimes(2);
});

it('maps timestamped batches onto the playback clock without collapsing their scoring windows', async () => {
  const h = harness(),
    origin = 12000;
  await h.begin(origin);
  const duration = 120 / item.bpm,
    start = 0.05 + (4 * 60) / item.bpm;
  const pitches = [64, 67, 65, 65, 62, 62, 64, 64];
  const windows = Array.from({ length: 96 }, (_, index) => {
    const note = Math.floor(index / 12),
      bin = index % 12;
    return {
      pitch: pitches[note],
      at: start + (note + 0.15 + ((bin + 0.5) / 12) * 0.7) * duration + 2048 / 48000 / 2,
    };
  });
  for (let index = 0; index < windows.length; index += 3) {
    const batch = windows.slice(index, index + 3),
      last = batch.at(-1);
    if (!last) throw Error('Missing timestamp fixture');
    h.ctx.currentTime = last.at + 0.2;
    for (const window of batch) {
      if (window.pitch === undefined) throw Error('Missing pitch fixture');
      const samples = new Float32Array(2048);
      samples[0] = window.pitch;
      h.frame(samples, 48000, origin + window.at * 1000);
    }
    h.tick();
  }
  h.ctx.currentTime = start + duration * 8 + 0.4;
  h.tick();
  await h.runner.stop();
  expect(h.error).toHaveBeenLastCalledWith('');
  const answer = h.answer.mock.calls.at(-1)?.[0];
  if (typeof answer !== 'string') throw Error('Missing timestamped take');
  expect(assessChoir(item, answer).passed).toBe(true);
});

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
