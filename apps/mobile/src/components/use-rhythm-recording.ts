import type { RhythmItem } from '@harmonia/exercises';
import {
  assessRhythm,
  rhythmAnswerId,
  rhythmBeatCount,
  rhythmTolerance,
} from '@harmonia/exercises';
import type { AudioEngine } from '@harmonia/audio';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getAudioEngine } from '@/audio';
import { useSettings } from '@/state/settings';
import { playRhythm } from '@/exercises/play-rhythm';
import type { RhythmMetronome, RhythmPlayback } from '@/exercises/play-rhythm';

type Phase = 'idle' | 'preparing' | 'count-in' | 'recording' | 'complete';
interface Take {
  readonly engine: AudioEngine;
  readonly playback: RhythmPlayback;
  readonly source: RhythmItem;
  readonly mode: 'practice' | 'test';
  readonly loop: boolean;
  readonly metronome: RhythmMetronome;
  readonly taps: number[];
}
export interface RhythmTakeOptions {
  readonly mode: 'practice' | 'test';
  readonly bpm: number;
  readonly loop: boolean;
  readonly metronome: RhythmMetronome;
}
/** Nur ein abgeschlossener Prüfungs-Take ist eine Antwort. */
export function useRhythmRecording(
  item: RhythmItem,
  locked: boolean,
  onSelect: (answer: string | null) => void,
  options: RhythmTakeOptions,
  onPracticeStart: () => void,
) {
  const [progress, setProgress] = useState<{ phase: Phase; current: number }>({
    phase: 'idle',
    current: 0,
  });
  const [taps, setTaps] = useState<readonly number[]>([]),
    [error, setError] = useState(false),
    [latency, setLatency] = useState(0);
  const [practiceResult, setPracticeResult] = useState<{
    readonly round: number;
    readonly matched: number;
    readonly total: number;
    readonly extras: number;
  } | null>(null);
  const request = useRef(0),
    take = useRef<Take | null>(null),
    preparing = useRef(false),
    round = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null),
    focused = useRef(true),
    active = useRef(!['background', 'inactive'].includes(AppState.currentState));
  const props = useRef({ item, locked, onSelect, options, onPracticeStart });
  props.current = { item, locked, onSelect, options, onPracticeStart };
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
  const reset = useCallback(() => {
    dispose();
    setProgress({ phase: 'idle', current: 0 });
    setTaps([]);
    setPracticeResult(null);
    if (!props.current.locked) props.current.onSelect(null);
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
    const silentPractice =
      props.current.options.mode === 'practice' && props.current.options.metronome === 'off';
    if (!useSettings.getState().sound && !silentPractice) {
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
      const selected = props.current.options;
      const source = selected.mode === 'practice' ? { ...item, bpm: selected.bpm } : item;
      const metronome = selected.mode === 'practice' ? selected.metronome : 'through';
      const playback = playRhythm(engine, source, 'record', metronome);
      if (selected.mode === 'practice') props.current.onPracticeStart();
      preparing.current = false;
      take.current = {
        engine,
        playback,
        source,
        mode: selected.mode,
        loop: selected.mode === 'practice' && selected.loop,
        metronome,
        taps: [],
      };
      round.current = 0;
      setPracticeResult(null);
      setLatency(Math.round(playback.latencySeconds * 1000));
      const tick = () => {
        const current = take.current;
        if (!current || request.current !== token) return;
        if (engine.context.state !== 'running') {
          cancel();
          setError(true);
          return;
        }
        const activePlayback = current.playback;
        const now = engine.context.currentTime - activePlayback.latencySeconds,
          count = rhythmBeatCount(current.source),
          period = 60 / current.source.bpm;
        if (now >= activePlayback.endTime - activePlayback.latencySeconds) {
          if (current.mode === 'practice') {
            const assessment = assessRhythm(current.source, current.taps);
            round.current++;
            setPracticeResult({
              round: round.current,
              matched: assessment.matched,
              total: assessment.targets.length,
              extras: assessment.extras.length,
            });
            if (current.loop) {
              current.playback.stop();
              try {
                const next = playRhythm(engine, current.source, 'record', current.metronome);
                take.current = { ...current, playback: next, taps: [] };
                setTaps([]);
                setProgress({ phase: 'count-in', current: 1 });
              } catch {
                dispose();
                setError(true);
                setProgress({ phase: 'idle', current: 0 });
              }
            } else {
              dispose();
              setProgress({ phase: 'complete', current: count });
            }
          } else {
            const answer = rhythmAnswerId(current.taps);
            dispose();
            setProgress({ phase: 'complete', current: count });
            props.current.onSelect(answer);
          }
          return;
        }
        const recording = now >= activePlayback.startTime - rhythmTolerance(current.source) / 1000;
        const next = {
          phase: recording ? ('recording' as const) : ('count-in' as const),
          current: Math.max(
            1,
            Math.min(
              count,
              Math.floor(
                (now - (recording ? activePlayback.startTime : activePlayback.countInAt)) / period,
              ) + 1,
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
      now < current.playback.startTime - rhythmTolerance(current.source) / 1000 ||
      now >= current.playback.endTime - current.playback.latencySeconds ||
      current.taps.length >= 128
    )
      return;
    current.taps.push(Math.round((now - current.playback.startTime) * 1000));
    setTaps([...current.taps]);
  };
  return { progress, taps, error, latency, practiceResult, start, tap, cancel, reset };
}
