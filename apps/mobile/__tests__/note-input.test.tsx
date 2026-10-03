import type { Score } from '@harmonia/notation';
import { eventBounds, layoutScore, parseScore, staffY, svgScene } from '@harmonia/notation';
import { INPUT_EXTENT } from '@harmonia/notation/native';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { i18n } from '@/i18n';
import { useSettings } from '@/state/settings';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', regionCode: 'DE' }],
}));

// Gleiche Einstellungen wie im Übungs-Bildschirm
const STAFF_SPACE = 14;
const start = parseScore('treble | 4/4 | C4/1 | r/1');

/** Pixel im Notenbild für eine Tonhöhe im zweiten Takt. */
function pointFor(score: Score, pitch: Parameters<typeof staffY>[0]) {
  const layout = layoutScore(score);
  const scene = svgScene(layout, {
    scale: STAFF_SPACE,
    padding: 1,
    highlights: [],
    extent: INPUT_EXTENT,
  });
  const slot = eventBounds(layout).find((b) => b.measure === 1);
  if (!slot) {
    throw new Error('zweiter Takt fehlt');
  }
  return scene.toPixels((slot.x1 + slot.x2) / 2, staffY(pitch, 'treble'));
}

function tap(x: number, y: number): void {
  const input = screen.getByTestId('score-input');
  fireEvent(input, 'responderGrant', { nativeEvent: { locationX: x, locationY: y, pageY: y } });
  fireEvent(input, 'responderRelease', { nativeEvent: { locationX: x, locationY: y, pageY: y } });
}

const E4 = { letter: 'E', alter: 0, octave: 4 } as const;

beforeEach(() => {
  useSettings.setState({ locale: null });
  void i18n.changeLanguage('de');
});

describe('Intervall eingeben', () => {
  it('Tippen setzt die Note, Prüfen bewertet mit Farbe, Symbol und Text', () => {
    renderRouter('./src/app', { initialUrl: '/practice' });
    expect(screen.getByText('Noch keine Note gesetzt.')).toBeTruthy();
    const { x, y } = pointFor(start, E4);
    tap(x, y);
    expect(screen.getByText('Gesetzt: Ganze Note, eingestrichenes e')).toBeTruthy();
    expect(screen.getByLabelText('Ganze Note, eingestrichenes e, ausgewählt')).toBeTruthy();
    fireEvent.press(screen.getByText('Prüfen'));
    expect(screen.getByText('Richtig, das ist die große Terz.')).toBeTruthy();
    expect(screen.getByLabelText('Ganze Note, eingestrichenes e, richtig')).toBeTruthy();
  });

  it('Vorzeichen-Leiste ändert die Note; falsche Antwort wird markiert', () => {
    renderRouter('./src/app', { initialUrl: '/practice' });
    const { x, y } = pointFor(start, E4);
    tap(x, y);
    fireEvent.press(screen.getByLabelText('b'));
    expect(screen.getByText('Gesetzt: Ganze Note, eingestrichenes es')).toBeTruthy();
    fireEvent.press(screen.getByText('Prüfen'));
    expect(screen.getByText('Noch nicht richtig. Versuch es noch einmal.')).toBeTruthy();
    expect(screen.getByLabelText('Ganze Note, eingestrichenes es, falsch')).toBeTruthy();
  });

  it('Ziehen verschiebt die Note schrittweise (relativ zum Startpunkt)', () => {
    renderRouter('./src/app', { initialUrl: '/practice' });
    const { x, y } = pointFor(start, E4);
    tap(x, y);
    const input = screen.getByTestId('score-input');
    // Gegriffen wird dort, wo vorher die Pause stand (die ganze Note steht jetzt am Taktanfang)
    fireEvent(input, 'responderGrant', { nativeEvent: { locationX: x, locationY: y, pageY: 500 } });
    // Eine Notenlinie nach oben = zwei Schritte: e¹ → g¹
    fireEvent(input, 'responderMove', { nativeEvent: { pageY: 500 - STAFF_SPACE } });
    expect(screen.getByText('Gesetzt: Ganze Note, eingestrichenes g')).toBeTruthy();
    fireEvent(input, 'responderMove', { nativeEvent: { pageY: 500 + STAFF_SPACE / 2 } });
    expect(screen.getByText('Gesetzt: Ganze Note, eingestrichenes d')).toBeTruthy();
    fireEvent(input, 'responderRelease', { nativeEvent: { pageY: 500 + STAFF_SPACE / 2 } });
    expect(screen.getByText('Gesetzt: Ganze Note, eingestrichenes d')).toBeTruthy();
  });

  it('Screenreader: ohne gesetzte Note startet das Verstellen beim vorgegebenen c¹', () => {
    renderRouter('./src/app', { initialUrl: '/practice' });
    const slot = screen.getByLabelText('Ganze Pause');
    expect(slot.props['accessibilityRole']).toBe('adjustable');
    fireEvent(slot, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(screen.getByText('Gesetzt: Ganze Note, eingestrichenes d')).toBeTruthy();
  });

  it('Screenreader: Note als anpassbares Element höher und tiefer stellen', () => {
    renderRouter('./src/app', { initialUrl: '/practice' });
    const { x, y } = pointFor(start, E4);
    tap(x, y);
    const note = screen.getByLabelText('Ganze Note, eingestrichenes e, ausgewählt');
    expect(note.props['accessibilityRole']).toBe('adjustable');
    fireEvent(note, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(screen.getByText('Gesetzt: Ganze Note, eingestrichenes f')).toBeTruthy();
  });

  it('Löschen entfernt die Note; Tippen in den ersten Takt ändert nichts', () => {
    renderRouter('./src/app', { initialUrl: '/practice' });
    const { x, y } = pointFor(start, E4);
    tap(x, y);
    fireEvent.press(screen.getByText('Löschen'));
    expect(screen.getByText('Noch keine Note gesetzt.')).toBeTruthy();
    tap(40, y);
    expect(screen.getByText('Noch keine Note gesetzt.')).toBeTruthy();
  });
});
