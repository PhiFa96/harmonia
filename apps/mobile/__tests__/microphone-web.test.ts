import { startMicrophone } from '@/microphone/input.web';
import type { OnPcmFrame } from '@/microphone/types';

class Events {
  readonly listeners = new Map<string, Set<() => void>>();
  addEventListener(name: string, callback: () => void) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name)?.add(callback);
  }
  removeEventListener(name: string, callback: () => void) {
    this.listeners.get(name)?.delete(callback);
  }
  emit(name: string) {
    for (const callback of this.listeners.get(name) ?? []) callback();
  }
}
class Track extends Events {
  readyState = 'live';
  enabled = true;
  muted = false;
  readonly stop = jest.fn(() => {
    this.readyState = 'ended';
  });
}
class Context extends Events {
  static instances: Context[] = [];
  state = 'suspended';
  sampleRate = 48000;
  readonly disconnect = jest.fn();
  readonly resume = jest.fn(() => {
    this.state = 'running';
    return Promise.resolve();
  });
  readonly close = jest.fn(() => {
    this.state = 'closed';
    return Promise.resolve();
  });
  constructor() {
    super();
    Context.instances.push(this);
  }
  createMediaStreamSource() {
    return { connect: jest.fn(), disconnect: this.disconnect };
  }
  createAnalyser() {
    return { fftSize: 0, getFloatTimeDomainData: (frame: Float32Array) => frame.fill(0) };
  }
}
let track: Track,
  audioDescriptor: PropertyDescriptor | undefined,
  mediaDescriptor: PropertyDescriptor | undefined;
const media = jest.fn();
beforeEach(() => {
  jest.useFakeTimers();
  Context.instances = [];
  track = new Track();
  media.mockReset();
  media.mockResolvedValue({ getAudioTracks: () => [track], getTracks: () => [track] });
  audioDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  mediaDescriptor = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, value: Context });
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: media },
  });
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  if (audioDescriptor) Object.defineProperty(globalThis, 'AudioContext', audioDescriptor);
  else Reflect.deleteProperty(globalThis, 'AudioContext');
  if (mediaDescriptor) Object.defineProperty(navigator, 'mediaDevices', mediaDescriptor);
  else Reflect.deleteProperty(navigator, 'mediaDevices');
});
it('passes silent PCM, and normal stop closes every resource without reporting interruption', async () => {
  const frame = jest.fn<ReturnType<OnPcmFrame>, Parameters<OnPcmFrame>>(),
    error = jest.fn(),
    session = await startMicrophone(frame, error);
  jest.advanceTimersByTime(80);
  expect(frame).toHaveBeenCalledTimes(2);
  expect(frame.mock.calls[0]?.[0]).toEqual(new Float32Array(2048));
  await session.stop();
  await session.stop();
  track.emit('ended');
  Context.instances[0]?.emit('statechange');
  expect(error).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
  expect(track.stop).toHaveBeenCalledTimes(1);
  expect(Context.instances[0]?.close).toHaveBeenCalledTimes(1);
  expect([...track.listeners.values()].every((listeners) => listeners.size === 0)).toBe(true);
});
it.each(['ended', 'muted', 'disabled', 'suspended'])(
  '%s input self-closes and reports once',
  async (reason) => {
    const frame = jest.fn<ReturnType<OnPcmFrame>, Parameters<OnPcmFrame>>(),
      error = jest.fn(),
      session = await startMicrophone(frame, error);
    jest.advanceTimersByTime(40);
    if (reason === 'ended') {
      track.readyState = 'ended';
      track.emit('ended');
    }
    if (reason === 'muted') {
      track.muted = true;
      track.emit('mute');
    }
    if (reason === 'disabled') track.enabled = false;
    if (reason === 'suspended') {
      const context = Context.instances[0];
      if (context) {
        context.state = 'suspended';
        context.emit('statechange');
      }
    }
    jest.advanceTimersByTime(80);
    await session.stop();
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith('interrupted');
    expect(frame).toHaveBeenCalledTimes(1);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(Context.instances[0]?.close).toHaveBeenCalledTimes(1);
  },
);
it('waits for an initially muted track without forwarding fake PCM', async () => {
  track.muted = true;
  const frame = jest.fn<ReturnType<OnPcmFrame>, Parameters<OnPcmFrame>>(),
    error = jest.fn(),
    session = await startMicrophone(frame, error);
  jest.advanceTimersByTime(120);
  expect(frame).not.toHaveBeenCalled();
  expect(error).not.toHaveBeenCalled();
  track.muted = false;
  jest.advanceTimersByTime(40);
  expect(frame).toHaveBeenCalledTimes(1);
  await session.stop();
});
it('rejects a stream without audio and releases the context and tracks', async () => {
  media.mockResolvedValue({ getAudioTracks: () => [], getTracks: () => [track] });
  await expect(startMicrophone(jest.fn(), jest.fn())).rejects.toHaveProperty(
    'reason',
    'unavailable',
  );
  expect(track.stop).toHaveBeenCalledTimes(1);
  expect(Context.instances[0]?.close).toHaveBeenCalledTimes(1);
});
it('every stop waits for the same pending AudioContext close', async () => {
  let release: (() => void) | undefined;
  const session = await startMicrophone(jest.fn(), jest.fn()),
    context = Context.instances[0];
  if (!context) throw Error('Missing context');
  context.close.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  const first = session.stop(),
    second = session.stop();
  expect(first).toBe(second);
  expect(track.stop).toHaveBeenCalledTimes(1);
  release?.();
  await Promise.all([first, second]);
});
