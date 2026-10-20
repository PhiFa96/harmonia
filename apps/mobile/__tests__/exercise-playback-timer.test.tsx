import { act, renderHook } from '@testing-library/react-native';
import { createRng, generateCadence, generateDictation } from '@harmonia/exercises';
import type { ExerciseItem } from '@harmonia/exercises';

import { useExercisePlayback } from '@/components/use-exercise-playback';
import { useSettings } from '@/state/settings';

jest.mock('expo-router', () => ({ useFocusEffect: () => undefined }));

const mockStop = jest.fn();
jest.mock('@/audio', () => ({
  getAudioEngine: () => ({
    resume: () => Promise.resolve(),
    context: { currentTime: 0 },
  }),
}));
jest.mock('@/exercises/play-cadence', () => ({
  playCadence: () => ({ startTime: 0, endTime: 3, stop: mockStop }),
}));
jest.mock('@/exercises/play-example', () => ({
  EXAMPLE_BPM: 90,
  playExample: () => ({ startTime: 0, endTime: 3, stop: mockStop }),
}));

beforeEach(() => {
  jest.useFakeTimers();
  useSettings.setState({ sound: true });
});
afterEach(() => {
  jest.useRealTimers();
});

describe('Abspielstatus bei Kadenz- und Diktataufgaben', () => {
  const items: readonly [string, ExerciseItem][] = [
    ['Kadenz', generateCadence({ fifths: [0] }, createRng(1))],
    ['Melodiediktat', generateDictation({ level: 1 }, createRng(1), 'MELODY_DICTATION')],
    ['Rhythmusdiktat', generateDictation({ level: 1 }, createRng(1), 'RHYTHM_DICTATION')],
  ];
  it.each(items)('%s bleibt bis zum Ende des Klangs im Zustand „Wiedergabe“', async (_, item) => {
    const { result } = renderHook(() => useExercisePlayback(item));
    await act(async () => {
      await result.current.play();
    });
    expect(result.current.playing).toBe(true);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.playing).toBe(true);
    act(() => {
      jest.advanceTimersByTime(2100);
    });
    expect(result.current.playing).toBe(false);
  });
});
