import { useEffect, useMemo, useRef, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { catalogue } from '@harmonia/content/catalogue';
import {
  createLevelFivePreview,
  restoreLevelFivePreview,
  changeLevelFivePreview,
} from '@harmonia/content';
import type { LevelFivePreviewState } from '@harmonia/content';
import { previewStore } from './storage.ts';

type Problem = 'load' | 'save' | 'outdated' | 'conflict' | null;
export function useLevelFivePreview(scope: string, memory: boolean) {
  const store = useMemo(() => previewStore(scope, memory), [scope, memory]);
  const mounted = useRef(true),
    locked = useRef(false),
    raw = useRef<string | null>(null);
  const [state, setState] = useState<LevelFivePreviewState | null>(null);
  const current = useRef(state);
  const [busy, setBusy] = useState(true),
    [opened, setOpened] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const [stored, setStored] = useState(false);
  async function guarded(work: () => Promise<void>, fallback: Problem = 'save') {
    if (locked.current) return;
    locked.current = true;
    if (mounted.current) setBusy(true);
    try {
      await work();
    } catch (error) {
      if (mounted.current)
        setProblem(
          error instanceof Error && error.message === 'Preview conflict' ? 'conflict' : fallback,
        );
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  const load = () =>
    guarded(async () => {
      const value = await store.read();
      if (!mounted.current) return;
      raw.current = value;
      setStored(value !== null);
      setOpened(false);
      setProblem(null);
      current.current = null;
      setState(null);
      if (value !== null) {
        try {
          current.current = restoreLevelFivePreview(
            catalogue,
            JSON.parse(value) as unknown,
            Date.now(),
          );
          setState(current.current);
        } catch {
          setProblem('outdated');
        }
      }
    }, 'load');
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
    // The screen is keyed by owner and storage mode, so pending work retains its original owner.
  }, [store]);
  async function commit(next: LevelFivePreviewState | null) {
    const value = next ? JSON.stringify(next.draft) : null;
    if (!(await store.compare(raw.current, value))) throw Error('Preview conflict');
    raw.current = value;
    if (!mounted.current) return;
    current.current = next;
    setState(next);
    setStored(value !== null);
    setProblem(null);
  }
  return {
    state,
    busy,
    opened,
    stored,
    problem,
    memory,
    load,
    resume: () => {
      if (!problem && state && !busy) setOpened(true);
    },
    back: () => {
      if (!busy) setOpened(false);
    },
    discard: () =>
      guarded(async () => {
        await commit(null);
        if (mounted.current) setOpened(false);
      }),
    start: (lessonId: string) =>
      guarded(async () => {
        if (raw.current !== null || problem) throw Error('Preview conflict');
        const now = Date.now();
        const draft = createLevelFivePreview(catalogue, lessonId, randomUUID(), now);
        await commit(restoreLevelFivePreview(catalogue, draft, now));
        if (mounted.current) setOpened(true);
      }),
    change: (change: Parameters<typeof changeLevelFivePreview>[1]) =>
      guarded(async () => {
        if (!current.current || problem) return;
        await commit(changeLevelFivePreview(current.current, change, Date.now()));
      }),
  };
}
