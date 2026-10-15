import type { Playback } from '@harmonia/audio';
import type { ExerciseItem } from '@harmonia/exercises';
import type { Score } from '@harmonia/notation';
import {
  isChordItem,
  isKeySignatureItem,
  isScaleItem,
  isRhythmItem,
  isKnowledgeItem,
} from '@harmonia/exercises';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getAudioEngine } from '@/audio';
import { useSettings } from '@/state/settings';
import { playScale } from '@/exercises/play-scale';
import { playChordExercise } from '@/exercises/play-chord';
import { playRhythm } from '@/exercises/play-rhythm';
import { playListening } from '@/exercises/play-listening';
import { playExample, EXAMPLE_BPM } from '@/exercises/play-example';

/** Keine automatische Wiedergabe. Ein verspätetes resume() darf nach dem Verlassen nicht klingen. */
export function useExercisePlayback(item: ExerciseItem | Score | undefined, bpm = EXAMPLE_BPM) {
  const current = useRef(item);
  current.current = item;
  const focused = useRef(true);
  const appActive = useRef(!['background', 'inactive'].includes(AppState.currentState));
  const request = useRef(0);
  const playback = useRef<Playback | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [heard, setHeard] = useState(false);
  const [error, setError] = useState(false);
  const sound = useSettings((s) => s.sound),
    referenceHz = useSettings((s) => s.referenceHz);
  const stop = useCallback(() => {
    request.current++;
    playback.current?.stop();
    playback.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPlaying(false);
  }, []);
  useEffect(() => {
    stop();
    setHeard(false);
    setError(false);
  }, [item, bpm, stop, sound, referenceHz]);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
        stop();
      };
    }, [stop]),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      appActive.current = state === 'active';
      if (!appActive.current) stop();
    });
    return () => {
      subscription.remove();
      stop();
    };
  }, [stop]);
  const play = async () => {
    if (!useSettings.getState().sound) {
      setError(true);
      return;
    }
    const canPlay = () => focused.current && appActive.current;
    if (
      !item ||
      ('type' in item &&
        (isKnowledgeItem(item) || isKeySignatureItem(item) || item.type === 'CONTEXT_CHOICE')) ||
      !canPlay()
    )
      return;
    stop();
    setError(false);
    const token = request.current;
    try {
      const engine = getAudioEngine();
      await engine.resume();
      if (token !== request.current || current.current !== item || !canPlay()) return;
      playback.current =
        'staves' in item
          ? playExample(engine, item, bpm)
          : item.type === 'LISTENING_CHOICE'
            ? playListening(engine, item)
            : isRhythmItem(item)
              ? playRhythm(engine, item, 'demo')
              : isChordItem(item)
                ? playChordExercise(engine, item)
                : isScaleItem(item)
                  ? playScale(engine, item)
                  : 'pitch' in item
                    ? engine.playPitch(item.pitch, { duration: 0.8 })
                    : engine.playInterval(
                        item.from,
                        item.to,
                        item.playback === 'harmonic' ? 'harmonic' : 'melodic',
                        { duration: 0.8 },
                      );
      setPlaying(true);
      setHeard(true);
      timer.current = setTimeout(
        () => {
          playback.current = null;
          timer.current = null;
          setPlaying(false);
        },
        'staves' in item ||
          item.type === 'LISTENING_CHOICE' ||
          isRhythmItem(item) ||
          isChordItem(item) ||
          isScaleItem(item)
          ? Math.max(0, playback.current.endTime - engine.context.currentTime) * 1000 + 50
          : 'pitch' in item || item.playback === 'harmonic'
            ? 850
            : 1650,
      );
    } catch {
      if (token === request.current && current.current === item) setError(true);
    }
  };
  return { play, stop, playing, heard, error };
}
