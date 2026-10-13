import { waitFor } from '@testing-library/react-native';
import {
  bank,
  dispatchPlacement,
  initializePlacement,
  retryPlacementSave,
  selectPlacement,
  startPlacement,
  startTemporaryPlacement,
  usePlacementState,
} from '@/state/placement';
import { currentPlacementTask, expectedAnswer } from '@harmonia/exercises';
import { EMPTY_PLACEMENT, restorePlacement } from '@/placement/model';
import type { PlacementData } from '@/placement/model';
import { useDeviceState } from '@/state/device';

const mockLoad = jest.fn<Promise<PlacementData | null>, []>(),
  mockSave = jest.fn<Promise<void>, [PlacementData]>(() => Promise.resolve());
jest.mock('@/storage/device', () => ({
  getDeviceRepository: () => Promise.resolve({ loadPlacement: mockLoad, savePlacement: mockSave }),
}));
beforeEach(() => {
  mockSave.mockReset().mockResolvedValue(undefined);
  mockLoad.mockReset();
});
it('Ladefehler überschreibt nichts; der erneute Ladeversuch übernimmt den bestehenden Verlauf', async () => {
  startPlacement(1000, 'resume');
  await waitFor(() => {
    expect(usePlacementState.getState().storage).toBe('saved');
  });
  const stored = usePlacementState.getState().data;
  mockSave.mockClear();
  usePlacementState.setState({ phase: 'loading', data: EMPTY_PLACEMENT });
  mockLoad.mockRejectedValueOnce(new Error('disk'));
  await initializePlacement();
  expect(usePlacementState.getState().phase).toBe('error');
  await expect(retryPlacementSave()).rejects.toThrow();
  startPlacement(2000, 'must-not-overwrite');
  expect(mockSave).not.toHaveBeenCalled();
  mockLoad.mockResolvedValueOnce(stored);
  await initializePlacement();
  expect(usePlacementState.getState()).toMatchObject({
    phase: 'ready',
    data: stored,
    storage: 'saved',
  });
  expect(mockSave).not.toHaveBeenCalled();
});
it('schreibt Übergänge geordnet; ein später Fehler bleibt sichtbar und kann ohne Datenverlust wiederholt werden', async () => {
  startPlacement(1000, 'queue');
  selectPlacement('key:60');
  dispatchPlacement({ type: 'hint' });
  await waitFor(() => {
    expect(usePlacementState.getState().storage).toBe('saved');
  });
  expect(mockSave.mock.calls.map(([data]) => data.active?.actions.length)).toEqual([0, 0, 1]);
  mockSave.mockRejectedValueOnce(new Error('disk'));
  selectPlacement('key:61');
  await waitFor(() => {
    expect(usePlacementState.getState().storage).toBe('error');
  });
  const pending = usePlacementState.getState().data;
  await retryPlacementSave();
  expect(usePlacementState.getState().data).toEqual(pending);
  expect(usePlacementState.getState().storage).toBe('saved');
});
it('eine ältere langsame Speicherung darf den Status eines neueren Writes nicht zurücksetzen', async () => {
  let release: (() => void) | undefined;
  mockSave.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  startPlacement(1000, 'ordered');
  await waitFor(() => {
    expect(release).toBeDefined();
  });
  selectPlacement('key:60');
  expect(usePlacementState.getState().storage).toBe('saving');
  if (!release) throw new Error('Write fehlt');
  release();
  await waitFor(() => {
    expect(usePlacementState.getState().storage).toBe('saved');
  });
  expect(mockSave.mock.calls[1]?.[0].active?.answer).toBe('key:60');
});
it('sperrt geprüfte Antworten; Wiederholungen behalten das vorherige Ergebnis bis zum nächsten Abschluss', async () => {
  startPlacement(1000, 'lock');
  const snapshot = usePlacementState.getState().data.active;
  if (!snapshot) throw new Error('Test fehlt');
  const item = currentPlacementTask(restorePlacement(bank, snapshot))?.session.items[0];
  if (!item) throw new Error('Aufgabe fehlt');
  const answer = expectedAnswer(item);
  dispatchPlacement({ type: 'answer', answer });
  selectPlacement('key:60');
  dispatchPlacement({ type: 'answer', answer: 'invalid' });
  expect(usePlacementState.getState().data.active?.answer).toBe(answer);
  dispatchPlacement({ type: 'finish' }, 2000);
  const last = usePlacementState.getState().data.last;
  startPlacement(3000, 'retake');
  expect(usePlacementState.getState().data.last).toEqual(last);
  await waitFor(() => {
    expect(usePlacementState.getState().storage).toBe('saved');
  });
});
it('Gast im temporären Modus speichert auch Tests nicht auf dem Gerät', () => {
  useDeviceState.setState({ storage: 'memory' });
  startPlacement(1000, 'temporary');
  selectPlacement('key:60');
  dispatchPlacement({ type: 'finish' }, 2000);
  expect(usePlacementState.getState().storage).toBe('memory');
  expect(mockSave).not.toHaveBeenCalled();
});
it('ein ausdrücklich temporärer Test nach Ladefehler überschreibt keine defekten gespeicherten Tests', () => {
  usePlacementState.setState({ phase: 'error', storage: 'error' });
  startTemporaryPlacement();
  startPlacement(1000, 'temporary-test');
  selectPlacement('key:60');
  dispatchPlacement({ type: 'finish' }, 2000);
  expect(useDeviceState.getState().storage).toBe('saved');
  expect(usePlacementState.getState().storage).toBe('memory');
  expect(mockSave).not.toHaveBeenCalled();
});
