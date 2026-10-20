import { UiProvider } from '@harmonia/ui/native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ComponentProps } from 'react';
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

function createPort(id: string, name: string) {
  const listeners: ((event: Event) => void)[] = [];
  return {
    id,
    name,
    manufacturer: 'Test',
    state: 'connected',
    listeners,
    addEventListener: jest.fn((_type: string, callback: (event: Event) => void) => {
      listeners.push(callback);
    }),
    removeEventListener: jest.fn(),
    close: jest.fn(() => Promise.resolve()),
  };
}

function renderKeyboard(props: Partial<ComponentProps<typeof PianoKeyboard>>, onPitch: jest.Mock) {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <UiProvider scheme="light" reduceMotion haptics={false}>
        <PianoKeyboard onPitch={onPitch} {...props} />
      </UiProvider>
    </SafeAreaProvider>,
  );
}

async function connect(access: unknown) {
  mockRequest.mockResolvedValue(access);
  fireEvent.press(screen.getByText('Anpassen'));
  fireEvent.press(screen.getByText('MIDI-Keyboard'));
  fireEvent.press(screen.getByText('MIDI verbinden'));
  await waitFor(() => {
    expect(screen.getByTestId('midi-status')).toBeTruthy();
  });
}

describe('MIDI-Eingang an der Klaviatur', () => {
  beforeEach(() => {
    void i18n.changeLanguage('de');
  });

  it('wählt das Gerät nach Ausstecken und Einstecken mit neuer Port-ID wieder aus', async () => {
    const first = createPort('dev-1-port-0', 'Test Keyboard');
    const statechange: (() => void)[] = [];
    const access = {
      inputs: new Map([[first.id, first]]),
      addEventListener: jest.fn((_type: string, callback: () => void) => {
        statechange.push(callback);
      }),
      removeEventListener: jest.fn(),
    };
    const onPitch = jest.fn();
    renderKeyboard({}, onPitch);
    await connect(access);
    await waitFor(() => {
      expect(first.addEventListener).toHaveBeenCalledWith('midimessage', expect.any(Function));
    });

    // Gerät wird ausgesteckt und kommt mit anderer ID und neuem Port-Objekt zurück.
    first.state = 'disconnected';
    const fire = () => {
      act(() => {
        statechange.forEach((callback) => {
          callback();
        });
      });
    };
    fire();
    const second = createPort('dev-2-port-0', 'Test Keyboard');
    access.inputs = new Map([[second.id, second]]);
    fire();
    await waitFor(() => {
      expect(second.addEventListener).toHaveBeenCalledWith('midimessage', expect.any(Function));
    });
    act(() => {
      second.listeners.at(-1)?.(message([0x90, 64, 80]));
    });
    expect(onPitch).toHaveBeenCalledWith({ letter: 'E', alter: 0, octave: 4 });
  });

  it('ignoriert MIDI-Töne außerhalb des festen Tastenausschnitts und meldet das', async () => {
    const port = createPort('range-1', 'Range Keyboard');
    const access = {
      inputs: new Map([[port.id, port]]),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    const onPitch = jest.fn();
    renderKeyboard({ fixedRange: { first: 60, last: 71 } }, onPitch);
    await connect(access);
    await waitFor(() => {
      expect(port.addEventListener).toHaveBeenCalledWith('midimessage', expect.any(Function));
    });
    const send = (data: number[]) => {
      act(() => {
        port.listeners.at(-1)?.(message(data));
      });
    };
    send([0x90, 36, 90]);
    send([0x80, 36, 0]);
    expect(onPitch).not.toHaveBeenCalled();
    expect(screen.getByText(/außerhalb des angezeigten Ausschnitts/)).toBeTruthy();
    send([0x90, 62, 90]);
    expect(onPitch).toHaveBeenCalledWith({ letter: 'D', alter: 0, octave: 4 });
    expect(screen.queryByText(/außerhalb des angezeigten Ausschnitts/)).toBeNull();
  });
});
