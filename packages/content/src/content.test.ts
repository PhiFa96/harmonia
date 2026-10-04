import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import {
  createLessonSession,
  itemVariantKey,
  activeLessonSession,
  currentItem,
  expectedAnswer,
  answerLesson,
  nextLessonExercise,
  startLessonReview,
} from '@harmonia/exercises';
import { intervalBetween, formatInterval, parsePitch } from '@harmonia/theory';
import { firstLesson, lessonSchema } from './index.ts';
describe('Erste versionierte Lektion', () => {
  it('hat zehn Aufgaben mit stabiler ID und allen drei Typen; Inhalte bleiben Entwurf', () => {
    expect(firstLesson.id).toBe('fundament.reading-and-listening.1');
    expect(firstLesson.contentVersion).toBe(1);
    expect(firstLesson.status).toBe('entwurf');
    expect(firstLesson.exercises.map((value) => value.type)).toEqual([
      'NOTE_NAME',
      'INTERVAL_IDENTIFY_VISUAL',
      'INTERVAL_IDENTIFY_AURAL',
      'NOTE_NAME',
      'INTERVAL_IDENTIFY_VISUAL',
      'INTERVAL_IDENTIFY_AURAL',
      'NOTE_NAME',
      'INTERVAL_IDENTIFY_VISUAL',
      'INTERVAL_IDENTIFY_AURAL',
      'NOTE_NAME',
    ]);
  });
  it('weist fehlende Einführung, falschen Umfang, ungültige Parameter und Zusatzfelder zurück', () => {
    for (const patch of [
      { introduction: [] },
      { exercises: firstLesson.exercises.slice(1) },
      { contentVersion: 0 },
      { status: 'live' },
      { extra: true },
      {
        exercises: [
          { type: 'NOTE_NAME', params: { maxAccidentals: 3 } },
          ...firstLesson.exercises.slice(1),
        ],
      },
    ]) {
      expect(lessonSchema.safeParse({ ...firstLesson, ...patch }).success).toBe(false);
    }
    for (const spec of [
      { type: 'INTERVAL_IDENTIFY_VISUAL', params: { intervals: ['M4'] } },
      { type: 'INTERVAL_IDENTIFY_AURAL', params: { intervals: ['A4', 'd5'] } },
      {
        type: 'INTERVAL_IDENTIFY_VISUAL',
        params: { intervals: ['P5'], range: { minMidi: 60, maxMidi: 61 } },
      },
    ])
      expect(
        lessonSchema.safeParse({
          ...firstLesson,
          exercises: [spec, ...firstLesson.exercises.slice(1)],
        }).success,
      ).toBe(false);
  });
  it('erzeugt für 300 Seeds einen vollständigen Satz und eine andere Variante für jeden Fehler', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        let state = createLessonSession(firstLesson, seed);
        expect(state.initial.items).toHaveLength(10);
        expect(state.initial.items).toEqual(createLessonSession(firstLesson, seed).initial.items);
        while (state.phase === 'initial') {
          const session = required(activeLessonSession(state));
          const item = required(currentItem(session));
          const wrong = required(item.choices.find((value) => value !== expectedAnswer(item)));
          state = nextLessonExercise(answerLesson(state, wrong));
        }
        expect(state.reviewOrigins).toHaveLength(10);
        required(state.review).items.forEach((item, index) => {
          expect(itemVariantKey(item)).not.toBe(
            itemVariantKey(required(state.initial.items[index])),
          );
        });
        state = startLessonReview(state);
        while (state.phase === 'review') {
          state = nextLessonExercise(
            answerLesson(
              state,
              expectedAnswer(required(currentItem(required(activeLessonSession(state))))),
            ),
          );
        }
        expect(state.phase).toBe('complete');
      }),
      { numRuns: 300 },
    );
  });
  it('prüft die eigenen Referenzintervalle gegen feste Tabellen und Engine', () => {
    const examples = firstLesson.introduction.flatMap((card) => card.examples);
    const table = [
      ['Eb4', 'm3', 'lesson.minorThird'],
      ['E4', 'M3', 'lesson.majorThird'],
      ['F4', 'P4', 'lesson.fourth'],
      ['G4', 'P5', 'lesson.fifth'],
    ] as const;
    for (const [to, interval, caption] of table) {
      expect(examples.find((value) => value.captionKey === caption)?.score).toBe(
        `treble | 4/4 | C4/2 ${to}/2`,
      );
      expect(formatInterval(intervalBetween(parsePitch('C4'), parsePitch(to)))).toBe(interval);
    }
  });
});

function required<T>(value: T | undefined | null): T {
  if (value == null) throw new Error('Erwarteter Testwert fehlt');
  return value;
}
