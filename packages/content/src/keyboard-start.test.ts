import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
  itemVariantKey,
  lessonSummary,
  nextLessonExercise,
  revealLessonHint,
  startLessonReview,
} from '@harmonia/exercises';
import { catalogue, curriculumPlan } from './authoring.ts';
import { exampleSchema, exerciseSpecSchema, publicCatalogue, resolveLesson } from './index.ts';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Testwert fehlt');
  return value;
}
const cases = [
  ['keys', 8, 3],
  ['steps', 10, 2],
  ['accidentals', 12, 3],
] as const;
describe('Zweite Notationseinheit: Klaviatur und Vorzeichen', () => {
  it.each(cases)(
    '%s: %s Aufgaben mit korrekten Voraussetzungen, neuen Wiederholungen und 150 Seeds',
    (name, count, cards) => {
      const lesson = required(resolveLesson(catalogue, `notation.l1.keyboard.${name}`));
      expect(lesson).toMatchObject({ contentVersion: 4, status: 'entwurf' });
      expect(lesson.introduction).toHaveLength(cards);
      expect(lesson.exercises).toHaveLength(count);
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          let session = createLessonSession(lesson, seed);
          expect(session.initial.items).toEqual(createLessonSession(lesson, seed).initial.items);
          const types = session.initial.items.map((item) => item.type);
          expect(types).toEqual(
            name === 'keys'
              ? Array<string>(8).fill('KEY_FIND')
              : name === 'steps'
                ? [...Array<string>(6).fill('KNOWLEDGE_MC'), ...Array<string>(4).fill('KEY_FIND')]
                : [
                    ...Array<string>(4).fill('KNOWLEDGE_MC'),
                    ...Array<string>(4).fill('NOTE_NAME'),
                    ...Array<string>(4).fill('KEY_FIND'),
                  ],
          );
          for (const item of session.initial.items) {
            if (item.type === 'KEY_FIND') {
              expect(item.presentation).toBe('name');
              expect(item.keyboardRange).toEqual({ first: 60, last: 71 });
              expect(item.pitch.octave).toBe(4);
              expect(Math.abs(item.pitch.alter)).toBeLessThanOrEqual(
                name === 'accidentals' ? 1 : 0,
              );
            } else if (item.type === 'NOTE_NAME') {
              expect(item.clef).toBe('treble');
              expect(Math.abs(item.pitch.alter)).toBeLessThanOrEqual(1);
            } else if (item.type === 'KNOWLEDGE_MC') {
              expect(item.fact.topic).toBe(name === 'steps' ? 'keyboard' : 'accidentals');
              if (item.fact.topic === 'accidentals')
                expect(Math.abs(item.fact.alter)).toBeLessThanOrEqual(1);
            }
          }
          session = revealLessonHint(session);
          while (session.phase === 'initial') {
            const item = required(currentItem(required(activeLessonSession(session))));
            const wrong =
              item.type === 'KEY_FIND'
                ? `key:${expectedAnswer(item) === 'key:60' ? '62' : '60'}`
                : required(item.choices.find((value) => value !== expectedAnswer(item)));
            session = nextLessonExercise(answerLesson(session, wrong));
          }
          expect(session.phase).toBe('review-intro');
          required(session.review).items.forEach((item, index) => {
            expect(itemVariantKey(item)).not.toBe(
              itemVariantKey(required(session.initial.items[index])),
            );
          });
          session = startLessonReview(session);
          while (session.phase === 'review') {
            const item = required(currentItem(required(activeLessonSession(session))));
            session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
          }
          expect(lessonSummary(session)).toMatchObject({
            correct: 0,
            answered: count,
            assisted: 1,
            reviewCorrect: count,
            unresolved: 0,
          });
          expect(JSON.parse(JSON.stringify(session))).toEqual(session);
        }),
        { numRuns: 150, seed: 20723 },
      );
    },
  );
  it('hält acht Karten, dreizehn Beispiele und den fünfteiligen Artikel intern; alte IDs und Versionen bleiben erhalten', () => {
    const cards = catalogue.knowledgeCards.filter((card) =>
      card.id.startsWith('notation.l1.keyboard.'),
    );
    expect(cards).toHaveLength(8);
    expect(cards.flatMap((card) => card.examples)).toHaveLength(13);
    expect(
      cards.every((card) =>
        card.examples.every(
          (example) => example.keyboard?.first === 60 && example.keyboard.last === 72,
        ),
      ),
    ).toBe(true);
    expect(
      catalogue.knowledgeArticles.find((article) => article.id === 'notation.l1.keyboard.article')
        ?.sections,
    ).toHaveLength(5);
    expect(catalogue.contentVersion).toBe(13);
    expect(curriculumPlan.contentVersion).toBe(13);
    expect(resolveLesson(catalogue, 'fundament.reading-and-listening.1')?.contentVersion).toBe(1);
    expect(resolveLesson(catalogue, 'notation.l1.staff.anchor')?.contentVersion).toBe(3);
    const unit = required(
      curriculumPlan.units.find((unit) => unit.unitId === 'notation.l1.keyboard'),
    );
    expect(unit.skillIds).toEqual([
      'notation.keyboard-layout',
      'notation.semitone',
      'notation.accidentals',
    ]);
    const output = publicCatalogue(catalogue);
    expect(output.lessons).toHaveLength(0);
    expect(output.knowledgeCards).toHaveLength(0);
    expect(output.knowledgeArticles).toHaveLength(0);
  });
  it('bewahrt neue Parameter in der strengen Pipeline und lehnt nicht wiederholbare Bereiche ab', () => {
    const named = {
      type: 'KEY_FIND',
      params: { presentation: 'name', range: { minMidi: 60, maxMidi: 71 }, maxAccidentals: 1 },
    };
    expect(exerciseSpecSchema.parse(named)).toEqual(named);
    const knowledge = {
      type: 'KNOWLEDGE_MC',
      params: { topics: ['accidentals'], maxAccidentals: 1 },
    };
    expect(exerciseSpecSchema.parse(knowledge)).toEqual(knowledge);
    const match = {
      type: 'MATCH',
      params: { topics: ['accidentals'], maxAccidentals: 1, count: 2 },
    };
    expect(exerciseSpecSchema.parse(match)).toEqual(match);
    for (const spec of [
      { ...named, params: { ...named.params, range: { minMidi: 60, maxMidi: 72 } } },
      { ...knowledge, params: { topics: ['accidentals'], maxAccidentals: 0 } },
      { ...match, params: { ...match.params, count: 3 } },
    ])
      expect(exerciseSpecSchema.safeParse(spec).success).toBe(false);
  });
  it('lehnt unpassende, umgekehrte und nicht ganzzahlige Klaviaturgrenzen ab', () => {
    const base = { score: 'treble | 4/4 | C4/1', captionKey: 'content.keyboardStart.whiteCaption' };
    for (const keyboard of [
      { first: 20, last: 72 },
      { first: 60, last: 109 },
      { first: 72, last: 60 },
      { first: 60.5, last: 72 },
      { first: 60, last: 72, unknown: true },
    ])
      expect(exampleSchema.safeParse({ ...base, keyboard }).success).toBe(false);
    expect(exampleSchema.parse({ ...base, keyboard: { first: 60, last: 72 } }).keyboard).toEqual({
      first: 60,
      last: 72,
    });
  });
});
