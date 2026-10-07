import type { EventRef, Score } from '@harmonia/notation';
import { MAX_STEP, MIN_STEP, note, rest, singleStaffScore, stepOf } from '@harmonia/notation';
import type { Key, Mode, NoteName, Pitch, Rng } from '@harmonia/theory';
import {
  LETTERS,
  buildScale,
  duration,
  equals,
  formatNoteName,
  formatPitch,
  key,
  keyFifths,
  keyFromFifths,
  midi,
  parseNoteName,
  sameNoteName,
} from '@harmonia/theory';
import { accidentalLimit, clefs, options, pitchPool, rangeFor } from './parameters.ts';
import { writtenAnswerPitch } from './pitch-input.ts';
import type {
  ExerciseItem,
  KeySignatureItem,
  KeySignatureParams,
  MvpScaleType,
  ScaleDirection,
  ScaleItem,
  ScaleParams,
} from './types.ts';

export const MVP_SCALE_TYPES = [
  'major',
  'naturalMinor',
  'harmonicMinor',
  'melodicMinor',
] as const satisfies readonly MvpScaleType[];
function fifthsList(values: readonly number[] = [-3, -2, -1, 0, 1, 2, 3]) {
  if (!values.length || values.some((number) => !Number.isInteger(number) || Math.abs(number) > 7))
    throw new RangeError('Vorzeichenzahlen müssen innerhalb -7 bis 7 liegen');
  return [...new Set(values)];
}
export function isScaleItem(item: ExerciseItem): item is ScaleItem {
  return item.type === 'SCALE_BUILD' || item.type === 'SCALE_IDENTIFY';
}
export function isKeySignatureItem(item: ExerciseItem): item is KeySignatureItem {
  return item.type === 'KEYSIG_BUILD' || item.type === 'KEYSIG_IDENTIFY';
}
export function scaleChoiceId(type: MvpScaleType) {
  return `scale:${type}`;
}
export function tonalityAnswerId(value: Key) {
  return `tonality:${value.mode}:${formatNoteName(value.tonic)}`;
}
export function tonalityFromId(id: string): Key {
  const match = /^tonality:(major|minor):([A-G](?:b|#)?)$/.exec(id);
  if (!match?.[1] || !match[2]) throw new RangeError('Ungültige Tonart-ID');
  const result = key(parseNoteName(match[2]), match[1] as Mode);
  if (tonalityAnswerId(result) !== id) throw new RangeError('Ungültige Tonart-ID');
  return result;
}
export function scalePitches(item: ScaleItem): Pitch[] {
  return buildScale(item.tonic, item.scaleType, { direction: item.direction, includeOctave: true });
}
export function scaleSlot(index: number): EventRef {
  if (!Number.isInteger(index) || index < 0 || index > 7)
    throw new RangeError('Tonleiterposition muss 0 bis 7 sein');
  return { measure: Math.floor(index / 4), event: index % 4 };
}
export function scaleSlotIndex(ref: EventRef): number {
  return ref.measure * 4 + ref.event;
}
function scaleScore(pitches: readonly (Pitch | null)[], clef: ScaleItem['clef']): Score {
  const events = pitches.map((pitch) =>
    pitch ? note(pitch, duration('quarter')) : rest(duration('quarter')),
  );
  return singleStaffScore([events.slice(0, 4), events.slice(4)], { clef });
}
export function scaleAnswerId(pitches: readonly (Pitch | null)[]): string {
  return `notes:${pitches.map((pitch) => (pitch ? formatPitch(pitch) : '')).join(',')}`;
}
/** Auch Zwischenstände sind serialisierbar; die Bewertung verlangt alle acht Töne. */
export function scaleAnswerPitches(
  item: ScaleItem,
  answer: string | null,
): readonly (Pitch | null)[] | undefined {
  if (answer === null) return [item.tonic, ...Array<null>(7).fill(null)];
  if (!answer.startsWith('notes:') || answer.length > 70) return undefined;
  const values = answer.slice(6).split(',');
  if (values.length !== 8) return undefined;
  const pitches = values.map((value) =>
    value === '' ? null : writtenAnswerPitch(item.clef, value),
  );
  if (pitches.some((pitch) => pitch === undefined)) return undefined;
  return pitches as readonly (Pitch | null)[];
}
export function scaleAnswerScore(item: ScaleItem, answer: string | null): Score {
  const pitches = scaleAnswerPitches(item, answer);
  return pitches ? scaleScore(pitches, item.clef) : item.score;
}
export function scaleSolutionScore(item: ScaleItem): Score {
  return scaleScore(scalePitches(item), item.clef);
}
export function identifyScale(item: ScaleItem): MvpScaleType {
  const matches = MVP_SCALE_TYPES.filter((type) =>
    item.choices.includes(scaleChoiceId(type)),
  ).filter((type) => {
    const pitches = buildScale(item.tonic, type, {
      direction: item.direction,
      includeOctave: true,
    });
    return (
      pitches.length === item.pitches.length &&
      pitches.every((pitch, index) => item.pitches[index] && equals(pitch, item.pitches[index]))
    );
  });
  const [match] = matches;
  if (matches.length !== 1 || !match)
    throw new RangeError('Tonleiter ist anhand der Antworten nicht eindeutig bestimmbar');
  return match;
}
export function generateScale(params: ScaleParams, rng: Rng, type: ScaleItem['type']): ScaleItem {
  if (!params.types.length || params.types.some((value) => !MVP_SCALE_TYPES.includes(value)))
    throw new RangeError('Ungültige MVP-Tonleiterart');
  const types = [...new Set(params.types)];
  const direction = params.direction ?? 'ascending';
  if (!['ascending', 'descending', 'both'].includes(direction))
    throw new RangeError('Ungültige Tonleiterrichtung');
  if (
    type === 'SCALE_IDENTIFY' &&
    direction !== 'ascending' &&
    types.includes('naturalMinor') &&
    types.includes('melodicMinor')
  )
    throw new RangeError(
      'Natürliches und klassisch melodisches Moll sind abwärts nicht unterscheidbar',
    );
  const directions: readonly ScaleDirection[] =
    direction === 'both' ? ['ascending', 'descending'] : [direction];
  const limit = accidentalLimit(params, 1);
  const pools = clefs(params).map((clef) => ({
    clef,
    range: rangeFor(params, clef),
    pitches: pitchPool(rangeFor(params, clef), limit),
  }));
  const groups = types.flatMap((scaleType) =>
    fifthsList(params.fifths).flatMap((fifths) =>
      directions.map((dir) => {
        const tonality = keyFromFifths(fifths, scaleType === 'major' ? 'major' : 'minor');
        const candidates = pools.flatMap((pool) =>
          pool.pitches
            .filter((pitch) => sameNoteName(pitch, tonality.tonic))
            .flatMap((tonic) => {
              let pitches: Pitch[];
              try {
                pitches = buildScale(tonic, scaleType, { direction: dir, includeOctave: true });
              } catch (error) {
                if (error instanceof RangeError) return [];
                throw error;
              }
              if (
                !pitches.every(
                  (pitch) =>
                    midi(pitch) >= pool.range.minMidi &&
                    midi(pitch) <= pool.range.maxMidi &&
                    Math.abs(pitch.alter) <= limit &&
                    stepOf(pitch, pool.clef) >= MIN_STEP &&
                    stepOf(pitch, pool.clef) <= MAX_STEP,
                )
              )
                return [];
              return [{ clef: pool.clef, tonic, pitches }];
            }),
        );
        if (!candidates.length)
          throw new RangeError('Tonleiter im erlaubten Bereich nicht vollständig darstellbar');
        return { scaleType, direction: dir, candidates };
      }),
    ),
  );
  const group = rng.pick(groups),
    chosen = rng.pick(group.candidates);
  return {
    type,
    ...chosen,
    scaleType: group.scaleType,
    direction: group.direction,
    score: scaleScore(
      type === 'SCALE_BUILD' ? [chosen.tonic, ...Array<null>(7).fill(null)] : chosen.pitches,
      chosen.clef,
    ),
    choices: type === 'SCALE_BUILD' ? [] : rng.shuffle(types.map(scaleChoiceId)),
  };
}
export function signatureAnswerId(notes: readonly NoteName[]): string {
  return `signature:${notes.map((note) => formatNoteName(note)).join(',')}`;
}
export function signatureInputNotes(alter: 1 | -1): readonly NoteName[] {
  return LETTERS.map((letter) => ({ letter, alter }));
}
export function signatureAnswerNotes(answer: string | null): readonly NoteName[] | undefined {
  if (answer === null || !answer.startsWith('signature:') || answer.length > 50) return undefined;
  const body = answer.slice(10);
  if (body === '') return [];
  const values = body.split(',');
  if (values.length > 7 || values.some((value) => !/^[A-G][#b]$/.test(value))) return undefined;
  const notes = values.map((value) => parseNoteName(value));
  return signatureAnswerId(notes) === answer ? notes : undefined;
}
export function signatureSolutionScore(item: KeySignatureItem): Score {
  return singleStaffScore([[rest(duration('whole'))]], {
    clef: item.clef,
    keySignature: { fifths: keyFifths(item.key) },
  });
}
export function signatureKey(item: KeySignatureItem): Key {
  if (item.type === 'KEYSIG_BUILD') return item.key;
  const fifths = item.score.staves[0]?.keySignature.fifths;
  if (fifths === undefined) throw new RangeError('Vorzeichnung fehlt');
  return keyFromFifths(fifths, item.key.mode);
}
export function generateKeySignature(
  params: KeySignatureParams,
  rng: Rng,
  type: KeySignatureItem['type'],
): KeySignatureItem {
  const fifths = fifthsList(params.fifths);
  const modes: readonly Mode[] = params.modes ?? ['major', 'minor'];
  if (!modes.length || modes.some((mode) => !['major', 'minor'].includes(mode)))
    throw new RangeError('Tongeschlecht muss Dur oder Moll sein');
  const allowedClefs = clefs(params),
    mode = rng.pick([...new Set(modes)]);
  const value = keyFromFifths(rng.pick(fifths), mode),
    clef = rng.pick(allowedClefs);
  return {
    type,
    key: value,
    clef,
    score: singleStaffScore([[rest(duration('whole'))]], {
      clef,
      keySignature: { fifths: type === 'KEYSIG_BUILD' ? 0 : keyFifths(value) },
    }),
    choices:
      type === 'KEYSIG_BUILD'
        ? []
        : options(
            tonalityAnswerId(value),
            fifths.map((number) => tonalityAnswerId(keyFromFifths(number, mode))),
            rng,
          ),
  };
}
