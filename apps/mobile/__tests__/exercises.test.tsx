import { act as settleAct } from 'expo-router/testing-library';
import type { ExerciseItem, ExerciseSession, PitchInputItem } from '@harmonia/exercises';
import {
  currentItem,
  expectedAnswer,
  nextExercise,
  answerSession,
  skipAuralExercises,
  choiceLabel,
  inputSlot,
  inputTarget,
  isPitchInput,
} from '@harmonia/exercises';
import type { Pitch, Score } from '@harmonia/notation';
import { eventBounds, keyboardMidi, layoutScore, staffY, svgScene } from '@harmonia/notation';
import { INPUT_EXTENT } from '@harmonia/notation/native';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';
import { createPitchInputSession, createPracticeSession } from '@/exercises/practice';
import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';
import { useTutor } from '@/tutor/state';

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

async function start() {
  const router = renderRouter('./src/app', { initialUrl: '/practice' });
  expect(screen.getByText('Musik lesen und hören')).toBeTruthy();
  fireEvent.press(screen.getByText('Übungssatz starten'));
  await settleAct(async () => {
    await Promise.resolve();
  });
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
  const advanced = nextExercise(session);
  fireEvent.press(
    screen.getByRole('button', {
      name: currentItem(advanced) ? 'Weiter' : 'Ergebnis ansehen',
    }),
  );
  return advanced;
}
function reachHearing() {
  let state = createPracticeSession(SEED);
  state = next(check(state));
  state = next(check(state));
  expect(itemAt(state).type).toBe('INTERVAL_IDENTIFY_AURAL');
  return state;
}
function tapStaff(
  item: PitchInputItem,
  pitch: Pitch,
  score: Score = item.score,
  measure = inputSlot(item).measure,
) {
  const layout = layoutScore(score);
  const scene = svgScene(layout, { scale: 14, padding: 1, highlights: [], extent: INPUT_EXTENT });
  const slot = eventBounds(layout).find((bounds) => bounds.measure === measure);
  if (!slot) throw new Error('Eingabeplatz fehlt');
  const { x, y } = scene.toPixels((slot.x1 + slot.x2) / 2, staffY(pitch, item.clef));
  const input = screen.getByTestId('score-input');
  fireEvent(input, 'responderGrant', { nativeEvent: { locationX: x, locationY: y, pageY: y } });
  fireEvent(input, 'responderRelease', { nativeEvent: { locationX: x, locationY: y, pageY: y } });
}

