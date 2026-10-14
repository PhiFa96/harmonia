import { act as settleAct } from 'expo-router/testing-library';
import { catalogue } from '@harmonia/content/authoring';
import { lessonPlan } from '@harmonia/content';
import {
  answerLesson,
  createLessonSession,
  expectedAnswer,
  nextLessonExercise,
  knowledgeFactId,
  orderedValues,
  orderValueId,
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
const SEED = 20708;
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

async function intro(name: string) {
  const lesson = required(lessonPlan(catalogue, `rhythm.l1.values.${name}`));
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
  if (item.type === 'MATCH') {
    item.facts.forEach((fact, index) => {
      fireEvent.press(screen.getByTestId(`match-term-${String(index)}`));
      fireEvent.press(screen.getByTestId(`answer-${knowledgeFactId(fact)}`));
    });
  } else if (item.type === 'ORDER') {
    orderedValues(item).forEach((value) => {
      fireEvent.press(screen.getByTestId(`order-option-${orderValueId(value)}`));
    });
  } else
    fireEvent.press(
      screen.getByTestId(
        `answer-${wrong ? required(item.choices.find((v) => v !== expectedAnswer(item))) : expectedAnswer(item)}`,
      ),
    );
  fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
}
describe('Notenwerte und Pausen im Lektionsspieler', () => {
  it.each([
    ['notes', 8],
    ['rests', 10],
    ['fill', 12],
  ] as const)('%s speichert %s echte Antworten in Version 7', async (name, newCount) => {
    renderRouter('./src/app', { initialUrl: `/lesson?id=rhythm.l1.values.${name}` });
    const session = await intro(name);
    const count = session.initial.items.length;
    expect(lessonPlan(catalogue, session.lesson.id)?.newCount).toBe(newCount);
    for (const item of session.initial.items) {
      if (item.type === 'KNOWLEDGE_MC' && item.presentation)
        expect(screen.getByTestId(item.gap ? 'measure-gap' : 'duration-symbol')).toBeTruthy();
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
      id: `rhythm.l1.values.${name}`,
      contentVersion: 7,
    });
    expect(saved.summary).toMatchObject({ correct: count, answered: count, skipped: 0 });
    expect(saved.session.initial.records.map((r) => r.result.answer)).toEqual(
      session.initial.items.map(expectedAnswer),
    );
    expect(mockPlay).not.toHaveBeenCalled();
  });
  it('wiederholt eine falsch ergänzte Taktlücke mit neuer Quelle und getrennten Ergebnissen', async () => {
    renderRouter('./src/app', { initialUrl: '/lesson?id=rhythm.l1.values.fill' });
    let session = await intro('fill');
    for (const [index, item] of session.initial.items.entries()) {
      const wrong = index === 4;
      answer(item, wrong);
      expect(screen.getByText(wrong ? 'Noch nicht ganz' : 'Richtig!')).toBeTruthy();
      fireEvent.press(screen.getByTestId('exercise-next'));
      const value = wrong
        ? required(item.choices.find((v) => v !== expectedAnswer(item)))
        : expectedAnswer(item);
      session = nextLessonExercise(answerLesson(session, value));
    }
    fireEvent.press(screen.getByRole('button', { name: 'Wiederholung starten' }));
    const review = required(session.review?.items[0]);
    expect(itemVariantKey(review)).not.toBe(itemVariantKey(required(session.initial.items[4])));
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
    expect(screen.getByText('In der Wiederholung: 1 von 1 Aufgabe richtig.')).toBeTruthy();
  });
  it('spielt einen ganzen Takt Stille ohne erfundenen Ton und lässt sich stoppen', async () => {
    renderRouter('./src/app', { initialUrl: '/lesson?id=rhythm.l1.values.rests' });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Klangbeispiel' }));
      await Promise.resolve();
    });
    expect(mockPlay).not.toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: 'Wiedergabe stoppen' }));
    expect(screen.getByRole('button', { name: 'Klangbeispiel' })).toBeTruthy();
  });
});
