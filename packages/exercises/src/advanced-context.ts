import {
  analyzeFirstSpecies,
  contrapuntalMotion,
  duration,
  durationValue,
  formatPitch,
  fromMidi,
  intervalClassVector,
  isCounterpointConsonance,
  isTwelveToneRow,
  matchingMotifTransforms,
  midi,
  MOTIF_TRANSFORMS,
  parsePitch,
  pitchClass,
  pitchClassSet,
  rotatePattern,
  sectionPattern,
  transformMotif,
  transpose,
  type Rng,
} from '@harmonia/theory';
import { note, parseScore, singleStaffScore, validateScore, type Score } from '@harmonia/notation';
import type { ContextItem, ContextTopic } from './context.ts';
import { options } from './parameters.ts';

export const ADVANCED_CONTEXT_TOPICS = [
  'counterpoint-consonance',
  'counterpoint-motion',
  'counterpoint-check',
  'motif-transform',
  'form-sections',
  'row-transform',
  'row-validity',
  'set-cardinality',
  'set-vector',
  'minimal-phase',
] as const;
export type AdvancedContextTopic = (typeof ADVANCED_CONTEXT_TOPICS)[number];
export function isAdvancedContextTopic(topic: ContextTopic): topic is AdvancedContextTopic {
  return (ADVANCED_CONTEXT_TOPICS as readonly string[]).includes(topic);
}
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new RangeError('Missing analysis material');
  return value;
}
function measures(score: Score) {
  if (validateScore(score).length || score.staves.length !== 1)
    throw new RangeError('One valid staff required');
  const staff = required(score.staves[0]);
  if (staff.measures.some((m) => m.voices.length !== 1 || m.changes))
    throw new RangeError('One voice without changes required');
  return staff.measures.map((m) => required(m.voices[0]).events);
}
function dyads(score: Score) {
  return measures(score).flatMap((events) =>
    events.map((event) => {
      if (
        event.kind !== 'chord' ||
        event.notes.length !== 2 ||
        event.notes.some((n) => n.tie) ||
        durationValue(event.duration).num !== durationValue(event.duration).den
      )
        throw new RangeError('Whole-note dyads required');
      // The display uses the lower note as cantus; identity cannot swap between chords.
      const pitches = event.notes.map((n) => n.pitch).sort((a, b) => midi(a) - midi(b));
      return { lower: required(pitches[0]), upper: required(pitches[1]) };
    }),
  );
}
function monophonic(score: Score) {
  return measures(score).map((events) =>
    events.map((event) => {
      if (
        event.kind !== 'note' ||
        event.tie ||
        durationValue(event.duration).num !== 1 ||
        durationValue(event.duration).den !== 4
      )
        throw new RangeError('Untied quarter notes required');
      return midi(event.pitch);
    }),
  );
}
export function counterpointContextFindings(score: Score) {
  return analyzeFirstSpecies(dyads(score));
}
export function advancedContextAnswer(topic: AdvancedContextTopic, score: Score): string {
  if (topic === 'counterpoint-check')
    return `boolean:${counterpointContextFindings(score).length ? 'no' : 'yes'}`;
  if (topic === 'counterpoint-consonance') {
    const values = dyads(score);
    if (values.length !== 1) throw new RangeError('One dyad required');
    const dyad = required(values[0]);
    return `boolean:${isCounterpointConsonance(dyad.lower, dyad.upper) ? 'yes' : 'no'}`;
  }
  if (topic === 'counterpoint-motion') {
    const values = dyads(score);
    if (values.length !== 2) throw new RangeError('Two dyads required');
    return `motion:${contrapuntalMotion(required(values[0]), required(values[1]))}`;
  }
  const bars = monophonic(score),
    pitches = bars.flat();
  if (topic === 'row-validity') return `boolean:${isTwelveToneRow(pitches) ? 'yes' : 'no'}`;
  if (topic === 'set-cardinality') return `cardinality:${String(pitchClassSet(pitches).length)}`;
  if (topic === 'set-vector') return `vector:${intervalClassVector(pitches).join(',')}`;
  if (topic === 'form-sections')
    return `sections:${sectionPattern(bars.map((bar) => bar.join(',')))}`;
  if (topic === 'minimal-phase') {
    if (bars.length !== 2 || bars.some((bar) => bar.length !== 4))
      throw new RangeError('Two four-pulse patterns required');
    const first = required(bars[0]),
      second = required(bars[1]);
    const matches = first.flatMap((_, offset) =>
      rotatePattern(first, offset).every((v, i) => v === second[i]) ? [offset] : [],
    );
    if (matches.length !== 1) throw new RangeError('Ambiguous rotation');
    return `rotation:${String(required(matches[0]))}`;
  }
  const row = topic === 'row-transform';
  if (bars.length !== (row ? 6 : 2) || bars.some((bar) => bar.length !== 4))
    throw new RangeError('Two equal-length models required');
  const middle = pitches.length / 2,
    first = pitches.slice(0, middle),
    second = pitches.slice(middle);
  if (row && (!isTwelveToneRow(first) || !isTwelveToneRow(second)))
    throw new RangeError('Two complete rows required');
  const matches = matchingMotifTransforms(first, second, row);
  if (matches.length !== 1) throw new RangeError('Ambiguous transformation');
  return `transform:${required(matches[0])}`;
}
function melody(values: readonly number[]): Score {
  return singleStaffScore(
    Array.from({ length: values.length / 4 }, (_, index) =>
      values
        .slice(index * 4, index * 4 + 4)
        .map((value) => note(fromMidi(value), duration('quarter'))),
    ),
  );
}
export function generateAdvancedContext(topic: AdvancedContextTopic, rng: Rng): ContextItem {
  let score: Score, choices: string[];
  if (topic.startsWith('counterpoint-')) {
    const models =
      topic === 'counterpoint-consonance'
        ? ['C4 E4', 'C4 F4', 'C4 G4', 'C4 A4', 'C4 D#4', 'C4 Gb4', 'C4 C5', 'C4 B4']
        : topic === 'counterpoint-motion'
          ? ['C4 G4 | D4 A4', 'C4 G4 | D4 F4', 'C4 G4 | C4 A4', 'C4 G4 | C4 G4']
          : [
              'C4 G4 | E4 G4 | D4 B4 | C4 C5',
              'C4 G4 | E4 A4 | D4 B4 | C4 C5',
              'C4 G4 | D4 A4 | D4 B4 | C4 C5',
              'C4 E4 | E4 G4 | D4 B4 | C4 C5',
            ];
    const shift = rng.pick([
      [0, 0],
      [1, 2],
      [2, 4],
      [3, 5],
    ] as const);
    const model = rng
      .pick(models)
      .split(' | ')
      .map(
        (bar) =>
          `(${bar
            .split(' ')
            .map((name) => formatPitch(transpose(parsePitch(name), shift[0], shift[1])))
            .join(' ')})/1`,
      )
      .join(' | ');
    score = parseScore(`treble | 4/4 | ${model}`);
    choices =
      topic === 'counterpoint-motion'
        ? ['contrary', 'similar', 'oblique', 'static'].map((v) => `motion:${v}`)
        : ['boolean:yes', 'boolean:no'];
  } else if (topic === 'set-cardinality' || topic === 'set-vector') {
    const offset = rng.int(0, 5),
      material = rng.pick([
        [60, 64, 67, 72],
        [60, 61, 64, 65],
        [60, 62, 64, 66],
        [60, 60, 72, 72],
      ]);
    score = melody(material.map((v) => v + offset));
    choices =
      topic === 'set-cardinality'
        ? [1, 2, 3, 4].map((v) => `cardinality:${String(v)}`)
        : ['0,0,1,1,1,0', '2,0,1,2,1,0', '0,3,0,2,0,1', '0,0,0,0,0,0'].map((v) => `vector:${v}`);
  } else if (topic === 'row-validity' || topic === 'row-transform') {
    // Own asymmetric series; not a quotation. Ambiguity is checked from the displayed source.
    const offset = rng.int(0, 11),
      first = [0, 1, 4, 2, 7, 5, 8, 6, 11, 9, 3, 10].map((v) => pitchClass(v + offset));
    if (topic === 'row-validity') {
      if (rng.pick([true, false])) first[rng.int(1, 11)] = required(first[0]);
      score = melody(first.map((v) => v + 60));
      choices = ['boolean:yes', 'boolean:no'];
    } else {
      const second = transformMotif(first, rng.pick(MOTIF_TRANSFORMS), rng.int(0, 11)).map(
        pitchClass,
      );
      score = melody([...first, ...second].map((v) => v + 60));
      choices = MOTIF_TRANSFORMS.map((v) => `transform:${v}`);
    }
  } else {
    const offset = rng.int(0, 5),
      first = rng
        .pick([
          [60, 62, 65, 64],
          [60, 64, 67, 65],
          [62, 65, 64, 69],
        ])
        .map((v) => v + offset);
    if (topic === 'form-sections') {
      const other = first.map((v) => v + 2),
        third = first.map((v) => v - 2);
      const form = rng.pick(['ABACA', 'ABABA', 'ABCAB', 'ABABC']);
      score = melody(
        Array.from(form).flatMap((v) => (v === 'A' ? first : v === 'B' ? other : third)),
      );
      choices = ['ABACA', 'ABABA', 'ABCAB', 'ABABC'].map((v) => `sections:${v}`);
    } else if (topic === 'minimal-phase') {
      score = melody([...first, ...rotatePattern(first, rng.int(0, 3))]);
      choices = [0, 1, 2, 3].map((v) => `rotation:${String(v)}`);
    } else {
      const raw = transformMotif(first, rng.pick(MOTIF_TRANSFORMS));
      const shift = rng.int(65, 70) - required(raw[0]);
      score = melody([...first, ...raw.map((v) => v + shift)]);
      choices = MOTIF_TRANSFORMS.map((v) => `transform:${v}`);
    }
  }
  const answer = advancedContextAnswer(topic, score);
  return {
    type: 'CONTEXT_CHOICE',
    topic,
    source: { kind: 'score', score },
    choices: options(answer, choices, rng),
  };
}
