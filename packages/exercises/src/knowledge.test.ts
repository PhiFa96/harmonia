import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type {
  ExerciseItem,
  ExerciseSpec,
  KnowledgeParams,
  MatchParams,
  OrderItem,
  OrderParams,
} from './index.ts';
import {
  activeLessonSession,
  answerLesson,
  answerSession,
  choiceLabel,
  createLessonSession,
  createRng,
  createSession,
  currentItem,
  evaluateExercise,
  exerciseDescription,
  exerciseFeedback,
  exerciseHints,
  exercisePrompt,
  expectedAnswer,
  generateKnowledge,
  generateMatch,
  generateOrder,
  hintText,
  itemVariantKey,
  KNOWLEDGE_TOPICS,
  knowledgeDefinition,
  knowledgeFactId,
  knowledgeFactLabel,
  knowledgeFacts,
  knowledgeStatuses,
  lessonSummary,
  matchAnswerId,
  matchAnswerValues,
  nextLessonExercise,
  orderAnswerId,
  orderAnswerValues,
  orderValueId,
  revealLessonHint,
  skipAuralExercises,
  startLessonReview,
} from './index.ts';
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Testwert fehlt');
  return value;
}
// Unabhängige Tabellen: keine Sortier-/Dauerfunktion der Implementierung als Referenz.
const fractions = { whole: 1, half: 0.5, quarter: 0.25, eighth: 0.125, sixteenth: 0.0625 };
const heights = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function oracle(item: OrderItem) {
  const ranked = item.values.map((value) => ({
    id: orderValueId(value),
    rank:
      value.kind === 'period'
        ? required(
            (
              {
                medieval: 500,
                renaissance: 1400,
                baroque: 1600,
                classical: 1750,
                romantic: 1800,
                since1900: 1900,
              } as Readonly<Record<string, number>>
            )[value.period],
          )
        : value.kind === 'pitch'
          ? (value.pitch.octave + 1) * 12 + heights[value.pitch.letter] + value.pitch.alter
          : required(fractions[value.duration.value as keyof typeof fractions]) *
            (value.duration.dots ? 1.5 : 1),
  }));
  return ranked
    .sort((a, b) => (item.direction === 'ascending' ? a.rank - b.rank : b.rank - a.rank))
    .map((value) => value.id);
}
describe('Wissensfragen, Zuordnen und Reihenfolgen', () => {
  it.each(KNOWLEDGE_TOPICS)(
    'Wissensfragen %s: 150 reproduzierbare Seeds und genau eine richtige Option',
    (topic) => {
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const item = generateKnowledge({ topics: [topic] }, createRng(seed));
          expect(item).toEqual(generateKnowledge({ topics: [topic] }, createRng(seed)));
          expect('score' in item).toBe(false);
          expect(item.choices).toHaveLength(Math.min(4, knowledgeFacts(topic).length));
          expect(new Set(item.choices).size).toBe(Math.min(4, knowledgeFacts(topic).length));
          expect(item.choices.filter((answer) => evaluateExercise(item, answer).correct)).toEqual([
            knowledgeFactId(item.fact),
          ]);
          for (const locale of ['de', 'en-US', 'en-GB'] as const)
            expect(new Set(item.choices.map((id) => choiceLabel(item, id, locale))).size).toBe(
              Math.min(4, knowledgeFacts(topic).length),
            );
        }),
        { numRuns: 150, seed: 20661 },
      );
    },
  );
  it.each(KNOWLEDGE_TOPICS.filter((topic) => knowledgeFacts(topic).length > 3))(
    'Zuordnung %s: 150 Seeds haben eindeutige Begriff-/Erklärungspaare',
    (topic) => {
      const definitions = knowledgeFacts(topic).map((fact) => knowledgeDefinition(fact, 'de'));
      expect(new Set(definitions).size).toBe(definitions.length);
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const item = generateMatch({ topics: [topic], count: 3 }, createRng(seed));
          expect(item).toEqual(generateMatch({ topics: [topic], count: 3 }, createRng(seed)));
          expect(new Set(item.facts.map(knowledgeFactId))).toEqual(new Set(item.choices));
          const answer = matchAnswerId(item.facts.map(knowledgeFactId));
          expect(evaluateExercise(item, answer)).toMatchObject({
            correct: true,
            validAnswer: true,
          });
          expect(knowledgeStatuses(item, answer)).toEqual([true, true, true]);
          const ids = item.facts.map(knowledgeFactId),
            swapped = matchAnswerId([required(ids[1]), required(ids[0]), required(ids[2])]);
          expect(evaluateExercise(item, swapped)).toMatchObject({
            correct: false,
            validAnswer: true,
          });
          expect(knowledgeStatuses(item, swapped)).toEqual([false, false, true]);
        }),
        { numRuns: 150, seed: 20662 },
      );
    },
  );
  it.each([
    { topics: ['noteValues'], direction: 'ascending', count: 6 },
    { topics: ['noteValues'], direction: 'descending', count: 3 },
    { topics: ['pitches'], direction: 'ascending', count: 6 },
    { topics: ['pitches'], direction: 'descending', count: 4 },
  ] satisfies OrderParams[])(
    'Reihenfolge %j: 150 Seeds stimmen mit unabhängigen Dauer-/MIDI-Tabellen überein',
    (params) => {
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const item = generateOrder(params, createRng(seed));
          expect(item).toEqual(generateOrder(params, createRng(seed)));
          expect(expectedAnswer(item)).toBe(orderAnswerId(oracle(item)));
          expect(evaluateExercise(item, orderAnswerId(oracle(item)))).toMatchObject({
            correct: true,
            validAnswer: true,
          });
          expect(evaluateExercise(item, orderAnswerId([...oracle(item)].reverse()))).toMatchObject({
            correct: false,
            validAnswer: true,
          });
        }),
        { numRuns: 150, seed: 20663 },
      );
    },
  );
  it('Feste Begriffe bewahren Enharmonik, Punktierung, Tonleiter-Aufwärtsform und zusammengesetzten Grundschlag', () => {
    const fact = (topic: Parameters<typeof knowledgeFacts>[0], id: string) =>
      required(knowledgeFacts(topic).find((value) => knowledgeFactId(value) === id));
    expect(knowledgeDefinition(fact('intervals', 'interval:A4'), 'de')).toContain(
      '4 Stammtonstufen',
    );
    expect(knowledgeDefinition(fact('intervals', 'interval:d5'), 'de')).toContain(
      '5 Stammtonstufen',
    );
    expect(knowledgeDefinition(fact('intervals', 'interval:d5'), 'de')).toContain('6 Halbtöne');
    expect(knowledgeDefinition(fact('intervals', 'interval:P1'), 'de')).toContain(
      '1 Stammtonstufe',
    );
    expect(knowledgeDefinition(fact('intervals', 'interval:m2'), 'de')).toContain('1 Halbton.');
    expect(knowledgeDefinition(fact('intervals', 'interval:m2'), 'en-GB')).toContain('1 semitone.');
    expect(knowledgeDefinition(fact('noteValues', 'duration:half:1'), 'de')).toContain('3/4');
    expect(knowledgeDefinition(fact('noteValues', 'duration:quarter:0'), 'de')).toContain('1/4');
    for (const [type, pattern] of [
      ['major', '0 – 4 – 7'],
      ['minor', '0 – 3 – 7'],
      ['diminished', '0 – 3 – 6'],
      ['augmented', '0 – 4 – 8'],
    ] as const)
      expect(knowledgeDefinition(fact('triads', `triad:${type}`), 'de')).toContain(pattern);
    for (const [type, pattern] of [
      ['major', '2 – 2 – 1 – 2 – 2 – 2 – 1'],
      ['naturalMinor', '2 – 1 – 2 – 2 – 1 – 2 – 2'],
      ['harmonicMinor', '2 – 1 – 2 – 2 – 1 – 3 – 1'],
      ['melodicMinor', '2 – 1 – 2 – 2 – 2 – 2 – 1'],
    ] as const)
      expect(knowledgeDefinition(fact('scales', `scale:${type}`), 'de')).toContain(pattern);
    expect(knowledgeDefinition(fact('meters', 'meter:6/8'), 'de')).toContain('2 Grundschläge');
    expect(knowledgeDefinition(fact('meters', 'meter:6/8'), 'en-GB')).toContain('dotted crotchet');
    expect(knowledgeDefinition(fact('accidentals', 'accidental:1'), 'de')).toContain('1 Halbton.');
    expect(knowledgeDefinition(fact('accidentals', 'accidental:2'), 'de')).toContain('2 Halbtöne.');
  });
  it('Antworten werden aus Fachdaten bestimmt; umgemischte Auswahl ist keine neue Fragestellung', () => {
    const mc = generateKnowledge({ topics: ['scales'] }, createRng(1));
    const next = {
      ...mc,
      fact: required(
        knowledgeFacts('scales').find((fact) => knowledgeFactId(fact) !== expectedAnswer(mc)),
      ),
    };
    expect(expectedAnswer(next)).not.toBe(expectedAnswer(mc));
    expect(expectedAnswer({ ...mc, choices: [...mc.choices].reverse() })).toBe(expectedAnswer(mc));
    expect(itemVariantKey({ ...mc, choices: [...mc.choices].reverse() })).toBe(itemVariantKey(mc));
    const match = generateMatch({ topics: ['intervals'] }, createRng(2));
    expect(
      itemVariantKey({
        ...match,
        facts: [...match.facts].reverse(),
        choices: [...match.choices].reverse(),
      }),
    ).toBe(itemVariantKey(match));
    const order = generateOrder({ topics: ['pitches'] }, createRng(3));
    expect(
      itemVariantKey({
        ...order,
        values: [...order.values].reverse(),
        choices: [...order.choices].reverse(),
      }),
    ).toBe(itemVariantKey(order));
    expect(
      expectedAnswer({
        ...order,
        direction: order.direction === 'ascending' ? 'descending' : 'ascending',
      }),
    ).not.toBe(expectedAnswer(order));
  });
  it('Teilantworten sind editierbar; doppelte, fremde und nichtkanonische IDs erzeugen keine Wertung', () => {
    const match = generateMatch({ topics: ['triads'] }, createRng(1)),
      ids = match.facts.map(knowledgeFactId),
      order = generateOrder({ topics: ['pitches'] }, createRng(2)),
      values = oracle(order);
    expect(matchAnswerValues(match, matchAnswerId([required(ids[0]), null, null]))).toEqual([
      ids[0],
      null,
      null,
    ]);
    expect(orderAnswerValues(order, 'order:')).toEqual([]);
    expect(orderAnswerValues(order, orderAnswerId(values.slice(0, 1)))).toEqual(values.slice(0, 1));
    for (const [item, answers] of [
      [
        match,
        [
          matchAnswerId([required(ids[0]), null, null]),
          'match:',
          matchAnswerId([required(ids[0]), required(ids[0]), required(ids[1])]),
          expectedAnswer(match) + '\n',
          expectedAnswer(match) + ',',
          'match:triad:unknown,,',
          'MATCH:a,b,c',
        ],
      ],
      [
        order,
        [
          'order:',
          orderAnswerId(values.slice(1)),
          orderAnswerId([...values, required(values[0])]),
          orderAnswerId([required(values[0]), required(values[0])]),
          expectedAnswer(order) + '\n',
          expectedAnswer(order) + ',',
          'order:pitch:C9',
          'order: pitch:C4',
        ],
      ],
    ] as const)
      for (const answer of answers) {
        expect(evaluateExercise(item, answer).validAnswer).toBe(false);
        const session = createSession([item]);
        expect(answerSession(session, answer)).toBe(session);
      }
    const mc = generateKnowledge({ topics: ['meters'] }, createRng(3));
    for (const answer of [expectedAnswer(mc) + '\n', 'meter:06/8', 'unknown', ''])
      expect(evaluateExercise(mc, answer).validAnswer).toBe(false);
  });
  it('Erstfehler und Hilfe bleiben gespeichert; alle drei Wiederholungen ändern tatsächlich die Fragestellung', () => {
    const specs: readonly ExerciseSpec[] = [
      { type: 'KNOWLEDGE_MC', params: { topics: ['triads'] } },
      { type: 'MATCH', params: { topics: ['scales'], count: 3 } },
      { type: 'ORDER', params: { topics: ['noteValues'], count: 6 } },
    ];
    let lesson = createLessonSession(
      { id: 'test.knowledge', contentVersion: 1, exercises: specs },
      2066,
    );
    const original = lesson.initial.items;
    while (lesson.phase === 'initial') {
      const item = required(currentItem(lesson.initial));
      const wrong =
        item.type === 'KNOWLEDGE_MC'
          ? required(item.choices.find((id) => id !== expectedAnswer(item)))
          : item.type === 'MATCH'
            ? matchAnswerId([...item.facts].reverse().map(knowledgeFactId))
            : item.type === 'ORDER'
              ? orderAnswerId([...oracle(item)].reverse())
              : '';
      lesson = nextLessonExercise(answerLesson(revealLessonHint(lesson), wrong));
    }
    expect(lesson.phase).toBe('review-intro');
    lesson = startLessonReview(lesson);
    while (lesson.phase === 'review') {
      const active = required(activeLessonSession(lesson)),
        item = required(currentItem(active));
      expect(itemVariantKey(item)).not.toBe(itemVariantKey(required(original[active.index])));
      lesson = nextLessonExercise(answerLesson(lesson, expectedAnswer(item)));
    }
    expect(lessonSummary(lesson)).toMatchObject({
      answered: 3,
      correct: 0,
      assisted: 3,
      reviewCorrect: 3,
      unresolved: 0,
    });
    expect(JSON.parse(JSON.stringify(lesson))).toEqual(lesson);
    expect(
      lesson.initial.records.every((record) => !record.result.correct && record.hintLevel === 1),
    ).toBe(true);
  });
  it.each(['de', 'en-US', 'en-GB'] as const)(
    'Alle Begriffe, eindeutigen Erklärungen und drei Hinweise sind in %s vollständig',
    (locale) => {
      for (const topic of KNOWLEDGE_TOPICS) {
        const facts = knowledgeFacts(topic);
        expect(new Set(facts.map((fact) => knowledgeFactLabel(fact, locale))).size).toBe(
          facts.length,
        );
        expect(new Set(facts.map((fact) => knowledgeDefinition(fact, locale))).size).toBe(
          facts.length,
        );
        const items: readonly ExerciseItem[] = [
          generateKnowledge({ topics: [topic] }, createRng(1)),
          ...(facts.length > 3 ? [generateMatch({ topics: [topic] }, createRng(1))] : []),
          generateOrder({ topics: ['pitches', 'noteValues'] }, createRng(1)),
        ];
        for (const item of items) {
          const texts = [
            exercisePrompt(item, locale),
            exerciseDescription(item, locale),
            exerciseFeedback(item, evaluateExercise(item, expectedAnswer(item)), locale).message,
            ...([1, 2, 3] as const).map((level) =>
              hintText(item, exerciseHints(item, level), locale),
            ),
          ];
          expect(
            texts.every(
              (text) => text.length > 10 && !/exercise\.|glossary:|\{\{|\$t\(/.test(text),
            ),
          ).toBe(true);
          expect(skipAuralExercises(createSession([item])).skipped).toEqual([]);
        }
      }
    },
  );
  it('Unmögliche Parameter scheitern unabhängig vom Seed', () => {
    for (const params of [{ topics: [] }, { topics: ['unknown'] }])
      expect(() => generateKnowledge(params as KnowledgeParams, createRng(1))).toThrow();
    for (const params of [
      { topics: [] },
      { topics: ['scales'], count: 4 },
      { topics: ['intervals', 'triads'], count: 4 },
      { topics: ['meters'], count: 1 },
      { topics: ['meters'], count: 5 },
      { topics: ['accidentals'], count: 2.5 },
    ])
      for (let seed = 0; seed < 3; seed++)
        expect(() => generateMatch(params as MatchParams, createRng(seed))).toThrow();
    for (const params of [
      { topics: [] },
      { topics: ['intervals'] },
      { topics: ['pitches'], count: 2 },
      { topics: ['noteValues'], count: 7 },
      { topics: ['pitches'], count: 3.5 },
      { topics: ['noteValues'], direction: 'random' },
    ])
      expect(() => generateOrder(params as OrderParams, createRng(1))).toThrow();
  });
});
