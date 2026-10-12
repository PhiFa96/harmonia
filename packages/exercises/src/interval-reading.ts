import {
  diatonicIndex,
  durationValue,
  fraction,
  fractionEquals,
  LETTERS,
  midi,
  intervalBetween,
  formatInterval,
} from '@harmonia/theory';
import type { Pitch } from '@harmonia/theory';
import type { KeyboardRange } from '@harmonia/notation';
import type { ExerciseItem, IntervalItem, IntervalReadingQuestion } from './types.ts';

export function isIntervalReadingItem(
  item: ExerciseItem,
): item is IntervalItem & { readonly question: IntervalReadingQuestion } {
  return item.type === 'INTERVAL_IDENTIFY_VISUAL' && item.question !== undefined;
}

/** Die beiden sichtbaren natürlichen Noten sind die Quelle für Beschreibung und Bewertung. */
export function intervalReadingPitches(item: IntervalItem): readonly [Pitch, Pitch] {
  if (
    !isIntervalReadingItem(item) ||
    !['number', 'direction', 'motion', 'semitones', 'quality', 'perfect'].includes(item.question)
  )
    throw new RangeError('Keine Grundlagenfrage zum Intervall');
  const staff = item.score.staves[0];
  const measure = staff?.measures[0];
  const events = measure?.voices[0]?.events;
  const first = events?.[0],
    second = events?.[1];
  if (
    item.score.staves.length !== 1 ||
    staff?.measures.length !== 1 ||
    (staff.clef !== 'treble' && staff.clef !== 'bass') ||
    staff.keySignature.fifths !== 0 ||
    staff.timeSignature.numerator !== 4 ||
    staff.timeSignature.denominator !== 4 ||
    measure?.voices.length !== 1 ||
    measure.changes !== undefined ||
    events?.length !== 2 ||
    first?.kind !== 'note' ||
    second?.kind !== 'note' ||
    [first, second].some(
      (event) =>
        event.pitch.alter !== 0 ||
        event.tie ||
        event.duration.dots !== 0 ||
        event.duration.tuplet !== undefined ||
        !fractionEquals(durationValue(event.duration), fraction(1, 2)),
    )
  )
    throw new RangeError('Grundlagenfrage braucht zwei natürliche Halben in einem 4/4-Takt');
  const number = Math.abs(diatonicIndex(second.pitch) - diatonicIndex(first.pitch)) + 1;
  if (number > 8) throw new RangeError('Grundlagenfrage unterstützt Prime bis Oktave');
  if (item.question === 'perfect' && ![4, 5, 8].includes(number))
    throw new RangeError('Reinheitsfrage unterstützt Quarte, Quinte und Oktave');
  return [first.pitch, second.pitch];
}

export function intervalReadingNumber(item: IntervalItem): number {
  const [from, to] = intervalReadingPitches(item);
  return Math.abs(diatonicIndex(to) - diatonicIndex(from)) + 1;
}
export function intervalReadingDirection(item: IntervalItem): 'up' | 'down' | 'same' {
  const [from, to] = intervalReadingPitches(item);
  const delta = diatonicIndex(to) - diatonicIndex(from);
  return delta > 0 ? 'up' : delta < 0 ? 'down' : 'same';
}
export function intervalReadingPath(item: IntervalItem): readonly Pitch[] {
  const [from, to] = intervalReadingPitches(item);
  const start = diatonicIndex(from),
    end = diatonicIndex(to);
  const direction = end >= start ? 1 : -1;
  return Array.from({ length: Math.abs(end - start) + 1 }, (_, offset) => {
    const position = start + offset * direction;
    const letter = LETTERS[((position % 7) + 7) % 7];
    if (!letter) throw new RangeError('Stammton fehlt');
    return { letter, alter: 0, octave: Math.floor(position / 7) };
  });
}
export function intervalMotion(number: number): 'repeat' | 'step' | 'leap' {
  if (!Number.isInteger(number) || number < 1 || number > 8)
    throw new RangeError('Ungültige Intervallnummer');
  return number === 1 ? 'repeat' : number === 2 ? 'step' : 'leap';
}
export function intervalReadingSemitones(item: IntervalItem): number {
  const [from, to] = intervalReadingPitches(item);
  return Math.abs(midi(to) - midi(from));
}
/** Ausschnitt einschließlich beider weißen Endtasten und aller schwarzen Tasten dazwischen. */
export function intervalReadingKeyboardRange(item: IntervalItem): KeyboardRange {
  const pitches = intervalReadingPitches(item).map(midi);
  return { first: Math.min(...pitches), last: Math.max(...pitches) };
}
export function intervalReadingPerfect(item: IntervalItem): boolean {
  const number = intervalReadingNumber(item),
    distance = intervalReadingSemitones(item);
  return (
    (number === 4 && distance === 5) ||
    (number === 5 && distance === 7) ||
    (number === 8 && distance === 12)
  );
}
export function intervalReadingAnswer(item: IntervalItem): string {
  const number = intervalReadingNumber(item);
  switch (item.question) {
    case 'number':
      return `interval-number:${String(number)}`;
    case 'direction':
      return `interval-direction:${intervalReadingDirection(item)}`;
    case 'motion':
      return `interval-motion:${intervalMotion(number)}`;
    case 'semitones':
      return `interval-semitones:${String(intervalReadingSemitones(item))}`;
    case 'quality': {
      const [from, to] = intervalReadingPitches(item);
      return formatInterval({ ...intervalBetween(from, to), direction: 1 });
    }
    case 'perfect':
      return intervalReadingPerfect(item) ? 'interval-perfect:yes' : 'interval-perfect:no';
    default:
      throw new RangeError('Grundlagenfrage fehlt');
  }
}
