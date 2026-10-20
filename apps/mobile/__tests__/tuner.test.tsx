import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type * as ReactTypes from 'react';
import type * as RN from 'react-native';
import { UiProvider } from '@harmonia/ui/native';
import { i18n } from '@/i18n';
import TunerScreen from '@/app/tuner';
import { startMicrophone } from '@/microphone/input';
import { MicrophoneError } from '@/microphone/types';

jest.mock('@/microphone/input', () => ({ startMicrophone: jest.fn() }));
jest.mock('@harmonia/audio/pitch-detection', () => ({
  PitchTracker: class {
    analyze() {
      return { state: 'silent', rms: 0 };
    }
  },
}));
// Isolate the permission lifecycle from the existing Reanimated Jest mock.
jest.mock('@harmonia/ui/native', () => {
  const React = jest.requireActual<typeof ReactTypes>('react');
  const { Pressable, Text, View } = jest.requireActual<typeof RN>('react-native');
  return {
    UiProvider: ({ children }: { children: React.ReactNode }) => children,
    Card: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    AppText: ({ children, ...rest }: RN.TextProps) => React.createElement(Text, rest, children),
    Button: ({ label, onPress }: { label: string; onPress: () => void }) =>
      React.createElement(
        Pressable,
        { onPress, accessibilityRole: 'button' },
        React.createElement(Text, null, label),
      ),
    useUiTheme: () => ({
      colors: { borderStrong: '#000', surface: '#fff', success: '#0a0', primary: '#00a' },
    }),
  };
});

function Fixture() {
  return (
    <UiProvider scheme="light">
      <TunerScreen />
    </UiProvider>
  );
}

beforeEach(async () => {
  jest.mocked(startMicrophone).mockReset();
  await i18n.changeLanguage('de');
});

it('asks for the microphone only after pressing Start and explains a denial', async () => {
  jest.mocked(startMicrophone).mockRejectedValue(new MicrophoneError('permission'));
  renderRouter({ index: Fixture });
  expect(startMicrophone).not.toHaveBeenCalled();
  expect(screen.getByText(/weder gespeichert noch hochgeladen/)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Mikrofon starten' }));
  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/Mikrofonzugriff verweigert/);
  });
  expect(startMicrophone).toHaveBeenCalledTimes(1);
});

it('stops an active session on request', async () => {
  const stop = jest.fn(() => Promise.resolve());
  jest.mocked(startMicrophone).mockResolvedValue({ stop });
  renderRouter({ index: Fixture });
  fireEvent.press(screen.getByRole('button', { name: 'Mikrofon starten' }));
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Mikrofon stoppen' })).toBeTruthy();
  });
  fireEvent.press(screen.getByRole('button', { name: 'Mikrofon stoppen' }));
  await waitFor(() => {
    expect(stop).toHaveBeenCalledTimes(1);
  });
  expect(screen.getByRole('button', { name: 'Mikrofon starten' })).toBeTruthy();
});

it('waits for recorder shutdown before starting again', async () => {
  let releaseStop: (() => void) | undefined;
  const stop = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        releaseStop = resolve;
      }),
  );
  jest.mocked(startMicrophone).mockResolvedValue({ stop });
  renderRouter({ index: Fixture });
  fireEvent.press(screen.getByRole('button', { name: 'Mikrofon starten' }));
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Mikrofon stoppen' })).toBeTruthy();
  });
  fireEvent.press(screen.getByRole('button', { name: 'Mikrofon stoppen' }));
  await waitFor(() => {
    expect(stop).toHaveBeenCalledTimes(1);
  });
  fireEvent.press(screen.getByRole('button', { name: 'Mikrofon starten' }));
  expect(startMicrophone).toHaveBeenCalledTimes(1);
  act(() => {
    releaseStop?.();
  });
  await waitFor(() => {
    expect(startMicrophone).toHaveBeenCalledTimes(2);
  });
});
