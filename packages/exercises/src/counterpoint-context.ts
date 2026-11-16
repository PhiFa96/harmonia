import {
  analyzeFirstSpecies,
  diatonicIndex,
  duration,
  durationValue,
  midi,
  parsePitch,
  transpose,
  type CounterpointDyad,
  type Rng,
} from '@harmonia/theory';
import { note, singleStaffScore, validateScore, type Score } from '@harmonia/notation';

// Original short arithmetic models. Passing means only the nine named profile rules.
// Distinct cantus/counterpoint contours and four, five and six simultaneous events.
const MODELS = [
  'C4 C5 | G4 B4 | D4 B4 | C4 C5',
  'C4 G4 | F4 D5 | D4 B4 | C4 C5',
  'C4 C5 | G4 E5 | D4 B4 | C4 C5',
  'C4 G4 | E4 G4 | B3 D5 | C4 C5',
  'C4 C5 | E4 G4 | B3 D5 | C4 C5',
  'C4 C5 | D4 A4 | B3 D5 | C4 C5',
  'C4 G4 | E4 C5 | D4 B4 | C4 C5',
  'C4 C5 | E4 B4 | B3 D5 | C4 C5',
  'C4 C5 | E4 G4 | C4 G4 | B3 D5 | C4 C5',
  'C4 C5 | B3 G4 | D4 B4 | B3 D5 | C4 C5',
  'C4 C5 | F4 A4 | E4 G4 | D4 B4 | C4 C5',
  'C4 G4 | C4 C5 | F4 A4 | D4 B4 | C4 C5',
  'C4 G4 | F4 D5 | C4 E5 | D4 B4 | C4 C5',
  'C4 G4 | E4 C5 | C4 A4 | B3 D5 | C4 C5',
  'C4 C5 | B3 D5 | C4 G4 | D4 B4 | C4 C5',
  'C4 G4 | F4 D5 | D4 B4 | B3 D5 | C4 C5',
  'C4 C5 | E4 C5 | B3 D5 | C4 A4 | D4 B4 | C4 C5',
  'C4 G4 | E4 C5 | F4 A4 | E4 B4 | D4 B4 | C4 C5',
  'C4 G4 | E4 C5 | E4 G4 | D4 B4 | B3 D5 | C4 C5',
  'C4 G4 | B3 D5 | E4 B4 | E4 G4 | B3 D5 | C4 C5',
  'C4 C5 | D4 B4 | D4 D5 | C4 A4 | B3 D5 | C4 C5',
  'C4 G4 | D4 B4 | C4 E4 | B3 B4 | D4 B4 | C4 C5',
  'C4 G4 | B3 B4 | C4 A4 | C4 A4 | D4 B4 | C4 C5',
  'C4 C5 | E4 C5 | C4 A4 | G4 E5 | D4 B4 | C4 C5',
] as const;

function model(text: string): CounterpointDyad[] {
  return text.split(' | ').map((bar) => {
    const [lower, upper] = bar.split(' ');
    if (!lower || !upper) throw new RangeError('Incomplete counterpoint model');
    return { lower: parsePitch(lower), upper: parsePitch(upper) };
  });
}
function partScore(dyads: readonly CounterpointDyad[]): Score {
  const clefFor = (part: 'upper' | 'lower') => {
    const cost = (bottom: number) =>
      Math.max(
        ...dyads.map((d) => {
          const position = diatonicIndex(d[part]);
          return Math.max(0, bottom - position, position - bottom - 8);
        }),
      );
    return cost(diatonicIndex(parsePitch('G2'))) < cost(diatonicIndex(parsePitch('E4')))
      ? ('bass' as const)
      : ('treble' as const);
  };
  return {
    staves: (['upper', 'lower'] as const).flatMap(
      (part) =>
        singleStaffScore(
          dyads.map((d) => [note(d[part], duration('whole'))]),
          { clef: clefFor(part) },
        ).staves,
    ),
  };
}

/** First staff = counterpoint, second = cantus, even if the parts cross. */
export function counterpointDyads(score: Score): CounterpointDyad[] {
  if (validateScore(score).length || ![1, 2].includes(score.staves.length))
    throw new RangeError('Valid counterpoint staves required');
  const first = score.staves[0];
  if (!first) throw new RangeError('Missing counterpoint staff');
  if (score.staves.length === 1) {
    // Historical one-staff dyad notation had only a low/high convention. Retain its
    // interpretation for old sources; every newly generated source has named parts.
    return first.measures.flatMap((m) => {
      if (m.changes || m.voices.length !== 1) throw new RangeError('One unchanged voice required');
      return (m.voices[0]?.events ?? []).map((e) => {
        if (
          e.kind !== 'chord' ||
          e.notes.length !== 2 ||
          e.notes.some((n) => n.tie) ||
          durationValue(e.duration).num !== durationValue(e.duration).den
        )
          throw new RangeError('Whole-note dyads required');
        const pitches = e.notes.map((n) => n.pitch).sort((a, b) => midi(a) - midi(b));
        const lower = pitches[0],
          upper = pitches[1];
        if (!lower || !upper) throw new RangeError('Missing dyad');
        return { lower, upper };
      });
    });
  }
  const second = score.staves[1];
  if (second?.measures.length !== first.measures.length)
    throw new RangeError('Aligned counterpoint staves required');
  const values = score.staves.map((s) =>
    s.measures.map((m) => {
      const e = m.voices[0]?.events[0];
      if (
        m.changes ||
        m.voices.length !== 1 ||
        m.voices[0]?.events.length !== 1 ||
        e?.kind !== 'note' ||
        e.tie ||
        durationValue(e.duration).num !== durationValue(e.duration).den
      )
        throw new RangeError('One untied whole note per part and measure required');
      return e.pitch;
    }),
  );
  return first.measures.map((_, i) => {
    const upper = values[0]?.[i],
      lower = values[1]?.[i];
    if (!upper || !lower) throw new RangeError('Missing aligned counterpoint');
    return { lower, upper };
  });
}

