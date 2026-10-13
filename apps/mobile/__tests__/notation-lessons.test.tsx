import { learningPath } from '@harmonia/content';
import { useLearningState } from '@/state/learning';
import { catalogue } from '@harmonia/content/authoring';
import { resolveLesson } from '@harmonia/content';
import { createLessonSession, expectedAnswer } from '@harmonia/exercises';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { router as navigation } from 'expo-router';
import { within } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';
import type { LessonAttempt, SavedLessonSummary } from '@/storage/lesson-repository';
import { selectedLesson } from '@/content';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));
const mockSave = jest.fn<Promise<void>, [LessonAttempt]>();
const mockLatest = jest.fn<Promise<SavedLessonSummary | null>, [string]>();
jest.mock('@/storage/lessons', () => ({
  getLessonRepository: () => Promise.resolve({ save: mockSave, latest: mockLatest }),
}));
const mockPlay = jest.fn<unknown, unknown[]>();
const mockStop = jest.fn();
const mockResume = jest.fn<Promise<void>, []>();
jest.mock('@/audio', () => ({
  usePianoStatus: () => 'ready',
  getAudioEngine: () => ({
    context: { currentTime: 10 },
    resume: mockResume,
    playPitch: (...args: unknown[]) => {
      mockPlay(...args);
      return { startTime: 10.05, endTime: 12.8, stop: mockStop };
    },
  }),
}));
const SEED = 20707;
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
  mockResume.mockReset().mockResolvedValue(undefined);
});
afterEach(() => {
  clock.mockRestore();
});
jest.setTimeout(20_000);
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Testwert fehlt');
  return value;
}
function content(name: string) {
  return required(resolveLesson(catalogue, `notation.l1.staff.${name}`));
}
function intro(name: string) {
  const lesson = content(name);
  for (let index = 1; index < lesson.introduction.length; index++)
    fireEvent.press(screen.getByRole('button', { name: 'Nächste Einführungskarte' }));
  fireEvent.press(
    screen.getByRole('button', { name: `Mit ${String(lesson.exercises.length)} Aufgaben starten` }),
  );
  return createLessonSession(lesson, SEED);
}
function finish(name: string) {
  const session = intro(name);
  for (const item of session.initial.items) {
    fireEvent.press(screen.getByTestId(`answer-${expectedAnswer(item)}`));
    fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
    fireEvent.press(screen.getByTestId('exercise-next'));
  }
}
describe('Auswahl und Wiedergabe der Notationslektionen', () => {
  it('zeigt drei aufsteigende Umfänge und öffnet ausdrücklich die ausgewählte Lektion', async () => {
    renderRouter('./src/app', { initialUrl: '/' });
    const unit = within(screen.getByTestId('lesson-group-notation.l1.staff'));
    for (const count of [8, 10, 12])
      expect(unit.getByText(`${String(count)} Aufgaben`)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Linien und Zwischenräume öffnen' }));
    expect(screen.getByText('Einführung 1 von 2')).toBeTruthy();
    expect(screen.getByText('Töne auf den Linien')).toBeTruthy();
    expect(screen.queryByText('Fünf Linien, vier Zwischenräume')).toBeNull();
    expect(mockPlay).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(mockLatest).not.toHaveBeenCalled();
    });
  });
  it.each([
    ['anchor', 8],
    ['positions', 10],
    ['reading', 12],
  ] as const)(
    '%s: alle %s Aufgaben speichern ausschließlich die ausgewählte ID und Version',
    async (name, count) => {
      renderRouter('./src/app', { initialUrl: `/lesson?id=notation.l1.staff.${name}` });
      finish(name);
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      });
      expect(
        screen.getByText(`Im Erstversuch: ${String(count)} von ${String(count)} richtig.`),
      ).toBeTruthy();
      const attempt = required(mockSave.mock.calls[0])[0];
      expect(attempt.session.lesson).toMatchObject({
        id: `notation.l1.staff.${name}`,
        contentVersion: 3,
      });
      expect(attempt.summary).toMatchObject({ correct: count, answered: count, reviewTotal: 0 });
      expect(attempt.session.initial.records).toHaveLength(count);
    },
  );
  it('setzt bei einer geänderten Lektions-ID Aufgabe, Antwort und Einführung zurück', async () => {
    renderRouter('./src/app', { initialUrl: '/lesson?id=notation.l1.staff.anchor' });
    const state = intro('anchor'),
      first = required(state.initial.items[0]);
    fireEvent.press(screen.getByTestId(`answer-${expectedAnswer(first)}`));
    fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
    act(() => {
      navigation.setParams({ id: 'notation.l1.staff.positions' });
    });
    expect(screen.getByText('Einführung 1 von 2')).toBeTruthy();
    expect(screen.queryByText('Richtig!')).toBeNull();
    expect(screen.queryByText('Aufgabe 1 von 8')).toBeNull();
    expect(mockSave).not.toHaveBeenCalled();
    finish('positions');
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
    expect(required(mockSave.mock.calls[0])[0].session.lesson.id).toBe(
      'notation.l1.staff.positions',
    );
  });
  it('weist unbekannte, leere und doppelte IDs zurück, statt still die erste Lektion zu starten', () => {
    for (const id of [
      '',
      'unknown.lesson',
      ['notation.l1.staff.anchor', 'notation.l1.staff.positions'],
    ])
      expect(selectedLesson(id)).toBeUndefined();
    expect(selectedLesson(undefined)?.id).toBe('fundament.reading-and-listening.1');
    renderRouter('./src/app', { initialUrl: '/lesson?id=unknown.lesson' });
    expect(
      screen.getByText('Neue Lektionen werden vorbereitet. Du kannst schon frei üben.'),
    ).toBeTruthy();
    expect(screen.queryByText(/Einführung 1/)).toBeNull();
    expect(mockSave).not.toHaveBeenCalled();
    expect(mockLatest).not.toHaveBeenCalled();
  });
  it('spielt vier Nachbartöne vollständig; der Aufgabenstart stoppt nur die eigenen Stimmen', async () => {
    renderRouter('./src/app', { initialUrl: '/lesson?id=notation.l1.staff.anchor' });
    fireEvent.press(screen.getByRole('button', { name: 'Nächste Einführungskarte' }));
    fireEvent.press(screen.getByRole('button', { name: 'Nächste Einführungskarte' }));
    expect(mockPlay).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Klangbeispiel' }));
      await Promise.resolve();
    });
    expect(mockPlay).toHaveBeenCalledTimes(4);
    expect(mockPlay.mock.calls.map((call) => (call[0] as { letter: string }).letter)).toEqual([
      'F',
      'G',
      'A',
      'B',
    ]);
    fireEvent.press(screen.getByRole('button', { name: 'Mit 8 Aufgaben starten' }));
    expect(mockStop).toHaveBeenCalledTimes(4);
    expect(screen.getByText('Aufgabe 1 von 8')).toBeTruthy();
  });
  it('startet nach verspäteter Audio-Freigabe beim Kartenwechsel keinen Klang', async () => {
    let release: () => void = () => {
      throw new Error('Freigabe fehlt');
    };
    mockResume.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    renderRouter('./src/app', { initialUrl: '/lesson?id=notation.l1.staff.anchor' });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Klangbeispiel' }));
      await Promise.resolve();
    });
    fireEvent.press(screen.getByRole('button', { name: 'Nächste Einführungskarte' }));
    await act(async () => {
      release();
      await Promise.resolve();
    });
    expect(mockPlay).not.toHaveBeenCalled();
    expect(screen.getByText('G als Orientierung')).toBeTruthy();
  });
  it('ordnet bestandene Versuche dem eigenen Lernpfad zu und nutzt keine globale letzte Zusammenfassung', () => {
    const id = 'notation.l1.staff.anchor';
    const version = catalogue.lessons.find((l) => l.id === id)?.contentVersion ?? 1;
    useLearningState.setState({
      path: learningPath(catalogue, [
        { lessonId: id, contentVersion: version, passed: true, eligibleCorrect: 8, total: 8 },
      ]),
    });
    renderRouter('./src/app', { initialUrl: '/' });
    const unit = within(screen.getByTestId('lesson-group-notation.l1.staff'));
    expect(unit.getAllByText('Bestanden')).toHaveLength(1);
    expect(unit.getAllByText('1 von 3 Lektionen bestanden').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Linien und Zwischenräume öffnen' })).toBeEnabled();
    expect(mockLatest).not.toHaveBeenCalled();
  });
  it.each([
    ['en-US', 'A staff'],
    ['en-GB', 'A stave'],
  ] as const)('%s: eigene Einführung, Glossar und internationale Tonnamen', (locale, start) => {
    useSettings.setState({ locale });
    renderRouter('./src/app', { initialUrl: '/lesson?id=notation.l1.staff.anchor' });
    expect(screen.getByText('Introduction 1 of 3')).toBeTruthy();
    expect(screen.getByText(new RegExp(`^${start} has five lines`))).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Next introduction card' }));
    expect(screen.getByText(/natural notes are C, D, E, F, G, A, B/)).toBeTruthy();
    expect(screen.queryByText(/\$t\(|content\.|glossary:/)).toBeNull();
  });
});