describe('Aufgaben-Screen', () => {
  it('bietet KI-Lösungen erst nach einer geprüften Antwort an und bindet die Antwort an den Dialog', async () => {
    await start();
    const state = createPracticeSession(SEED);
    expect(screen.queryByText(i18n.t('tutor.aiSolution'))).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: i18n.t('exercise.hint', { level: 1 }) }));
    expect(screen.getByText(i18n.t('tutor.aiHint', { level: 1 }))).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: i18n.t('exercise.hint', { level: 2 }) }));
    fireEvent.press(screen.getByRole('button', { name: i18n.t('exercise.solution') }));
    expect(screen.getByText(i18n.t('exercise.solution'))).toBeDisabled();
    expect(screen.queryByText(i18n.t('tutor.aiSolution'))).toBeNull();
    const answer = expectedAnswer(itemAt(state));
    check(state, answer);
    fireEvent.press(screen.getByText(i18n.t('tutor.aiSolution')));
    expect(useTutor.getState().scope).toMatchObject({
      mode: 'solution',
      context: { answer, checked: true, source: { kind: 'practice', index: 0 } },
    });
  });
  it('Prüfen braucht eine Antwort; falsche Antwort bleibt gewertet und wird zusammen mit der Lösung markiert', async () => {
    await start();
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

  it('Ansage der Notenfrage beschreibt Positionen, ohne die Antwort zu verraten; alle Hinweisstufen helfen', async () => {
    await start();
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
    await start();
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
    if (item.type !== 'INTERVAL_IDENTIFY_AURAL') throw new Error('Hörfrage fehlt');
    expect(mockPlay).toHaveBeenLastCalledWith(item.from, item.to, 'melodic', { duration: 0.8 });
    fireEvent.press(screen.getByText('Prüfen'));
    expect(mockStops[0]).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Richtig!')).toBeTruthy();
    expect(screen.getByRole('img')).toBeTruthy();
  });

  it('Gerade nicht hören beendet den Klang und überspringt alle weiteren Hörfragen des Satzes', async () => {
    await start();
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
    await settleAct(async () => {
      fireEvent.press(screen.getByText('Neuen Übungssatz starten'));
      await Promise.resolve();
    });
    expect(screen.getByText('Aufgabe 1 von 9')).toBeTruthy();
    expect(screen.queryByText(/Hörfragen werden in diesem Übungssatz übersprungen/)).toBeNull();
  });

  it('ein kompletter gemischter Satz zeigt ein Ergebnis und trennt Hilfen von selbständig richtigen Antworten', async () => {
    await start();
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
    await start();
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
    await start();
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
      await start();
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
    await start();
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
    await settleAct(async () => {
      fireEvent.press(screen.getByText('Start practice set'));
      await Promise.resolve();
    });
    expect(screen.getByText('Question 1 of 9')).toBeTruthy();
    expect(
      screen.getByText('What is this note called? Choose the name without its octave.'),
    ).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('Check')).toBeTruthy();
    });
  });

  it('neun Eingabeaufgaben lassen sich setzen, prüfen und abschließen; nächste Aufgabe beginnt leer', async () => {
    renderRouter('./src/app', { initialUrl: '/practice' });
    await settleAct(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Noten und Intervalle selbst eingeben' }));
      await Promise.resolve();
    });
    let state = createPitchInputSession(SEED);
    while (currentItem(state)) {
      const item = itemAt(state);
      if (!isPitchInput(item)) throw new Error('Eingabeaufgabe fehlt');
      expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
      expect(screen.queryByText('So sieht die Lösung aus')).toBeNull();
      if (item.type === 'KEY_FIND')
        fireEvent.press(screen.getByTestId(`piano-key-${String(keyboardMidi(item.pitch))}`));
      else {
        if (item.type === 'INTERVAL_BUILD') {
          tapStaff(item, item.from, item.score, 0);
          expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
        }
        tapStaff(item, inputTarget(item));
        const names: Readonly<Record<number, string>> = {
          '-2': 'Doppel-b',
          '-1': 'b',
          0: 'Auflösungszeichen',
          1: 'Kreuz',
          2: 'Doppelkreuz',
        };
        const name = names[inputTarget(item).alter];
        if (!name) throw new Error('Vorzeichenname fehlt');
        fireEvent.press(screen.getByRole('radio', { name }));
      }
      fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
      expect(screen.getByText('Richtig!')).toBeTruthy();
      if (item.type === 'KEY_FIND')
        expect(screen.getByTestId(`piano-key-${String(keyboardMidi(item.pitch))}`)).toBeDisabled();
      else {
        expect(screen.queryByTestId('score-input')).toBeNull();
        expect(screen.getByRole('button', { name: 'Löschen' })).toBeDisabled();
        expect(screen.getByRole('radio', { name: 'Kreuz' })).toBeDisabled();
        expect(screen.getByText('So sieht die Lösung aus')).toBeTruthy();
      }
      state = next(answerSession(state, expectedAnswer(item)));
    }
    expect(screen.getByText('9 von 9 Antworten richtig.')).toBeTruthy();
    expect(screen.getByText('9 Antworten ohne Hinweis richtig.')).toBeTruthy();
    await settleAct(async () => {
      fireEvent.press(screen.getByText('Neuen Übungssatz starten'));
      await Promise.resolve();
    });
    expect(screen.getByText('Noten setzen')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  });

  it('freie Eingabe löscht die Antwort, erklärt erst mit Hinweis 3 die Lösung und sperrt die erste Wertung', async () => {
    renderRouter('./src/app', { initialUrl: '/practice' });
    await settleAct(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Noten und Intervalle selbst eingeben' }));
      await Promise.resolve();
    });
    const item = itemAt(createPitchInputSession(SEED));
    if (item.type !== 'NOTE_PLACE') throw new Error('Notenplatz fehlt');
    const wrong = {
      letter: inputTarget(item).letter === 'C' ? ('D' as const) : ('C' as const),
      alter: 0,
      octave: 4,
    };
    tapStaff(item, wrong);
    fireEvent.press(screen.getByText('Löschen'));
    expect(screen.getByText('Noch keine Note gesetzt.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    fireEvent.press(screen.getByText('Hinweis 1'));
    fireEvent.press(screen.getByText('Hinweis 2'));
    expect(screen.queryByText('So sieht die Lösung aus')).toBeNull();
    fireEvent.press(screen.getByText('Lösung erklären'));
    expect(screen.getByText('So sieht die Lösung aus')).toBeTruthy();
    tapStaff(item, wrong);
    fireEvent.press(screen.getByText('Prüfen'));
    expect(screen.getByText('Noch nicht ganz')).toBeTruthy();
    expect(screen.getByText('Mit Hinweis beantwortet')).toBeTruthy();
    expect(screen.queryByTestId('score-input')).toBeNull();
    fireEvent.press(screen.getByText('Weiter'));
    expect(screen.getByText('Tasten finden')).toBeTruthy();
    expect(screen.queryByText('So sieht die Lösung aus')).toBeNull();
  });

  it('Screenreader kann eine freie Antwort aus der Pause aufbauen und Vorzeichen ändern', async () => {
    renderRouter('./src/app', { initialUrl: '/practice' });
    await settleAct(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Noten und Intervalle selbst eingeben' }));
      await Promise.resolve();
    });
    const rest = screen.getByLabelText('Ganze Pause');
    expect(rest.props['accessibilityRole']).toBe('adjustable');
    fireEvent(rest, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(screen.getByRole('button', { name: 'Prüfen' })).not.toBeDisabled();
    fireEvent.press(screen.getByRole('radio', { name: 'b' }));
    expect(screen.getByRole('radio', { name: 'b' })).toBeChecked();
  });

  it('UK-Eingabeaufgaben und ihre Hinweise verwenden vollständig übersetzte Texte', async () => {
    useSettings.setState({ locale: 'en-GB' });
    renderRouter('./src/app', { initialUrl: '/practice' });
    await settleAct(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Enter notes and build intervals' }));
      await Promise.resolve();
    });
    expect(screen.getByText('Place notes')).toBeTruthy();
    expect(screen.getByText(/Write .* on the empty staff/)).toBeTruthy();
    fireEvent.press(screen.getByText('Hint 1'));
    expect(screen.getByText('Your hint')).toBeTruthy();
    expect(screen.queryByText('Noten setzen')).toBeNull();
  });
});
