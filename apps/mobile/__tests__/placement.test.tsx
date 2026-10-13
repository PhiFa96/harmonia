import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import {
  expectedAnswer,
  currentPlacementTask,
  rhythmBeatCount,
  rhythmMeasureMs,
  rhythmOnsets,
} from '@harmonia/exercises';
import type { PlacementData } from '@/placement/model';
import { restorePlacement } from '@/placement/model';
import {
  bank,
  dispatchPlacement,
  selectPlacement,
  startPlacement,
  usePlacementState,
} from '@/state/placement';
import { useSettings } from '@/state/settings';
import { i18n } from '@/i18n';

const mockSave = jest.fn<Promise<void>, [PlacementData]>(() => Promise.resolve());
jest.mock('@/storage/device', () => ({
  getDeviceRepository: () =>
    Promise.resolve({ loadPlacement: () => Promise.resolve(null), savePlacement: mockSave }),
}));
const mockResume = jest.fn(() => Promise.resolve()),
  mockStop = jest.fn(),
  mockPlay = jest.fn();
let mockNow = 10;
jest.mock('@/audio', () => ({
  usePianoStatus: () => 'ready',
  getAudioEngine: () => ({
    context: {
      get currentTime() {
        return mockNow;
      },
      state: 'running',
    },
    latency: () => ({}),
    resume: mockResume,
    playPitch: (pitch: unknown, options: { when: number; duration: number }) => {
      mockPlay(pitch, options);
      return { startTime: options.when, endTime: options.when + options.duration, stop: mockStop };
    },
  }),
}));
beforeEach(() => {
  mockSave.mockClear();
  mockPlay.mockClear();
  mockNow = 10;
  useSettings.setState({ locale: 'de' });
  void i18n.changeLanguage('de');
});
function task() {
  const snapshot = usePlacementState.getState().data.active;
  if (!snapshot) throw new Error('Test fehlt');
  const current = currentPlacementTask(restorePlacement(bank, snapshot));
  if (!current) throw new Error('Aufgabe fehlt');
  return current;
}
function finishPerfect() {
  while (usePlacementState.getState().data.active) {
    const item = task().session.items[0];
    if (!item) throw new Error('Aufgabe fehlt');
    dispatchPlacement({ type: 'answer', answer: expectedAnswer(item) });
    dispatchPlacement({ type: 'next' });
  }
}
describe('Einstufung: echte Routen, Eingaben und Ergebnisse', () => {
  it('die Rhythmusaufnahme läuft trotz gespeicherter Eingaben weiter und bewertet einen vollständigen Take', async () => {
    startPlacement(1000000, '1000000:0.5');
    for (let i = 0; i < 5; i++) {
      const item = task().session.items[0];
      if (!item) throw new Error('Aufgabe fehlt');
      dispatchPlacement({ type: 'answer', answer: expectedAnswer(item) });
      dispatchPlacement({ type: 'next' });
    }
    const item = task().session.items[0];
    if (item?.type !== 'RHYTHM_TAP') throw new Error('Rhythmusaufgabe erwartet');
    renderRouter('./src/app', { initialUrl: '/placement' });
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Einzählen und aufnehmen' }));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(mockPlay).toHaveBeenCalledTimes(rhythmBeatCount(item) * 2);
    });
    const start = 10.35 + (rhythmBeatCount(item) * 60) / item.bpm;
    mockNow = start;
    await waitFor(() => {
      expect(screen.getByTestId('rhythm-tap-pad')).toBeEnabled();
    });
    for (const onset of rhythmOnsets(item)) {
      mockNow = start + onset / 1000;
      fireEvent(screen.getByTestId('rhythm-tap-pad'), 'pressIn');
    }
    mockNow = start + rhythmMeasureMs(item) / 1000 + 0.05;
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Prüfen' })).toBeEnabled();
    });
    fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
    expect(task().session.result).toMatchObject({ correct: true });
  });
  it('startet über den Lernbereich, prüft eine echte Taste, bewahrt Antwort und Sperre beim Wiederaufruf', async () => {
    const router = renderRouter('./src/app', { initialUrl: '/' });
    fireEvent.press(screen.getByRole('button', { name: 'Einstufung ansehen' }));
    expect(router.getPathname()).toBe('/placement');
    act(() => {
      startPlacement(1000, 'adaptive');
    });
    const item = task().session.items[0];
    if (item?.type !== 'KEY_FIND') throw new Error('Tastenaufgabe erwartet');
    const answer = expectedAnswer(item);
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    fireEvent.press(screen.getByTestId(`piano-key-${answer.slice(4)}`));
    fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
    expect(task().session.result?.correct).toBe(true);
    const saved = usePlacementState.getState().data.active;
    fireEvent.press(screen.getByRole('button', { name: 'Pausieren und zurück' }));
    expect(router.getPathname()).toBe('/');
    fireEvent.press(screen.getByRole('button', { name: 'Test fortsetzen' }));
    expect(screen.getByTestId('exercise-next')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Prüfen' })).toBeNull();
    expect(usePlacementState.getState().data.active).toEqual(saved);
    fireEvent.press(screen.getByTestId('exercise-next'));
    expect(task().tier).toBe(2);
    await waitFor(() => {
      expect(usePlacementState.getState().storage).toBe('saved');
    });
  });
  it('vorzeitiges Beenden zeigt vorläufige sieben Bereichsergebnisse, keine getesteten Einheiten', () => {
    renderRouter('./src/app', { initialUrl: '/placement' });
    fireEvent.press(screen.getByRole('button', { name: 'Test beginnen' }));
    fireEvent.press(screen.getByRole('button', { name: 'Test jetzt beenden' }));
    expect(screen.getByText('Vorläufiges Ergebnis')).toBeTruthy();
    expect(screen.getAllByText('Niveau noch nicht einschätzbar')).toHaveLength(7);
    expect(screen.queryByText(/Getestet ·/)).toBeNull();
    expect(
      screen.getByText('0 beantwortet · 0 selbstständig richtig · 0 mit Hilfe · 0 ausgelassen'),
    ).toBeTruthy();
  });
  it('vollständiges Ergebnis benennt Niveau und Startpunkte und öffnet eine tatsächlich verfügbare Lektion', () => {
    act(() => {
      startPlacement(1000, 'advanced');
      finishPerfect();
    });
    const router = renderRouter('./src/app', { initialUrl: '/placement' });
    expect(screen.getByText('Dein Einstieg')).toBeTruthy();
    expect(screen.getAllByText('Geschätztes Niveau: Stufe 2')).toHaveLength(7);
    expect(screen.getAllByText(/Getestet ·/).length).toBeGreaterThan(0);
    expect(screen.getByText('Empfohlener erster Schritt')).toBeTruthy();
    const start = screen.getAllByText('Hier weiterlernen')[0];
    if (!start) throw new Error('Startpunkt fehlt');
    fireEvent.press(start);
    expect(router.getPathname()).toBe('/lesson');
    expect(screen.getByText(/Einführung 1 von/)).toBeTruthy();
  });
  it('Wiederholung startet frisch, hält das letzte Ergebnis bis zum Abschluss und erscheint im Profil', () => {
    act(() => {
      startPlacement(1000, 'first');
      finishPerfect();
    });
    const previous = usePlacementState.getState().data.last;
    renderRouter('./src/app', { initialUrl: '/placement' });
    fireEvent.press(screen.getByRole('button', { name: 'Einstufungstest wiederholen' }));
    expect(task().tier).toBe(1);
    expect(task().session.result).toBeUndefined();
    expect(usePlacementState.getState().data.last).toEqual(previous);
    act(() => {
      dispatchPlacement({ type: 'finish' });
    });
    expect(usePlacementState.getState().data.last).not.toEqual(previous);
  });
  it('Sprachwechsel bewahrt den Test und Hinweise bleiben ausdrücklich Hilfe', () => {
    act(() => {
      startPlacement(1000, 'adaptive');
    });
    renderRouter('./src/app', { initialUrl: '/placement' });
    fireEvent.press(screen.getByRole('button', { name: 'Hinweis 1' }));
    const item = task().session.items[0];
    if (!item) throw new Error('Aufgabe fehlt');
    act(() => {
      selectPlacement(expectedAnswer(item));
    });
    fireEvent.press(screen.getByRole('button', { name: 'Prüfen' }));
    act(() => {
      useSettings.setState({ locale: 'en-GB' });
    });
    expect(task().session.hintLevel).toBe(1);
    expect(screen.getByTestId('exercise-next')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Finish test now' }));
    expect(
      screen.getByText('1 answered · 0 independently correct · 1 with help · 0 skipped'),
    ).toBeTruthy();
  });
  it('fremder Katalog wird nicht erneut bewertet; Neubeginn ist ausdrücklich möglich', () => {
    act(() => {
      startPlacement(1000, 'changed');
    });
    const data = usePlacementState.getState().data;
    if (!data.active) throw new Error('Test fehlt');
    usePlacementState.setState({
      data: { ...data, active: { ...data.active, bankKey: 'old-bank' } },
    });
    renderRouter('./src/app', { initialUrl: '/placement' });
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Prüfen' })).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Mit den aktuellen Aufgaben neu starten' }));
    expect(task().session.result).toBeUndefined();
  });
});
