import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { AccessibilityInfo } from 'react-native';
import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));
jest.mock('@/audio', () => ({
  usePianoStatus: () => 'ready',
  getAudioEngine: () => ({
    context: { currentTime: 0, state: 'running' },
    resume: () => Promise.resolve(),
    stopAll: jest.fn(),
    latency: () => ({ sampleRate: 48000, base: 0.02, output: 0.03 }),
    playPitch: () => ({ startTime: 0, endTime: 1, stop: jest.fn() }),
    playChord: () => ({ startTime: 0, endTime: 1, stop: jest.fn() }),
    playInterval: () => ({ startTime: 0, endTime: 1, stop: jest.fn() }),
  }),
}));

jest.setTimeout(60_000);

const START = 1_000_000;
let announce: jest.SpyInstance;
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(START);
  announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation();
  useSettings.setState({ locale: 'de', sound: true });
  void i18n.changeLanguage('de');
});
afterEach(() => {
  announce.mockRestore();
  jest.useRealTimers();
});

function open() {
  renderRouter('./src/app', { initialUrl: '/' });
  act(() => {
    router.push('/exam');
  });
  expect(screen.getByText('Vertiefte Studienvorbereitung')).toBeTruthy();
}
function startFirst() {
  fireEvent.press(screen.getAllByText('Prüfung starten')[0] as never);
  expect(screen.getByTestId('exercise-question')).toBeTruthy();
}
function tick(ms: number) {
  jest.setSystemTime(Date.now() + ms);
  act(() => {
    jest.advanceTimersByTime(1000);
  });
}

describe('Prüfungsmodus in der App', () => {
  it('fragt vor dem Verlassen eines laufenden Durchgangs nach und setzt ihn fort', () => {
    open();
    startFirst();
    act(() => {
      router.back();
    });
    expect(screen.getByText('Prüfung abbrechen?')).toBeTruthy();
    expect(screen.queryByTestId('exercise-question')).toBeNull();
    fireEvent.press(screen.getByText('Hier weiter bearbeiten'));
    expect(screen.getByTestId('exercise-question')).toBeTruthy();
    expect(screen.queryByText('Prüfung abbrechen?')).toBeNull();
  });

  it('verlässt den Durchgang erst nach ausdrücklicher Bestätigung', () => {
    open();
    startFirst();
    act(() => {
      router.back();
    });
    fireEvent.press(screen.getByText('Prüfung abbrechen und verlassen'));
    expect(screen.queryByText('Prüfung abbrechen?')).toBeNull();
    expect(screen.queryByTestId('exercise-question')).toBeNull();
    expect(screen.queryByText('Vertiefte Studienvorbereitung')).toBeNull();
  });

  it('lässt nach der Abgabe ohne Rückfrage zurückgehen und kündigt das Ergebnis an', () => {
    open();
    startFirst();
    fireEvent.press(screen.getByText('Prüfung vorzeitig abgeben'));
    fireEvent.press(screen.getByText('Jetzt abgeben'));
    expect(screen.getByText('Prüfungsauswertung')).toBeTruthy();
    expect(screen.getByText(/Du hast vorzeitig abgegeben\./)).toBeTruthy();
    expect(screen.getByText(/Aufgaben blieben unbeantwortet und zählen null Punkte/)).toBeTruthy();
    expect(announce).toHaveBeenCalledWith(expect.stringMatching(/Prüfung beendet.*Punkten/));
    act(() => {
      router.back();
    });
    expect(screen.queryByText('Prüfung abbrechen?')).toBeNull();
  });

  it('warnt hörbar bei fünf und einer Minute Restzeit und kündigt den Fristablauf an', () => {
    open();
    startFirst();
    const total = 20 * 60_000;
    tick(total - 5 * 60_000 + 500);
    expect(screen.getByText('Noch fünf Minuten.')).toBeTruthy();
    tick(4 * 60_000);
    expect(screen.getByText('Noch eine Minute.')).toBeTruthy();
    tick(2 * 60_000);
    expect(screen.getByText('Prüfungsauswertung')).toBeTruthy();
    expect(screen.getByText(/Die Zeit ist abgelaufen\./)).toBeTruthy();
    expect(announce).toHaveBeenCalledWith(expect.stringMatching(/Zeit ist abgelaufen/));
  });
});
