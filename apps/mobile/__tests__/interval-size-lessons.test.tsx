import { catalogue } from '@harmonia/content/authoring';
import { lessonPlan } from '@harmonia/content';
import {
  answerLesson,
  createLessonSession,
  expectedAnswer,
  nextLessonExercise,
  itemVariantKey,
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
    playPitch: (pitch: Pitch, options: { when: number; duration: number; velocity?: number }) => {
      mockPlay(pitch, options);
      const stop = jest.fn();
      mockStops.push(stop);
      return { startTime: options.when, endTime: options.when + options.duration, stop };
    },
  }),
}));
const SEED = 20918;
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
jest.setTimeout(20_000);
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Testwert fehlt');
  return value;
}

function intro(name: string) {
  const lesson = required(lessonPlan(catalogue, `intervals.l1.size.${name}`));
  for (let i = 1; i < lesson.introduction.length; i++)
    fireEvent.press(screen.getByRole('button', { name: 'Nächste Einführungskarte' }));
  fireEvent.press(
    screen.getByRole('button', { name: `Mit ${String(lesson.exercises.length)} Aufgaben starten` }),
  );
  return createLessonSession(lesson, SEED);
}
function answer(item: ExerciseItem, wrong = false) {
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  fireEvent.press(
    screen.getByTestId(
      `answer-${wrong ? required(item.choices.find((id) => id !== expectedAnswer(item))) : expectedAnswer(item)}`,
    ),
  );
  fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
}
describe('Intervallgrundlagen im Lektionsspieler', () => {
  it.each([
    ['numbers', 8],
    ['direction', 10],
    ['motion', 12],
  ] as const)('%s speichert %s echte visuelle Antworten in Version 9', async (name, newCount) => {
    renderRouter('./src/app', { initialUrl: `/lesson?id=intervals.l1.size.${name}` });
    const session = intro(name);
    const count = session.initial.items.length;
    expect(lessonPlan(catalogue, session.lesson.id)?.newCount).toBe(newCount);
    for (const item of session.initial.items) {
      expect(screen.queryByRole('button', { name: 'Gerade nicht hören' })).toBeNull();
      answer(item);
      expect(screen.getByText('Richtig!')).toBeTruthy();
      fireEvent.press(screen.getByTestId('exercise-next'));
    }
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
    const saved = required(mockSave.mock.calls[0]?.[0]);
    expect(saved.session.lesson).toMatchObject({
      id: `intervals.l1.size.${name}`,
      contentVersion: 9,
    });
    expect(saved.summary).toMatchObject({ answered: count, correct: count, skipped: 0 });
    expect(saved.session.initial.records.map((r) => r.result.answer)).toEqual(
      session.initial.items.map(expectedAnswer),
    );
    expect(mockPlay).not.toHaveBeenCalled();
  });
  it('wiederholt eine falsche Richtung mit einer anderen fachlichen Antwort', async () => {
    renderRouter('./src/app', { initialUrl: '/lesson?id=intervals.l1.size.direction' });
    let session = intro('direction');
    const plan = required(lessonPlan(catalogue, session.lesson.id));
    const wrongIndex = required(
      session.initial.items.map((_, i) => i).filter((i) => !plan.repetitionIndices.includes(i))[4],
    );
    for (const [index, item] of session.initial.items.entries()) {
      const wrong = index === wrongIndex;
      if (index === wrongIndex) expect(screen.getByText('Richtung lesen')).toBeTruthy();
      answer(item, wrong);
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
    answer(review);
    fireEvent.press(screen.getByTestId('exercise-next'));
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
    expect(mockSave.mock.calls[0]?.[0].summary).toMatchObject({
      correct: session.initial.items.length - 1,
      reviewCorrect: 1,
      unresolved: 0,
    });
  });
  it('spielt die zwei notierten Halben bei Viertel = 90 und stoppt sie beim Kartenwechsel', async () => {
    renderRouter('./src/app', { initialUrl: '/lesson?id=intervals.l1.size.numbers' });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Klangbeispiel' }));
      await Promise.resolve();
    });
    expect(mockPlay.mock.calls.map(([p]) => p.letter)).toEqual(['E', 'G']);
    expect(mockPlay.mock.calls[0]?.[1].when).toBeCloseTo(10.05, 8);
    expect(mockPlay.mock.calls[1]?.[1].when).toBeCloseTo(10.05 + 4 / 3, 8);
    expect(
      mockPlay.mock.calls.every(([, options]) => Math.abs(options.duration - 4 / 3) < 1e-8),
    ).toBe(true);
    fireEvent.press(screen.getByRole('button', { name: 'Nächste Einführungskarte' }));
    expect(mockStops.every((stop) => stop.mock.calls.length === 1)).toBe(true);
  });
});
