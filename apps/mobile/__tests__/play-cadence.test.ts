import type { AudioEngine, PlayOptions } from '@harmonia/audio';
import { createRng, generateCadence } from '@harmonia/exercises';
import type { Pitch } from '@harmonia/notation';
import { playCadence } from '@/exercises/play-cadence';

const formatNoteName = (pitch: Pitch) =>
  `${pitch.letter}${pitch.alter > 0 ? '#'.repeat(pitch.alter) : 'b'.repeat(-pitch.alter)}${String(pitch.octave)}`;

function setup() {
  const calls: { names: string[]; when: number }[] = [];
  const voices: { stop: jest.Mock }[] = [];
  const voice = (options: PlayOptions = {}) => {
    const value = {
      startTime: options.when ?? 10,
      endTime: (options.when ?? 10) + (options.duration ?? 1),
      stop: jest.fn(),
    };
    voices.push(value);
    return value;
  };
  const engine = {
    context: { currentTime: 10 },
    playPitch: jest.fn((pitch: Pitch, options: PlayOptions = {}) => {
      calls.push({ names: [formatNoteName(pitch)], when: options.when ?? 10 });
      return voice(options);
    }),
    playChord: jest.fn((pitches: readonly Pitch[], options: PlayOptions = {}) => {
      calls.push({
        names: pitches.map((pitch) => formatNoteName(pitch)),
        when: options.when ?? 10,
      });
      return voice(options);
    }),
  } as unknown as AudioEngine;
  return { engine, calls, voices };
}

describe('Kadenz mit Tonika-Bezug', () => {
  it.each([
    [0, ['C', 'E', 'G']],
    [1, ['G', 'B', 'D']],
    [-1, ['F', 'A', 'C']],
  ] as const)('spielt in %s Vorzeichen zuerst die Tonika, dann die Folge', (fifths, tonic) => {
    const item = generateCadence({ fifths: [fifths], types: ['plagal'] }, createRng(3));
    const value = setup();
    const playback = playCadence(value.engine, item);
    const lead = value.calls.filter((call) => call.when < 10.5);
    // Der erste Klang ist der Tonika-Dreiklang der genannten Tonart ...
    const reference = lead.flatMap((call) => call.names).map((name) => name.replace(/\d+$/, ''));
    expect(reference.sort()).toEqual([...tonic].sort());
    // ... und alle Töne der eigentlichen Folge beginnen deutlich danach.
    const rest = value.calls.filter((call) => call.when >= 10.5);
    expect(rest.length).toBeGreaterThanOrEqual(6);
    expect(Math.min(...rest.map((call) => call.when))).toBeGreaterThan(
      Math.max(...lead.map((call) => call.when)) + 1,
    );
    expect(playback.endTime).toBeGreaterThan(Math.max(...rest.map((call) => call.when)));
    playback.stop();
    value.voices.forEach((voice) => {
      expect(voice.stop).toHaveBeenCalledTimes(1);
    });
  });
});
