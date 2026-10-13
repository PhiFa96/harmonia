import type { Score } from '@harmonia/notation';
import {
  MAX_STEP,
  MIN_STEP,
  chord as notationChord,
  note,
  rest,
  singleStaffScore,
  stepOf,
} from '@harmonia/notation';
import type { Chord, NoteName, Pitch, Rng, TriadType } from '@harmonia/theory';
import {
  LETTERS,
  chord,
  chordBass,
  chordPitches,
  chroma,
  comparePitches,
  duration,
  equals,
  formatNoteName,
  formatPitch,
  identifyChord,
  identifyChordFromMidi,
  midi,
  parseNoteName,
  sameNoteName,
} from '@harmonia/theory';
import { accidentalLimit, clefs, options, pitchPool, rangeFor } from './parameters.ts';
import { writtenAnswerPitch } from './pitch-input.ts';
import type { ChordIdentifyParams, ChordItem, ExerciseItem } from './types.ts';

export const MVP_TRIAD_TYPES = [
  'major',
  'minor',
  'diminished',
  'augmented',
] as const satisfies readonly TriadType[];
export function isChordItem(item: ExerciseItem): item is ChordItem {
  return item.type === 'CHORD_BUILD' || item.type === 'CHORD_IDENTIFY';
}
export function isAuralExercise(item: ExerciseItem): boolean {
  return (
    item.type === 'INTERVAL_IDENTIFY_AURAL' ||
    (item.type === 'CHORD_IDENTIFY' && item.presentation === 'aural')
  );
}
export function chordChoiceId(value: Chord): string {
  return `chord:${formatNoteName(value.root)}:${value.type}:${String(value.inversion)}`;
}
export function chordFromId(id: string): Chord {
  const match = /^chord:([A-G](?:bb|b|##|#)?):(major|minor|diminished|augmented):([012])$/.exec(id);
  if (!match?.[1] || !match[2] || !match[3]) throw new RangeError('Ungültige Akkord-ID');
  const result = chord(parseNoteName(match[1]), match[2] as TriadType, Number(match[3]));
  if (chordChoiceId(result) !== id) throw new RangeError('Ungültige Akkord-ID');
  return result;
}
/** Visuell zählt die Schreibweise; auditiv ist der Grundton vorgegeben und die MIDI-Töne entscheiden. */
export function resolvedChord(item: ChordItem): Chord {
  if (item.type === 'CHORD_BUILD') return item.chord;
  const matches = (
    item.presentation === 'aural'
      ? identifyChordFromMidi(item.pitches.map(midi), { maxAccidentals: 2 }).filter((match) =>
          sameNoteName(match.chord.root, item.chord.root),
        )
      : identifyChord(item.pitches)
  ).filter((match) => !match.omitted.length);
  const [match] = matches;
  if (matches.length !== 1 || !match)
    throw new RangeError('Dreiklang ist nicht eindeutig bestimmbar');
  return match.chord;
}
export function chordTargets(item: ChordItem): readonly Pitch[] {
  return item.type === 'CHORD_BUILD'
    ? chordPitches(item.chord, { octave: item.bass.octave })
    : item.pitches;
}
/** Klingender Grundtonbezug aus demselben Register: auch symmetrische Dreiklänge bleiben hörbar eindeutig. */
export function chordReferencePitch(item: ChordItem): Pitch {
  const rootChroma = chroma({ ...item.chord.root, octave: 4 });
  const pitch = chordTargets(item).find((pitch) => chroma(pitch) === rootChroma);
  if (!pitch) throw new RangeError('Grundtonbezug fehlt im vollständigen Dreiklang');
  return pitch;
}
function stackScore(pitches: readonly Pitch[], clef: ChordItem['clef']): Score {
  // Gleiche Notenköpfe können nicht doppelt gezeichnet werden; die Antwort selbst bleibt unverändert.
  const unique = pitches.filter(
    (pitch, index) => pitches.findIndex((other) => equals(pitch, other)) === index,
  );
  const [only] = unique;
  const event =
    unique.length > 1
      ? notationChord(
          unique.map((pitch) => ({ pitch, tie: false })),
          duration('whole'),
        )
      : only
        ? note(only, duration('whole'))
        : rest(duration('whole'));
  return singleStaffScore([[event]], { clef });
}
export function chordAnswerId(pitches: readonly (Pitch | null)[]): string {
  return `chord-notes:${pitches.map((pitch) => (pitch ? formatPitch(pitch) : '')).join(',')}`;
}
export function chordAnswerPitches(
  item: ChordItem,
  answer: string | null,
): readonly (Pitch | null)[] | undefined {
  if (answer === null) return [item.bass, null, null];
  if (!answer.startsWith('chord-notes:') || answer.length > 40) return undefined;
  const parts = answer.slice(12).split(',');
  if (parts.length !== 3) return undefined;
  const pitches = parts.map((value) =>
    value === '' ? null : writtenAnswerPitch(item.clef, value),
  );
  if (pitches.some((pitch) => pitch === undefined)) return undefined;
  return pitches as readonly (Pitch | null)[];
}
/** Die Eingabereihenfolge der oberen Töne verändert einen gleichzeitig notierten Akkord nicht. */
export function canonicalChordAnswer(pitches: readonly Pitch[]): string {
  return chordAnswerId([...pitches].sort(comparePitches));
}
export function chordAnswerScore(item: ChordItem, answer: string | null): Score {
  const pitches = chordAnswerPitches(item, answer) ?? [item.bass];
  return stackScore(
    pitches.filter((pitch): pitch is Pitch => pitch !== null),
    item.clef,
  );
}
export function chordSolutionScore(item: ChordItem): Score {
  return stackScore(chordTargets(item), item.clef);
}
export function chordEditScore(item: ChordItem, answer: string | null, index: 1 | 2): Score {
  const pitch = chordAnswerPitches(item, answer)?.[index];
  return singleStaffScore(
    [
      [note(item.bass, duration('whole'))],
      [pitch ? note(pitch, duration('whole')) : rest(duration('whole'))],
    ],
    { clef: item.clef },
  );
}
export function chordAnswerStatuses(item: ChordItem, answer: string | null): readonly boolean[] {
  const entered = chordAnswerPitches(item, answer) ?? [],
    targets = chordTargets(item);
  return entered.map(
    (pitch, index) =>
      !!pitch &&
      (index === 0
        ? equals(pitch, item.bass)
        : targets.slice(1).some((target) => equals(pitch, target)) &&
          entered.slice(1).findIndex((other) => !!other && equals(pitch, other)) === index - 1),
  );
}
export function generateChord(
  params: ChordIdentifyParams,
  rng: Rng,
  type: ChordItem['type'],
): ChordItem {
  if (!params.types.length || params.types.some((value) => !MVP_TRIAD_TYPES.includes(value)))
    throw new RangeError('Ungültige Dreiklangart');
  const types = [...new Set(params.types)],
    inversions = [...new Set(params.inversions ?? [0, 1, 2])];
  if (
    !inversions.length ||
    inversions.some((inversion) => !Number.isInteger(inversion) || inversion < 0 || inversion > 2)
  )
    throw new RangeError('Dreiklang-Umkehrung muss 0 bis 2 sein');
  const presentation = params.presentation ?? 'visual';
  if (
    !['visual', 'aural'].includes(presentation) ||
    (type === 'CHORD_BUILD' && params.presentation !== undefined)
  )
    throw new RangeError('Ungültige Akkorddarstellung');
  const limit = accidentalLimit(params, 1);
  let roots: NoteName[];
  if (params.roots) {
    if (!params.roots.length) throw new RangeError('Mindestens ein Grundton ist nötig');
    roots = [...new Set(params.roots)].map((value) => {
      const root = parseNoteName(value);
      if (formatNoteName(root) !== value || Math.abs(root.alter) > limit)
        throw new RangeError('Grundton muss kanonisch geschrieben und darstellbar sein');
      return root;
    });
  } else
    roots = LETTERS.flatMap((letter) =>
      Array.from({ length: limit * 2 + 1 }, (_, index) => ({ letter, alter: index - limit })),
    );
  const pools = clefs(params).map((clef) => ({
    clef,
    range: rangeFor(params, clef),
    pitches: pitchPool(rangeFor(params, clef), limit),
  }));
  const groups = types.flatMap((quality) =>
    inversions.flatMap((inversion) =>
      (params.roots ? roots.map((root) => [root]) : [roots]).map((allowedRoots) => {
        const candidates = allowedRoots.flatMap((root) => {
          let value: Chord;
          try {
            value = chord(root, quality, inversion);
          } catch (error) {
            if (error instanceof RangeError) return [];
            throw error;
          }
          const bassName = chordBass(value);
          return pools.flatMap((pool) =>
            pool.pitches
              .filter((pitch) => sameNoteName(pitch, bassName))
              .flatMap((bass) => {
                const pitches = chordPitches(value, { octave: bass.octave });
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
                return [{ chord: value, clef: pool.clef, bass, pitches }];
              }),
          );
        });
        if (!candidates.length)
          throw new RangeError('Dreiklang im erlaubten Bereich nicht vollständig darstellbar');
        return candidates;
      }),
    ),
  );
  const chosen = rng.pick(rng.pick(groups));
  const available = types.flatMap((quality) =>
    inversions.flatMap((inversion) => {
      // Beim Hören werden keine abweichenden/enharmonischen Grundtöne angeboten.
      const optionRoots = presentation === 'aural' ? [chosen.chord.root] : roots;
      return optionRoots.flatMap((root) => {
        try {
          return [chordChoiceId(chord(root, quality, inversion))];
        } catch (error) {
          if (error instanceof RangeError) return [];
          throw error;
        }
      });
    }),
  );
  return {
    type,
    ...chosen,
    presentation,
    score: stackScore(type === 'CHORD_BUILD' ? [chosen.bass] : chosen.pitches, chosen.clef),
    choices: type === 'CHORD_BUILD' ? [] : options(chordChoiceId(chosen.chord), available, rng),
  };
}
