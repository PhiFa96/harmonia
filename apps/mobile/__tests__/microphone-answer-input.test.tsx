import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
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
jest.mock('@harmonia/audio/pitch-detection', () => ({
  PitchTracker: class {
    analyze() {
      return { state: 'stable', midi: 64, cents: 12, hz: 331, rms: 0.2, clarity: 0.99 };
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
function Fixture() {
  return (
    <UiProvider scheme="light">
      <MicrophoneAnswerInput
        item={generated}
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
