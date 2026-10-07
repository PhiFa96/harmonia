import type { AudioEngine, Playback } from '@harmonia/audio';
import type { ScaleItem } from '@harmonia/exercises';
import { scalePitches } from '@harmonia/exercises';

/** Reihenfolge bewahren; ein Abbruch stoppt ausschließlich die Stimmen dieser Aufgabe. */
export function playScale(engine: AudioEngine, item: ScaleItem): Playback {
  const voices: Playback[] = [];
  const startTime = engine.context.currentTime + 0.05;
  try {
    scalePitches(item).forEach((pitch, index) => {
      voices.push(engine.playPitch(pitch, { when: startTime + index * 0.5, duration: 0.45 }));
    });
  } catch (error) {
    voices.forEach((voice) => {
      voice.stop();
    });
    throw error;
  }
  return {
    startTime,
    endTime: Math.max(...voices.map((voice) => voice.endTime)),
    stop: () => {
      voices.forEach((voice) => {
        voice.stop();
      });
    },
  };
}
