import type { AudioEngine, Playback } from '@harmonia/audio';
import { cadenceTonicPitches } from '@harmonia/exercises';
import type { CadenceItem } from '@harmonia/exercises';
import { EXAMPLE_BPM, playExample } from './play-example';

const TONIC_SECONDS = 1.2;
const GAP_SECONDS = 0.3;

/**
 * Spielt zuerst den Tonika-Dreiklang der genannten Tonart und danach die Akkordfolge. Zwei
 * Akkorde allein sind ohne Tonartbezug mehrdeutig (C–G ist I–V in C und IV–I in G).
 */
export function playCadence(engine: AudioEngine, item: CadenceItem, bpm = EXAMPLE_BPM): Playback {
  const startTime = engine.context.currentTime + 0.05;
  const voices: Playback[] = [];
  try {
    voices.push(
      engine.playChord(cadenceTonicPitches(item), {
        when: startTime,
        duration: TONIC_SECONDS,
      }),
    );
    voices.push(playExample(engine, item.score, bpm, TONIC_SECONDS + GAP_SECONDS));
  } catch (error) {
    voices.forEach((voice) => {
      voice.stop();
    });
    throw error;
  }
  let stopped = false;
  return {
    startTime,
    endTime: Math.max(...voices.map((voice) => voice.endTime)),
    stop: () => {
      if (stopped) return;
      stopped = true;
      voices.forEach((voice) => {
        voice.stop();
      });
    },
  };
}
