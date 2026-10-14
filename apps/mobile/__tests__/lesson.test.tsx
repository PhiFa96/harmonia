import { act as settleAct } from 'expo-router/testing-library';
import { firstLesson } from '@harmonia/content/authoring';
import type { LessonSession } from '@harmonia/exercises';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
  nextLessonExercise,
  skipLessonAural,
  startLessonReview,
  revealLessonHint,
} from '@harmonia/exercises';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { AppState } from 'react-native';
import { i18n } from '@/i18n';
import { router as navigation } from 'expo-router';
import { useTutor } from '@/tutor/state';
import { useSettings } from '@/state/settings';
import type { LessonAttempt, SavedLessonSummary } from '@/storage/lesson-repository';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));
const mockSave = jest.fn<Promise<void>, [LessonAttempt]>();
const mockLatest = jest.fn<Promise<SavedLessonSummary | null>, []>();
jest.mock('@/storage/lessons', () => ({
  getLessonRepository: () => Promise.resolve({ save: mockSave, latest: mockLatest }),
}));
const mockPlay = jest.fn<unknown, unknown[]>();
const mockStop = jest.fn();
jest.mock('@/audio', () => ({
  usePianoStatus: () => 'ready',
  getAudioEngine: () => ({
    context: { currentTime: 0 },
    resume: () => Promise.resolve(),
    playPitch: (...args: unknown[]) => {
      mockPlay(...args);
      return { startTime: 0, endTime: 0.8, stop: mockStop };
    },
    playInterval: (...args: unknown[]) => {
      mockPlay(...args);
      return { startTime: 0, endTime: 1.6, stop: mockStop };
    },
  }),
}));
const SEED = 20120;
let clock: jest.SpyInstance;
beforeEach(() => {
  jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
  clock = jest.spyOn(Date, 'now').mockReturnValue(SEED);
  useSettings.setState({ locale: null });
  void i18n.changeLanguage('de');
  mockSave.mockReset().mockResolvedValue(undefined);
  mockLatest.mockReset().mockResolvedValue(null);
  mockPlay.mockClear();
  mockStop.mockClear();
});
afterEach(() => {
  clock.mockRestore();
});
async function start() {
  const router = renderRouter('./src/app', { initialUrl: '/lesson' });
  fireEvent.press(screen.getByText('Nächste Einführungskarte'));
  fireEvent.press(screen.getByText('Nächste Einführungskarte'));
  fireEvent.press(screen.getByText('Mit 10 Aufgaben starten'));
  await settleAct(async () => {
    await Promise.resolve();
  });
  return router;
}
function itemOf(state: LessonSession) {
  return required(currentItem(required(activeLessonSession(state))));
}
async function answer(state: LessonSession, correct = true) {
  const item = itemOf(state);
  if (item.type === 'INTERVAL_IDENTIFY_AURAL')
    await act(async () => {
      fireEvent.press(screen.getByText('Töne anhören'));
      await Promise.resolve();
    });
  const choice = correct
    ? expectedAnswer(item)
    : required(item.choices.find((value) => value !== expectedAnswer(item)));
  fireEvent.press(screen.getByTestId(`answer-${choice}`));
  fireEvent.press(screen.getByText('Prüfen'));
  return answerLesson(state, choice);
}
function next(state: LessonSession) {
  fireEvent.press(screen.getByTestId('exercise-next'));
  return nextLessonExercise(state);
}
async function finish(state: LessonSession, wrong: readonly number[] = []) {
  while (state.phase === 'initial')
    state = next(await answer(state, !wrong.includes(state.initial.index)));
  if (state.phase === 'review-intro') {
    fireEvent.press(screen.getByText('Wiederholung starten'));
    state = startLessonReview(state);
  }
  while (state.phase === 'review') state = next(await answer(state));
  return state;
}
// Der erste Test rendert den ganzen Router kalt (alle Routen, Inhalte, Notation): mit 2 Workern in der
// CI knapp über dem Standardlimit von 5 s. Die folgenden Tests brauchen etwa 1 s.
jest.setTimeout(20_000);

