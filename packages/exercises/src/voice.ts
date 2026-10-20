import { note, singleStaffScore } from '@harmonia/notation';
import { duration, midi, intervalBetween, intervalName } from '@harmonia/theory';
import type { IntervalNameOptions, Pitch, Rng } from '@harmonia/theory';
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

/**
 * Oktaväquivalenz (ADR 0037): Eine Folge gilt als richtig, wenn alle Töne innerhalb der Toleranz
 * um dieselbe ganze Zahl von Oktaven vom Ziel abweichen. Gibt die gemeinsame Verschiebung in
 * Oktaven zurück (0 = genau die notierte Lage), sonst `undefined`.
 */
export function voiceOctaveShift(item: VoiceItem, answer: string): number | undefined {
  const targets = voiceTargets(item);
  const values = voiceAnswerValues(answer, targets.length);
  if (!values) return undefined;
  const differences = values.map((value, index) => value - midi(pitchAt(targets, index)) * 100);
  const shift = Math.round((differences[0] ?? 0) / 1200);
  return differences.every((value) => Math.abs(value - shift * 1200) <= item.toleranceCents)
    ? shift
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
    correct: voiceOctaveShift(item, answer) !== undefined,
  };
}

/** Richtig, aber in einer anderen Oktavlage gesungen: nur ein freundlicher Hinweis. */
export function voiceOctaveShifted(item: VoiceItem, answer: string): boolean {
  const shift = voiceOctaveShift(item, answer);
  return shift !== undefined && shift !== 0;
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

export function voiceIntervalName(item: VoiceItem, options: IntervalNameOptions = {}): string {
  return item.type === 'SING_INTERVAL'
    ? intervalName(intervalBetween(pitchAt(item.pitches, 0), pitchAt(item.pitches, 1)), {
        ...options,
        showDirection: false,
      })
    : '';
}
