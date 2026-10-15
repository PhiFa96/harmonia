import type { RhythmItem } from '@harmonia/exercises';
import { rhythmAnswerId, rhythmBeatCount, rhythmTolerance } from '@harmonia/exercises';
import type { AudioEngine } from '@harmonia/audio';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getAudioEngine } from '@/audio';
import { useSettings } from '@/state/settings';
import { playRhythm } from '@/exercises/play-rhythm';
import type { RhythmPlayback } from '@/exercises/play-rhythm';

type Phase = 'idle' | 'preparing' | 'count-in' | 'recording' | 'complete';
interface Take {
  readonly engine: AudioEngine;
  readonly playback: RhythmPlayback;
  readonly taps: number[];
}
/** Ein abgeschlossener Take ist eine Antwort; ein abgebrochener Take erzeugt keine Wertung. */
export function useRhythmRecording(
  item: RhythmItem,
  locked: boolean,
  onSelect: (answer: string | null) => void,
) {
  const [progress, setProgress] = useState<{ phase: Phase; current: number }>({
    phase: 'idle',
    current: 0,
  });
  const [taps, setTaps] = useState<readonly number[]>([]),
    [error, setError] = useState(false),
    [latency, setLatency] = useState(0);
  const request = useRef(0),
    take = useRef<Take | null>(null),
    preparing = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null),
    focused = useRef(true),
    active = useRef(!['background', 'inactive'].includes(AppState.currentState));
  const props = useRef({ item, locked, onSelect });
  props.current = { item, locked, onSelect };
  const dispose = useCallback(() => {
    request.current++;
    preparing.current = false;
    take.current?.playback.stop();
    take.current = null;
    if (timer.current !== null) clearInterval(timer.current);
    timer.current = null;
  }, []);
  const cancel = useCallback(() => {
    const running = take.current !== null || preparing.current;
    dispose();
    if (running && !props.current.locked) {
      setProgress({ phase: 'idle', current: 0 });
      setTaps([]);
      props.current.onSelect(null);
    }
  }, [dispose]);
  const sound = useSettings((s) => s.sound),
    referenceHz = useSettings((s) => s.referenceHz);
  useEffect(() => {
    cancel();
  }, [cancel, sound, referenceHz]);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
        cancel();
      };
    }, [cancel]),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      active.current = state === 'active';
      if (!active.current) cancel();
    });
    return () => {
      subscription.remove();
      dispose();
    };
  }, [cancel, dispose]);
  const start = async () => {
    if (!useSettings.getState().sound) {
      setError(true);
      return;
    }
    const canRecord = () => !props.current.locked && focused.current && active.current;
    if (!canRecord()) return;
    dispose();
    preparing.current = true;
    setProgress({ phase: 'preparing', current: 0 });
    setTaps([]);
    setError(false);
    onSelect(null);
    const token = request.current;
    try {
      const engine = getAudioEngine();
      await engine.resume();
      if (token !== request.current || props.current.item !== item || !canRecord()) return;
      if (engine.context.state !== 'running') throw new Error('Audio-Uhr läuft nicht');
      const playback = playRhythm(engine, item, 'record');
      preparing.current = false;
      take.current = { engine, playback, taps: [] };
      setLatency(Math.round(playback.latencySeconds * 1000));
      const tick = () => {
        const current = take.current;
        if (!current || request.current !== token) return;
        if (engine.context.state !== 'running') {
          cancel();
          setError(true);
          return;
        }
        const now = engine.context.currentTime - playback.latencySeconds,
          count = rhythmBeatCount(item),
          period = 60 / item.bpm;
        if (now >= playback.endTime - playback.latencySeconds) {
          const answer = rhythmAnswerId(current.taps);
          dispose();
          setProgress({ phase: 'complete', current: count });
          onSelect(answer);
          return;
        }
        const recording = now >= playback.startTime - rhythmTolerance(item) / 1000;
        const next = {
          phase: recording ? ('recording' as const) : ('count-in' as const),
          current: Math.max(
            1,
            Math.min(
              count,
              Math.floor((now - (recording ? playback.startTime : playback.countInAt)) / period) +
                1,
            ),
          ),
        };
        setProgress((old) =>
          old.phase === next.phase && old.current === next.current ? old : next,
        );
      };
      timer.current = setInterval(tick, 25);
      tick();
    } catch {
      if (token === request.current) {
        dispose();
        setProgress({ phase: 'idle', current: 0 });
        setError(true);
      }
    }
  };
  const tap = () => {
    const current = take.current;
    if (!current || props.current.locked || !focused.current || !active.current) return;
    const now = current.engine.context.currentTime - current.playback.latencySeconds;
    if (
      now < current.playback.startTime - rhythmTolerance(item) / 1000 ||
      now >= current.playback.endTime - current.playback.latencySeconds ||
      current.taps.length >= 128
    )
      return;
    current.taps.push(Math.round((now - current.playback.startTime) * 1000));
    setTaps([...current.taps]);
  };
  return { progress, taps, error, latency, start, tap, cancel };
}
