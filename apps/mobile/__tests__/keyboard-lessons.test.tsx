import { act as settleAct } from 'expo-router/testing-library';
import { catalogue } from '@harmonia/content/authoring';
import { lessonPlan } from '@harmonia/content';
import type { ExerciseItem } from '@harmonia/exercises';
import { createLessonSession, expectedAnswer } from '@harmonia/exercises';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { AppState } from 'react-native';
import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';
import type { LessonAttempt, SavedLessonSummary } from '@/storage/lesson-repository';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));
const mockSave = jest.fn<Promise<void>, [LessonAttempt]>();
const mockLatest = jest.fn<Promise<SavedLessonSummary | null>, [string]>();
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
const SEED = 20727;
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
async function intro(name: string) {
  const content = required(lessonPlan(catalogue, `notation.l1.keyboard.${name}`));
  for (let index = 1; index < content.introduction.length; index++)
    fireEvent.press(screen.getByRole('button', { name: 'Nächste Einführungskarte' }));
  fireEvent.press(
    screen.getByRole('button', {
      name: `Mit ${String(content.exercises.length)} Aufgaben starten`,
    }),
  );
  await settleAct(async () => {
    await Promise.resolve();
  });
  return createLessonSession(content, SEED);
}
function answer(item: ExerciseItem) {
  const value = expectedAnswer(item);
  fireEvent.press(
    screen.getByTestId(
      item.type === 'KEY_FIND' ? `piano-key-${value.slice(4)}` : `answer-${value}`,
    ),
  );
  fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
  fireEvent.press(screen.getByTestId('exercise-next'));
}
describe('Klaviaturlektionen im vorhandenen Spieler', () => {
  it('zeigt die neue Einheit und öffnet ihre richtige Einführung mit stiller Klaviaturabbildung', async () => {
    renderRouter('./src/app', { initialUrl: '/' });
    fireEvent.press(screen.getByRole('button', { name: 'Die weißen Tasten finden öffnen' }));
    expect(screen.getByText('Einführung 1 von 3')).toBeTruthy();
    expect(screen.getByTestId('keyboard-example')).toHaveAccessibleName(/c¹, f¹/);
    expect(screen.getByText('Punkte markieren die Tasten des Notenbeispiels.')).toBeTruthy();
    expect(mockPlay).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(mockLatest).not.toHaveBeenCalled();
    });
    // Der erste Render lädt den gesamten Katalog (kalt ca. 30 s, auch auf main); das
    // globale Limit von 20 s greift nur bei CI-Last zufällig, daher hier ausdrücklich höher.
  }, 90_000);
  it.each([
    ['keys', 8],
    ['steps', 10],
    ['accidentals', 12],
  ] as const)(
    '%s speichert alle %s Aufgaben unter ihrer eigenen ID und Version 4',
    async (name, newCount) => {
      renderRouter('./src/app', { initialUrl: `/lesson?id=notation.l1.keyboard.${name}` });
      const state = await intro(name);
      const count = state.initial.items.length;
      expect(lessonPlan(catalogue, state.lesson.id)?.newCount).toBe(newCount);
      for (const item of state.initial.items) answer(item);
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      });
      expect(
        screen.getByText(`Im Erstversuch: ${String(count)} von ${String(count)} richtig.`),
      ).toBeTruthy();
      const attempt = required(mockSave.mock.calls[0])[0];
      expect(attempt.session.lesson).toMatchObject({
        id: `notation.l1.keyboard.${name}`,
        contentVersion: 4,
      });
      expect(attempt.summary).toMatchObject({ correct: count, answered: count, reviewTotal: 0 });
    },
  );
  it('fragt Namen ohne Notenbild oder Oktave und hält zwölf Tasten fest; Anpassen öffnet keinen größeren Tonbereich', async () => {
    renderRouter('./src/app', { initialUrl: '/lesson?id=notation.l1.keyboard.keys' });
    const state = await intro('keys');
    expect(screen.getByTestId('exercise-question')).not.toHaveTextContent(/[0-9¹²³⁴⁵]|Oktav/);
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    for (let number = 60; number <= 71; number++)
      expect(screen.getByTestId(`piano-key-${String(number)}`)).toBeTruthy();
    expect(screen.queryByTestId('piano-key-72')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Anpassen' }));
    expect(screen.getByText('Ausschnitt: c¹–h¹')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Tonumfang' })).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Schließen' }));
    answer(required(state.initial.items[0]));
    expect(screen.getByText('Aufgabe 2 von 8')).toBeTruthy();
  });
  it('wechselt zwischen Kreuz, Be und Auflösung; Notenbild, Klang und markierte Tasten verwenden das gewählte Beispiel', async () => {
    renderRouter('./src/app', { initialUrl: '/lesson?id=notation.l1.keyboard.accidentals' });
    fireEvent.press(screen.getByRole('button', { name: 'Gis–G: die Erhöhung auflösen' }));
    expect(screen.getByTestId('keyboard-example')).toHaveAccessibleName(/gis¹, g¹/);
    expect(mockPlay).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Klangbeispiel' }));
      await Promise.resolve();
    });
    expect(mockPlay).toHaveBeenCalledTimes(2);
    expect(mockPlay.mock.calls.map(([pitch]) => pitch)).toEqual([
      { letter: 'G', alter: 1, octave: 4 },
      { letter: 'G', alter: 0, octave: 4 },
    ]);
    fireEvent.press(screen.getByRole('button', { name: 'A–As: eine Taste nach links' }));
    expect(mockStop).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('keyboard-example')).toHaveAccessibleName(/a¹, as¹/);
  });
  it.each([
    ['en-US', 'C–C♯–D: two separate half steps'],
    ['en-GB', 'C–C♯–D: two separate semitones'],
  ] as const)(
    '%s verwendet die eigenen Fachbegriffe auch in Klaviaturbeschriftungen',
    (locale, caption) => {
      useSettings.setState({ locale });
      renderRouter('./src/app', { initialUrl: '/lesson?id=notation.l1.keyboard.steps' });
      expect(screen.getByText(caption)).toBeTruthy();
      expect(screen.getByTestId('keyboard-example')).toHaveAccessibleName(/C4, C♯4, D4/);
      expect(screen.queryByText(/\$t\(|content\.|glossary:/)).toBeNull();
    },
  );
});
