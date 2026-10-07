import type { Pitch, Rng } from '@harmonia/theory';
import { LETTERS, midi } from '@harmonia/theory';
import type { ExerciseClef, NoteParams, PitchRange } from './types.ts';

const DEFAULT_RANGES: Readonly<Record<ExerciseClef, PitchRange>> = {
  treble: { minMidi: 60, maxMidi: 84 },
  bass: { minMidi: 36, maxMidi: 60 },
};
export function clefs(params: Pick<NoteParams, 'clefs'>): readonly ExerciseClef[] {
  const values = params.clefs ?? ['treble'];
  if (values.length === 0 || values.some((clef) => !['treble', 'bass'].includes(clef)))
    throw new RangeError('Mindestens ein unterstützter Schlüssel ist nötig');
  return [...new Set(values)];
}
export function accidentalLimit(params: NoteParams, fallback: 0 | 1): number {
  const limit = params.maxAccidentals ?? fallback;
  if (!Number.isInteger(limit) || limit < 0 || limit > 2)
    throw new RangeError('Vorzeichen müssen zwischen 0 und 2 liegen');
  return limit;
}
export function rangeFor(params: NoteParams, clef: ExerciseClef): PitchRange {
  const range = params.range ?? DEFAULT_RANGES[clef];
  if (
    !Number.isInteger(range.minMidi) ||
    !Number.isInteger(range.maxMidi) ||
    range.minMidi < 21 ||
    range.maxMidi > 108 ||
    range.minMidi > range.maxMidi
  )
    throw new RangeError('Tonbereich muss innerhalb A0–C8 liegen');
  return range;
}
export function pitchPool(range: PitchRange, limit: number): Pitch[] {
  const result: Pitch[] = [];
  for (let octave = 0; octave <= 8; octave++)
    for (const letter of LETTERS) {
      for (let alter = limit === 0 ? 0 : -limit; alter <= limit; alter++) {
        const pitch = { letter, alter, octave };
        if (midi(pitch) >= range.minMidi && midi(pitch) <= range.maxMidi) result.push(pitch);
      }
    }
  return result;
}
export function options(correct: string, available: readonly string[], rng: Rng): string[] {
  const others = rng
    .shuffle([...new Set(available)].filter((value) => value !== correct))
    .slice(0, 3);
  return rng.shuffle([correct, ...others]);
}
