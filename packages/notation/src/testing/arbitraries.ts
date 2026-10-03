// Zufallsgeneratoren für eigenschaftsbasierte Tests (fast-check). Nicht Teil der öffentlichen Schnittstelle.

import type { Duration, Pitch, TimeSignature } from '@harmonia/theory';
import { ALL_KEYS, duration, LETTERS, NOTE_VALUES, pitch, timeSignature } from '@harmonia/theory';
import fc from 'fast-check';

import type {
  ChordNote,
  Clef,
  KeySignature,
  Measure,
  MeasureChanges,
  Score,
  Staff,
  VoiceEvent,
} from '../score.ts';
import { chord, CLEFS, keySignature, note, rest } from '../score.ts';

const pitchArbitrary: fc.Arbitrary<Pitch> = fc
  .record({
    letter: fc.constantFrom(...LETTERS),
    alter: fc.integer({ min: -2, max: 2 }),
    octave: fc.integer({ min: -1, max: 8 }),
  })
  .map(({ letter, alter, octave }) => pitch(letter, alter, octave));

/** Dauern ohne N-tolen (die Kurzschreibweise kennt sie noch nicht). */
const durationArbitrary: fc.Arbitrary<Duration> = fc
  .record({ value: fc.constantFrom(...NOTE_VALUES), dots: fc.integer({ min: 0, max: 3 }) })
  .map(({ value, dots }) => duration(value, dots));

const chordNotesArbitrary: fc.Arbitrary<ChordNote[]> = fc
  .uniqueArray(pitchArbitrary, {
    minLength: 2,
    maxLength: 4,
    selector: (p) => `${p.letter}${String(p.alter)}${String(p.octave)}`,
  })
  .chain((pitches) =>
    fc
      .array(fc.boolean(), { minLength: pitches.length, maxLength: pitches.length })
      .map((ties) => pitches.map((p, i) => ({ pitch: p, tie: ties[i] ?? false }))),
  );

export const eventArbitrary: fc.Arbitrary<VoiceEvent> = fc.oneof(
  fc.tuple(pitchArbitrary, durationArbitrary, fc.boolean()).map(([p, d, t]) => note(p, d, t)),
  durationArbitrary.map((d) => rest(d)),
  fc.tuple(chordNotesArbitrary, durationArbitrary).map(([notes, d]) => chord(notes, d)),
);

const clefArbitrary: fc.Arbitrary<Clef> = fc.constantFrom(...CLEFS);

const keySignatureArbitrary: fc.Arbitrary<KeySignature> = fc.oneof(
  fc.integer({ min: -7, max: 7 }).map((n) => keySignature(n)),
  fc.constantFrom(...ALL_KEYS).map((k) => keySignature(k)),
);

const TIME_SIGNATURES: readonly TimeSignature[] = [
  timeSignature(4, 4),
  timeSignature(3, 4),
  timeSignature(2, 2),
  timeSignature(6, 8),
  timeSignature(7, 8),
  timeSignature(7, 8, [3, 2, 2]),
  timeSignature(8, 8, [3, 3, 2]),
  timeSignature(5, 4),
  timeSignature(12, 16),
];

const timeArbitrary: fc.Arbitrary<TimeSignature> = fc.constantFrom(...TIME_SIGNATURES);

const changesArbitrary: fc.Arbitrary<MeasureChanges | undefined> = fc
  .record(
    { clef: clefArbitrary, keySignature: keySignatureArbitrary, timeSignature: timeArbitrary },
    { requiredKeys: [] },
  )
  .map((c) => (Object.keys(c).length > 0 ? c : undefined));

const measureArbitrary: fc.Arbitrary<Measure> = fc
  .tuple(
    changesArbitrary,
    fc.array(
      fc.array(eventArbitrary, { minLength: 1, maxLength: 5 }).map((events) => ({ events })),
      { minLength: 1, maxLength: 2 },
    ),
  )
  .map(([changes, voices]) => (changes ? { changes, voices } : { voices }));

const staffArbitrary: fc.Arbitrary<Staff> = fc
  .record({
    clef: clefArbitrary,
    keySignature: keySignatureArbitrary,
    timeSignature: timeArbitrary,
    measures: fc.array(measureArbitrary, { minLength: 1, maxLength: 4 }),
  })
  // Wechsel gibt es erst ab dem zweiten Takt; die Angaben des ersten gehören zum System.
  .map((staff) => ({
    ...staff,
    measures: staff.measures.map((m, i) => (i === 0 ? { voices: m.voices } : m)),
  }));

/** Beliebige Partitur mit 1–2 Systemen, Wechseln, mehreren Stimmen, Akkorden und Haltebögen. */
export const scoreArbitrary: fc.Arbitrary<Score> = fc
  .array(staffArbitrary, { minLength: 1, maxLength: 2 })
  .map((staves) => ({ staves }));
