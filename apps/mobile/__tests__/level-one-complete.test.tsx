import { catalogue } from '@harmonia/content/authoring';
import { lessonPlan } from '@harmonia/content';
import {
  answerLesson,
  createLessonSession,
  expectedAnswer,
  nextLessonExercise,
  isAuralExercise,
  knowledgeFactId,
  orderedValues,
  orderValueId,
  listeningTimeline,
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
jest.setTimeout(20_000);
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Testwert fehlt');
  return value;
}

const units = [
  'aural.l1.pulse-rhythm',
  'aural.l1.pitch-intervals',
  'history.l1.sources',
  'history.l1.overview',
];
const lessons = catalogue.lessons.filter((l) => units.includes(l.unitId));
function intro(id: string) {
  const lesson = required(lessonPlan(catalogue, id));
  for (let i = 1; i < lesson.introduction.length; i++)
    fireEvent.press(screen.getByRole('button', { name: 'Nächste Einführungskarte' }));
  fireEvent.press(
    screen.getByRole('button', { name: `Mit ${String(lesson.exercises.length)} Aufgaben starten` }),
  );
  return createLessonSession(lesson, SEED);
}
async function answer(item: ExerciseItem, wrong = false) {
  const check = screen.getByRole('button', { name: 'Prüfen' });
  expect(check).toBeDisabled();
  if (item.type === 'MATCH') {
    const ids = item.facts.map(knowledgeFactId);
    for (const [i, id] of ids.entries()) {
      fireEvent.press(screen.getByTestId(`match-term-${String(i)}`));
      fireEvent.press(
        screen.getByTestId(`answer-${wrong ? required(ids[(i + 1) % ids.length]) : id}`),
      );
    }
  } else if (item.type === 'ORDER') {
    const ids = orderedValues(item).map(orderValueId);
    for (const id of wrong ? [...ids].reverse() : ids)
      fireEvent.press(screen.getByTestId(`order-option-${id}`));
  } else
    fireEvent.press(
      screen.getByTestId(
        `answer-${wrong ? required(item.choices.find((a) => a !== expectedAnswer(item))) : expectedAnswer(item)}`,
      ),
    );
  if (isAuralExercise(item)) {
    expect(check).toBeDisabled();
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Töne anhören' }));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Prüfen' })).not.toBeDisabled();
    });
  }
  fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
}
describe('Restliche Stufe 1 im App-Spieler', () => {
  it.each(lessons.map((l) => l.id))(
    '%s lässt sich vollständig beantworten und speichern',
    async (id) => {
      renderRouter('./src/app', { initialUrl: `/lesson?id=${id}` });
      const session = intro(id);
      for (const item of session.initial.items) {
        if (item.type === 'LISTENING_CHOICE')
          expect(screen.queryByTestId('listening-scores') !== null).toBe(
            item.question === 'rhythm-choice',
          );
        await answer(item);
        expect(screen.getByText('Richtig!')).toBeTruthy();
        if (item.type === 'LISTENING_CHOICE')
          expect(screen.getByTestId('listening-scores')).toBeTruthy();
        fireEvent.press(screen.getByTestId('exercise-next'));
      }
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      });
      const saved = required(mockSave.mock.calls[0]?.[0]);
      expect(saved.session.lesson).toMatchObject({ id, contentVersion: 11 });
      expect(saved.summary).toMatchObject({
        correct: session.initial.items.length,
        answered: session.initial.items.length,
        skipped: 0,
        reviewTotal: 0,
      });
    },
  );
  it('Hörpause speichert acht übersprungene Aufgaben und keine falschen Wertungen', async () => {
    const id = 'aural.l1.pulse-rhythm.pulse';
    renderRouter('./src/app', { initialUrl: `/lesson?id=${id}` });
    intro(id);
    fireEvent.press(screen.getByRole('button', { name: 'Gerade nicht hören' }));
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
    expect(required(mockSave.mock.calls[0]?.[0]).summary).toMatchObject({
      answered: 0,
      correct: 0,
      skipped: 8,
      accuracy: null,
      reviewTotal: 0,
    });
  });
  it('Klangauswahl spielt beide Rhythmusquellen mit ihrer Trennpause und stoppt alle eigenen Stimmen', async () => {
    const id = 'aural.l1.pulse-rhythm.compare';
    renderRouter('./src/app', { initialUrl: `/lesson?id=${id}` });
    const session = intro(id),
      item = required(session.initial.items[0]);
    if (item.type !== 'LISTENING_CHOICE') throw new Error('Hörfrage fehlt');
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Töne anhören' }));
      await Promise.resolve();
    });
    const plan = listeningTimeline(item);
    expect(mockPlay).toHaveBeenCalledTimes(plan.tones.length);
    for (const [i, tone] of plan.tones.entries())
      expect(mockPlay.mock.calls[i]).toEqual([
        tone.pitch,
        { when: 10.05 + tone.onsetSeconds, duration: tone.durationSeconds },
      ]);
    fireEvent.press(screen.getByRole('button', { name: 'Wiedergabe stoppen' }));
    expect(mockStops.every((s) => s.mock.calls.length === 1)).toBe(true);
  });
  it('Eine falsche Tonrichtung bekommt eine andere Antwort in der Wiederholung', async () => {
    const id = 'aural.l1.pitch-intervals.direction';
    renderRouter('./src/app', { initialUrl: `/lesson?id=${id}` });
    let session = intro(id);
    for (const [i, item] of session.initial.items.entries()) {
      await answer(item, i === 0);
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
    const review = required(session.review?.items[0]);
    expect(expectedAnswer(review)).not.toBe(expectedAnswer(required(session.initial.items[0])));
    await answer(review);
    fireEvent.press(screen.getByTestId('exercise-next'));
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
    expect(required(mockSave.mock.calls[0]?.[0]).summary).toMatchObject({
      correct: 7,
      answered: 8,
      reviewCorrect: 1,
      reviewTotal: 1,
      unresolved: 0,
    });
  });
});
