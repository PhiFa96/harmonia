import type { ExerciseItem, ExerciseSession } from '@harmonia/exercises';
import {
  currentItem,
  expectedAnswer,
  nextExercise,
  answerSession,
  skipAuralExercises,
  choiceLabel,
} from '@harmonia/exercises';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';
import { createPracticeSession } from '@/exercises/practice';
import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));

const mockResume = jest.fn(() => Promise.resolve());
const mockPlay = jest.fn();
const mockStops: jest.Mock[] = [];
jest.mock('@/audio', () => ({
  usePianoStatus: () => 'ready',
  getAudioEngine: () => ({
    resume: mockResume,
    playInterval: (...args: unknown[]) => {
      mockPlay(...args);
      const stop = jest.fn();
      mockStops.push(stop);
      return { startTime: 0, endTime: 1.6, stop };
    },
    playPitch: (...args: unknown[]) => {
      mockPlay(...args);
      const stop = jest.fn();
      mockStops.push(stop);
      return { startTime: 0, endTime: 0.8, stop };
    },
  }),
}));

const SEED = 19019;
let clock: jest.SpyInstance;
beforeEach(() => {
  // AppState ist im RN-Preset bereits eine jest.fn; mockRestore leert deren Implementierung.
  jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
  clock = jest.spyOn(Date, 'now').mockReturnValue(SEED);
  useSettings.setState({ locale: null });
  void i18n.changeLanguage('de');
  mockResume.mockReset().mockResolvedValue(undefined);
  mockPlay.mockClear();
  mockStops.length = 0;
});
afterEach(() => {
  clock.mockRestore();
});

function start() {
  const router = renderRouter('./src/app', { initialUrl: '/practice' });
  expect(screen.getByText('Musik lesen und hören')).toBeTruthy();
  fireEvent.press(screen.getByText('Übungssatz starten'));
  return router;
}
function itemAt(session: ExerciseSession): ExerciseItem {
  const item = currentItem(session);
  if (!item) throw new Error('Aufgabe fehlt');
  return item;
}
function check(session: ExerciseSession, answer = expectedAnswer(itemAt(session))) {
  fireEvent.press(screen.getByTestId(`answer-${answer}`));
  fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
  return answerSession(session, answer);
}
function next(session: ExerciseSession) {
  fireEvent.press(
    screen.getByRole('button', {
      name: session.index === session.items.length - 1 ? 'Ergebnis ansehen' : 'Weiter',
    }),
  );
  return nextExercise(session);
}
function reachHearing() {
  let state = createPracticeSession(SEED);
  state = next(check(state));
  state = next(check(state));
  expect(itemAt(state).type).toBe('INTERVAL_IDENTIFY_AURAL');
  return state;
}

