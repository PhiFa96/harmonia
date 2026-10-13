import { catalogue } from '@harmonia/content/authoring';
import { resolveLesson } from '@harmonia/content';
import type { ExerciseItem } from '@harmonia/exercises';
import {
  answerLesson,
  createLessonSession,
  expectedAnswer,
  nextLessonExercise,
} from '@harmonia/exercises';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { AppState } from 'react-native';
import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';
import type { LessonAttempt, SavedLessonSummary } from '@/storage/lesson-repository';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));
const mockSave = jest.fn<Promise<void>, [LessonAttempt]>(),
  mockLatest = jest.fn<Promise<SavedLessonSummary | null>, [string]>();
jest.mock('@/storage/lessons', () => ({
  getLessonRepository: () => Promise.resolve({ save: mockSave, latest: mockLatest }),
}));
const mockPlay = jest.fn<unknown, unknown[]>(),
  mockStop = jest.fn();
jest.mock('@/audio', () => ({
  usePianoStatus: () => 'ready',
  getAudioEngine: () => ({
    context: { currentTime: 10 },
    resume: () => Promise.resolve(),
    playPitch: (...args: unknown[]) => {
      mockPlay(...args);
      return { startTime: 10.05, endTime: 13, stop: mockStop };
    },
  }),
}));
const SEED = 20757;
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
jest.setTimeout(20_000);
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Testwert fehlt');
  return value;
}
function intro(name: string) {
  const content = required(resolveLesson(catalogue, `notation.l1.register.${name}`));
  for (let index = 1; index < content.introduction.length; index++)
    fireEvent.press(screen.getByRole('button', { name: 'Nächste Einführungskarte' }));
  fireEvent.press(
    screen.getByRole('button', {
      name: `Mit ${String(content.exercises.length)} Aufgaben starten`,
    }),
  );
  return createLessonSession(content, SEED);
}
function answer(item: ExerciseItem, value = expectedAnswer(item)) {
  fireEvent.press(
    screen.getByTestId(
      item.type === 'KEY_FIND' ? `piano-key-${value.slice(4)}` : `answer-${value}`,
    ),
  );
  fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
}
describe('Oktavlagen und Hilfslinien im Spieler', () => {
  it('öffnet die neue Einheit; der breite beschriftete Ausschnitt ist still und erhält einen Scrollhinweis', async () => {
    renderRouter('./src/app', { initialUrl: '/' });
    fireEvent.press(screen.getByRole('button', { name: 'Oktavlagen unterscheiden öffnen' }));
    expect(screen.getByTestId('keyboard-example')).toHaveAccessibleName(/e¹, e²/);
    fireEvent(screen.getByTestId('keyboard-example'), 'layout', {
      nativeEvent: { layout: { width: 320 } },
    });
    expect(
      screen.getByText(
        'Verschiebe die Klaviatur seitlich, um alle beschrifteten Oktavlagen zu sehen.',
      ),
    ).toBeTruthy();
    expect(mockPlay).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(mockLatest).toHaveBeenCalledTimes(catalogue.lessons.length);
    });
  });
  it.each([
    ['octaves', 8],
    ['ledger', 10],
    ['match', 12],
  ] as const)(
    '%s speichert alle %s Antworten mit eigener ID und Version 5',
    async (name, count) => {
      renderRouter('./src/app', { initialUrl: `/lesson?id=notation.l1.register.${name}` });
      const state = intro(name);
      for (const item of state.initial.items) {
        answer(item);
        fireEvent.press(screen.getByTestId('exercise-next'));
      }
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      });
      expect(
        screen.getByText(`Im Erstversuch: ${String(count)} von ${String(count)} richtig.`),
      ).toBeTruthy();
      expect(required(mockSave.mock.calls[0])[0].session.lesson).toMatchObject({
        id: `notation.l1.register.${name}`,
        contentVersion: 5,
      });
    },
  );
  it('weist denselben Buchstaben in anderer Lage zurück und speichert 7/8 plus eine neue richtige Wiederholung', async () => {
    renderRouter('./src/app', { initialUrl: '/lesson?id=notation.l1.register.octaves' });
    let simulated = intro('octaves');
    const first = required(simulated.initial.items[0]);
    const correct = expectedAnswer(first);
    const wrong = required(
      first.choices.find((value) => value.startsWith(correct.charAt(0)) && value !== correct),
    );
    answer(first, wrong);
    expect(screen.getByText('Noch nicht ganz')).toBeTruthy();
    fireEvent.press(screen.getByTestId('exercise-next'));
    simulated = nextLessonExercise(answerLesson(simulated, wrong));
    for (const item of simulated.initial.items.slice(1)) {
      answer(item);
      fireEvent.press(screen.getByTestId('exercise-next'));
      simulated = nextLessonExercise(answerLesson(simulated, expectedAnswer(item)));
    }
    fireEvent.press(screen.getByRole('button', { name: 'Wiederholung starten' }));
    const review = required(required(simulated.review).items[0]);
    expect(expectedAnswer(review)).not.toBe(correct);
    answer(review);
    fireEvent.press(screen.getByTestId('exercise-next'));
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
    expect(required(mockSave.mock.calls[0])[0].summary).toMatchObject({
      correct: 7,
      answered: 8,
      reviewCorrect: 1,
      unresolved: 0,
    });
  });
  it('zeigt bei der Tastenfrage das Notenbild ohne vorgegebenen Namen; eine falsche Oktave bleibt falsch', () => {
    renderRouter('./src/app', { initialUrl: '/lesson?id=notation.l1.register.match' });
    const state = intro('match'),
      item = required(state.initial.items[0]);
    expect(screen.getByTestId('exercise-question')).not.toHaveTextContent(/[0-9¹²³⁴⁵]/);
    expect(screen.getByTestId('exercise-question')).toHaveTextContent(/Spiele die notierte Note/);
    expect(screen.getAllByRole('img')).toHaveLength(1);
    for (let number = 57; number <= 84; number++)
      expect(screen.getByTestId(`piano-key-${String(number)}`)).toBeTruthy();
    expect(screen.queryByTestId('piano-key-56')).toBeNull();
    expect(screen.queryByTestId('piano-key-85')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Anpassen' }));
    expect(screen.getByText('Ausschnitt: a–c³')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Tonumfang' })).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Schließen' }));
    const target = Number(expectedAnswer(item).slice(4));
    answer(item, `key:${String(target <= 72 ? target + 12 : target - 12)}`);
    expect(screen.getByText('Noch nicht ganz')).toBeTruthy();
    expect(screen.queryByText('Richtig!')).toBeNull();
  });
  it('wechselt das vollständige Beispiel und stoppt seine beiden Stimmen', async () => {
    renderRouter('./src/app', { initialUrl: '/lesson?id=notation.l1.register.octaves' });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Klangbeispiel' }));
      await Promise.resolve();
    });
    expect(mockPlay.mock.calls.map(([pitch]) => pitch)).toEqual([
      { letter: 'E', alter: 0, octave: 4 },
      { letter: 'E', alter: 0, octave: 5 },
    ]);
    fireEvent.press(screen.getByRole('button', { name: 'g¹ und g²: international G4 und G5' }));
    expect(mockStop).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('keyboard-example')).toHaveAccessibleName(/g¹, g²/);
  });
  it.each([
    ['en-US', 'quarter notes'],
    ['en-GB', 'crotchets'],
  ] as const)('%s zeigt vollständige Namen und die eigene Tempoeinheit', (locale, value) => {
    useSettings.setState({ locale });
    renderRouter('./src/app', { initialUrl: '/lesson?id=notation.l1.register.octaves' });
    expect(screen.getByTestId('keyboard-example')).toHaveAccessibleName(/E4, E5/);
    expect(screen.getByText(`Sound example: 90 ${value} per minute.`)).toBeTruthy();
    expect(screen.queryByText(/\$t\(|glossary:|content\./)).toBeNull();
  });
});
