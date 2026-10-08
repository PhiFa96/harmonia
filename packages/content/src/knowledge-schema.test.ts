import { describe, expect, it } from 'vitest';
import { createLessonSession, KNOWLEDGE_TOPICS } from '@harmonia/exercises';
import { exerciseSpecSchema } from './index.ts';
describe('Wissensaufgaben im strengen Inhaltsschema', () => {
  it.each([
    { type: 'KNOWLEDGE_MC', params: { topics: KNOWLEDGE_TOPICS } },
    { type: 'MATCH', params: { topics: ['intervals', 'noteValues'], count: 4 } },
    { type: 'MATCH', params: { topics: ['scales', 'triads'] } },
    {
      type: 'ORDER',
      params: { topics: ['noteValues', 'pitches'], count: 6, direction: 'ascending' },
    },
    { type: 'ORDER', params: { topics: ['pitches'] } },
  ])('validiert %j und serialisiert ohne künstliches Notenbild', (spec) => {
    const parsed = exerciseSpecSchema.parse(spec);
    expect(parsed).toEqual(spec);
    const lesson = createLessonSession(
      { id: 'test.knowledge-schema', contentVersion: 1, exercises: [parsed] },
      1,
    );
    expect(lesson.initial.items[0]?.type).toBe(spec.type);
    expect(lesson.initial.items[0]).not.toHaveProperty('score');
    expect(JSON.parse(JSON.stringify(lesson))).toEqual(lesson);
  });
  it.each([
    { type: 'KNOWLEDGE_MC', params: { topics: [] } },
    { type: 'KNOWLEDGE_MC', params: { topics: ['unknown'] } },
    { type: 'KNOWLEDGE_MC', params: { topics: ['triads'], count: 3 } },
    { type: 'KNOWLEDGE_MC', params: { topics: ['meters'], score: 'fake' } },
    { type: 'MATCH', params: { topics: ['triads'], count: 4 } },
    { type: 'MATCH', params: { topics: ['intervals', 'scales'], count: 4 } },
    { type: 'MATCH', params: { topics: ['accidentals'], count: 5 } },
    { type: 'MATCH', params: { topics: ['meters'], count: 1 } },
    { type: 'MATCH', params: { topics: ['noteValues'], count: 3.5 } },
    { type: 'MATCH', params: { topics: ['noteValues'], direction: 'both' } },
    { type: 'ORDER', params: { topics: [] } },
    { type: 'ORDER', params: { topics: ['triads'] } },
    { type: 'ORDER', params: { topics: ['pitches'], count: 2 } },
    { type: 'ORDER', params: { topics: ['noteValues'], count: 7 } },
    { type: 'ORDER', params: { topics: ['noteValues'], direction: 'random' } },
    { type: 'ORDER', params: { topics: ['pitches'], answer: 'cheat' } },
  ])('weist unmögliche oder typfremde Parameter zurück: %j', (spec) => {
    expect(exerciseSpecSchema.safeParse(spec).success).toBe(false);
  });
});
