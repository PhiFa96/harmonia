import type { AudioEngine, Playback } from '@harmonia/audio';
import type { RhythmItem } from '@harmonia/exercises';
import { rhythmBeatCount, rhythmMeasureMs, rhythmTimeline } from '@harmonia/exercises';

export interface RhythmPlayback extends Playback {
  readonly countInAt: number;
  readonly latencySeconds: number;
}
/** Einzähltakt und Grundschlag vorplanen; keine globalen Sequenz-/Stop-All-Aufrufe. */
export function playRhythm(
  engine: AudioEngine,
  item: RhythmItem,
  mode: 'record' | 'demo',
): RhythmPlayback {
  const count = rhythmBeatCount(item),
    period = 60 / item.bpm;
  const countInAt = engine.context.currentTime + 0.35,
    startTime = countInAt + count * period;
  const reported = engine.latency(),
    sum = (reported.base ?? 0) + (reported.output ?? 0);
  const latencySeconds = Number.isFinite(sum) && sum >= 0 && sum <= 0.25 ? sum : 0;
  const voices: Playback[] = [];
  try {
    for (let index = 0; index < count * 2; index++)
      voices.push(
        engine.playPitch(
          {
            letter: index % count === 0 ? 'C' : 'G',
            alter: 0,
            octave: index % count === 0 ? 6 : 5,
          },
          {
            when: countInAt + index * period,
            duration: 0.07,
            velocity: index % count === 0 ? 0.3 : 0.18,
          },
        ),
      );
    if (mode === 'demo')
      for (const event of rhythmTimeline(item))
        if (!event.rest)
          voices.push(
            engine.playPitch(
              { letter: 'G', alter: 0, octave: 4 },
              {
                when: startTime + event.onsetMs / 1000,
                duration: Math.min((event.durationMs / 1000) * 0.85, 0.4),
                velocity: 0.6,
              },
            ),
          );
  } catch (error) {
    voices.forEach((voice) => {
      voice.stop();
    });
    throw error;
  }
  let stopped = false;
  return {
    countInAt,
    startTime,
    endTime: startTime + rhythmMeasureMs(item) / 1000 + latencySeconds,
    latencySeconds,
    stop: () => {
      if (stopped) return;
      stopped = true;
      voices.forEach((voice) => {
        voice.stop();
      });
    },
  };
}
