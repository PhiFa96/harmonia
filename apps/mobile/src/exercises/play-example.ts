import type { AudioEngine, Playback } from '@harmonia/audio';
import type { Score } from '@harmonia/notation';
import { scoreTimeline } from '@harmonia/notation';

export const EXAMPLE_BPM = 90;

/** Ganze Notenbeispiele planen; Pausen, Akkorde und Haltebögen gehören zum tatsächlichen Score. */
export function playExample(engine: AudioEngine, score: Score, bpm = EXAMPLE_BPM): Playback {
  const timeline = scoreTimeline(score, { bpm }),
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
