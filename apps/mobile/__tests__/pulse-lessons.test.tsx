import { catalogue } from '@harmonia/content/authoring';
import { resolveLesson } from '@harmonia/content';
import {
  answerLesson,
  createLessonSession,
  expectedAnswer,
  nextLessonExercise,
  rhythmBeatCount,
  rhythmMeasureMs,
  rhythmOnsets,
} from '@harmonia/exercises';
import type { ExerciseItem, RhythmItem } from '@harmonia/exercises';
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
const SEED = 20767;
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
  const lesson = required(resolveLesson(catalogue, `rhythm.l1.pulse.${name}`));
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
async function take(item: RhythmItem, extra = false) {
  const before = mockPlay.mock.calls.length;
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Einzählen und aufnehmen' }));
    await Promise.resolve();
  });
  const when = required(mockPlay.mock.calls[before]?.[1].when),
    start = when + (rhythmBeatCount(item) * 60) / item.bpm;
  expect(mockPlay.mock.calls.length - before).toBe(rhythmBeatCount(item) * 2);
  expect(screen.getByTestId('rhythm-tap-pad')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  for (const time of rhythmOnsets(item)) {
    advance(start + time / 1000 + 0.05);
    fireEvent(screen.getByTestId('rhythm-tap-pad'), 'pressIn');
    if (extra && time === 0) fireEvent(screen.getByTestId('rhythm-tap-pad'), 'pressIn');
  }
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  advance(start + rhythmMeasureMs(item) / 1000 + 0.051);
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeEnabled();
}
async function answer(item: ExerciseItem, extra = false) {
  if (item.type === 'RHYTHM_TAP') {
    expect(screen.getByTestId('pulse-example')).toHaveAccessibleName(
      new RegExp(`${String(rhythmBeatCount(item))} gleichmäßige`),
    );
    expect(screen.queryByTestId('lesson-example-scroll')).toBeNull();
    await take(item, extra);
  } else fireEvent.press(screen.getByTestId(`answer-${expectedAnswer(item)}`));
  fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
}
describe('Pulslektionen mit Audio-Uhr im Spieler', () => {
  it('öffnet die neue Einheit ohne Klang oder Notenbild', async () => {
    renderRouter('./src/app', { initialUrl: '/' });
    fireEvent.press(screen.getByRole('button', { name: 'Einen gleichmäßigen Puls halten öffnen' }));
    expect(screen.getByTestId('pulse-example')).toHaveAccessibleName(
      /4 gleichmäßige Zählpositionen bei 72/,
    );
    expect(screen.queryByTestId('lesson-example-scroll')).toBeNull();
    expect(mockPlay).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(mockLatest).toHaveBeenCalledTimes(catalogue.lessons.length);
    });
  });
  it.each([
    ['steady', 8],
    ['tempo', 10],
    ['groups', 12],
  ] as const)(
    '%s speichert %s echte Antworten und Rohzeiten mit Version 6',
    async (name, count) => {
      renderRouter('./src/app', { initialUrl: `/lesson?id=rhythm.l1.pulse.${name}` });
      const session = intro(name);
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
        id: `rhythm.l1.pulse.${name}`,
        contentVersion: 6,
      });
      expect(saved.summary).toMatchObject({ answered: count, correct: count });
      expect(saved.session.initial.records.map((record) => record.result.answer)).toEqual(
        session.initial.items.map(expectedAnswer),
      );
      expect(
        saved.session.initial.items
          .filter((item) => item.type === 'RHYTHM_TAP')
          .every((item) => item.type === 'RHYTHM_TAP' && item.presentation === 'pulse'),
      ).toBe(true);
    },
  );
  it('wertet einen zusätzlichen Anschlag falsch und speichert die andere Gruppengröße in der Wiederholung', async () => {
    renderRouter('./src/app', { initialUrl: '/lesson?id=rhythm.l1.pulse.steady' });
    let session = intro('steady');
    for (const [index, item] of session.initial.items.entries()) {
      const extra = index === 4;
      await answer(item, extra);
      expect(screen.getByText(extra ? 'Noch nicht ganz' : 'Richtig!')).toBeTruthy();
      const times = item.type === 'RHYTHM_TAP' ? rhythmOnsets(item) : [];
      const value = extra ? `taps:0,${times.join(',')}` : expectedAnswer(item);
      session = nextLessonExercise(answerLesson(session, value));
      fireEvent.press(screen.getByTestId('exercise-next'));
    }
    fireEvent.press(screen.getByRole('button', { name: 'Wiederholung starten' }));
    const review = required(session.review?.items[0]),
      original = required(session.initial.items[4]);
    if (review.type !== 'RHYTHM_TAP' || original.type !== 'RHYTHM_TAP')
      throw new Error('Puls fehlt');
    expect(rhythmBeatCount(review)).not.toBe(rhythmBeatCount(original));
    await answer(review);
    fireEvent.press(screen.getByTestId('exercise-next'));
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
    expect(mockSave.mock.calls[0]?.[0].summary).toMatchObject({
      correct: 7,
      reviewCorrect: 1,
      unresolved: 0,
    });
    expect(screen.getByText('In der Wiederholung: 1 von 1 Aufgabe richtig.')).toBeTruthy();
  });
  it('überspringt alle Tippaufgaben ohne Hörmöglichkeit und wertet nur die Begriffsfragen', async () => {
    renderRouter('./src/app', { initialUrl: '/lesson?id=rhythm.l1.pulse.tempo' });
    const session = intro('tempo');
    for (const item of session.initial.items.filter((item) => item.type === 'KNOWLEDGE_MC')) {
      await answer(item);
      fireEvent.press(screen.getByTestId('exercise-next'));
    }
    fireEvent.press(screen.getByRole('button', { name: 'Gerade nicht hören' }));
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
    expect(mockSave.mock.calls[0]?.[0].summary).toMatchObject({
      answered: 4,
      correct: 4,
      skipped: 6,
    });
    expect(mockPlay).not.toHaveBeenCalled();
  });
  it('spielt genau zwei Gruppen mit richtigem Abstand und stoppt alle eigenen Klicks beim Wechsel', async () => {
    renderRouter('./src/app', { initialUrl: '/lesson?id=rhythm.l1.pulse.tempo' });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Klangbeispiel' }));
      await Promise.resolve();
    });
    expect(mockPlay.mock.calls.map(([, options]) => options.when)).toEqual([
      10.35, 11.35, 12.35, 13.35, 14.35, 15.35, 16.35, 17.35,
    ]);
    expect(mockPlay.mock.calls.map(([pitch]) => pitch.letter)).toEqual([
      'C',
      'G',
      'G',
      'G',
      'C',
      'G',
      'G',
      'G',
    ]);
    fireEvent.press(
      screen.getByRole('button', { name: '120 BPM: eine halbe Sekunde zwischen Klicks' }),
    );
    expect(mockStops.every((stop) => stop.mock.calls.length === 1)).toBe(true);
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Klangbeispiel' }));
      await Promise.resolve();
    });
    expect(mockPlay.mock.calls.slice(8).map(([, options]) => options.when)).toEqual([
      10.35, 10.85, 11.35, 11.85, 12.35, 12.85, 13.35, 13.85,
    ]);
  });
  it.each(['en-US', 'en-GB'] as const)(
    '%s erklärt Tempo mit Beats statt einem unbekannten Notenwert',
    (locale) => {
      useSettings.setState({ locale });
      renderRouter('./src/app', { initialUrl: '/lesson?id=rhythm.l1.pulse.tempo' });
      expect(screen.getByText('Sound example: 60 beats per minute, two beat groups.')).toBeTruthy();
      expect(screen.getByTestId('pulse-example')).toHaveAccessibleName(
        /4 evenly spaced counting positions at 60/,
      );
      expect(screen.queryByText(/quarter notes|crotchets|\$t\(|glossary:|content\./)).toBeNull();
    },
  );
});
