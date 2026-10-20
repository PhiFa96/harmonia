import { note, singleStaffScore } from '@harmonia/notation';
import { duration, midi, formatInterval, intervalBetween } from '@harmonia/theory';
import type { Pitch, Rng } from '@harmonia/theory';
import { generateNote, generateVisualInterval } from './generate.ts';
import { accidentalLimit, pitchPool, rangeFor } from './parameters.ts';
import type { ExerciseItem, VoiceItem, VoiceParams, VoiceSequenceParams } from './types.ts';

export function isVoiceItem(item: ExerciseItem): item is VoiceItem {
  return ['SING_INTERVAL', 'SIGHT_SING', 'PLAY_BACK'].includes(item.type);
}

export function voiceTargets(item: VoiceItem): readonly Pitch[] {
  return item.type === 'SING_INTERVAL' ? item.pitches.slice(1) : item.pitches;
}

function pitchAt(pitches: readonly Pitch[], index: number): Pitch {
  const pitch = pitches[index];
  if (!pitch) throw new RangeError('Tonfolge ist unvollständig');
  return pitch;
}

export function voiceAnswerId(pitches: readonly Pitch[]): string {
  return `voice:${pitches.map((pitch) => String(midi(pitch) * 100)).join(',')}`;
}

/** Each integer is a detected MIDI pitch in hundredths of a semitone. */
export function voiceAnswerValues(answer: string, count: number): number[] | undefined {
  if (!/^voice:\d{4,5}(?:,\d{4,5}){0,2}$/.test(answer)) return undefined;
  const values = answer.slice(6).split(',').map(Number);
  return values.length === count && values.every((value) => value >= 2100 && value <= 10800)
    ? values
    : undefined;
}

export function evaluateVoice(item: VoiceItem, answer: string) {
  const targets = voiceTargets(item);
  const expected = voiceAnswerId(targets);
  const values = voiceAnswerValues(answer, targets.length);
  return {
    answer,
    expected,
    validAnswer: values !== undefined,
    correct:
      values?.every(
        (value, index) =>
          Math.abs(value - midi(pitchAt(targets, index)) * 100) <= item.toleranceCents,
      ) ?? false,
  };
}

/** Richtiges Tonmaterial im falschen Register bleibt falsch, erhält aber gezieltes Feedback. */
export function voiceOctaveError(item: VoiceItem, answer: string): boolean {
  const targets = voiceTargets(item);
  const values = voiceAnswerValues(answer, targets.length);
  if (!values) return false;
  const differences = values.map((value, index) => value - midi(pitchAt(targets, index)) * 100);
  return (
    differences.some((value) => Math.abs(value) > item.toleranceCents) &&
    differences.every((value) => {
      const octaves = Math.round(value / 1200);
      return Math.abs(value - octaves * 1200) <= item.toleranceCents;
    })
  );
}

export function generateSightSing(params: VoiceParams, rng: Rng): VoiceItem {
  const source = generateNote(params, rng);
  return {
    type: 'SIGHT_SING',
    clef: source.clef,
    score: source.score,
    pitches: [source.pitch],
    toleranceCents: params.level === 1 ? 50 : 25,
    choices: [],
  };
}

export function generateVoiceSequence(
  params: VoiceSequenceParams,
  rng: Rng,
  type: 'SING_INTERVAL' | 'PLAY_BACK',
): VoiceItem {
  const pair = generateVisualInterval({ ...params, direction: 'up' }, rng);
  const pitches: Pitch[] = [pair.from, pair.to];
  if (type === 'PLAY_BACK') {
    const range = rangeFor(params, pair.clef);
    const options = pitchPool(range, accidentalLimit(params, 0)).filter((pitch) => {
      const distance = Math.abs(midi(pitch) - midi(pair.to));
      return distance >= 2 && distance <= 5 && midi(pitch) !== midi(pair.from);
    });
    if (options.length === 0) throw new RangeError('Kein dritter Ton im Stimmumfang');
    pitches.push(rng.pick(options));
  }
  const score =
    type === 'SING_INTERVAL'
      ? singleStaffScore([[note(pair.from, duration('whole'))]], { clef: pair.clef })
      : singleStaffScore(
          [
            [
              note(pair.from, duration('quarter')),
              note(pair.to, duration('quarter')),
              note(pitchAt(pitches, 2), duration('half')),
            ],
          ],
          { clef: pair.clef },
        );
  return {
    type,
    clef: pair.clef,
    score,
    pitches,
    toleranceCents: params.level === 1 ? 50 : 25,
    choices: [],
  };
}

export function voiceIntervalName(item: VoiceItem): string {
  return item.type === 'SING_INTERVAL'
    ? formatInterval(intervalBetween(pitchAt(item.pitches, 0), pitchAt(item.pitches, 1)))
    : '';
}
