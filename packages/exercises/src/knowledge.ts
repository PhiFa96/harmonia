import {
  compareFractions,
  duration,
  durationValue,
  formatInterval,
  formatPitch,
  LETTERS,
  midi,
  parseInterval,
} from '@harmonia/theory';
import type { Rng } from '@harmonia/theory';
import { MVP_METERS } from './rhythm.ts';
import { MVP_SCALE_TYPES } from './tonality.ts';
import { MVP_TRIAD_TYPES } from './chords.ts';
import { options } from './parameters.ts';
import type {
  ExerciseItem,
  KnowledgeExerciseItem,
  KnowledgeFact,
  KnowledgeItem,
  KnowledgeParams,
  KnowledgeTopic,
  MatchItem,
  MatchParams,
  OrderItem,
  OrderParams,
  OrderValue,
} from './types.ts';

export const KNOWLEDGE_TOPICS = [
  'accidentals',
  'noteValues',
  'intervals',
  'triads',
  'scales',
  'meters',
  'keyboard',
] as const;
export const ORDER_TOPICS = ['noteValues', 'pitches'] as const;
const VALUES = ['whole', 'half', 'quarter', 'eighth', 'sixteenth'] as const;
export function isKnowledgeItem(item: ExerciseItem): item is KnowledgeExerciseItem {
  return item.type === 'KNOWLEDGE_MC' || item.type === 'MATCH' || item.type === 'ORDER';
}
/** Fachdaten statt übersetzter Antworttexte; punktierte Werte bleiben eigenständige Begriffe. */
export function knowledgeFacts(
  topic: KnowledgeTopic,
  maxAccidentals: 1 | 2 = 2,
): readonly KnowledgeFact[] {
  if (![1, 2].includes(maxAccidentals)) throw new RangeError('Ungültiger Wissens-Vorzeichenumfang');
  switch (topic) {
    case 'keyboard':
      return (['semitone', 'wholeTone', 'twoBlackKeys', 'threeBlackKeys'] as const).map((kind) => ({
        topic,
        kind,
      }));
    case 'accidentals':
      return ([-2, -1, 0, 1, 2] as const)
        .filter((alter) => Math.abs(alter) <= maxAccidentals)
        .map((alter) => ({ topic, alter }));
    case 'noteValues':
      return VALUES.flatMap((value) =>
        [0, 1].map((dots) => ({ topic, duration: duration(value, dots) })),
      );
    case 'intervals':
      return [
        'P1',
        'm2',
        'M2',
        'm3',
        'M3',
        'P4',
        'A4',
        'd5',
        'P5',
        'm6',
        'M6',
        'm7',
        'M7',
        'P8',
      ].map((value) => ({ topic, interval: parseInterval(value) }));
    case 'triads':
      return MVP_TRIAD_TYPES.map((triad) => ({ topic, triad }));
    case 'scales':
      return MVP_SCALE_TYPES.map((scale) => ({ topic, scale }));
    case 'meters':
      return MVP_METERS.map((meter) => ({ topic, meter }));
  }
}
export function knowledgeFactId(fact: KnowledgeFact): string {
  switch (fact.topic) {
    case 'keyboard':
      return `keyboard:${fact.kind}`;
    case 'accidentals':
      return `accidental:${String(fact.alter)}`;
    case 'noteValues':
      return `duration:${fact.duration.value}:${String(fact.duration.dots)}`;
    case 'intervals':
      return `interval:${formatInterval(fact.interval)}`;
    case 'triads':
      return `triad:${fact.triad}`;
    case 'scales':
      return `scale:${fact.scale}`;
    case 'meters':
      return `meter:${fact.meter}`;
  }
}
function topics(params: KnowledgeParams): readonly KnowledgeTopic[] {
  if (!params.topics.length || params.topics.some((topic) => !KNOWLEDGE_TOPICS.includes(topic)))
    throw new RangeError('Ungültige Wissensthemen');
  return [...new Set(params.topics)];
}
export function generateKnowledge(params: KnowledgeParams, rng: Rng): KnowledgeItem {
  const facts = knowledgeFacts(rng.pick(topics(params)), params.maxAccidentals),
    fact = rng.pick(facts);
  return {
    type: 'KNOWLEDGE_MC',
    fact,
    choices: options(knowledgeFactId(fact), facts.map(knowledgeFactId), rng),
  };
}
export function generateMatch(params: MatchParams, rng: Rng): MatchItem {
  const allowed = topics(params),
    count = params.count ?? 3;
  // Eine andere Begriffsauswahl muss für Fehlerwiederholungen möglich bleiben.
  if (
    !Number.isInteger(count) ||
    count < 2 ||
    count > 4 ||
    allowed.some((topic) => count >= knowledgeFacts(topic, params.maxAccidentals).length)
  )
    throw new RangeError('Zuordnung braucht 2–4 Begriffe und mindestens eine weitere Variante');
  const facts = rng
    .shuffle(knowledgeFacts(rng.pick(allowed), params.maxAccidentals))
    .slice(0, count);
  return { type: 'MATCH', facts, choices: rng.shuffle(facts.map(knowledgeFactId)) };
}
export function orderValueId(value: OrderValue): string {
  return value.kind === 'pitch'
    ? `pitch:${formatPitch(value.pitch)}`
    : `duration:${value.duration.value}:${String(value.duration.dots)}`;
}
export function orderedValues(item: OrderItem): readonly OrderValue[] {
  return [...item.values].sort((a, b) => {
    if (a.kind !== b.kind) throw new RangeError('Gemischte Ordnungswerte');
    const comparison =
      a.kind === 'pitch' && b.kind === 'pitch'
        ? midi(a.pitch) - midi(b.pitch)
        : a.kind === 'duration' && b.kind === 'duration'
          ? compareFractions(durationValue(a.duration), durationValue(b.duration))
          : 0;
    return item.direction === 'ascending' ? comparison : -comparison;
  });
}
export function generateOrder(params: OrderParams, rng: Rng): OrderItem {
  const count = params.count ?? 4;
  if (
    !params.topics.length ||
    params.topics.some((topic) => !ORDER_TOPICS.includes(topic)) ||
    !Number.isInteger(count) ||
    count < 3 ||
    count > 6 ||
    !['ascending', 'descending', 'both'].includes(params.direction ?? 'both')
  )
    throw new RangeError('Ungültige Reihenfolgeparameter');
  const topic = rng.pick([...new Set(params.topics)]),
    direction =
      params.direction === 'both' || params.direction === undefined
        ? rng.pick(['ascending', 'descending'] as const)
        : params.direction;
  const available: readonly OrderValue[] =
    topic === 'noteValues'
      ? VALUES.flatMap((value) =>
          [0, 1].map((dots) => ({ kind: 'duration' as const, duration: duration(value, dots) })),
        )
      : [4, 5].flatMap((octave) =>
          LETTERS.map((letter) => ({
            kind: 'pitch' as const,
            pitch: { letter, alter: 0, octave },
          })),
        );
  const values = rng.shuffle(available).slice(0, count);
  return {
    type: 'ORDER',
    topic,
    direction,
    values,
    choices: rng.shuffle(values.map(orderValueId)),
  };
}
export function matchAnswerId(ids: readonly (string | null)[]): string {
  return `match:${ids.map((id) => id ?? '').join(',')}`;
}
export function orderAnswerId(ids: readonly string[]): string {
  return `order:${ids.join(',')}`;
}
/** Teilantworten sind editierbar, aber noch keine Wertung; IDs sind vollständig kanonisch. */
export function matchAnswerValues(
  item: MatchItem,
  answer: string,
): readonly (string | null)[] | undefined {
  if (!answer.startsWith('match:') || answer.length > 1000) return undefined;
  const values = answer
      .slice(6)
      .split(',')
      .map((value) => value || null),
    filled = values.filter((value) => value !== null);
  return values.length === item.facts.length &&
    new Set(filled).size === filled.length &&
    filled.every((value) => item.choices.includes(value)) &&
    matchAnswerId(values) === answer
    ? values
    : undefined;
}
export function orderAnswerValues(item: OrderItem, answer: string): readonly string[] | undefined {
  if (!answer.startsWith('order:') || answer.length > 1000) return undefined;
  const values = answer === 'order:' ? [] : answer.slice(6).split(',');
  return values.length <= item.values.length &&
    new Set(values).size === values.length &&
    values.every((value) => item.choices.includes(value)) &&
    orderAnswerId(values) === answer
    ? values
    : undefined;
}
export function knowledgeChoiceFact(
  item: KnowledgeItem | MatchItem,
  id: string,
): KnowledgeFact | undefined {
  return (item.type === 'MATCH' ? item.facts : knowledgeFacts(item.fact.topic)).find(
    (fact) => knowledgeFactId(fact) === id,
  );
}
export function knowledgeStatuses(item: MatchItem | OrderItem, answer: string): readonly boolean[] {
  const expected =
    item.type === 'MATCH' ? item.facts.map(knowledgeFactId) : orderedValues(item).map(orderValueId);
  const actual =
    item.type === 'MATCH' ? matchAnswerValues(item, answer) : orderAnswerValues(item, answer);
  return expected.map((id, index) => actual?.[index] === id);
}
