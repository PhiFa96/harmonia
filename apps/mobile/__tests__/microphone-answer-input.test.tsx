import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { router } from 'expo-router';
import type * as ReactTypes from 'react';
import type * as RN from 'react-native';
import { createRng, generateExercise } from '@harmonia/exercises';
import type { VoiceItem } from '@harmonia/exercises';
import { UiProvider } from '@harmonia/ui/native';
import { i18n } from '@/i18n';
import { MicrophoneAnswerInput } from '@/components/microphone-answer-input';
import { startMicrophone } from '@/microphone/input';
import { MicrophoneError } from '@/microphone/types';

jest.mock('@/microphone/input', () => ({ startMicrophone: jest.fn() }));
let mockMidi = 64;
jest.mock('@harmonia/audio/pitch-detection', () => ({
  PitchTracker: class {
    analyze() {
      return { state: 'stable', midi: mockMidi, cents: 12, hz: 331, rms: 0.2, clarity: 0.99 };
    }
  },
}));
jest.mock('@harmonia/ui/native', () => {
  const React = jest.requireActual<typeof ReactTypes>('react');
  const { Pressable, Text, View } = jest.requireActual<typeof RN>('react-native');
  return {
    UiProvider: ({ children }: { children: React.ReactNode }) => children,
    Card: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    AppText: ({ children, ...rest }: RN.TextProps) => React.createElement(Text, rest, children),
    Button: ({
      label,
      onPress,
      disabled,
    }: {
      label: string;
      onPress: () => void;
      disabled?: boolean;
    }) =>
      React.createElement(
        Pressable,
        { onPress, disabled, accessibilityRole: 'button' },
        React.createElement(Text, null, label),
      ),
  };
});

const generated = generateExercise(
  { type: 'SIGHT_SING', params: { level: 1 } },
  createRng(1),
) as VoiceItem;
const onSelect = jest.fn();
const onPreview = jest.fn(() => Promise.resolve());
const multiple = generateExercise(
  {
    type: 'PLAY_BACK',
    params: {
      level: 2,
      intervals: ['M2', 'm3', 'M3', 'P4'],
      clefs: ['treble'],
      range: { minMidi: 60, maxMidi: 76 },
    },
  },
  createRng(7),
) as VoiceItem;
function Fixture({ item = generated }: { item?: VoiceItem } = {}) {
  return (
    <UiProvider scheme="light">
      <MicrophoneAnswerInput
        item={item}
        answer={null}
        disabled={false}
        playing={false}
        heard={false}
        onSelect={onSelect}
        onBeforeCapture={jest.fn()}
        onPreview={onPreview}
      />
    </UiProvider>
  );
}

beforeEach(async () => {
  mockMidi = 64;
  jest.mocked(startMicrophone).mockReset();
  onSelect.mockReset();
  onPreview.mockClear();
  await i18n.changeLanguage('de');
});

it('meldet verweigerten Zugriff und speichert keine Antwort', async () => {
  jest.mocked(startMicrophone).mockRejectedValue(new MicrophoneError('permission'));
  renderRouter({ index: Fixture });
  expect(startMicrophone).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'Mikrofon starten' }));
  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/verweigert/);
  });
  expect(onSelect).not.toHaveBeenCalled();
});

it('übernimmt einen stabilen Ton in Cent und stoppt das Mikrofon', async () => {
  const stop = jest.fn(() => Promise.resolve());
  let sample: ((samples: Float32Array, rate: number, atMs: number) => void) | undefined;
  jest.mocked(startMicrophone).mockImplementation((onSamples) => {
    sample = onSamples;
    return Promise.resolve({ stop });
  });
  renderRouter({ index: Fixture });
  fireEvent.press(screen.getByRole('button', { name: 'Mikrofon starten' }));
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Mikrofon stoppen' })).toBeTruthy();
  });
  act(() => {
    sample?.(new Float32Array(2048), 48000, 100);
  });
  fireEvent.press(screen.getByRole('button', { name: 'Diesen Ton übernehmen' }));
  expect(onSelect).toHaveBeenLastCalledWith('voice:6412');
  await waitFor(() => {
    expect(stop).toHaveBeenCalledTimes(1);
  });
});

function Multiple() {
  return <Fixture item={multiple} />;
}

it('erfasst drei neue Töne nach Neuaufnahme und stoppt beim Verlassen ohne weitere Antwort', async () => {
  const stop = jest.fn(() => Promise.resolve());
  let sample: ((samples: Float32Array, rate: number, atMs: number) => void) | undefined;
  jest.mocked(startMicrophone).mockImplementation((onSamples) => {
    sample = onSamples;
    return Promise.resolve({ stop });
  });
  renderRouter({ index: Multiple, away: () => null });
  const start = async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Mikrofon starten' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mikrofon stoppen' })).toBeTruthy();
    });
  };
  const capture = (pitch: number, at: number) => {
    mockMidi = pitch;
    act(() => sample?.(new Float32Array(2048), 48000, at));
    fireEvent.press(screen.getByRole('button', { name: 'Diesen Ton übernehmen' }));
  };
  await start();
  capture(60, 100);
  fireEvent.press(screen.getByRole('button', { name: 'Töne neu aufnehmen' }));
  expect(onSelect).toHaveBeenLastCalledWith(null);
  capture(62, 200);
  capture(65, 300);
  expect(onSelect).toHaveBeenLastCalledWith(null);
  capture(69, 400);
  expect(onSelect).toHaveBeenLastCalledWith('voice:6212,6512,6912');
  await waitFor(() => {
    expect(stop).toHaveBeenCalledTimes(1);
  });
  await start();
  act(() => {
    router.push('/away');
  });
  await waitFor(() => {
    expect(stop).toHaveBeenCalledTimes(2);
  });
  act(() => sample?.(new Float32Array(2048), 48000, 500));
  expect(onSelect).toHaveBeenLastCalledWith('voice:6212,6512,6912');
});