describe('Aufgaben-Screen', () => {
  it('Prüfen braucht eine Antwort; falsche Antwort bleibt gewertet und wird zusammen mit der Lösung markiert', () => {
    start();
    const state = createPracticeSession(SEED);
    const item = itemAt(state);
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    const wrong = item.choices.find((value) => value !== expectedAnswer(item));
    if (!wrong) throw new Error('Falsche Option fehlt');
    check(state, wrong);
    expect(screen.getByText('Noch nicht ganz')).toBeTruthy();
    expect(
      screen.getByRole('radio', { name: `${choiceLabel(item, wrong, 'de')}, falsch` }),
    ).toBeDisabled();
    expect(
      screen.getByRole('radio', {
        name: `${choiceLabel(item, expectedAnswer(item), 'de')}, richtig`,
      }),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Prüfen' })).toBeNull();
    fireEvent.press(screen.getByText('Weiter'));
    expect(screen.getByText('Aufgabe 2 von 9')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  });

  it('Ansage der Notenfrage beschreibt Positionen, ohne die Antwort zu verraten; alle Hinweisstufen helfen', () => {
    start();
    const item = itemAt(createPracticeSession(SEED));
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img').props['aria-label']).toMatch(/untersten Linie/);
    fireEvent.press(screen.getByText('Hinweis 1'));
    expect(screen.getByText('Dein Hinweis')).toBeTruthy();
    fireEvent.press(screen.getByText('Hinweis 2'));
    fireEvent.press(screen.getByText('Lösung erklären'));
    expect(screen.getByRole('button', { name: 'Lösung erklären' })).toBeDisabled();
    expect(
      screen.getByText(
        new RegExp(`Die Note heißt ${choiceLabel(item, expectedAnswer(item), 'de')}`),
      ),
    ).toBeTruthy();
    check(createPracticeSession(SEED));
    expect(screen.getByText('Mit Hinweis beantwortet')).toBeTruthy();
  });

  it('Hörfrage zeigt vor der Bewertung kein Notenbild und braucht eine ausdrücklich gestartete Wiedergabe', async () => {
    start();
    const state = reachHearing();
    expect(screen.queryByRole('img')).toBeNull();
    expect(mockPlay).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId(`answer-${expectedAnswer(itemAt(state))}`));
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    await act(() => {
      fireEvent.press(screen.getByText('Töne anhören'));
      return Promise.resolve();
    });
    const item = itemAt(state);
    if (item.type === 'NOTE_NAME') throw new Error('Hörfrage fehlt');
    expect(mockPlay).toHaveBeenLastCalledWith(item.from, item.to, 'melodic', { duration: 0.8 });
    fireEvent.press(screen.getByText('Prüfen'));
    expect(mockStops[0]).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Richtig!')).toBeTruthy();
    expect(screen.getByRole('img')).toBeTruthy();
  });

  it('Gerade nicht hören beendet den Klang und überspringt alle weiteren Hörfragen des Satzes', async () => {
    start();
    let state = reachHearing();
    await act(() => {
      fireEvent.press(screen.getByText('Töne anhören'));
      return Promise.resolve();
    });
    fireEvent.press(screen.getByText('Gerade nicht hören'));
    state = skipAuralExercises(state);
    expect(mockStops[0]).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Aufgabe 4 von 9')).toBeTruthy();
    expect(screen.getByText(/Hörfragen werden in diesem Übungssatz übersprungen/)).toBeTruthy();
    while (currentItem(state)) state = next(check(state));
    expect(screen.getByText('6 von 6 Antworten richtig.')).toBeTruthy();
    expect(screen.getByText('3 Hörfragen übersprungen; sie zählen nicht als Fehler.')).toBeTruthy();
    fireEvent.press(screen.getByText('Neuen Übungssatz starten'));
    expect(screen.getByText('Aufgabe 1 von 9')).toBeTruthy();
    expect(screen.queryByText(/Hörfragen werden in diesem Übungssatz übersprungen/)).toBeNull();
  });

  it('ein kompletter gemischter Satz zeigt ein Ergebnis und trennt Hilfen von selbständig richtigen Antworten', async () => {
    start();
    let state = createPracticeSession(SEED);
    fireEvent.press(screen.getByText('Hinweis 1'));
    while (currentItem(state)) {
      if (itemAt(state).type === 'INTERVAL_IDENTIFY_AURAL')
        await act(() => {
          fireEvent.press(screen.getByText('Töne anhören'));
          return Promise.resolve();
        });
      state = next(check(state));
    }
    expect(screen.getByText('Übungssatz beendet')).toBeTruthy();
    expect(screen.getByText('9 von 9 Antworten richtig.')).toBeTruthy();
    expect(screen.getByText('8 Antworten ohne Hinweis richtig.')).toBeTruthy();
    expect(screen.getByText('1 Aufgabe mit Hinweis beantwortet.')).toBeTruthy();
  });

  it('eine verspätete Audio-Freigabe startet nach dem Überspringen keinen Ton', async () => {
    let resume: (() => void) | undefined;
    mockResume.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resume = resolve;
        }),
    );
    start();
    reachHearing();
    fireEvent.press(screen.getByText('Töne anhören'));
    fireEvent.press(screen.getByText('Gerade nicht hören'));
    await act(() => {
      resume?.();
      return Promise.resolve();
    });
    expect(mockPlay).not.toHaveBeenCalled();
    expect(screen.getByText('Aufgabe 4 von 9')).toBeTruthy();
  });

  it('Audio-Fehler bleibt bedienbar und zeigt den Weg zum Überspringen', async () => {
    mockResume.mockRejectedValue(new Error('no audio'));
    start();
    reachHearing();
    await act(() => {
      fireEvent.press(screen.getByText('Töne anhören'));
      return Promise.resolve();
    });
    expect(screen.getByText(/Der Klang konnte nicht gestartet werden/)).toBeTruthy();
    fireEvent.press(screen.getByText('Gerade nicht hören'));
    expect(screen.getByText('Aufgabe 4 von 9')).toBeTruthy();
  });

  it('Hintergrund und Verlassen des Tabs beenden die laufende Wiedergabe', async () => {
    let onState: ((state: AppStateStatus) => void) | undefined;
    const subscription = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, callback) => {
        onState = callback;
        return { remove: jest.fn() };
      });
    try {
      start();
      reachHearing();
      await act(() => {
        fireEvent.press(screen.getByText('Töne anhören'));
        return Promise.resolve();
      });
      act(() => {
        onState?.('background');
      });
      expect(mockStops[0]).toHaveBeenCalledTimes(1);
      act(() => {
        onState?.('active');
      });
      await act(() => {
        fireEvent.press(screen.getByText('Noch einmal hören'));
        return Promise.resolve();
      });
      fireEvent.press(screen.getByText('Profil'));
      expect(mockStops[1]).toHaveBeenCalledTimes(1);
    } finally {
      subscription.mockRestore();
    }
  });

  it('eine verspätete Audio-Freigabe startet nach einem Tabwechsel keinen Ton', async () => {
    let resume: (() => void) | undefined;
    mockResume.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resume = resolve;
        }),
    );
    start();
    reachHearing();
    fireEvent.press(screen.getByText('Töne anhören'));
    fireEvent.press(screen.getByText('Profil'));
    await act(() => {
      resume?.();
      return Promise.resolve();
    });
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('Klaviatur-Demo bleibt über die Einführung erreichbar', () => {
    const router = renderRouter('./src/app', { initialUrl: '/practice' });
    fireEvent.press(screen.getByText('Noten und Klaviatur ausprobieren'));
    expect(router.getPathname()).toBe('/note-input');
    fireEvent.press(screen.getByText('Klaviatur'));
    expect(screen.getByTestId('piano-canvas')).toBeTruthy();
  });

  it('Englisch bleibt beim Start und während der Aufgabe vollständig übersetzt', async () => {
    useSettings.setState({ locale: 'en-GB' });
    renderRouter('./src/app', { initialUrl: '/practice' });
    fireEvent.press(screen.getByText('Start practice set'));
    expect(screen.getByText('Question 1 of 9')).toBeTruthy();
    expect(
      screen.getByText('What is this note called? Choose the name without its octave.'),
    ).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('Check')).toBeTruthy();
    });
  });
});
