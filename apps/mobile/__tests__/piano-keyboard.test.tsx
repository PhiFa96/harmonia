import type { Pitch } from '@harmonia/notation';
import { UiProvider } from '@harmonia/ui/native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PianoKeyboard } from '@/components/piano-keyboard';
import { i18n } from '@/i18n';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));

const mockVoices: { pitch: Pitch; stop: jest.Mock }[] = [];
const mockResume = jest.fn(() => Promise.resolve());
jest.mock('@/audio', () => ({
  getAudioEngine: () => ({
    resume: mockResume,
    playPitch: (pitch: Pitch) => {
      const voice = { pitch, stop: jest.fn() };
      mockVoices.push(voice);
      return voice;
    },
  }),
  usePianoStatus: () => 'ready',
}));

const C4 = { letter: 'C', alter: 0, octave: 4 } as const;
const E4 = { letter: 'E', alter: 0, octave: 4 } as const;
const G4 = { letter: 'G', alter: 0, octave: 4 } as const;
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function ui(props: Partial<Parameters<typeof PianoKeyboard>[0]> = {}) {
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <UiProvider scheme="light" reduceMotion haptics={false}>
        <PianoKeyboard onPitch={() => undefined} {...props} />
      </UiProvider>
    </SafeAreaProvider>
  );
}

