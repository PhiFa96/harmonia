import type { ChordItem } from '@harmonia/exercises';
import {
  chordAnswerId,
  chordEditScore,
  chordTargets,
  chordReferencePitch,
  currentItem,
  expectedAnswer,
  pitchInputLabel,
} from '@harmonia/exercises';
import type { Pitch, Score } from '@harmonia/notation';
import { eventBounds, layoutScore, staffY, svgScene } from '@harmonia/notation';
import { INPUT_EXTENT } from '@harmonia/notation/native';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';
import { createChordSession } from '@/exercises/practice';
import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));
const mockResume = jest.fn(() => Promise.resolve());
const mockPlay = jest.fn<undefined, [readonly Pitch[], { duration: number; when?: number }]>();
const mockReference = jest.fn<undefined, [Pitch, { duration: number; when: number }]>();
const mockStopAll = jest.fn();
const mockStops: jest.Mock[] = [];
let mockFail = false;
jest.mock('@/audio', () => ({
  usePianoStatus: () => 'ready',
  getAudioEngine: () => ({
    context: { currentTime: 10 },
    resume: mockResume,
    stopAll: mockStopAll,
    playPitch: (pitch: Pitch, options: { duration: number; when: number }) => {
      mockReference(pitch, options);
      const stop = jest.fn();
      mockStops.push(stop);
      return { startTime: options.when, endTime: options.when + options.duration, stop };
    },
    playChord: (pitches: readonly Pitch[], options: { duration: number; when?: number }) => {
      mockPlay(pitches, options);
      if (mockFail) throw new Error('Scheduling failed');
      const stop = jest.fn();
      mockStops.push(stop);
      return {
        startTime: options.when ?? 10,
        endTime: (options.when ?? 10) + options.duration,
        stop,
      };
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
  mockReference.mockClear();
  mockStopAll.mockClear();
  mockStops.length = 0;
  mockFail = false;
});
afterEach(() => {
  clock.mockRestore();
});
function required<T>(value: T | undefined | null): T {
  if (value == null) throw new Error('Testwert fehlt');
  return value;
}
function start() {
  const router = renderRouter('./src/app', { initialUrl: '/practice' });
  fireEvent.press(screen.getByRole('button', { name: 'Akkorde erkennen und schreiben' }));
  return router;
}
function firstBuild(): ChordItem {
  const item = currentItem(createChordSession(SEED));
  if (item?.type !== 'CHORD_BUILD') throw new Error('Akkord fehlt');
  return item;
}
function tap(item: ChordItem, pitch: Pitch, score: Score, measure = 1) {
  const layout = layoutScore(score),
    scene = svgScene(layout, { scale: 14, padding: 1, highlights: [], extent: INPUT_EXTENT });
  const bounds = required(
    eventBounds(layout).find((bounds) => bounds.measure === measure && bounds.event === 0),
  );
  const { x, y } = scene.toPixels((bounds.x1 + bounds.x2) / 2, staffY(pitch, item.clef));
  const input = screen.getByTestId('score-input');
  fireEvent(input, 'responderGrant', { nativeEvent: { locationX: x, locationY: y, pageY: y } });
  fireEvent(input, 'responderRelease', { nativeEvent: { locationX: x, locationY: y, pageY: y } });
}
function enter(item: ChordItem, pitches: (Pitch | null)[], index: 1 | 2, target: Pitch) {
  fireEvent.press(screen.getByTestId(`chord-tone-${String(index + 1)}`));
  tap(item, target, chordEditScore(item, chordAnswerId(pitches), index));
  const names: Readonly<Record<number, string>> = {
    '-2': 'Doppel-b',
    '-1': 'b',
    0: 'Auflösungszeichen',
    1: 'Kreuz',
    2: 'Doppelkreuz',
  };
  fireEvent.press(screen.getByRole('radio', { name: required(names[target.alter]) }));
  pitches[index] = target;
}
function fill(item: ChordItem, reverse = false, duplicate = false) {
  const targets = chordTargets(item),
    pitches: (Pitch | null)[] = [item.bass, null, null];
  enter(item, pitches, 1, required(targets[reverse ? 2 : 1]));
  expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  enter(item, pitches, 2, required(targets[duplicate || reverse ? 1 : 2]));
  return pitches;
}
function reachHearing() {
  const items = createChordSession(SEED).items;
  const build = required(items[0]);
  if (build.type !== 'CHORD_BUILD') throw new Error('Akkord fehlt');
  fill(build);
  fireEvent.press(screen.getByText('Prüfen'));
  fireEvent.press(screen.getByText('Weiter'));
  fireEvent.press(screen.getByTestId(`answer-${expectedAnswer(required(items[1]))}`));
  fireEvent.press(screen.getByText('Prüfen'));
  fireEvent.press(screen.getByText('Weiter'));
  return required(items[2]);
}
async function hear(label = 'Töne anhören') {
  await act(() => {
    fireEvent.press(screen.getByRole('button', { name: label }));
    return Promise.resolve();
  });
}
describe('Akkorde schreiben, sehen und hören in der App', () => {
  it('neun Aufgaben lassen sich vollständig abschließen; Hörfragen brauchen eine bewusste Wiedergabe und Neustart leert die Eingabe', async () => {
    start();
    expect(mockPlay).not.toHaveBeenCalled();
    const state = createChordSession(SEED);
    for (const [index, item] of state.items.entries()) {
      expect(screen.getByText(`Aufgabe ${String(index + 1)} von 9`)).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
      expect(screen.queryByText('So sieht die Lösung aus')).toBeNull();
      if (item.type === 'CHORD_BUILD') fill(item, index === 3);
      else {
        fireEvent.press(screen.getByTestId(`answer-${expectedAnswer(item)}`));
        if (item.type === 'CHORD_IDENTIFY' && item.presentation === 'aural') {
          expect(screen.queryByRole('img')).toBeNull();
          expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
          await hear();
          expect(mockReference).toHaveBeenLastCalledWith(chordReferencePitch(item), {
            when: 10.05,
            duration: 0.65,
          });
          expect(mockPlay).toHaveBeenLastCalledWith(chordTargets(item), {
            when: 10.05 + 0.9,
            duration: 1.2,
          });
          expect(screen.queryByRole('img')).toBeNull();
        }
      }
      fireEvent.press(screen.getByText('Prüfen'));
      expect(screen.getByText('Richtig!')).toBeTruthy();
      fireEvent.press(screen.getByText(index === 8 ? 'Ergebnis ansehen' : 'Weiter'));
    }
    expect(screen.getByText('9 von 9 Antworten richtig.')).toBeTruthy();
    expect(screen.getByText('9 Antworten ohne Hinweis richtig.')).toBeTruthy();
    expect(mockStops).toHaveLength(6);
    mockStops.forEach((stop) => {
      expect(stop).toHaveBeenCalledTimes(1);
    });
    expect(mockStopAll).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Neuen Übungssatz starten'));
    expect(screen.getByText('Aufgabe 1 von 9')).toBeTruthy();
    expect(screen.getByText('0 von 2 Antworttönen gesetzt.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  });

  it('Basston bleibt fest; Screenreader setzt Töne; Löschen betrifft nur den ausgewählten Platz', () => {
    start();
    const item = firstBuild(),
      pitches: (Pitch | null)[] = [item.bass, null, null];
    tap(item, required(chordTargets(item)[1]), chordEditScore(item, null, 1), 0);
    expect(screen.getByText('0 von 2 Antworttönen gesetzt.')).toBeTruthy();
    fireEvent(screen.getByLabelText('Ganze Pause'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(screen.getByText('1 von 2 Antworttönen gesetzt.')).toBeTruthy();
    fireEvent.press(screen.getByText('Löschen'));
    expect(screen.getByText('0 von 2 Antworttönen gesetzt.')).toBeTruthy();
    enter(item, pitches, 1, required(chordTargets(item)[1]));
    enter(item, pitches, 2, required(chordTargets(item)[2]));
    fireEvent.press(screen.getByText('Löschen'));
    expect(
      screen.getByRole('radio', { name: `Ton 2, ${pitchInputLabel(required(pitches[1]), 'de')}` }),
    ).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Ton 3, noch nicht gesetzt' })).toBeTruthy();
    expect(screen.getByText('1 von 2 Antworttönen gesetzt.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
  });

  it('doppelte Töne bleiben in der Antwort, erhalten einzelne Fehlermarkierungen und sperren nach Prüfen', () => {
    start();
    const item = firstBuild();
    fill(item, false, true);
    fireEvent.press(screen.getByText('Prüfen'));
    expect(screen.getByText('Noch nicht ganz')).toBeTruthy();
    const value = pitchInputLabel(required(chordTargets(item)[1]), 'de');
    expect(screen.getByRole('radio', { name: `Ton 2, ${value}, richtig` })).toBeDisabled();
    expect(screen.getByRole('radio', { name: `Ton 3, ${value}, falsch` })).toBeDisabled();
    expect(screen.queryByTestId('score-input')).toBeNull();
    expect(screen.getByText('So sieht die Lösung aus')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeDisabled();
  });

  it('Hinweis 3 zeigt den Lösungsklang als Noten und zählt Schreiben und ungehörte Erkennung als unterstützt', () => {
    start();
    fireEvent.press(screen.getByText('Hinweis 1'));
    fireEvent.press(screen.getByText('Hinweis 2'));
    expect(screen.queryByText('So sieht die Lösung aus')).toBeNull();
    fireEvent.press(screen.getByText('Lösung erklären'));
    expect(screen.getByText('So sieht die Lösung aus')).toBeTruthy();
    fill(firstBuild());
    fireEvent.press(screen.getByText('Prüfen'));
    expect(screen.getByText('Mit Hinweis beantwortet')).toBeTruthy();
    fireEvent.press(screen.getByText('Weiter'));
    const items = createChordSession(SEED).items;
    fireEvent.press(screen.getByTestId(`answer-${expectedAnswer(required(items[1]))}`));
    fireEvent.press(screen.getByText('Prüfen'));
    fireEvent.press(screen.getByText('Weiter'));
    const item = required(items[2]);
    fireEvent.press(screen.getByTestId(`answer-${expectedAnswer(item)}`));
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    fireEvent.press(screen.getByText('Hinweis 1'));
    fireEvent.press(screen.getByText('Hinweis 2'));
    expect(screen.queryByRole('img')).toBeNull();
    fireEvent.press(screen.getByText('Lösung erklären'));
    expect(screen.getByRole('img')).toBeTruthy();
    fireEvent.press(screen.getByText('Prüfen'));
    expect(screen.getByText('Mit Hinweis beantwortet')).toBeTruthy();
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('Hör-Pause überspringt alle drei Akkordhörfragen und beendet die sechs visuellen Aufgaben ohne Fehler', () => {
    start();
    reachHearing();
    fireEvent.press(screen.getByText('Gerade nicht hören'));
    for (const [index, item] of createChordSession(SEED).items.slice(3).entries()) {
      if (item.type === 'CHORD_IDENTIFY' && item.presentation === 'aural') continue;
      if (item.type === 'CHORD_BUILD') fill(item);
      else fireEvent.press(screen.getByTestId(`answer-${expectedAnswer(item)}`));
      fireEvent.press(screen.getByText('Prüfen'));
      fireEvent.press(screen.getByText(index === 4 ? 'Ergebnis ansehen' : 'Weiter'));
    }
    expect(screen.getByText('6 von 6 Antworten richtig.')).toBeTruthy();
    expect(screen.getByText('3 Hörfragen übersprungen; sie zählen nicht als Fehler.')).toBeTruthy();
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('späte Audio-Freigabe startet nach Hör-Pause nichts', async () => {
    start();
    reachHearing();
    let resume: (() => void) | undefined;
    mockResume.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resume = resolve;
        }),
    );
    fireEvent.press(screen.getByText('Töne anhören'));
    fireEvent.press(screen.getByText('Gerade nicht hören'));
    await act(() => {
      resume?.();
      return Promise.resolve();
    });
    expect(mockPlay).not.toHaveBeenCalled();
    expect(screen.getByText('Aufgabe 4 von 9')).toBeTruthy();
  });

  it('Tabwechsel verwirft späte Freigabe und Hintergrund stoppt nur die eigene laufende Akkordstimme', async () => {
    let onState: ((state: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => {
      onState = callback;
      return { remove: jest.fn() };
    });
    start();
    reachHearing();
    let resume: (() => void) | undefined;
    mockResume.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resume = resolve;
        }),
    );
    fireEvent.press(screen.getByText('Töne anhören'));
    fireEvent.press(screen.getByText('Profil'));
    await act(() => {
      resume?.();
      return Promise.resolve();
    });
    expect(mockPlay).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Üben'));
    mockResume.mockResolvedValue(undefined);
    await hear();
    act(() => {
      onState?.('background');
    });
    expect(mockStops).toHaveLength(2);
    mockStops.forEach((stop) => {
      expect(stop).toHaveBeenCalledTimes(1);
    });
    expect(mockStopAll).not.toHaveBeenCalled();
  });

  it('Audiofehler lässt Prüfen gesperrt und Hör-Pause weiterhin bedienbar', async () => {
    start();
    const item = reachHearing();
    fireEvent.press(screen.getByTestId(`answer-${expectedAnswer(item)}`));
    mockFail = true;
    await hear();
    expect(screen.getByText(/Der Klang konnte nicht gestartet werden/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    expect(mockStops).toHaveLength(1);
    expect(required(mockStops[0])).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByText('Gerade nicht hören'));
    expect(screen.getByText('Aufgabe 4 von 9')).toBeTruthy();
  });

  it.each([
    ['en-US', 'Recognize and write chords', 'measure'],
    ['en-GB', 'Recognise and write chords', 'bar'],
  ] as const)(
    'die Eingabe und ihre Hilfe verwenden vollständige Begriffe in %s',
    (locale, label, measure) => {
      useSettings.setState({ locale });
      renderRouter('./src/app', { initialUrl: '/practice' });
      fireEvent.press(screen.getByRole('button', { name: label }));
      expect(screen.getByText('Question 1 of 9')).toBeTruthy();
      expect(screen.getByRole('radio', { name: 'Note 2, not placed yet' })).toBeTruthy();
      expect(screen.getByText(new RegExp(`right ${measure}`))).toBeTruthy();
      fireEvent.press(screen.getByText('Hint 1'));
      fireEvent.press(screen.getByText('Hint 2'));
      expect(screen.queryByText(/exercise\.|glossary:|\{\{|\$t\(/)).toBeNull();
    },
  );
});
