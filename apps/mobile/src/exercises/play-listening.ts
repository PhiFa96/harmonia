import type { AudioEngine, Playback } from '@harmonia/audio';
import type { ListeningItem } from '@harmonia/exercises';
import { listeningTimeline } from '@harmonia/exercises';

/** Vergleichsbeispiele gemeinsam auf der Audio-Uhr planen und nur eigene Stimmen stoppen. */
export function playListening(engine: AudioEngine, item: ListeningItem): Playback {
  const timeline = listeningTimeline(item),
    startTime = engine.context.currentTime + 0.05,
    voices: Playback[] = [];
  try {
    for (const tone of timeline.tones)
      voices.push(
        engine.playPitch(tone.pitch, {
          when: startTime + tone.onsetSeconds,
          duration: tone.durationSeconds,
        }),
      );
  } catch (error) {
    voices.forEach((voice) => {
      voice.stop();
    });
    throw error;
  }
  let stopped = false;
  return {
    startTime,
    endTime: Math.max(
      startTime + timeline.durationSeconds,
      ...voices.map((voice) => voice.endTime),
    ),
    stop: () => {
      if (stopped) return;
      stopped = true;
      voices.forEach((voice) => {
        voice.stop();
      });
    },
  };
}
