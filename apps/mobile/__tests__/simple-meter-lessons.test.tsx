import { catalogue } from '@harmonia/content/authoring';
import { lessonPlan } from '@harmonia/content';
import {
  answerLesson,
  createLessonSession,
  expectedAnswer,
  itemVariantKey,
  nextLessonExercise,
  rhythmBeatCount,
  rhythmMeasureMs,
  rhythmOnsets,
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
let mockNow = 10;
const mockPlay = jest.fn<
  undefined,
  [Pitch, { when: number; duration: number; velocity?: number }]
>();
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
    playPitch: (pitch: Pitch, options: { when: number; duration: number; velocity?: number }) => {
      mockPlay(pitch, options);
      return { startTime: options.when, endTime: options.when + options.duration, stop: jest.fn() };
    },
  }),
}));
const SEED = 20818;
let clock: jest.SpyInstance;
beforeEach(() => {
  jest.useFakeTimers();
  clock = jest.spyOn(Date, 'now').mockReturnValue(SEED);
  mockNow = 10;
  jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
  useSettings.setState({ locale: null });
  void i18n.changeLanguage('de');
  mockSave.mockReset().mockResolvedValue(undefined);
  mockLatest.mockReset().mockResolvedValue(null);
  mockPlay.mockClear();
});
afterEach(() => {
  clock.mockRestore();
  jest.useRealTimers();
});
jest.setTimeout(30_000);
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Testwert fehlt');
  return value;
}
function intro(name: string) {
  const lesson = required(lessonPlan(catalogue, `rhythm.l1.simple-meter.${name}`));
  for (let index = 1; index < lesson.introduction.length; index++)
    fireEvent.press(screen.getByRole('button', { name: 'Nächste Einführungskarte' }));
  fireEvent.press(
    screen.getByRole('button', { name: `Mit ${String(lesson.exercises.length)} Aufgaben starten` }),
  );
  return createLessonSession(lesson, SEED);
}
function advance(time: number) {
  mockNow = time;
  act(() => {
    jest.advanceTimersByTime(30);
  });
}
async function answer(item: ExerciseItem, wrong = false) {
  if (item.type === 'RHYTHM_TAP') {
    const rhythm = item;
    const before = mockPlay.mock.calls.length;
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Einzählen und aufnehmen' }));
      await Promise.resolve();
    });
    const start =
      required(mockPlay.mock.calls[before]?.[1].when) + (rhythmBeatCount(rhythm) * 60) / rhythm.bpm;
    expect(mockPlay.mock.calls.length - before).toBe(rhythmBeatCount(rhythm) * 2);
    expect(screen.getByTestId('rhythm-tap-pad')).toBeDisabled();
    for (const time of rhythmOnsets(rhythm)) {
      advance(start + time / 1000 + 0.05);
      fireEvent(screen.getByTestId('rhythm-tap-pad'), 'pressIn');
    }
    advance(start + rhythmMeasureMs(rhythm) / 1000 + 0.051);
  } else {
    fireEvent.press(
      screen.getByTestId(
        `answer-${wrong ? required(item.choices.find((id) => id !== expectedAnswer(item))) : expectedAnswer(item)}`,
      ),
    );
  }
  fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
}
describe('Einfache Takte im Lektionsspieler', () => {
  it.each([
    ['meter', 8],
    ['count-in', 10],
    ['read', 12],
  ] as const)(
    '%s speichert %s Antworten mit einem vollständigen Einzähltakt',
    async (name, newCount) => {
      renderRouter('./src/app', { initialUrl: `/lesson?id=rhythm.l1.simple-meter.${name}` });
      const session = intro(name);
      const count = session.initial.items.length;
      expect(lessonPlan(catalogue, session.lesson.id)?.newCount).toBe(newCount);
      for (const item of session.initial.items) {
        await answer(item);
        expect(screen.getByText('Richtig!')).toBeTruthy();
        fireEvent.press(screen.getByTestId('exercise-next'));
      }
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      });
      const saved = required(mockSave.mock.calls[0]?.[0]);
      expect(saved.session.lesson).toMatchObject({
        id: `rhythm.l1.simple-meter.${name}`,
        contentVersion: 8,
      });
      expect(saved.summary).toMatchObject({ answered: count, correct: count, skipped: 0 });
      expect(saved.session.initial.records.map((record) => record.result.answer)).toEqual(
        session.initial.items.map(expectedAnswer),
      );
    },
  );
  it('zeigt die Auftaktfrage, bewertet einen Fehler und stellt in der Wiederholung die Gegenantwort', async () => {
    renderRouter('./src/app', { initialUrl: '/lesson?id=rhythm.l1.simple-meter.count-in' });
    let session = intro('count-in');
    const wrongIndex = session.initial.items.findIndex(
      (item) => item.type === 'METER_IDENTIFY' && item.presentation === 'pickup',
    );
    expect(wrongIndex).toBeGreaterThanOrEqual(0);
    for (const [index, item] of session.initial.items.entries()) {
      const wrong = index === wrongIndex;
      if (item.type === 'METER_IDENTIFY' && item.presentation === 'pickup') {
        expect(screen.getByText(/Ist der erste notierte Takt/)).toBeTruthy();
        expect(screen.getByText('Auftakt erkennen')).toBeTruthy();
      }
      await answer(item, wrong);
      expect(screen.getByText(wrong ? 'Noch nicht ganz' : 'Richtig!')).toBeTruthy();
      const chosen = wrong
        ? required(item.choices.find((id) => id !== expectedAnswer(item)))
        : expectedAnswer(item);
      session = nextLessonExercise(answerLesson(session, chosen));
      fireEvent.press(screen.getByTestId('exercise-next'));
    }
    fireEvent.press(screen.getByRole('button', { name: 'Wiederholung starten' }));
    const review = required(session.review?.items[0]);
    expect(itemVariantKey(review)).not.toBe(
      itemVariantKey(required(session.initial.items[wrongIndex])),
    );
    expect(expectedAnswer(review)).not.toBe(
      expectedAnswer(required(session.initial.items[wrongIndex])),
    );
    await answer(review);
    fireEvent.press(screen.getByTestId('exercise-next'));
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
    expect(mockSave.mock.calls[0]?.[0].summary).toMatchObject({
      answered: session.initial.items.length,
      correct: session.initial.items.length - 1,
      reviewCorrect: 1,
      unresolved: 0,
    });
  });
});
