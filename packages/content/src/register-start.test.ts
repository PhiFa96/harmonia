import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { parsePitch } from '@harmonia/theory';
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
  ['octaves', 8, 3],
  ['ledger', 10, 3],
  ['match', 12, 2],
] as const;
describe('Dritte Notationseinheit: Register und Hilfslinien', () => {
  it.each(cases)(
    '%s: %s Aufgaben, Voraussetzungen und neue Wiederholung in 150 Seeds',
    (name, count, cards) => {
      const lesson = required(resolveLesson(catalogue, `notation.l1.register.${name}`));
      expect(lesson).toMatchObject({ contentVersion: 5, status: 'entwurf' });
      expect(lesson.introduction).toHaveLength(cards);
      expect(lesson.exercises).toHaveLength(count);
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          let session = createLessonSession(lesson, seed);
          expect(session.initial.items).toEqual(createLessonSession(lesson, seed).initial.items);
          for (const item of session.initial.items) {
            if (item.type !== 'NOTE_NAME' && item.type !== 'KEY_FIND')
              throw new Error('Noten-/Tastenfrage erwartet');
            expect(item.clef).toBe('treble');
            expect(item.pitch.alter).toBe(0);
            const indices = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
            const step = item.pitch.octave * 7 + indices[item.pitch.letter] - 30;
            expect(step).toBeGreaterThanOrEqual(name === 'octaves' ? 0 : -4);
            expect(step).toBeLessThanOrEqual(name === 'octaves' ? 8 : 12);
            if (item.type === 'KEY_FIND') {
              expect(name).toBe('match');
              expect(item).toMatchObject({
                presentation: 'score',
                keyboardRange: { first: 57, last: 84 },
              });
            } else expect(item.includeOctave).toBe(true);
          }
          session = revealLessonHint(session);
          while (session.phase === 'initial') {
            const item = required(currentItem(required(activeLessonSession(session))));
            let wrong: string;
            if (item.type === 'KEY_FIND') {
              const target = Number(expectedAnswer(item).slice(4));
              wrong = `key:${String(target <= 72 ? target + 12 : target - 12)}`;
            } else if (item.type === 'NOTE_NAME') {
              wrong = required(
                item.choices.find((value) => {
                  const pitch = parsePitch(value);
                  return pitch.letter === item.pitch.letter && pitch.octave !== item.pitch.octave;
                }),
              );
            } else throw new Error('Falscher Aufgabentyp');
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
        { numRuns: 150, seed: 20753 },
      );
    },
  );
  it('ergänzt acht Karten, dreizehn Beispiele und einen fünfteiligen Artikel; frühere Versionen bleiben erhalten', () => {
    expect(catalogue.contentVersion).toBe(15);
    expect(curriculumPlan.contentVersion).toBe(15);
    const cards = catalogue.knowledgeCards.filter((card) =>
      card.id.startsWith('notation.l1.register.'),
    );
    expect(cards).toHaveLength(8);
    expect(cards.flatMap((card) => card.examples)).toHaveLength(13);
    expect(
      cards.every((card) =>
        card.examples.every((example) => example.keyboard?.showOctaves === true),
      ),
    ).toBe(true);
    expect(
      catalogue.knowledgeArticles.find((article) => article.id === 'notation.l1.register.article')
        ?.sections,
    ).toHaveLength(5);
    expect(resolveLesson(catalogue, 'fundament.reading-and-listening.1')?.contentVersion).toBe(1);
    expect(resolveLesson(catalogue, 'notation.l1.staff.anchor')?.contentVersion).toBe(3);
    expect(resolveLesson(catalogue, 'notation.l1.keyboard.keys')?.contentVersion).toBe(4);
    expect(catalogue.lessons).toHaveLength(121);
    expect(
      required(curriculumPlan.units.find((unit) => unit.unitId === 'notation.l1.register'))
        .skillIds,
    ).toEqual(['notation.octave-register', 'notation.ledger-lines', 'notation.pitch-match']);
    const output = publicCatalogue(catalogue);
    expect(output.lessons).toHaveLength(0);
    expect(output.knowledgeCards).toHaveLength(0);
    expect(output.knowledgeArticles).toHaveLength(0);
  });
  it('bewahrt neue Parameter und weist ungültige oder fachlich unpassende Vorgaben zurück', () => {
    const note = {
      type: 'NOTE_NAME',
      params: { includeOctave: true, range: { minMidi: 64, maxMidi: 77 } },
    };
    const key = {
      type: 'KEY_FIND',
      params: { presentation: 'score', range: { minMidi: 57, maxMidi: 84 } },
    };
    expect(exerciseSpecSchema.parse(note)).toEqual(note);
    expect(exerciseSpecSchema.parse(key)).toEqual(key);
    expect(
      exerciseSpecSchema.safeParse({ ...note, params: { includeOctave: 'true' } }).success,
    ).toBe(false);
    expect(
      exerciseSpecSchema.safeParse({
        ...note,
        params: { includeOctave: true, range: { minMidi: 60, maxMidi: 71 } },
      }).success,
    ).toBe(false);
    expect(
      exerciseSpecSchema.safeParse({ type: 'NOTE_PLACE', params: { includeOctave: true } }).success,
    ).toBe(false);
  });
  it('behält strenge optionale Oktavbeschriftungen bei und akzeptiert weiter alte Beispiele', () => {
    const example = {
      score: 'treble | 4/4 | C4/2 C5/2',
      captionKey: 'content.registerStart.cCaption',
      keyboard: { first: 60, last: 72, showOctaves: true },
    };
    expect(exampleSchema.parse(example)).toEqual(example);
    expect(
      exampleSchema.safeParse({
        ...example,
        keyboard: { ...example.keyboard, showOctaves: 'true' },
      }).success,
    ).toBe(false);
    expect(exampleSchema.parse({ ...example, keyboard: { first: 60, last: 72 } }).keyboard).toEqual(
      { first: 60, last: 72 },
    );
  });
});
