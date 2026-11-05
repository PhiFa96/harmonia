import {
  analyzeFirstSpecies,
  contrapuntalMotion,
  duration,
  durationValue,
  fromMidi,
  intervalClassVector,
  isCounterpointConsonance,
  isTwelveToneRow,
  matchingMotifTransforms,
  midi,
  MOTIF_TRANSFORMS,
  pitchClass,
  pitchClassSet,
  rotatePattern,
  sectionPattern,
  transformMotif,
  type Rng,
} from '@harmonia/theory';
import { note, singleStaffScore, validateScore, type Score } from '@harmonia/notation';
import { counterpointDyads, generateCounterpointSource } from './counterpoint-context.ts';
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
  return analyzeFirstSpecies(counterpointDyads(score));
}
export function advancedContextAnswer(topic: AdvancedContextTopic, score: Score): string {
  if (topic === 'counterpoint-check')
    return `boolean:${counterpointContextFindings(score).length ? 'no' : 'yes'}`;
  if (topic === 'counterpoint-consonance') {
    const values = counterpointDyads(score);
    if (values.length !== 1) throw new RangeError('One dyad required');
    const dyad = required(values[0]);
    return `boolean:${isCounterpointConsonance(dyad.lower, dyad.upper) ? 'yes' : 'no'}`;
  }
  if (topic === 'counterpoint-motion') {
    const values = counterpointDyads(score);
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
  if (
    topic === 'counterpoint-consonance' ||
    topic === 'counterpoint-motion' ||
    topic === 'counterpoint-check'
  ) {
    score = generateCounterpointSource(topic, rng);
    choices =
      topic === 'counterpoint-motion'
        ? ['contrary', 'similar', 'oblique', 'static'].map((v) => `motion:${v}`)
        : ['boolean:yes', 'boolean:no'];
  } else if (topic === 'set-cardinality' || topic === 'set-vector') {
    const cardinality = rng.int(1, 4),
      classes = rng.shuffle(Array.from({ length: 12 }, (_, i) => i)).slice(0, cardinality);
    const values = [
      ...classes,
      ...Array.from({ length: 4 - cardinality }, () => rng.pick(classes)),
    ];
    score = melody(
      rng.shuffle(values).map((v) => 60 + v + (v <= 7 && rng.pick([true, false]) ? 12 : 0)),
    );
    choices =
      topic === 'set-cardinality'
        ? [1, 2, 3, 4].map((v) => `cardinality:${String(v)}`)
        : ['0,0,1,1,1,0', '2,0,1,2,1,0', '0,3,0,2,0,1', '0,0,0,0,0,0'].map((v) => `vector:${v}`);
  } else if (topic === 'row-validity' || topic === 'row-transform') {
    // Own asymmetric series; not a quotation. Ambiguity is checked from the displayed source.
    let first = rng.shuffle(Array.from({ length: 12 }, (_, i) => i));
    if (topic === 'row-validity') {
      if (rng.pick([true, false])) {
        const duplicate = rng.int(0, 11),
          positions = rng
            .shuffle(Array.from({ length: 12 }, (_, i) => i).filter((i) => i !== duplicate))
            .slice(0, rng.int(1, 3));
        for (const index of positions) first[index] = required(first[duplicate]);
      }
      score = melody(first.map((v) => v + 60));
      choices = ['boolean:yes', 'boolean:no'];
    } else {
      const operation = rng.pick(MOTIF_TRANSFORMS),
        shift = rng.int(0, 11);
      let second = transformMotif(first, operation, shift).map(pitchClass);
      for (let attempt = 0; matchingMotifTransforms(first, second, true).length !== 1; attempt++) {
        first =
          attempt < 15
            ? rng.shuffle(Array.from({ length: 12 }, (_, i) => i))
            : [0, 1, 4, 2, 7, 5, 8, 6, 11, 9, 3, 10];
        second = transformMotif(first, operation, shift).map(pitchClass);
      }
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
