import { act as settleAct } from 'expo-router/testing-library';
import { catalogue } from '@harmonia/content/authoring';
import { lessonPlan } from '@harmonia/content';
import {
  answerLesson,
  createLessonSession,
  expectedAnswer,
  nextLessonExercise,
} from '@harmonia/exercises';
import type { ExerciseItem } from '@harmonia/exercises';
import type { Pitch } from '@harmonia/notation';
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
const mockNow = 10;
const mockPlay = jest.fn<
    undefined,
    [Pitch, { when: number; duration: number; velocity?: number }]
  >(),
  mockStops: jest.Mock[] = [];
jest.mock('@/audio', () => ({
  usePianoStatus: () => 'ready',
  getAudioEngine: () => ({
    context: {
      get currentTime() {
        return mockNow;
      },
      state: 'running',
    },
    resume: () => Promise.resolve(),
    latency: () => ({ sampleRate: 48000, base: 0.02, output: 0.03 }),
    playInterval: (from: Pitch, to: Pitch) => {
      mockPlay(from, { when: mockNow + 0.05, duration: 0.8 });
      mockPlay(to, { when: mockNow + 0.85, duration: 0.8 });
      const stop = jest.fn();
      mockStops.push(stop);
      return { startTime: mockNow + 0.05, endTime: mockNow + 1.65, stop };
    },
    playPitch: (pitch: Pitch, options: { when: number; duration: number; velocity?: number }) => {
      mockPlay(pitch, options);
      const stop = jest.fn();
      mockStops.push(stop);
      return { startTime: options.when, endTime: options.when + options.duration, stop };
    },
  }),
}));
const SEED = 207100;
let clock: jest.SpyInstance;
beforeEach(() => {
  jest.useFakeTimers();
  clock = jest.spyOn(Date, 'now').mockReturnValue(SEED);
  jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
  useSettings.setState({ locale: null });
  void i18n.changeLanguage('de');
  mockSave.mockReset().mockResolvedValue(undefined);
  mockLatest.mockReset().mockResolvedValue(null);
  mockPlay.mockClear();
  mockStops.length = 0;
});
afterEach(() => {
  clock.mockRestore();
  jest.useRealTimers();
});
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Testwert fehlt');
  return value;
}

const unit = 'notation.l2.clefs-registers';
async function intro(id: string) {
  const lesson = required(lessonPlan(catalogue, id));
  for (let i = 1; i < lesson.introduction.length; i++)
    fireEvent.press(screen.getByRole('button', { name: 'Nächste Einführungskarte' }));
  fireEvent.press(
    screen.getByRole('button', { name: `Mit ${String(lesson.exercises.length)} Aufgaben starten` }),
  );
  await settleAct(async () => {
    await Promise.resolve();
  });
  return createLessonSession(lesson, SEED);
}
function answer(item: ExerciseItem, wrong = false) {
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  if (item.type === 'KEY_FIND') {
    // Eingemischte Wiederholungsaufgaben früherer Lektionen (z. B. pitch-match) zeigen kein großes System.
    if (item.presentation === 'grand-staff')
      expect(
        screen.getByTestId('grand-staff-example', { includeHiddenElements: true }),
      ).toBeTruthy();
    const target = Number(expectedAnswer(item).slice(4));
    fireEvent.press(
      screen.getByTestId(`piano-key-${String(wrong ? (target === 60 ? 59 : 60) : target)}`),
    );
  } else {
    if (item.type === 'NOTE_NAME' && item.presentation === 'octave-name')
      expect(screen.queryByTestId('grand-staff-example')).toBeNull();
    fireEvent.press(
      screen.getByTestId(
        `answer-${wrong ? required(item.choices.find((a) => a !== expectedAnswer(item))) : expectedAnswer(item)}`,
      ),
    );
  }
  fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
}
describe('Bassschlüssel und Oktavnamen im App-Spieler', () => {
  it.each(['bass', 'grand', 'names'])(
    '%s: vollständig bearbeiten und als Version 12 speichern',
    async (name) => {
      const id = unit + '.' + name;
      renderRouter('./src/app', { initialUrl: `/lesson?id=${id}` });
      const session = await intro(id);
      for (const item of session.initial.items) {
        answer(item);
        expect(screen.getByText('Richtig!')).toBeTruthy();
        fireEvent.press(screen.getByTestId('exercise-next'));
      }
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      });
      const saved = required(mockSave.mock.calls[0]?.[0]);
      expect(saved.session.lesson).toMatchObject({ id, contentVersion: 12 });
      expect(saved.summary).toMatchObject({
        correct: session.initial.items.length,
        answered: session.initial.items.length,
        reviewTotal: 0,
      });
    },
  );
  it('mittleres c aus beiden Schlüsseln spielt jeweils nur einen Ton', async () => {
    renderRouter('./src/app', { initialUrl: `/lesson?id=${unit}.grand` });
    fireEvent.press(screen.getByRole('button', { name: 'Nächste Einführungskarte' }));
    for (const caption of [
      'c¹ = C4 im Violinschlüssel',
      'c¹ = C4 im Bassschlüssel: dieselbe Taste',
    ]) {
      if (caption.includes('Bassschlüssel:'))
        fireEvent.press(screen.getByRole('button', { name: caption }));
      expect(
        screen.getByTestId('grand-staff-example', { includeHiddenElements: true }),
      ).toBeTruthy();
      mockPlay.mockClear();
      await act(async () => {
        fireEvent.press(screen.getByRole('button', { name: 'Klangbeispiel' }));
        await Promise.resolve();
      });
      expect(mockPlay).toHaveBeenCalledTimes(1);
      expect(mockPlay.mock.calls[0]?.[0]).toEqual({ letter: 'C', alter: 0, octave: 4 });
      fireEvent.press(screen.getByRole('button', { name: 'Wiedergabe stoppen' }));
    }
  });
  it('falsche Oktavantwort erhält eine neue Quellhöhe und getrennte Wiederholungsstatistik', async () => {
    const id = unit + '.names';
    renderRouter('./src/app', { initialUrl: `/lesson?id=${id}` });
    let session = await intro(id);
    for (const [i, item] of session.initial.items.entries()) {
      answer(item, i === 0);
      session = nextLessonExercise(
        answerLesson(
          session,
          i === 0
            ? required(item.choices.find((a) => a !== expectedAnswer(item)))
            : expectedAnswer(item),
        ),
      );
      fireEvent.press(screen.getByTestId('exercise-next'));
    }
    fireEvent.press(screen.getByRole('button', { name: 'Wiederholung starten' }));
    answer(required(session.review?.items[0]));
    fireEvent.press(screen.getByTestId('exercise-next'));
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
    expect(required(mockSave.mock.calls[0]?.[0]).summary).toMatchObject({
      correct: session.initial.items.length - 1,
      answered: session.initial.items.length,
      reviewCorrect: 1,
      reviewTotal: 1,
      unresolved: 0,
    });
  });
});
