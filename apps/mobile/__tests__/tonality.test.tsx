import { act as settleAct } from 'expo-router/testing-library';
import type { ExerciseItem, ScaleItem } from '@harmonia/exercises';
import {
  choiceLabel,
  currentItem,
  expectedAnswer,
  scaleAnswerId,
  scaleAnswerScore,
  scalePitches,
  scaleSlot,
  signatureAnswerNotes,
  signatureNoteLabel,
} from '@harmonia/exercises';
import type { Pitch, Score } from '@harmonia/notation';
import { eventBounds, layoutScore, staffY, svgScene } from '@harmonia/notation';
import { INPUT_EXTENT } from '@harmonia/notation/native';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';
import { createTonalitySession } from '@/exercises/practice';
import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));
const mockResume = jest.fn(() => Promise.resolve());
const mockPlay = jest.fn<undefined, [Pitch, { when: number; duration: number }]>(),
  mockStopAll = jest.fn();
const mockStops: jest.Mock[] = [];
let mockFailAt = 0;
jest.mock('@/audio', () => ({
  usePianoStatus: () => 'ready',
  getAudioEngine: () => ({
    context: { currentTime: 10 },
    resume: mockResume,
    stopAll: mockStopAll,
    playPitch: (pitch: Pitch, options: { when: number; duration: number }) => {
      mockPlay(pitch, options);
      if (mockFailAt && mockPlay.mock.calls.length === mockFailAt)
        throw new Error('Scheduling failed');
      const stop = jest.fn();
      mockStops.push(stop);
      return { startTime: options.when, endTime: options.when + options.duration, stop };
    },
  }),
}));
const SEED = 19019;
let clock: jest.SpyInstance;
beforeEach(() => {
  jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
  clock = jest.spyOn(Date, 'now').mockReturnValue(SEED);
  useSettings.setState({ locale: null });
  void i18n.changeLanguage('de');
  mockResume.mockReset().mockResolvedValue(undefined);
  mockPlay.mockClear();
  mockStopAll.mockClear();
  mockStops.length = 0;
  mockFailAt = 0;
});
afterEach(() => {
  clock.mockRestore();
});
async function start() {
  const router = renderRouter('./src/app', { initialUrl: '/practice' });
  fireEvent.press(screen.getByRole('button', { name: 'Tonleitern und Tonarten üben' }));
  await settleAct(async () => {
    await Promise.resolve();
  });
  return router;
}
function tap(item: ScaleItem, index: number, pitch: Pitch, score: Score) {
  const layout = layoutScore(score),
    scene = svgScene(layout, { scale: 14, padding: 1, highlights: [], extent: INPUT_EXTENT });
  const ref = scaleSlot(index),
    bounds = eventBounds(layout).find(
      (bounds) => bounds.measure === ref.measure && bounds.event === ref.event,
    );
  if (!bounds) throw new Error('Notenplatz fehlt');
  const { x, y } = scene.toPixels((bounds.x1 + bounds.x2) / 2, staffY(pitch, item.clef));
  const input = screen.getByTestId('score-input');
  fireEvent(input, 'responderGrant', { nativeEvent: { locationX: x, locationY: y, pageY: y } });
  fireEvent(input, 'responderRelease', { nativeEvent: { locationX: x, locationY: y, pageY: y } });
}
function fill(item: ScaleItem, wrongIndex = -1) {
  const pitches: (Pitch | null)[] = [item.tonic, ...Array<null>(7).fill(null)];
  const names: Readonly<Record<number, string>> = {
    '-2': 'Doppel-b',
    '-1': 'b',
    0: 'Auflösungszeichen',
    1: 'Kreuz',
    2: 'Doppelkreuz',
  };
  scalePitches(item)
    .slice(1)
    .forEach((target, offset) => {
      const index = offset + 1,
        pitch = index === wrongIndex ? item.tonic : target;
      tap(item, index, pitch, scaleAnswerScore(item, scaleAnswerId(pitches)));
      const accidental = names[pitch.alter];
      if (!accidental) throw new Error('Vorzeichenname fehlt');
      fireEvent.press(screen.getByRole('radio', { name: accidental }));
      pitches[index] = pitch;
      if (index < 7) expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    });
  return pitches;
}
function select(item: ExerciseItem) {
  const answer = expectedAnswer(item);
  if (item.type === 'SCALE_BUILD') fill(item);
  else if (item.type === 'KEYSIG_BUILD') {
    const notes = signatureAnswerNotes(answer);
    if (!notes) throw new Error('Vorzeichnung fehlt');
    if (!notes.length) fireEvent.press(screen.getByText('Keine Vorzeichen'));
    else {
      fireEvent.press(screen.getByRole('radio', { name: notes[0]?.alter === -1 ? 'b' : 'Kreuz' }));
      notes.forEach((note) => {
        fireEvent.press(
          screen.getByRole('button', { name: `${signatureNoteLabel(note, 'de')} hinzufügen` }),
        );
      });
    }
  } else fireEvent.press(screen.getByTestId(`answer-${answer}`));
}
function reachSignature() {
  const state = createTonalitySession(SEED);
  for (const item of state.items.slice(0, 3)) {
    select(item);
    fireEvent.press(screen.getByText('Prüfen'));
    fireEvent.press(screen.getByText('Weiter'));
  }
  const item = state.items[3];
  if (item?.type !== 'KEYSIG_BUILD') throw new Error('Vorzeichnung fehlt');
  return item;
}
describe('Tonleitern und Vorzeichnungen in der App', () => {
  it('zwölf Aufgaben lassen sich vollständig eingeben, erkennen und abschließen; nach dem Neustart ist die Antwort leer', async () => {
    await start();
    const state = createTonalitySession(SEED);
    state.items.forEach((item, index) => {
      expect(screen.getByText(`Aufgabe ${String(index + 1)} von 12`)).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
      expect(screen.queryByText('So sieht die Lösung aus')).toBeNull();
      select(item);
      fireEvent.press(screen.getByText('Prüfen'));
      expect(screen.getByText('Richtig!')).toBeTruthy();
      if (item.type.startsWith('KEYSIG'))
        expect(screen.queryByRole('button', { name: 'Noch einmal hören' })).toBeNull();
      fireEvent.press(screen.getByText(index === 11 ? 'Ergebnis ansehen' : 'Weiter'));
    });
    expect(screen.getByText('12 von 12 Antworten richtig.')).toBeTruthy();
    expect(screen.getByText('12 Antworten ohne Hinweis richtig.')).toBeTruthy();
    await settleAct(async () => {
      fireEvent.press(screen.getByText('Neuen Übungssatz starten'));
      await Promise.resolve();
    });
    expect(screen.getByText('Aufgabe 1 von 12')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  });

  it('vorgegebener Grundton bleibt fest; Löschen betrifft nur den ausgewählten Ton; Screenreader bedient alle sieben Plätze', async () => {
    await start();
    const item = currentItem(createTonalitySession(SEED));
    if (item?.type !== 'SCALE_BUILD') throw new Error('Tonleiter fehlt');
    tap(item, 0, scalePitches(item)[1] ?? item.tonic, item.score);
    expect(screen.getByText('0 von 7 Antworttönen gesetzt.')).toBeTruthy();
    const rests = screen.getAllByLabelText('Viertelpause');
    expect(rests).toHaveLength(7);
    const firstRest = rests[0];
    if (!firstRest) throw new Error('Erste Pause fehlt');
    fireEvent(firstRest, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(screen.getByText('1 von 7 Antworttönen gesetzt.')).toBeTruthy();
    fireEvent.press(screen.getByText('Löschen'));
    expect(screen.getByText('0 von 7 Antworttönen gesetzt.')).toBeTruthy();
    const pitches = fill(item, 3);
    fireEvent.press(screen.getByText('Prüfen'));
    expect(screen.getByRole('radio', { name: 'Ton 4, falsch' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Ton 3, richtig' })).toBeDisabled();
    expect(screen.queryByTestId('score-input')).toBeNull();
    expect(screen.getByText('So sieht die Lösung aus')).toBeTruthy();
    expect(pitches.filter(Boolean)).toHaveLength(8);
  });

  it('Vorzeichenfolge bleibt in eingegebener Reihenfolge erhalten, kann rückwärts gelöscht werden und sperrt nach dem Prüfen', async () => {
    await start();
    reachSignature();
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('Noch keine Vorzeichenfolge eingegeben.')).toBeTruthy();
    fireEvent.press(screen.getByText('Cis hinzufügen'));
    fireEvent.press(screen.getByText('Fis hinzufügen'));
    expect(screen.getByText('Deine Vorzeichenfolge: Cis → Fis')).toBeTruthy();
    fireEvent.press(screen.getByText('Letztes Vorzeichen entfernen'));
    expect(screen.getByText('Deine Vorzeichenfolge: Cis')).toBeTruthy();
    fireEvent.press(screen.getByText('Fis hinzufügen'));
    fireEvent.press(screen.getByText('Prüfen'));
    expect(screen.getByText('Noch nicht ganz')).toBeTruthy();
    expect(screen.getByText('Deine Vorzeichenfolge: Cis → Fis')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Fis hinzufügen' })).toBeDisabled();
    expect(screen.getByText('So sieht die Lösung aus')).toBeTruthy();
  });

  it('Hinweis 3 erklärt erst die vollständige Tonleiter und zählt die Antwort als unterstützt', async () => {
    await start();
    const item = currentItem(createTonalitySession(SEED));
    if (item?.type !== 'SCALE_BUILD') throw new Error('Tonleiter fehlt');
    fireEvent.press(screen.getByText('Hinweis 1'));
    fireEvent.press(screen.getByText('Hinweis 2'));
    expect(screen.queryByText('So sieht die Lösung aus')).toBeNull();
    fireEvent.press(screen.getByText('Lösung erklären'));
    expect(screen.getByText('So sieht die Lösung aus')).toBeTruthy();
    fill(item);
    fireEvent.press(screen.getByText('Prüfen'));
    expect(screen.getByText('Mit Hinweis beantwortet')).toBeTruthy();
  });

  it('Tonleiter-Wiedergabe bewahrt die Reihenfolge und stoppt bei Weiter nur ihre acht Stimmen', async () => {
    await start();
    const item = currentItem(createTonalitySession(SEED));
    if (item?.type !== 'SCALE_BUILD') throw new Error('Tonleiter fehlt');
    fill(item);
    fireEvent.press(screen.getByText('Prüfen'));
    await act(() => {
      fireEvent.press(screen.getByRole('button', { name: 'Noch einmal hören' }));
      return Promise.resolve();
    });
    expect(mockPlay.mock.calls.map((call) => call[0])).toEqual(scalePitches(item));
    expect(mockPlay.mock.calls.map((call) => call[1].when)).toEqual(
      Array.from({ length: 8 }, (_, index) => 10.05 + index * 0.5),
    );
    fireEvent.press(screen.getByText('Weiter'));
    mockStops.forEach((stop) => {
      expect(stop).toHaveBeenCalledTimes(1);
    });
    expect(mockStopAll).not.toHaveBeenCalled();
  });

  it('späte Audio-Freigabe startet nach dem Tabwechsel nichts; Hintergrund beendet laufende Tonleitern', async () => {
    let onState: ((state: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => {
      onState = callback;
      return { remove: jest.fn() };
    });
    let resume: (() => void) | undefined;
    mockResume.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resume = resolve;
        }),
    );
    await start();
    const item = currentItem(createTonalitySession(SEED));
    if (item?.type !== 'SCALE_BUILD') throw new Error('Tonleiter fehlt');
    fill(item);
    fireEvent.press(screen.getByText('Prüfen'));
    fireEvent.press(screen.getByRole('button', { name: 'Noch einmal hören' }));
    fireEvent.press(screen.getByText('Profil'));
    await act(() => {
      resume?.();
      return Promise.resolve();
    });
    expect(mockPlay).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Üben'));
    mockResume.mockResolvedValue(undefined);
    await act(() => {
      fireEvent.press(screen.getByRole('button', { name: 'Noch einmal hören' }));
      return Promise.resolve();
    });
    act(() => {
      onState?.('background');
    });
    expect(mockStops).toHaveLength(8);
    mockStops.forEach((stop) => {
      expect(stop).toHaveBeenCalledTimes(1);
    });
  });

  it('teilweise fehlgeschlagene Planung stoppt bereits geplante Töne und zeigt den Audiofehler', async () => {
    await start();
    const item = currentItem(createTonalitySession(SEED));
    if (item?.type !== 'SCALE_BUILD') throw new Error('Tonleiter fehlt');
    fill(item);
    fireEvent.press(screen.getByText('Prüfen'));
    mockFailAt = 4;
    await act(() => {
      fireEvent.press(screen.getByRole('button', { name: 'Noch einmal hören' }));
      return Promise.resolve();
    });
    expect(mockStops).toHaveLength(3);
    mockStops.forEach((stop) => {
      expect(stop).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText(/Der Klang konnte nicht gestartet werden/)).toBeTruthy();
    expect(mockStopAll).not.toHaveBeenCalled();
  });

  it('UK-Begriffe bleiben beim Tonleiter-Erkennen und in Hilfen korrekt übersetzt', async () => {
    useSettings.setState({ locale: 'en-GB' });
    renderRouter('./src/app', { initialUrl: '/practice' });
    await settleAct(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Practise scales and key signatures' }));
      await Promise.resolve();
    });
    expect(screen.getByText('Question 1 of 12')).toBeTruthy();
    fireEvent.press(screen.getByText('Hint 1'));
    fireEvent.press(screen.getByText('Hint 2'));
    expect(screen.getByText(/in semitones/)).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Note 2' })).toBeTruthy();
    const identify = createTonalitySession(SEED).items[1];
    if (!identify) throw new Error('Erkennungsaufgabe fehlt');
    expect(choiceLabel(identify, 'scale:major', 'en-GB')).toBe('major');
  });
});
