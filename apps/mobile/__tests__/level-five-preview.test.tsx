import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createLevelFivePreview } from '@harmonia/content';
import { catalogue } from '@harmonia/content/authoring';
import { useLevelFivePreview } from '@/preview/use-level-five-preview';
import { readPreviewMemory, comparePreviewMemory, erasePreviewMemory } from '@/preview/memory';

const mockValues = new Map<string, string>();
const mockRead = jest.fn((scope: string) => Promise.resolve(mockValues.get(scope) ?? null));
const mockCompare = jest.fn((scope: string, expected: string | null, next: string | null) => {
  if ((mockValues.get(scope) ?? null) !== expected) return Promise.resolve(false);
  if (next === null) mockValues.delete(scope);
  else mockValues.set(scope, next);
  return Promise.resolve(true);
});
jest.mock('@/preview/storage', () => ({
  previewStore: (scope: string) => ({
    read: () => mockRead(scope),
    compare: (expected: string | null, next: string | null) => mockCompare(scope, expected, next),
  }),
}));
const id = 'counterpoint.l5.species.lesson3';
beforeEach(() => {
  mockValues.clear();
  mockRead.mockClear();
  mockCompare.mockClear();
});

it('speichert vor Anzeige, setzt nach Neuladen fort und behält Einführungsposition', async () => {
  const first = renderHook(() => useLevelFivePreview('preview-owner', false));
  await waitFor(() => {
    expect(first.result.current.busy).toBe(false);
  });
  await act(() => first.result.current.start(id));
  await act(() => first.result.current.change({ type: 'card', index: 1 }));
  first.unmount();
  const second = renderHook(() => useLevelFivePreview('preview-owner', false));
  await waitFor(() => {
    expect(second.result.current.state?.draft.introCard).toBe(1);
  });
  expect(second.result.current.opened).toBe(false);
  act(() => {
    second.result.current.resume();
  });
  await act(() => second.result.current.change({ type: 'start' }));
  expect(second.result.current.state?.session?.initial.index).toBe(0);
});
it('erhält den letzten bestätigten Stand bei Schreibfehler und lädt einen verlorenen ACK nach', async () => {
  const hook = renderHook(() => useLevelFivePreview('preview-error', false));
  await waitFor(() => {
    expect(hook.result.current.busy).toBe(false);
  });
  await act(() => hook.result.current.start(id));
  const before = hook.result.current.state;
  mockCompare.mockImplementationOnce((scope, _expected, next) => {
    if (next) mockValues.set(scope, next);
    return Promise.reject(new Error('Lost response'));
  });
  await act(() => hook.result.current.change({ type: 'start' }));
  expect(hook.result.current.problem).toBe('save');
  expect(hook.result.current.state).toEqual(before);
  await act(() => hook.result.current.load());
  expect(hook.result.current.state?.draft.started).toBe(true);
});
it('hält Konflikte und beschädigte Quellen an und ermöglicht gezieltes Verwerfen', async () => {
  const hook = renderHook(() => useLevelFivePreview('preview-conflict', false));
  await waitFor(() => {
    expect(hook.result.current.busy).toBe(false);
  });
  await act(() => hook.result.current.start(id));
  mockValues.set('preview-conflict', '{"old":true}');
  await act(() => hook.result.current.change({ type: 'start' }));
  expect(hook.result.current.problem).toBe('conflict');
  await act(() => hook.result.current.load());
  expect(hook.result.current.problem).toBe('outdated');
  await act(() => hook.result.current.discard());
  expect(mockValues.has('preview-conflict')).toBe(false);
});
it('bindet verzögertes Schreiben an den ursprünglichen Besitzer und verhindert Doppelaktionen', async () => {
  let release: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const first = renderHook(() => useLevelFivePreview('preview-a', false));
  await waitFor(() => {
    expect(first.result.current.busy).toBe(false);
  });
  const compare = mockCompare.getMockImplementation();
  if (!compare) throw Error('Missing mock comparator');
  mockCompare.mockImplementationOnce(async (...args) => {
    await pending;
    return compare(...args);
  });
  let saving: Promise<void>;
  act(() => {
    saving = first.result.current.start(id);
  });
  await act(() => first.result.current.start(id));
  expect(mockCompare).toHaveBeenCalledTimes(1);
  first.unmount();
  const second = renderHook(() => useLevelFivePreview('preview-b', false));
  await waitFor(() => {
    expect(second.result.current.busy).toBe(false);
  });
  await act(async () => {
    release?.();
    await saving;
  });
  expect(mockValues.has('preview-a')).toBe(true);
  expect(second.result.current.stored).toBe(false);
});
it('der Modus ohne dauerhaften Speicher trennt Besitzer und löscht nach sieben Tagen', () => {
  const now = Date.now(),
    raw = JSON.stringify(createLevelFivePreview(catalogue, id, 'memory-preview', now));
  expect(comparePreviewMemory('preview-memory', null, raw)).toBe(true);
  expect(readPreviewMemory('preview-other', now)).toBeNull();
  expect(readPreviewMemory('preview-memory', now)).toBe(raw);
  expect(readPreviewMemory('preview-memory', now + 7 * 86400000)).toBeNull();
  erasePreviewMemory('preview-memory');
});
