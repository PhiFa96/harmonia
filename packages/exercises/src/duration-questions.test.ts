import { describe, expect, it } from 'vitest';
import { duration } from '@harmonia/theory';
import {
  createRng,
  evaluateExercise,
  expectedAnswer,
  exerciseDescription,
  exerciseFeedback,
  exerciseHints,
  hintText,
  generateKnowledge,
  generateMatch,
  generateOrder,
  knowledgeChoiceFact,
  knowledgeFactId,
  measureGapFact,
  itemVariantKey,
} from './index.ts';
const units = { whole: 16, half: 8, quarter: 4, eighth: 2, sixteenth: 1 };
describe('Unpunktierte Zeichen und echte Taktlücken', () => {
  it.each(['noteValues', 'rests'] as const)(
    '%s: alle fünf Formen, keine Punktierung in 300 Seeds',
    (topic) => {
      const seen = new Set<string>();
      for (let seed = 0; seed < 300; seed++) {
        const item = generateKnowledge(
          { topics: [topic], maxDots: 0, presentation: 'symbol' },
          createRng(seed),
        );
        seen.add(expectedAnswer(item));
        for (const id of item.choices) {
          const fact = knowledgeChoiceFact(item, id);
          expect(fact && 'duration' in fact && fact.duration.dots).toBe(0);
        }
        expect(item.choices.filter((id) => evaluateExercise(item, id).correct)).toEqual([
          expectedAnswer(item),
        ]);
        for (const locale of ['de', 'en-US', 'en-GB'] as const) {
          const description = exerciseDescription(item, locale);
          expect(description).not.toMatch(
            /whole|half|quarter|eighth|sixteenth|crotchet|quaver|semibreve|Ganze|Halbe|Viertel|Achtel|Sechzehntel/,
          );
          expect(description.length).toBeGreaterThan(20);
          for (const level of [1, 2, 3] as const)
            expect(hintText(item, exerciseHints(item, level), locale)).not.toMatch(
              /exercise\.|glossary:|\{\{|\$t\(/,
            );
        }
      }
      expect(seen.size).toBe(5);
    },
  );
  it.each(['noteValues', 'rests'] as const)(
    '%s: unabhängige Sechzehnteltabelle prüft 500 Taktlücken',
    (topic) => {
      const seen = new Set<string>();
      for (let seed = 0; seed < 500; seed++) {
        const params = {
          topics: [topic],
          maxDots: 0 as const,
          presentation: 'measure-gap' as const,
        };
        const item = generateKnowledge(params, createRng(seed));
        expect(item).toEqual(generateKnowledge(params, createRng(seed)));
        if (!item.gap) throw new Error('Lücke fehlt');
        expect(item.gap.events.length).toBeLessThanOrEqual(6);
        const used = item.gap.events.reduce(
          (sum, e) => sum + units[e.duration.value as keyof typeof units],
          0,
        );
        const correct = Object.entries(units).find(([, value]) => used + value === 16)?.[0];
        expect(correct).toBeDefined();
        const id = `${topic === 'rests' ? 'rest' : 'duration'}:${correct ?? ''}:0`;
        expect(expectedAnswer(item)).toBe(id);
        seen.add(id);
        expect(item.choices.filter((id) => evaluateExercise(item, id).correct)).toEqual([id]);
        expect(expectedAnswer({ ...item, fact: { topic, duration: duration('whole') } })).toBe(id);
        expect(itemVariantKey({ ...item, choices: [...item.choices].reverse() })).toBe(
          itemVariantKey(item),
        );
        expect(JSON.parse(JSON.stringify(item))).toEqual(item);
        for (const locale of ['de', 'en-US', 'en-GB'] as const) {
          const feedback = exerciseFeedback(item, evaluateExercise(item, id), locale).message;
          expect(feedback).toContain('4 −');
          expect(feedback).not.toMatch(/exercise\.|glossary:|\{\{|\$t\(/);
        }
      }
      expect(seen.size).toBe(4);
    },
  );
  it('verwirft volle/übervolle, punktierte und nicht durch einen Wert ergänzbare Quellen', () => {
    for (const values of [['whole'], ['whole', 'quarter'], ['eighth']] as const)
      expect(() =>
        measureGapFact({
          missingKind: 'note',
          events: values.map((v) => ({ kind: 'note', duration: duration(v) })),
        }),
      ).toThrow();
    expect(() => measureGapFact({ missingKind: 'rest', events: [] })).toThrow();
    expect(() =>
      measureGapFact({
        missingKind: 'rest',
        events: [{ kind: 'rest', duration: duration('quarter', 1) }],
      }),
    ).toThrow();
    expect(() =>
      measureGapFact({
        missingKind: 'note',
        events: [{ kind: 'note', duration: duration('quarter', 0, { actual: 3, normal: 2 }) }],
      }),
    ).toThrow();
    expect(
      knowledgeFactId(
        measureGapFact({
          missingKind: 'rest',
          events: [{ kind: 'note', duration: duration('half') }],
        }),
      ),
    ).toBe('rest:half:0');
  });
  it('wendet die Grenze auch auf Zuordnen und Reihenfolge an', () => {
    for (let seed = 0; seed < 100; seed++) {
      const match = generateMatch({ topics: ['rests'], maxDots: 0, count: 4 }, createRng(seed));
      expect(match.facts.every((f) => 'duration' in f && f.duration.dots === 0)).toBe(true);
      const order = generateOrder(
        { topics: ['noteValues'], maxDots: 0, count: 5 },
        createRng(seed),
      );
      expect(order.values.every((v) => v.kind === 'duration' && v.duration.dots === 0)).toBe(true);
    }
    expect(() =>
      generateOrder({ topics: ['noteValues'], maxDots: 0, count: 6 }, createRng(1)),
    ).toThrow();
    expect(() => generateMatch({ topics: ['barlines'] }, createRng(1))).toThrow();
  });
});
