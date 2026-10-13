import type { AudioEngine, Playback } from '@harmonia/audio';
import type { ChordItem } from '@harmonia/exercises';
import { chordReferencePitch, chordTargets } from '@harmonia/exercises';

/** Bezugston und Akkord auf der Audio-Uhr planen; beide gehören ausschließlich dieser Aufgabe. */
export function playChordExercise(engine: AudioEngine, item: ChordItem): Playback {
  if (item.type !== 'CHORD_IDENTIFY' || item.presentation !== 'aural')
    return engine.playChord(chordTargets(item), { duration: 1.2 });
  const reference = chordReferencePitch(item);
  const voices: Playback[] = [];
  const startTime = engine.context.currentTime + 0.05;
  try {
    voices.push(engine.playPitch(reference, { when: startTime, duration: 0.65 }));
    voices.push(engine.playChord(chordTargets(item), { when: startTime + 0.9, duration: 1.2 }));
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