/** Describes only the named cantus's final motion, independently of the nine-rule verdict. */
export function counterpointCantusEnding(score: Score) {
  // A historical single staff has no fixed part identity when pitches cross.
  if (score.staves.length !== 2) return undefined;
  const dyads = counterpointDyads(score),
    from = dyads.at(-2)?.lower,
    to = dyads.at(-1)?.lower;
  if (!from || !to) return undefined;
  const written = diatonicIndex(to) - diatonicIndex(from),
    sounding = midi(to) - midi(from),
    kind =
      written === 1 && sounding === 1
        ? 'ascending-semitone'
        : written === -1 && sounding === -2
          ? 'descending-tone'
          : 'other-motion';
  return { kind, from, to } as const;
}

export function generateCounterpointSource(
  topic: 'counterpoint-consonance' | 'counterpoint-motion' | 'counterpoint-check',
  rng: Rng,
): Score {
  let dyads: CounterpointDyad[];
  if (topic === 'counterpoint-check') {
    dyads = model(rng.pick(MODELS));
    if (rng.pick([true, false])) {
      const at = rng.int(1, dyads.length - 2),
        d = dyads[at];
      if (!d) throw new RangeError('Missing model dyad');
      switch (rng.int(0, 7)) {
        case 0: {
          const first = dyads[0];
          if (first) dyads[0] = { ...first, upper: transpose(first.lower, 2, 4) };
          break;
        }
        case 1:
          dyads[at] = { ...d, upper: transpose(d.lower, 3, 5) };
          break;
        case 2:
          dyads[at] = { ...d, upper: transpose(d.lower, -2, -3) };
          break;
        case 3:
          dyads[at] = { ...d, upper: d.lower };
          break;
        case 4:
          dyads = dyads.map((v) => ({ ...v, lower: transpose(v.lower, -7, -12) }));
          break;
        case 5:
          for (const i of [0, 1]) {
            const p = dyads[i];
            if (p) dyads[i] = { ...p, upper: transpose(p.lower, 4, 7) };
          }
          break;
        case 6: {
          const previous = dyads[at - 1];
          if (previous) {
            const lower = transpose(previous.upper, 1, 2);
            dyads[at] = { lower, upper: transpose(lower, 2, 4) };
          }
          break;
        }
        case 7: {
          const last = dyads[dyads.length - 1];
          if (last) dyads[dyads.length - 1] = { ...last, upper: transpose(last.lower, 4, 7) };
          break;
        }
      }
      if (!analyzeFirstSpecies(dyads).length)
        throw new RangeError('Fault model must exhibit a profile finding');
    }
  } else
    dyads = model(
      rng.pick(
        topic === 'counterpoint-consonance'
          ? [
              'C4 E4',
              'C4 Eb4',
              'C4 F4',
              'C4 G4',
              'C4 A4',
              'C4 D#4',
              'C4 Gb4',
              'C4 C5',
              'C4 B4',
              'D4 F4',
              'E4 B4',
              'F4 B4',
            ]
          : [
              'C4 G4 | D4 A4',
              'C4 G4 | D4 F4',
              'C4 G4 | C4 A4',
              'C4 G4 | C4 G4',
              'E4 C5 | D4 B4',
              'D4 A4 | C4 B4',
              'D4 B4 | D4 A4',
              'E4 G4 | E4 G4',
            ],
      ),
    );
  const shifts = (
    [
      [0, 0],
      [1, 2],
      [2, 4],
      [3, 5],
      [-1, -2],
    ] as const
  ).filter((shift) =>
    dyads.every((d) => [d.lower, d.upper].every((p) => midi(p) + shift[1] <= 84)),
  );
  const shift = rng.pick(shifts.length ? shifts : ([[-1, -2]] as const));
  return partScore(
    dyads.map((d) => ({
      lower: transpose(d.lower, shift[0], shift[1]),
      upper: transpose(d.upper, shift[0], shift[1]),
    })),
  );
}
