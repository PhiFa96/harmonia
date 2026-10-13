import {
  addFractions,
  fraction,
  fractionEquals,
  subtractFractions,
  ZERO,
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
  KnowledgeMcParams,
  DurationLimits,
  MeasureGap,
  RhythmValue,
  KnowledgeTopic,
  HistoryKind,
  HistoryTopic,
  MatchItem,
  MatchParams,
  OrderItem,
  OrderParams,
  OrderValue,
} from './types.ts';

export const HISTORY_FACTS: Readonly<Record<HistoryTopic, readonly HistoryKind[]>> = {
  soundSources: ['voice', 'instrument', 'recording', 'electronic'],
  sourceTypes: ['score', 'recording', 'report', 'programme'],
  context: ['place', 'time', 'occasion', 'author'],
  periods: ['medieval', 'renaissance', 'baroque', 'classical', 'romantic', 'since1900'],
  genreContext: ['genre', 'forces', 'occasion', 'function'],
  evidence: ['observation', 'metadata', 'inference', 'uncertainty'],
};
export const HISTORY_PERIODS = [
  'medieval',
  'renaissance',
  'baroque',
  'classical',
  'romantic',
  'since1900',
] as const;
export function isHistoryTopic(topic: KnowledgeTopic): topic is HistoryTopic {
  return Object.hasOwn(HISTORY_FACTS, topic);
}
export const KNOWLEDGE_TOPICS = [
  'soundSources',
  'sourceTypes',
  'context',
  'periods',
  'genreContext',
  'evidence',
  'accidentals',
  'noteValues',
  'rests',
  'barlines',
  'intervals',
  'triads',
  'scales',
  'meters',
  'keyboard',
  'pulse',
  'tempo',
  'beatGroup',
] as const;
export const ORDER_TOPICS = ['noteValues', 'pitches', 'periods'] as const;
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
  if (isHistoryTopic(topic)) return HISTORY_FACTS[topic].map((kind) => ({ topic, kind }));
  switch (topic) {
    case 'pulse':
      return (['pulse', 'rhythm', 'metronome', 'countIn'] as const).map((kind) => ({
        topic,
        kind,
      }));
    case 'tempo':
      return (['tempo', 'bpm', 'faster', 'slower'] as const).map((kind) => ({ topic, kind }));
    case 'beatGroup':
      return (['first', 'duple', 'triple', 'quadruple'] as const).map((kind) => ({ topic, kind }));
    case 'keyboard':
      return (['semitone', 'wholeTone', 'twoBlackKeys', 'threeBlackKeys'] as const).map((kind) => ({
        topic,
        kind,
      }));
    case 'accidentals':
      return ([-2, -1, 0, 1, 2] as const)
        .filter((alter) => Math.abs(alter) <= maxAccidentals)
        .map((alter) => ({ topic, alter }));
    case 'barlines':
      return (['single', 'final'] as const).map((kind) => ({ topic, kind }));
    case 'rests':
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
  if (isHistoryTopic(fact.topic) && 'kind' in fact) {
    if (!HISTORY_FACTS[fact.topic].includes(fact.kind as HistoryKind))
      throw new RangeError('Unbekannter Geschichtsbegriff');
    return `${fact.topic}:${fact.kind}`;
  }
  switch (fact.topic) {
    case 'pulse':
    case 'tempo':
    case 'beatGroup':
    case 'barlines':
      return `${fact.topic}:${fact.kind}`;
    case 'keyboard':
      return `keyboard:${fact.kind}`;
    case 'accidentals':
      return `accidental:${String(fact.alter)}`;
    case 'rests':
      return `rest:${fact.duration.value}:${String(fact.duration.dots)}`;
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
  throw new RangeError('Unbekannter Wissensbegriff');
}
function topics(params: KnowledgeParams): readonly KnowledgeTopic[] {
  if (!params.topics.length || params.topics.some((topic) => !KNOWLEDGE_TOPICS.includes(topic)))
    throw new RangeError('Ungültige Wissensthemen');
  return [...new Set(params.topics)];
}
function durationLimit(params: DurationLimits, allowed: readonly string[]) {
  if (
    params.maxDots !== undefined &&
    (![0, 1].includes(params.maxDots) ||
      allowed.some((topic) => !['noteValues', 'rests'].includes(topic)))
  )
    throw new RangeError('Punktierungsgrenze nur für Noten- und Pausenwerte');
}
function factsFor(topic: KnowledgeTopic, params: KnowledgeParams) {
  return knowledgeFacts(topic, params.maxAccidentals).filter(
    (fact) => !('duration' in fact) || fact.duration.dots <= (params.maxDots ?? 1),
  );
}
/** Exakte Summe der sichtbaren Ereignisse; die gespeicherte Antwort ist kein Bewertungsorakel. */
export function measureGapFact(gap: MeasureGap): KnowledgeFact {
  if (
    !['note', 'rest'].includes(gap.missingKind) ||
    !gap.events.length ||
    gap.events.some(
      (event) =>
        !['note', 'rest'].includes(event.kind) ||
        !VALUES.includes(event.duration.value as (typeof VALUES)[number]) ||
        event.duration.dots !== 0 ||
        event.duration.tuplet !== undefined,
    )
  )
    throw new RangeError('Ungültige Taktlücke');
  const used = gap.events.reduce(
    (sum, event) => addFractions(sum, durationValue(event.duration)),
    ZERO,
  );
  const missing = subtractFractions(fraction(1, 1), used);
  const value = VALUES.find((value) => fractionEquals(durationValue(duration(value)), missing));
  if (!value) throw new RangeError('Taktlücke braucht genau einen unpunktierten Wert');
  return { topic: gap.missingKind === 'rest' ? 'rests' : 'noteValues', duration: duration(value) };
}
function generateGap(kind: 'note' | 'rest', rng: Rng): MeasureGap {
  const missing = rng.pick([8, 4, 2, 1]);
  let remaining = 16 - missing;
  const parts: number[] = [];
  for (const size of [8, 4, 2, 1]) {
    if (remaining >= size) {
      parts.push(size);
      remaining -= size;
    }
  }
  // Höchstens sechs sichtbare Ereignisse, mit wechselnden Noten und Pausen.
  for (let i = 0; i < 2; i++) {
    const candidates = parts.flatMap((size, index) => (size > 1 ? [index] : []));
    if (!candidates.length) break;
    const index = rng.pick(candidates),
      size = parts[index];
    if (size) parts.splice(index, 1, size / 2, size / 2);
  }
  const events: RhythmValue[] = rng.shuffle(parts).map((size) => ({
    kind: rng.pick(['note', 'rest'] as const),
    duration: duration(
      size === 8 ? 'half' : size === 4 ? 'quarter' : size === 2 ? 'eighth' : 'sixteenth',
    ),
  }));
  return { events, missingKind: kind };
}
export function generateKnowledge(params: KnowledgeMcParams, rng: Rng): KnowledgeItem {
  const allowed = topics(params);
  durationLimit(params, allowed);
  if (
    params.presentation !== undefined &&
    (!['symbol', 'measure-gap'].includes(params.presentation) ||
      allowed.some((topic) => !['noteValues', 'rests'].includes(topic)) ||
      params.maxDots !== 0)
  )
    throw new RangeError('Zeichen und Taktlücken brauchen unpunktierte Noten-/Pausenwerte');
  const topic = rng.pick(allowed),
    facts = factsFor(topic, params);
  const gap =
    params.presentation === 'measure-gap'
      ? generateGap(topic === 'rests' ? 'rest' : 'note', rng)
      : undefined;
  const fact = gap ? measureGapFact(gap) : rng.pick(facts);
  return {
    type: 'KNOWLEDGE_MC',
    fact,
    ...(params.presentation ? { presentation: params.presentation } : {}),
    ...(gap ? { gap } : {}),
    choices: options(knowledgeFactId(fact), facts.map(knowledgeFactId), rng),
  };
}
export function generateMatch(params: MatchParams, rng: Rng): MatchItem {
  const allowed = topics(params),
    count = params.count ?? 3;
  durationLimit(params, allowed);
  // Eine andere Begriffsauswahl muss für Fehlerwiederholungen möglich bleiben.
  if (
    !Number.isInteger(count) ||
    count < 2 ||
    count > 4 ||
    allowed.some((topic) => count >= factsFor(topic, params).length)
  )
    throw new RangeError('Zuordnung braucht 2–4 Begriffe und mindestens eine weitere Variante');
  const facts = rng.shuffle(factsFor(rng.pick(allowed), params)).slice(0, count);
  return { type: 'MATCH', facts, choices: rng.shuffle(facts.map(knowledgeFactId)) };
}
export function orderValueId(value: OrderValue): string {
  if (value.kind === 'period') return `period:${value.period}`;
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
          : a.kind === 'period' && b.kind === 'period'
            ? HISTORY_PERIODS.indexOf(a.period as (typeof HISTORY_PERIODS)[number]) -
              HISTORY_PERIODS.indexOf(b.period as (typeof HISTORY_PERIODS)[number])
            : 0;
    return item.direction === 'ascending' ? comparison : -comparison;
  });
}
export function generateOrder(params: OrderParams, rng: Rng): OrderItem {
  const count = params.count ?? 4;
  durationLimit(params, params.topics);
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
          [0, 1]
            .filter((dots) => dots <= (params.maxDots ?? 1))
            .map((dots) => ({ kind: 'duration' as const, duration: duration(value, dots) })),
        )
      : topic === 'periods'
        ? HISTORY_PERIODS.map((period) => ({ kind: 'period' as const, period }))
        : [4, 5].flatMap((octave) =>
            LETTERS.map((letter) => ({
              kind: 'pitch' as const,
              pitch: { letter, alter: 0, octave },
            })),
          );
  if (count > available.length) throw new RangeError('Zu wenige verschiedene Werte');
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
