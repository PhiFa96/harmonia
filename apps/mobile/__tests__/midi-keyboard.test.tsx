import { UiProvider } from '@harmonia/ui/native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PianoKeyboard } from '@/components/piano-keyboard';
import { i18n } from '@/i18n';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));
jest.mock('@/audio', () => ({
  getAudioEngine: () => ({
    resume: () => Promise.resolve(),
    playPitch: () => ({ stop: () => null }),
  }),
  usePianoStatus: () => 'ready',
}));

const mockRequest = jest.fn<Promise<unknown>, []>();
jest.mock('@/midi/access', () => ({
  currentMidiAccess: () => null,
  requestMidiAccess: () => mockRequest(),
}));

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};
const message = (data: number[]) => ({ data: Uint8Array.from(data) }) as unknown as Event;

it('receives an external key with velocity and sustain and stops after leaving', async () => {
  void i18n.changeLanguage('de');
  let onMessage: ((event: Event) => void) | undefined;
  let onOtherMessage: ((event: Event) => void) | undefined;
  const port = {
    id: 'usb-1',
    name: 'Test Keyboard',
    manufacturer: 'Test',
    state: 'connected',
    addEventListener: jest.fn((_type: string, callback: (event: Event) => void) => {
      onMessage = callback;
    }),
    removeEventListener: jest.fn(),
    close: jest.fn(() => Promise.resolve()),
  };
  const other = {
    ...port,
    id: 'usb-2',
    name: 'Other Keyboard',
    addEventListener: jest.fn((_type: string, callback: (event: Event) => void) => {
      onOtherMessage = callback;
    }),
    removeEventListener: jest.fn(),
    close: jest.fn(() => Promise.resolve()),
  };
  const access = {
    inputs: new Map([
      ['usb-1', port],
      ['usb-2', other],
    ]),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  mockRequest.mockResolvedValue(access);
  const onPitch = jest.fn();
  const view = render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <UiProvider scheme="light" reduceMotion haptics={false}>
        <PianoKeyboard onPitch={onPitch} />
      </UiProvider>
    </SafeAreaProvider>,
  );
  fireEvent.press(screen.getByText('Anpassen'));
  fireEvent.press(screen.getByText('MIDI-Keyboard'));
  fireEvent.press(screen.getByText('MIDI verbinden'));
  await waitFor(() => {
    expect(port.addEventListener).toHaveBeenCalledWith('midimessage', expect.any(Function));
  });
  act(() => {
    onMessage?.(message([0x90, 60, 91]));
    onMessage?.(message([0xb0, 64, 127]));
    onMessage?.(message([0x80, 60, 0]));
  });
  expect(onPitch).toHaveBeenCalledWith({ letter: 'C', alter: 0, octave: 4 });
  expect(screen.getByText(/Anschlag 91\/127/)).toBeTruthy();
  expect(screen.getByText(/Sustain an/)).toBeTruthy();
  expect(screen.getByTestId('piano-key-60').props['aria-pressed']).toBe(true);
  act(() => {
    onMessage?.(message([0xb0, 64, 0]));
  });
  expect(screen.getByTestId('piano-key-60').props['aria-pressed']).toBe(false);
  fireEvent.press(screen.getByText('Other Keyboard'));
  await waitFor(() => {
    expect(other.addEventListener).toHaveBeenCalledWith('midimessage', expect.any(Function));
  });
  expect(port.removeEventListener).toHaveBeenCalledWith('midimessage', expect.any(Function));
  act(() => {
    onOtherMessage?.(message([0x90, 62, 55]));
  });
  expect(onPitch).toHaveBeenLastCalledWith({ letter: 'D', alter: 0, octave: 4 });
  view.unmount();
  expect(other.removeEventListener).toHaveBeenCalledWith('midimessage', expect.any(Function));
  expect(port.close).toHaveBeenCalledTimes(1);
  expect(other.close).toHaveBeenCalledTimes(1);
});
