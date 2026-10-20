import { act as settleAct } from 'expo-router/testing-library';
import type { RhythmItem } from '@harmonia/exercises';
import {
  expectedAnswer,
  rhythmBeatCount,
  rhythmMeasureMs,
  rhythmOnsets,
  rhythmTimeline,
} from '@harmonia/exercises';
import type { Pitch } from '@harmonia/notation';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';
import { createRhythmSession } from '@/exercises/practice';
import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));
let mockNow = 10,
  mockState = 'running',
  mockFailAt = 0;
const mockResume = jest.fn(() => Promise.resolve()),
  mockStops: jest.Mock[] = [],
  mockStopAll = jest.fn();
const mockPlay = jest.fn<
  undefined,
  [Pitch, { when: number; duration: number; velocity?: number }]
>();
const mockStateListeners: ((state: AppStateStatus) => void)[] = [];
jest.mock('@/audio', () => ({
  usePianoStatus: () => 'ready',
  getAudioEngine: () => ({
    context: {
      get currentTime() {
        return mockNow;
      },
      get state() {
        return mockState;
      },
    },
    resume: mockResume,
    stopAll: mockStopAll,
    latency: () => ({ sampleRate: 48000, base: 0.02, output: 0.03 }),
    playPitch: (pitch: Pitch, options: { when: number; duration: number; velocity?: number }) => {
      mockPlay(pitch, options);
      if (mockFailAt && mockPlay.mock.calls.length === mockFailAt)
        throw new Error('Scheduling failed');
      const stop = jest.fn();
      mockStops.push(stop);
      return { startTime: options.when, endTime: options.when + options.duration, stop };
    },
  }),
}));
const SEED = 19019;
let clock: jest.SpyInstance;
beforeEach(() => {
  jest.useFakeTimers();
  clock = jest.spyOn(Date, 'now').mockReturnValue(SEED);
  mockNow = 10;
  mockState = 'running';
  mockFailAt = 0;
  mockResume.mockReset().mockResolvedValue(undefined);
  mockPlay.mockClear();
  mockStopAll.mockClear();
  mockStops.length = 0;
  mockStateListeners.length = 0;
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => {
    mockStateListeners.push(callback);
    return { remove: jest.fn() };
  });
  useSettings.setState({ locale: null, sound: true });
  void i18n.changeLanguage('de');
});
afterEach(() => {
  clock.mockRestore();
  jest.useRealTimers();
});
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Testwert fehlt');
  return value;
}
async function start() {
  const router = renderRouter('./src/app', { initialUrl: '/practice' });
  fireEvent.press(screen.getByRole('button', { name: 'Rhythmus und Taktgliederung üben' }));
  await settleAct(async () => {
    await Promise.resolve();
  });
  return router;
}
function advance(time: number) {
  mockNow = time;
  act(() => {
    jest.advanceTimersByTime(30);
  });
}
async function begin(item: RhythmItem) {
  const offset = mockPlay.mock.calls.length;
  await act(() => {
    fireEvent.press(screen.getByRole('button', { name: 'Einzählen und aufnehmen' }));
    return Promise.resolve();
  });
  return required(mockPlay.mock.calls[offset]?.[1].when) + (rhythmBeatCount(item) * 60) / item.bpm;
}
async function take(item: RhythmItem, mode: 'correct' | 'extra' | 'empty' = 'correct') {
  const beginAt = await begin(item);
  advance(beginAt + 0.05);
  if (mode !== 'empty')
    for (const time of rhythmOnsets(item)) {
      advance(beginAt + time / 1000 + 0.05);
      fireEvent(screen.getByTestId('rhythm-tap-pad'), 'pressIn');
      if (mode === 'extra' && time === rhythmOnsets(item)[0])
        fireEvent(screen.getByTestId('rhythm-tap-pad'), 'pressIn');
    }
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  advance(beginAt + rhythmMeasureMs(item) / 1000 + 0.051);
  return beginAt;
}
function first(): RhythmItem {
  const item = required(createRhythmSession(SEED).items[0]);
  if (item.type !== 'RHYTHM_TAP') throw new Error('Rhythmus fehlt');
  return item;
}
describe('Rhythmusaufnahme und Taktgliederung in der App', () => {
  it('übt langsamer in Schleifen ohne Antwort und prüft danach im Originaltempo', async () => {
    await start();
    const item = first();
    fireEvent.press(screen.getByTestId('rhythm-mode-practice'));
    fireEvent.press(screen.getByText('Langsamer −5'));
    const practiceBpm = item.bpm - 5;
    expect(screen.getByText(new RegExp(`${String(practiceBpm)} BPM`))).toBeTruthy();
    expect(screen.getByTestId('rhythm-practice-tempo').props['aria-live']).toBe('polite');
    expect(screen.getByTestId('rhythm-modes').props['role']).toBe('group');
    fireEvent.press(screen.getByText('Metronom: Durchgehend'));
    fireEvent.press(screen.getByText('Aus'));
    await act(() => {
      fireEvent.press(screen.getByText('Übung starten'));
      return Promise.resolve();
    });
    expect(mockPlay).not.toHaveBeenCalled();
    const source = { ...item, bpm: practiceBpm },
      beginAt = mockNow + 0.35 + (rhythmBeatCount(item) * 60) / practiceBpm;
    for (const time of rhythmOnsets(source)) {
      advance(beginAt + time / 1000 + 0.05);
      fireEvent(screen.getByTestId('rhythm-tap-pad'), 'pressIn');
    }
    advance(beginAt + rhythmMeasureMs(source) / 1000 + 0.051);
    expect(screen.getByText(/Runde 1:.*0 zusätzliche Anschläge\. Ohne Wertung/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    expect(screen.getByText(/Einzählen: 1 von/)).toBeTruthy();
    fireEvent.press(screen.getByText('Übung stoppen'));
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    fireEvent.press(screen.getByTestId('rhythm-mode-test'));
    await take(item);
    const clicks = mockPlay.mock.calls.filter((call) => call[0].octave >= 5);
    expect((clicks[1]?.[1].when ?? 0) - (clicks[0]?.[1].when ?? 0)).toBeCloseTo(60 / item.bpm);
    fireEvent.press(screen.getByText('Prüfen'));
    expect(screen.getByText('Mit Hinweis beantwortet')).toBeTruthy();
  });
  it('kann einen einzelnen Übungsdurchlauf nur einzählen und danach lautlos üben', async () => {
    await start();
    const item = first();
    fireEvent.press(screen.getByTestId('rhythm-mode-practice'));
    fireEvent.press(screen.getByText('Schleife an'));
    fireEvent.press(screen.getByText('Metronom: Durchgehend'));
    fireEvent.press(screen.getByText('Nur Einzählen'));
    await act(() => {
      fireEvent.press(screen.getByText('Übung starten'));
      return Promise.resolve();
    });
    expect(mockPlay).toHaveBeenCalledTimes(rhythmBeatCount(item));
    const beginAt = 10.35 + (rhythmBeatCount(item) * 60) / item.bpm;
    advance(beginAt + rhythmMeasureMs(item) / 1000 + 0.051);
    expect(screen.getByText(/Runde 1:.*Ohne Wertung/)).toBeTruthy();
    expect(
      screen.getByText('Übungsrunde beendet. Du kannst erneut üben oder zur Prüfung wechseln.'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    fireEvent.press(screen.getByText('Metronom: Nur Einzählen'));
    fireEvent.press(screen.getByText('Aus'));
    act(() => {
      useSettings.setState({ sound: false });
    });
    await act(() => {
      fireEvent.press(screen.getByText('Übung starten'));
      return Promise.resolve();
    });
    expect(mockPlay).toHaveBeenCalledTimes(rhythmBeatCount(item));
    expect(screen.getByText(/Einzählen: 1 von/)).toBeTruthy();
    fireEvent.press(screen.getByText('Übung stoppen'));
  });
  it('sechs Aufgaben lassen sich mit Audio-Uhr und Latenzbezug korrekt abschließen; Neustart leert die Aufnahme', async () => {
    await start();
    expect(mockPlay).not.toHaveBeenCalled();
    const items = createRhythmSession(SEED).items;
    for (const [index, item] of items.entries()) {
      expect(screen.getByText(`Aufgabe ${String(index + 1)} von 6`)).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
      if (item.type === 'RHYTHM_TAP') {
        await take(item);
        expect(screen.getByText(/Gemeldete Audio-Verzögerung: 50 ms/)).toBeTruthy();
      } else fireEvent.press(screen.getByTestId(`answer-${expectedAnswer(item)}`));
      fireEvent.press(screen.getByText('Prüfen'));
      expect(screen.getByText('Richtig!')).toBeTruthy();
      if (item.type === 'RHYTHM_TAP') expect(screen.getByTestId('rhythm-tap-pad')).toBeDisabled();
      fireEvent.press(screen.getByText(index === 5 ? 'Ergebnis ansehen' : 'Weiter'));
    }
    expect(screen.getByText('6 von 6 Antworten richtig.')).toBeTruthy();
    expect(screen.getByText('6 Antworten ohne Hinweis richtig.')).toBeTruthy();
    mockStops.forEach((stop) => {
      expect(stop).toHaveBeenCalledTimes(1);
    });
    expect(mockStopAll).not.toHaveBeenCalled();
    await settleAct(async () => {
      fireEvent.press(screen.getByText('Neuen Übungssatz starten'));
      await Promise.resolve();
    });
    expect(screen.getByText('0 Anschläge aufgenommen.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  });
  it('Einzähltakt nimmt noch nichts auf; nur vollständig beendete Aufnahmen aktivieren Prüfen', async () => {
    await start();
    const item = first(),
      beginAt = await begin(item);
    expect(screen.getByText(/Einzählen: 1 von/)).toBeTruthy();
    fireEvent(screen.getByTestId('rhythm-tap-pad'), 'pressIn');
    expect(screen.getByText('0 Anschläge aufgenommen.')).toBeTruthy();
    advance(beginAt + 0.05);
    expect(screen.getByTestId('rhythm-tap-pad')).not.toBeDisabled();
    fireEvent(screen.getByTestId('rhythm-tap-pad'), 'accessibilityAction', {
      nativeEvent: { actionName: 'activate' },
    });
    expect(screen.getByText('1 Anschlag aufgenommen.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    fireEvent.press(screen.getByText('Aufnahme abbrechen'));
    expect(screen.getByText('0 Anschläge aufgenommen.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    expect(mockPlay.mock.calls.length).toBe(rhythmBeatCount(item) * 2);
    mockStops.forEach((stop) => {
      expect(stop).toHaveBeenCalledTimes(1);
    });
  });
  it('doppelter Anschlag bleibt ein Fehler, spätere Treffer bleiben erhalten und eine zweite Wertung ist gesperrt', async () => {
    await start();
    const item = first();
    await take(item, 'extra');
    fireEvent.press(screen.getByText('Prüfen'));
    expect(screen.getByText('Noch nicht ganz')).toBeTruthy();
    expect(screen.getByText(/Zusätzliche Anschläge:/)).toBeTruthy();
    expect(screen.getByTestId('rhythm-tap-pad')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Prüfen' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Neu aufnehmen' })).toBeNull();
  });
  it('ein leerer vollständiger Take ist ein gewerteter Fehler; vor Prüfen kann neu aufgenommen werden', async () => {
    await start();
    await take(first(), 'empty');
    expect(screen.getByRole('button', { name: 'Prüfen' })).not.toBeDisabled();
    fireEvent.press(screen.getByText('Neu aufnehmen'));
    await act(() => Promise.resolve());
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    fireEvent.press(screen.getByText('Aufnahme abbrechen'));
    await take(first(), 'empty');
    fireEvent.press(screen.getByText('Prüfen'));
    expect(screen.getByText('Noch nicht ganz')).toBeTruthy();
    expect(screen.getAllByText('fehlt oder außerhalb der Toleranz').length).toBe(
      rhythmOnsets(first()).length,
    );
  });
  it('Hinweis 3 bietet ein Klangbeispiel; es enthält Pausen und korrekte Einsätze und wird als Hilfe gewertet', async () => {
    await start();
    const item = first();
    fireEvent.press(screen.getByText('Hinweis 1'));
    fireEvent.press(screen.getByText('Hinweis 2'));
    expect(screen.queryByText('Rhythmus als Beispiel anhören')).toBeNull();
    fireEvent.press(screen.getByText('Lösung erklären'));
    await act(() => {
      fireEvent.press(screen.getByText('Rhythmus als Beispiel anhören'));
      return Promise.resolve();
    });
    const targets = mockPlay.mock.calls.filter((call) => call[0].octave === 4),
      count = rhythmBeatCount(item),
      startAt = 10.35 + (count * 60) / item.bpm;
    expect(targets.map((call) => call[1].when)).toEqual(
      rhythmTimeline(item)
        .filter((event) => !event.rest)
        .map((event) => startAt + event.onsetMs / 1000),
    );
    expect(targets).toHaveLength(rhythmOnsets(item).length);
    await take(item);
    fireEvent.press(screen.getByText('Prüfen'));
    expect(screen.getByText('Mit Hinweis beantwortet')).toBeTruthy();
    expect(mockStopAll).not.toHaveBeenCalled();
  });
  it('Hör-Pause überspringt drei Aufnahmeaufgaben; die drei Taktfragen bleiben', async () => {
    await start();
    fireEvent.press(screen.getByText('Gerade nicht hören'));
    for (const [index, item] of createRhythmSession(SEED)
      .items.filter((item) => item.type === 'METER_IDENTIFY')
      .entries()) {
      fireEvent.press(screen.getByTestId(`answer-${expectedAnswer(item)}`));
      fireEvent.press(screen.getByText('Prüfen'));
      fireEvent.press(screen.getByText(index === 2 ? 'Ergebnis ansehen' : 'Weiter'));
    }
    expect(screen.getByText('3 von 3 Antworten richtig.')).toBeTruthy();
    expect(screen.getByText('3 Hörfragen übersprungen; sie zählen nicht als Fehler.')).toBeTruthy();
    expect(mockPlay).not.toHaveBeenCalled();
  });
  it('verspätete Freigabe startet nach Abbruch, Hör-Pause und Tabwechsel keine Stimmen', async () => {
    let resume: (() => void) | undefined;
    mockResume.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resume = resolve;
        }),
    );
    await start();
    fireEvent.press(screen.getByText('Einzählen und aufnehmen'));
    fireEvent.press(screen.getByText('Aufnahme abbrechen'));
    await act(() => {
      resume?.();
      return Promise.resolve();
    });
    expect(mockPlay).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Einzählen und aufnehmen'));
    fireEvent.press(screen.getByText('Profil'));
    await act(() => {
      resume?.();
      return Promise.resolve();
    });
    expect(mockPlay).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Üben'));
    fireEvent.press(screen.getByText('Einzählen und aufnehmen'));
    fireEvent.press(screen.getByText('Gerade nicht hören'));
    await act(() => {
      resume?.();
      return Promise.resolve();
    });
    expect(mockPlay).not.toHaveBeenCalled();
  });
  it('Hintergrund verwirft einen laufenden Take und stoppt ausschließlich seine vorgeplanten Stimmen', async () => {
    await start();
    await begin(first());
    act(() => {
      mockStateListeners.forEach((listener) => {
        listener('background');
      });
    });
    expect(screen.getByText('Bereit zum Einzählen.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    mockStops.forEach((stop) => {
      expect(stop).toHaveBeenCalledTimes(1);
    });
    expect(mockStopAll).not.toHaveBeenCalled();
  });
  it('teilweise fehlgeschlagene Planung stoppt angelegte Stimmen; Audiofehler erzeugt keine Antwort', async () => {
    await start();
    mockFailAt = 3;
    await act(() => {
      fireEvent.press(screen.getByText('Einzählen und aufnehmen'));
      return Promise.resolve();
    });
    expect(screen.getByText(/Der Klang konnte nicht gestartet werden/)).toBeTruthy();
    expect(mockStops).toHaveLength(2);
    mockStops.forEach((stop) => {
      expect(stop).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    fireEvent.press(screen.getByText('Gerade nicht hören'));
    expect(screen.getByText('Aufgabe 2 von 6')).toBeTruthy();
  });
  it.each([
    ['en-US', 'Practice rhythm and meter', 'quarter note'],
    ['en-GB', 'Practise rhythm and metre', 'crotchet'],
  ] as const)(
    'Bezeichnungen und Notenwerte in %s sind vollständig',
    async (locale, label, note) => {
      useSettings.setState({ locale });
      renderRouter('./src/app', { initialUrl: '/practice' });
      await settleAct(async () => {
        fireEvent.press(screen.getByRole('button', { name: label }));
        await Promise.resolve();
      });
      expect(screen.getByText('Question 1 of 6')).toBeTruthy();
      expect(screen.getByTestId('exercise-question').props['aria-label']).toContain(note);
      fireEvent.press(screen.getByText('Hint 1'));
      fireEvent.press(screen.getByText('Hint 2'));
      expect(screen.queryByText(/exercise\.|glossary:|\{\{|\$t\(/)).toBeNull();
    },
  );
});
