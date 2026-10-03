// Gemeinsame Ton-Lebensdauer für Finger, Tastatur und Screenreader.
import type { Playback } from '@harmonia/audio';
import type { Pitch } from '@harmonia/notation';
import { keyboardPitch } from '@harmonia/notation';
import { useHaptics } from '@harmonia/ui/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getAudioEngine } from '@/audio';

export interface PianoInputOptions {
  readonly onPitch: (pitch: Pitch) => void;
  readonly spellPitch?: (midi: number) => Pitch;
  readonly enabled?: boolean;
}
export function usePianoInput({ onPitch, spellPitch, enabled = true }: PianoInputOptions) {
  const haptics = useHaptics();
  const [held, setHeld] = useState<ReadonlySet<number>>(new Set());
  const sources = useRef(new Map<string, number>());
  const voices = useRef(new Map<number, Playback>());
  const pulses = useRef(new Set<ReturnType<typeof setTimeout>>());
  const pulseId = useRef(0);
  const stop = useCallback(() => {
    sources.current.clear();
    for (const voice of voices.current.values()) voice.stop();
    voices.current.clear();
    for (const timer of pulses.current) clearTimeout(timer);
    pulses.current.clear();
    setHeld(new Set());
  }, []);

  const changeSource = useCallback(
    (id: string, number: number | undefined) => {
      const previous = sources.current.get(id);
      if (previous === number) return;
      sources.current.delete(id);
      if (previous !== undefined && ![...sources.current.values()].includes(previous)) {
        voices.current.get(previous)?.stop();
        voices.current.delete(previous);
      }
      if (number !== undefined && enabled) {
        sources.current.set(id, number);
        if (!voices.current.has(number)) {
          const pitch = keyboardPitch(number, spellPitch?.(number));
          const engine = getAudioEngine();
          void engine.resume();
          // Proben dauern höchstens vier Sekunden. Mehrere Tasten gemeinsam bleiben leiser.
          voices.current.set(number, engine.playPitch(pitch, { duration: 4, velocity: 0.25 }));
          haptics.tap();
          onPitch(pitch);
        }
      }
      setHeld(new Set(voices.current.keys()));
    },
    [enabled, haptics, onPitch, spellPitch],
  );

  useEffect(() => {
    if (!enabled) stop();
  }, [enabled, stop]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') stop();
    });
    return () => {
      subscription.remove();
      stop();
    };
  }, [stop]);

  const pulse = (number: number) => {
    if (!enabled) return;
    const id = `pulse:${String(pulseId.current++)}`;
    changeSource(id, number);
    const timer = setTimeout(() => {
      changeSource(id, undefined);
      pulses.current.delete(timer);
    }, 400);
    pulses.current.add(timer);
  };
  return { held, sources, stop, changeSource, pulse };
}
