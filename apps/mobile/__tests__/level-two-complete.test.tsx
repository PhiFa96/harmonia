import { act as settleAct } from 'expo-router/testing-library';
import { catalogue } from '@harmonia/content/authoring';
import { lessonPlan } from '@harmonia/content';
import {
  createLessonSession,
  expectedAnswer,
  rhythmBeatCount,
  rhythmMeasureMs,
  rhythmOnsets,
  isAuralExercise,
  inputSlot,
  inputTarget,
  scalePitches,
  scaleAnswerId,
  scaleAnswerScore,
  scaleSlot,
  chordTargets,
  chordAnswerId,
  chordEditScore,
} from '@harmonia/exercises';
import type { ExerciseItem } from '@harmonia/exercises';
import { eventBounds, layoutScore, staffY, svgScene } from '@harmonia/notation';
import { INPUT_EXTENT } from '@harmonia/notation/native';
import type { Pitch, Score } from '@harmonia/notation';
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
    playChord: (pitches: readonly Pitch[], options: { when?: number; duration: number }) => {
      const when = options.when ?? mockNow;
      for (const pitch of pitches) mockPlay(pitch, { when, duration: options.duration });
      return { startTime: when, endTime: when + options.duration, stop: jest.fn() };
    },
    playInterval: () => ({
      startTime: mockNow,
      endTime: mockNow + 1.6,
      stop: jest.fn(),
    }),
    playPitch: (pitch: Pitch, options: { when: number; duration: number; velocity?: number }) => {
      mockPlay(pitch, options);
      const stop = jest.fn();
      mockStops.push(stop);
      return { startTime: options.when, endTime: options.when + options.duration, stop };
    },
  }),
}));
const SEED = 208208;
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
// Full lessons drive dozens of individual note edits through the router and renderer.
jest.setTimeout(60_000);
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Testwert fehlt');
  return value;
}
const lessons = catalogue.lessons.filter((l) => l.contentVersion === 13);
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
function tap(score: Score, clef: 'treble' | 'bass', measure: number, event: number, pitch: Pitch) {
  const layout = layoutScore(score),
    scene = svgScene(layout, { scale: 14, padding: 1, highlights: [], extent: INPUT_EXTENT });
  const bounds = required(
    eventBounds(layout).find((b) => b.measure === measure && b.event === event),
  );
  const { x, y } = scene.toPixels((bounds.x1 + bounds.x2) / 2, staffY(pitch, clef));
  const input = screen.getByTestId('score-input');
  fireEvent(input, 'responderGrant', { nativeEvent: { locationX: x, locationY: y, pageY: y } });
  fireEvent(input, 'responderRelease', { nativeEvent: { locationX: x, locationY: y, pageY: y } });
}
const names: Readonly<Record<number, string>> = {
  '-2': 'Doppel-b',
  '-1': 'b',
  0: 'Auflösungszeichen',
  1: 'Kreuz',
  2: 'Doppelkreuz',
};
function alter(pitch: Pitch) {
  fireEvent.press(screen.getByRole('radio', { name: required(names[pitch.alter]) }));
}
async function answer(item: ExerciseItem) {
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  if (item.type === 'KEY_FIND') {
    fireEvent.press(screen.getByTestId(`piano-key-${expectedAnswer(item).slice(4)}`));
  } else if (item.type === 'SCALE_BUILD') {
    const pitches: (Pitch | null)[] = [item.tonic, ...Array<null>(7).fill(null)];
    for (const [offset, pitch] of scalePitches(item).slice(1).entries()) {
      const index = offset + 1,
        slot = scaleSlot(index);
      tap(
        scaleAnswerScore(item, scaleAnswerId(pitches)),
        item.clef,
        slot.measure,
        slot.event,
        pitch,
      );
      alter(pitch);
      pitches[index] = pitch;
    }
  } else if (item.type === 'CHORD_BUILD') {
    const pitches: (Pitch | null)[] = [item.bass, null, null],
      targets = chordTargets(item);
    for (const index of [1, 2] as const) {
      const pitch = required(targets[index]);
      fireEvent.press(screen.getByTestId(`chord-tone-${String(index + 1)}`));
      tap(chordEditScore(item, chordAnswerId(pitches), index), item.clef, 1, 0, pitch);
      alter(pitch);
      pitches[index] = pitch;
    }
  } else if (item.type === 'NOTE_PLACE' || item.type === 'INTERVAL_BUILD') {
    const pitch = inputTarget(item),
      slot = inputSlot(item);
    tap(item.score, item.clef, slot.measure, slot.event, pitch);
    alter(pitch);
  } else if (item.type === 'RHYTHM_TAP') {
    const before = mockPlay.mock.calls.length;
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Einzählen und aufnehmen' }));
      await Promise.resolve();
    });
    const when = required(mockPlay.mock.calls[before]?.[1].when),
      start = when + (rhythmBeatCount(item) * 60) / item.bpm;
    for (const onset of rhythmOnsets(item)) {
      mockNow = start + onset / 1000 + 0.05;
      act(() => {
        jest.advanceTimersByTime(30);
      });
      fireEvent(screen.getByTestId('rhythm-tap-pad'), 'pressIn');
    }
    mockNow = start + rhythmMeasureMs(item) / 1000 + 0.051;
    act(() => {
      jest.advanceTimersByTime(30);
    });
  } else fireEvent.press(screen.getByTestId(`answer-${expectedAnswer(item)}`));
  if (isAuralExercise(item) && item.type !== 'RHYTHM_TAP')
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Töne anhören' }));
      await Promise.resolve();
    });
  fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
}
describe('Alle übrigen Stufe-2-Lektionen im App-Spieler', () => {
  it.each(lessons.map((l) => l.id))(
    '%s vollständig bedienen und als Version 13 speichern',
    async (id) => {
      renderRouter('./src/app', { initialUrl: `/lesson?id=${id}` });
      const session = await intro(id);
      for (const item of session.initial.items) {
        await answer(item);
        expect(screen.getByText('Richtig!')).toBeTruthy();
        fireEvent.press(screen.getByTestId('exercise-next'));
      }
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      });
      const saved = required(mockSave.mock.calls[0]?.[0]);
      expect(saved.session.lesson).toMatchObject({ id, contentVersion: 13 });
      expect(saved.summary).toMatchObject({
        correct: session.initial.items.length,
        answered: session.initial.items.length,
        reviewTotal: 0,
        skipped: 0,
      });
    },
  );
});
