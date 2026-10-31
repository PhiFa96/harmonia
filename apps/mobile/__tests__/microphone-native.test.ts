import { startMicrophone } from '@/microphone/input';
interface Packet {
  buffer: {
    numberOfChannels: number;
    sampleRate: number;
    getChannelData: (channel: number) => Float32Array;
  };
  when: number;
}
let mockError: (() => void) | undefined, mockFrame: ((event: Packet) => void) | undefined;
const mockRecorder = {
  start: jest.fn(() => Promise.resolve({ status: 'success' })),
  stop: jest.fn(() => Promise.resolve()),
  onAudioReady: jest.fn((_options: unknown, callback: (event: Packet) => void) => {
    mockFrame = callback;
    return { status: 'success' };
  }),
  onError: jest.fn((callback: () => void) => {
    mockError = callback;
  }),
  clearOnAudioReady: jest.fn(),
  clearOnError: jest.fn(),
};
const mockOptions = jest.fn();
jest.mock('react-native-audio-api', () => ({
  AudioManager: {
    requestRecordingPermissions: () => Promise.resolve('Granted'),
    setAudioSessionOptions: (options: unknown) => {
      mockOptions(options);
    },
  },
  AudioRecorder: jest.fn(() => mockRecorder),
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockError = undefined;
  mockFrame = undefined;
});
it('an SDK interruption releases recording and restores playback before late callbacks', async () => {
  const frame = jest.fn(),
    error = jest.fn(),
    session = await startMicrophone(frame, error, { headphones: true });
  const packet: Packet = {
    buffer: {
      numberOfChannels: 1,
      sampleRate: 48000,
      getChannelData: () => new Float32Array(2048),
    },
    when: 1,
  };
  mockFrame?.(packet);
  expect(frame).toHaveBeenCalledTimes(1);
  mockError?.();
  mockError?.();
  mockFrame?.(packet);
  await session.stop();
  expect(error).toHaveBeenCalledTimes(1);
  expect(frame).toHaveBeenCalledTimes(1);
  expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
  expect(mockRecorder.clearOnAudioReady).toHaveBeenCalledTimes(1);
  expect(mockOptions).toHaveBeenLastCalledWith({
    iosCategory: 'playback',
    iosMode: 'default',
    iosOptions: ['mixWithOthers'],
  });
});
it('an error while start is pending cannot return an apparently live session', async () => {
  mockRecorder.start.mockImplementationOnce(() => {
    mockError?.();
    return Promise.resolve({ status: 'success' });
  });
  const error = jest.fn();
  await expect(startMicrophone(jest.fn(), error)).rejects.toHaveProperty('reason', 'interrupted');
  expect(error).toHaveBeenCalledTimes(1);
  expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
});
it('every stop waits for the same native shutdown before restoring playback', async () => {
  let release: (() => void) | undefined;
  mockRecorder.stop.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  const session = await startMicrophone(jest.fn(), jest.fn());
  const first = session.stop(),
    second = session.stop();
  expect(first).toBe(second);
  expect(mockOptions).toHaveBeenLastCalledWith({
    iosCategory: 'playAndRecord',
    iosMode: 'measurement',
    iosOptions: ['defaultToSpeaker', 'mixWithOthers'],
  });
  release?.();
  await Promise.all([first, second]);
  expect(mockOptions).toHaveBeenLastCalledWith({
    iosCategory: 'playback',
    iosMode: 'default',
    iosOptions: ['mixWithOthers'],
  });
});
