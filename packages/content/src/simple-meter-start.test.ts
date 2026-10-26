import { describe, expect, it } from 'vitest';
import { checkMeasure, durationValue, fraction, fractionEquals } from '@harmonia/theory';
import {
  activeLessonSession,
  answerLesson,
  createLessonSession,
  currentItem,
  expectedAnswer,
  itemVariantKey,
  lessonSummary,
  nextLessonExercise,
  pickupAnswer,
  rhythmOnsets,
  startLessonReview,
} from '@harmonia/exercises';
import { catalogue, curriculumPlan } from './authoring.ts';
import { exerciseSpecSchema, publicCatalogue, resolveLesson } from './index.ts';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Fehlt');
  return value;
}

const cases = [
  ['meter', 8, 4, 0],
  ['count-in', 10, 6, 2],
  ['read', 12, 10, 2],
] as const;

describe('Einfache Taktarten, Einzählen und Lesen', () => {
  it.each(cases)(
    '%s: %s Aufgaben mit neuen fachlichen Antworten im Fehlerdurchgang',
    (name, count, taps, pickups) => {
      const lesson = required(resolveLesson(catalogue, `rhythm.l1.simple-meter.${name}`));
      expect(lesson).toMatchObject({ contentVersion: 8, status: 'entwurf' });
      expect(lesson.introduction).toHaveLength(3);
      expect(lesson.exercises).toHaveLength(count);
      for (let seed = 0; seed < 150; seed++) {
        let session = createLessonSession(lesson, seed);
        expect(session.initial.items.filter((item) => item.type === 'RHYTHM_TAP')).toHaveLength(
          taps,
        );
        expect(
          session.initial.items.filter(
            (item) => item.type === 'METER_IDENTIFY' && item.presentation === 'pickup',
          ),
        ).toHaveLength(pickups);
        while (session.phase === 'initial') {
          const item = required(currentItem(required(activeLessonSession(session))));
          if (item.type !== 'RHYTHM_TAP' && item.type !== 'METER_IDENTIFY')
            throw new Error('Falscher Übungstyp');
          if (item.type === 'RHYTHM_TAP') {
            const events = required(item.score.staves[0]?.measures[0]?.voices[0]?.events);
            const meter = required(item.score.staves[0]?.timeSignature);
            expect(
              checkMeasure(
                events.map((event) => event.duration),
                meter,
              ).status,
            ).toBe('complete');
            expect(rhythmOnsets(item).length).toBeGreaterThan(0);
            for (const event of events)
              expect(['quarter', 'eighth']).toContain(event.duration.value);
            if (name === 'meter') {
              expect(events).toHaveLength(meter.numerator);
              expect(
                events.every(
                  (event) =>
                    event.kind === 'note' &&
                    fractionEquals(durationValue(event.duration), fraction(1, 4)),
                ),
              ).toBe(true);
            } else if (name === 'count-in')
              expect(events.every((event) => event.kind === 'note')).toBe(true);
          }
          const answer =
            item.type === 'RHYTHM_TAP'
              ? 'taps:'
              : required(item.choices.find((id) => id !== expectedAnswer(item)));
          session = nextLessonExercise(answerLesson(session, answer));
        }
        expect(session.phase).toBe('review-intro');
        const review = required(session.review);
        review.items.forEach((item, index) => {
          expect(itemVariantKey(item)).not.toBe(
            itemVariantKey(required(session.initial.items[index])),
          );
          if (item.type === 'METER_IDENTIFY' && item.presentation === 'pickup')
            expect(pickupAnswer(item)).toBe(expectedAnswer(item));
        });
        session = startLessonReview(session);
        while (session.phase === 'review') {
          const item = required(currentItem(required(activeLessonSession(session))));
          session = nextLessonExercise(answerLesson(session, expectedAnswer(item)));
        }
        expect(lessonSummary(session)).toMatchObject({
          correct: 0,
          answered: count,
          reviewCorrect: count,
          unresolved: 0,
        });
        expect(JSON.parse(JSON.stringify(session))).toEqual(session);
      }
    },
  );
  it('neun Karten, vollständige und angefangene Takte sowie Entwurfsgrenze', () => {
    expect(catalogue.contentVersion).toBe(22);
    expect(curriculumPlan.contentVersion).toBe(22);
    expect(catalogue.lessons).toHaveLength(194);
    const cards = catalogue.knowledgeCards.filter((card) =>
      card.id.startsWith('rhythm.l1.simple-meter.'),
    );
    expect(cards).toHaveLength(9);
    expect(cards.flatMap((card) => card.examples)).toHaveLength(15);
    expect(
      catalogue.knowledgeArticles.find((article) => article.id === 'rhythm.l1.simple-meter.article')
        ?.sections,
    ).toHaveLength(9);
    expect(publicCatalogue(catalogue)).toMatchObject({
      lessons: [],
      knowledgeCards: [],
      knowledgeArticles: [],
    });
    expect(catalogue.skills.find((skill) => skill.id === 'rhythm.count-in')?.prerequisites).toEqual(
      ['rhythm.meter-simple', 'rhythm.barlines'],
    );
  });
  it('nur zugelassene einfache Takte und Notenwerte passieren das Inhaltsschema', () => {
    for (const spec of [
      {
        type: 'RHYTHM_TAP',
        params: { meters: ['2/4', '3/4', '4/4'], level: 'quarters', rests: false },
      },
      { type: 'METER_IDENTIFY', params: { meters: ['2/4', '3/4', '4/4'], presentation: 'pickup' } },
    ])
      expect(exerciseSpecSchema.parse(spec)).toEqual(spec);
    for (const spec of [
      { type: 'RHYTHM_TAP', params: { meters: ['6/8'], level: 'quarters' } },
      { type: 'RHYTHM_TAP', params: { meters: ['4/4'], level: 'quarters', rests: true } },
      { type: 'METER_IDENTIFY', params: { meters: ['6/8'], presentation: 'pickup' } },
      { type: 'METER_IDENTIFY', params: { meters: ['4/4'], presentation: 'pulse' } },
    ])
      expect(exerciseSpecSchema.safeParse(spec).success).toBe(false);
  });
});
