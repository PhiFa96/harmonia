import {
  parseScore,
  scoreTimeline,
  voiceLeadingScoreTimeline,
  type ScoreTimeline,
} from '../../packages/notation/src/index.ts';
import type { AudioEngine, Timers } from '../../packages/audio/src/index.ts';
import { PARTS, workbenchReportInput, type WorkbenchDraft } from './workbench-model.ts';

export type PlaybackPart = 'all' | (typeof PARTS)[number];
export const MIN_TEMPO = 40;
export const MAX_TEMPO = 200;

/** Tempo immer Viertel/min; Solo erhält Pausen, Haltebögen und die gesamte Satzlänge. */
export function workbenchPlaybackTimeline(
  draft: WorkbenchDraft,
  bpm: number,
  part: PlaybackPart,
): ScoreTimeline {
  if (!Number.isInteger(bpm) || bpm < MIN_TEMPO || bpm > MAX_TEMPO)
    throw new RangeError('Tempo must be an integer from 40 to 200 quarter notes per minute.');
  if (part !== 'all' && !PARTS.some((voice) => voice === part))
    throw new RangeError('Unknown voice');
  const input = workbenchReportInput(draft);
  const score = parseScore(input.score);
  voiceLeadingScoreTimeline(score, input.assignment);
  const full = scoreTimeline(score, { bpm, beat: { value: 'quarter', dots: 0 } });
  if (part === 'all') return full;
  const binding = input.assignment[part];
  const staff = score.staves[binding.staff];
  if (!staff) throw new RangeError('Missing staff');
  const solo = {
    staves: [
      {
        ...staff,
        measures: staff.measures.map((measure) => {
          const voice = measure.voices[binding.voice];
          if (!voice) throw new RangeError('Missing voice');
          return { ...measure, voices: [voice] };
        }),
      },
    ],
  };
  return scoreTimeline(solo, { bpm, beat: { value: 'quarter', dots: 0 } });
}

export interface PlayerState {
  readonly status: 'idle' | 'starting' | 'playing' | 'stopped' | 'ended' | 'error';
  readonly elapsed: number;
  readonly duration: number;
}

/** Nutzt die gemeinsame Engine; der Timer zeigt nur den Stand der Audio-Uhr an. */
export function createWorkbenchPlayer(
  getEngine: () => AudioEngine,
  timers: Timers,
  changed: (state: PlayerState) => void,
) {
  let engine: AudioEngine | undefined;
  let generation = 0;
  let interval: { handle: unknown } | undefined;
  let state: PlayerState = { status: 'idle', elapsed: 0, duration: 0 };
  function publish(next: PlayerState) {
    state = next;
    changed(next);
  }
  function cleanup() {
    if (interval) timers.clearInterval(interval.handle);
    interval = undefined;
    engine?.stopAll();
  }
  function stop() {
    generation += 1;
    cleanup();
    publish({ status: state.status === 'idle' ? 'idle' : 'stopped', elapsed: 0, duration: 0 });
  }
  async function start(timeline: ScoreTimeline) {
    stop();
    const current = generation;
    publish({ status: 'starting', elapsed: 0, duration: timeline.durationSeconds });
    try {
      engine = getEngine();
      await engine.resume();
      // Stop, neue Eingabe oder ein neuer Start während resume() gewinnt immer.
      if (current !== generation) return;
      if (engine.context.state !== 'running') throw new Error('Audio context did not start');
      const activeEngine = engine;
      const startAt = activeEngine.context.currentTime + 0.05;
      for (const tone of timeline.tones)
        activeEngine.playPitch(tone.pitch, {
          when: startAt + tone.onsetSeconds,
          duration: tone.durationSeconds,
          velocity: 0.3,
        });
      publish({ status: 'playing', elapsed: 0, duration: timeline.durationSeconds });
      interval = {
        handle: timers.setInterval(() => {
          if (activeEngine.context.state !== 'running') {
            stop();
            return;
          }
          const elapsed = Math.max(0, activeEngine.context.currentTime - startAt);
          if (elapsed >= timeline.durationSeconds + 0.02) {
            cleanup();
            publish({
              status: 'ended',
              elapsed: timeline.durationSeconds,
              duration: timeline.durationSeconds,
            });
          } else
            publish({
              status: 'playing',
              elapsed: Math.min(elapsed, timeline.durationSeconds),
              duration: timeline.durationSeconds,
            });
        }, 100),
      };
    } catch {
      if (current !== generation) return;
      cleanup();
      publish({ status: 'error', elapsed: 0, duration: 0 });
    }
  }
  return {
    start,
    stop,
    dispose: () => {
      stop();
      engine = undefined;
    },
  };
}