describe('Vollständige Lektion', () => {
  it('öffnet aus Lernen die Einführung; Klang startet nur ausdrücklich und stoppt beim Kartenwechsel', async () => {
    const router = renderRouter('./src/app', { initialUrl: '/' });
    fireEvent.press(screen.getByText('Lektion ansehen'));
    expect(router.getPathname()).toBe('/lesson');
    expect(screen.getByText('Einführung 1 von 3')).toBeTruthy();
    expect(mockPlay).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.press(screen.getByText('Klangbeispiel'));
      await Promise.resolve();
    });
    expect(mockPlay).toHaveBeenCalledWith(
      { letter: 'G', alter: 0, octave: 4 },
      { when: 0.05, duration: 8 / 3 },
    );
    fireEvent.press(screen.getByText('Nächste Einführungskarte'));
    expect(mockStop).toHaveBeenCalled();
    expect(screen.getByText('Einführung 2 von 3')).toBeTruthy();
    expect(screen.getByText('Kleine Terz: c¹–es¹')).toBeTruthy();
    fireEvent.press(screen.getByText('Große Terz: c¹–e¹'));
    await act(async () => {
      fireEvent.press(screen.getByText('Klangbeispiel'));
      await Promise.resolve();
    });
    expect(mockPlay.mock.calls.slice(-2).map((call) => call[0])).toEqual([
      { letter: 'C', alter: 0, octave: 4 },
      { letter: 'E', alter: 0, octave: 4 },
    ]);
  });
  it('Warum übernimmt die falsche Erstantwort und kehrt zum unveränderten Feedback zurück', async () => {
    const router = await start(),
      state = createLessonSession(firstLesson, SEED),
      item = itemOf(state);
    const wrong = required(item.choices.find((choice) => choice !== expectedAnswer(item)));
    fireEvent.press(screen.getByTestId(`answer-${wrong}`));
    fireEvent.press(screen.getByText('Prüfen'));
    fireEvent.press(screen.getByText('Warum? Mit KI erklären'));
    expect(router.getPathname()).toBe('/tutor-task');
    expect(useTutor.getState().scope).toMatchObject({
      mode: 'explain',
      hintLevel: null,
      context: {
        source: {
          kind: 'lesson',
          lessonId: firstLesson.id,
          seed: SEED,
          round: 'initial',
          index: 0,
        },
        answer: wrong,
        checked: true,
      },
    });
    expect(screen.getByText(/Melde dich mit deinem Konto/)).toBeTruthy();
    expect(screen.getByTestId('tutor-original-score')).toBeTruthy();
    act(() => {
      navigation.back();
    });
    expect(router.getPathname()).toBe('/lesson');
    await waitFor(() => {
      expect(screen.getByTestId('exercise-next')).toBeTruthy();
    });
    expect(mockSave).not.toHaveBeenCalled();
  });
  it('KI-Hinweise bewahren die verwendete Stufe; KI-Lösung wird erst nach festem Hinweis 3 angeboten', async () => {
    await start();
    expect(screen.queryByText('KI-Hinweis 1 ergänzen')).toBeNull();
    fireEvent.press(screen.getByText('Hinweis 1'));
    fireEvent.press(screen.getByText('KI-Hinweis 1 ergänzen'));
    expect(useTutor.getState().scope).toMatchObject({
      mode: 'hint',
      hintLevel: 1,
      context: { checked: false, answer: null },
    });
    act(() => {
      navigation.back();
    });
    fireEvent.press(screen.getByText('Hinweis 2'));
    fireEvent.press(screen.getByText('KI-Hinweis 2 ergänzen'));
    expect(useTutor.getState().scope).toMatchObject({ mode: 'hint', hintLevel: 2 });
    act(() => {
      navigation.back();
    });
    fireEvent.press(screen.getByText('Lösung erklären'));
    fireEvent.press(screen.getByText('Lösung mit KI erklären'));
    expect(useTutor.getState().scope).toMatchObject({
      mode: 'solution',
      hintLevel: null,
      context: { checked: false },
    });
    await waitFor(() => {
      expect(screen.getByText(/Melde dich mit deinem Konto/)).toBeTruthy();
    });
  });
  it('zehn richtige Antworten führen direkt zum Ergebnis und werden einmal gespeichert', async () => {
    await start();
    expect(screen.getByText('Aufgabe 1 von 10')).toBeTruthy();
    await finish(createLessonSession(firstLesson, SEED));
    expect(screen.getByText('Im Erstversuch: 10 von 10 richtig.')).toBeTruthy();
    expect(screen.queryByText('Wiederholung starten')).toBeNull();
    await waitFor(() => {
      expect(screen.getByText('Ergebnis auf diesem Gerät gespeichert.')).toBeTruthy();
    });
    expect(mockSave).toHaveBeenCalledTimes(1);
    const attempt = required(mockSave.mock.calls[0])[0];
    expect(attempt.session.lesson).toMatchObject({ id: firstLesson.id, contentVersion: 1 });
    expect(attempt.summary).toMatchObject({ correct: 10, reviewTotal: 0 });
    expect(attempt.session.initial.records).toHaveLength(10);
  });
  it('zeigt neue Varianten für Fehler, zählt beide Runden getrennt und behält Hinweise', async () => {
    await start();
    let state = createLessonSession(firstLesson, SEED);
    fireEvent.press(screen.getByText('Hinweis 1'));
    state = revealLessonHint(state);
    state = await finish(state, [0, 2]);
    expect(state.reviewOrigins).toEqual([0, 2]);
    expect(screen.getByText('Im Erstversuch: 8 von 10 richtig.')).toBeTruthy();
    expect(screen.getByText('Genauigkeit im Erstversuch: 80 %.')).toBeTruthy();
    expect(screen.getByText('In der Wiederholung: 2 von 2 Aufgaben richtig.')).toBeTruthy();
    expect(screen.getByText('1 Aufgabe mit Hinweis beantwortet.')).toBeTruthy();
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
    expect(required(mockSave.mock.calls[0])[0].summary).toMatchObject({
      correct: 8,
      reviewCorrect: 2,
      assisted: 1,
    });
  });
  it('Hör-Pause überspringt drei Hörfragen, zählt sieben Antworten und setzt sich im neuen Durchgang zurück', async () => {
    await start();
    let state = createLessonSession(firstLesson, SEED);
    state = next(await answer(state));
    state = next(await answer(state));
    fireEvent.press(screen.getByText('Gerade nicht hören'));
    state = skipLessonAural(state);
    await finish(state);
    expect(screen.getByText('Im Erstversuch: 7 von 7 richtig.')).toBeTruthy();
    expect(screen.getByText('3 Hörfragen übersprungen; sie zählen nicht als Fehler.')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('Lektion erneut üben')).toBeEnabled();
    });
    await settleAct(async () => {
      fireEvent.press(screen.getByText('Lektion erneut üben'));
      await Promise.resolve();
    });
    expect(screen.getByText('Aufgabe 1 von 10')).toBeTruthy();
    expect(screen.queryByText(/^Hörfragen werden in dieser Lektion/)).toBeNull();
  });
  it('bietet bei Speicherfehler einen erneuten Versuch mit derselben ID und demselben Ergebnis', async () => {
    mockSave.mockRejectedValueOnce(new Error('Speicher voll'));
    await start();
    await finish(createLessonSession(firstLesson, SEED));
    await waitFor(() => {
      expect(screen.getByText('Speichern erneut versuchen')).toBeTruthy();
    });
    expect(screen.getByText('Lektion erneut üben')).toBeDisabled();
    fireEvent.press(screen.getByText('Speichern erneut versuchen'));
    await waitFor(() => {
      expect(screen.getByText('Ergebnis auf diesem Gerät gespeichert.')).toBeTruthy();
    });
    expect(mockSave).toHaveBeenCalledTimes(2);
    expect(required(mockSave.mock.calls[1])[0]).toBe(required(mockSave.mock.calls[0])[0]);
  });
  it('zeigt englische Einführung und UK-Halbtonbegriffe', () => {
    useSettings.setState({ locale: 'en-GB' });
    renderRouter('./src/app', { initialUrl: '/lesson' });
    expect(screen.getByText('Introduction 1 of 3')).toBeTruthy();
    expect(screen.getByText(/A stave has five lines.*one semitone/)).toBeTruthy();
    fireEvent.press(screen.getByText('Next introduction card'));
    expect(screen.getByText(/Minor and major thirds.*semitones/)).toBeTruthy();
  });
});

function required<T>(value: T | undefined | null): T {
  if (value == null) throw new Error('Erwarteter Testwert fehlt');
  return value;
}