/** Native Mehrfachberührung: alle Koordinaten beziehen sich auf die leere Trefferfläche. */
function touches(event: string, points: readonly { id: string; x: number; y: number }[]) {
  fireEvent(screen.getByTestId('piano-touch-surface'), event, {
    nativeEvent: {
      touches: points.map(({ id, x, y }) => ({ identifier: id, locationX: x, locationY: y })),
    },
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockVoices.length = 0;
  mockResume.mockClear();
  void i18n.changeLanguage('de');
});
afterEach(() => {
  jest.useRealTimers();
});

describe('Bildschirm-Klaviatur', () => {
  it('zwei Finger klingen gleichzeitig; Loslassen eines Fingers stoppt nur dessen Stimme', () => {
    const onPitch = jest.fn();
    render(ui({ onPitch }));
    touches('responderGrant', [{ id: '1', x: 200, y: 170 }]);
    touches('responderStart', [
      { id: '1', x: 200, y: 170 },
      { id: '2', x: 360, y: 170 },
    ]);
    expect(onPitch.mock.calls.map(([pitch]) => pitch as Pitch)).toEqual([E4, G4]);
    expect(mockResume).toHaveBeenCalledTimes(2);
    expect(mockVoices[0]?.stop).not.toHaveBeenCalled();
    touches('responderEnd', [{ id: '2', x: 360, y: 170 }]);
    expect(mockVoices[0]?.stop).toHaveBeenCalledTimes(1);
    expect(mockVoices[1]?.stop).not.toHaveBeenCalled();
    touches('responderRelease', []);
    expect(mockVoices[1]?.stop).toHaveBeenCalledTimes(1);
  });

  it('zwei Finger auf derselben Taste teilen eine Stimme bis der letzte loslässt', () => {
    render(ui());
    touches('responderGrant', [
      { id: '1', x: 20, y: 170 },
      { id: '2', x: 30, y: 170 },
    ]);
    expect(mockVoices).toHaveLength(1);
    touches('responderEnd', [{ id: '2', x: 30, y: 170 }]);
    expect(mockVoices[0]?.stop).not.toHaveBeenCalled();
    touches('responderRelease', []);
    expect(mockVoices[0]?.stop).toHaveBeenCalledTimes(1);
  });

  it('Glissando wechselt Töne, Verlassen und Abbruch hinterlassen keinen gehaltenen Ton', () => {
    render(ui());
    touches('responderGrant', [{ id: '1', x: 20, y: 170 }]);
    touches('responderMove', [{ id: '1', x: 200, y: 170 }]);
    expect(mockVoices.map((voice) => voice.pitch)).toEqual([C4, E4]);
    expect(mockVoices[0]?.stop).toHaveBeenCalledTimes(1);
    touches('responderMove', [{ id: '1', x: -10, y: 170 }]);
    expect(mockVoices[1]?.stop).toHaveBeenCalledTimes(1);
    touches('responderMove', [{ id: '1', x: 200, y: 170 }]);
    fireEvent(screen.getByTestId('piano-touch-surface'), 'responderTerminate');
    expect(mockVoices[2]?.stop).toHaveBeenCalledTimes(1);
  });

  it('schwarze Taste spielt Cis und sagt beide Namen; Beschriftung ändert keine Tonhöhen', () => {
    const onPitch = jest.fn();
    render(ui({ onPitch }));
    expect(screen.getByLabelText('eingestrichenes cis oder eingestrichenes des')).toBeTruthy();
    touches('responderGrant', [{ id: '1', x: 70, y: 30 }]);
    expect(onPitch).toHaveBeenLastCalledWith({ letter: 'C', alter: 1, octave: 4 });
    touches('responderRelease', []);
    fireEvent.press(screen.getByText('Anpassen'));
    fireEvent.press(screen.getByText('Tonnamen'));
    fireEvent.press(screen.getByText('International (B/B♭)'));
    expect(screen.getByText('B4', { includeHiddenElements: true })).toBeTruthy();
    touches('responderGrant', [{ id: '1', x: 70, y: 30 }]);
    expect(onPitch).toHaveBeenLastCalledWith({ letter: 'C', alter: 1, octave: 4 });
    fireEvent.press(screen.getByText('Anpassen'));
    fireEvent.press(screen.getByText('Tonnamen'));
    fireEvent.press(screen.getByText('Keine Beschriftung'));
    expect(screen.queryByText('B4', { includeHiddenElements: true })).toBeNull();
    expect(screen.getByLabelText('eingestrichenes cis oder eingestrichenes des')).toBeTruthy();
  });

  it('Übung kann Des vorgeben; Lösung und Fehler sind auch als Ansage unterscheidbar', () => {
    const des = { letter: 'D', alter: -1, octave: 4 } as const;
    const onPitch = jest.fn();
    render(
      ui({
        onPitch,
        spellPitch: () => des,
        highlights: [
          { pitch: des, kind: 'wrong' },
          { pitch: E4, kind: 'correct' },
        ],
      }),
    );
    expect(screen.getByText('des¹', { includeHiddenElements: true })).toBeTruthy();
    expect(
      screen.getByLabelText('eingestrichenes cis oder eingestrichenes des, falsch'),
    ).toBeTruthy();
    expect(screen.getByLabelText('eingestrichenes e, richtig')).toBeTruthy();
    touches('responderGrant', [{ id: '1', x: 70, y: 30 }]);
    expect(onPitch).toHaveBeenLastCalledWith(des);
  });

  it('Verschieben beendet Töne und überlässt die Geste dem ScrollView', () => {
    render(ui());
    touches('responderGrant', [{ id: '1', x: 20, y: 170 }]);
    fireEvent.press(screen.getByText('Verschieben'));
    expect(mockVoices[0]?.stop).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('piano-touch-surface').props['pointerEvents']).toBe('none');
    expect(screen.getByText('Spielen')).toBeTruthy();
    fireEvent.press(screen.getByText('Spielen'));
    expect(screen.getByTestId('piano-touch-surface').props['pointerEvents']).toBe('auto');
  });

  it('Zoom und neuer Tonumfang stoppen gehaltene Töne, alle 88 Tasten sind erreichbar', () => {
    render(ui());
    touches('responderGrant', [{ id: '1', x: 20, y: 170 }]);
    fireEvent.press(screen.getByText('Anpassen'));
    fireEvent.press(screen.getByText('+'));
    expect(mockVoices[0]?.stop).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByText('Tonumfang'));
    fireEvent.press(screen.getByText('Ganzes Klavier (A₂–c⁵)'));
    expect(screen.getByTestId('piano-key-21')).toBeTruthy();
    expect(screen.getByTestId('piano-key-108')).toBeTruthy();
  });

  it('Screenreader-Aktivierung spielt kurz; deaktivierte oder unmontierte Klaviatur stoppt sofort', () => {
    const view = render(ui());
    fireEvent.press(screen.getByLabelText('eingestrichenes c'));
    expect(mockVoices[0]?.pitch).toEqual(C4);
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(mockVoices[0]?.stop).toHaveBeenCalledTimes(1);
    touches('responderGrant', [{ id: '1', x: 200, y: 170 }]);
    view.rerender(ui({ enabled: false }));
    expect(mockVoices[1]?.stop).toHaveBeenCalledTimes(1);
    view.rerender(ui());
    touches('responderGrant', [{ id: '1', x: 200, y: 170 }]);
    view.unmount();
    expect(mockVoices[2]?.stop).toHaveBeenCalledTimes(1);
  });

  it('Wechsel in den Hintergrund beendet gehaltene Töne', () => {
    let onState: ((state: AppStateStatus) => void) | undefined;
    const subscribe = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, callback) => {
        onState = callback;
        return { remove: jest.fn() };
      });
    render(ui());
    touches('responderGrant', [{ id: '1', x: 20, y: 170 }]);
    act(() => {
      onState?.('background');
    });
    expect(mockVoices[0]?.stop).toHaveBeenCalledTimes(1);
    subscribe.mockRestore();
  });
});
