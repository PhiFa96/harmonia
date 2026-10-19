import { describe, expect, it } from 'vitest';
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
  rhythmBeatCount,
  startLessonReview,
} from '@harmonia/exercises';
import { catalogue, curriculumPlan } from './authoring.ts';
import { exampleSchema, exerciseSpecSchema, publicCatalogue, resolveLesson } from './index.ts';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Testwert fehlt');
  return value;
}
describe('Erste Rhythmuseinheit: Puls, Tempo und Zählgruppen', () => {
  it.each([
    ['steady', 8, 3, 'pulse'],
    ['tempo', 10, 3, 'tempo'],
    ['groups', 12, 2, 'beatGroup'],
  ] as const)(
    '%s: %s Aufgaben, passende Themen und neue Fehleraufgaben in 150 Seeds',
    (name, count, cards, topic) => {
      const lesson = required(resolveLesson(catalogue, `rhythm.l1.pulse.${name}`));
      expect(lesson).toMatchObject({ contentVersion: 6, status: 'entwurf' });
      expect(lesson.introduction).toHaveLength(cards);
      expect(lesson.exercises).toHaveLength(count);
      for (let seed = 0; seed < 150; seed++) {
        let session = revealLessonHint(createLessonSession(lesson, seed));
        while (session.phase === 'initial') {
          const item = required(currentItem(required(activeLessonSession(session))));
          if (item.type === 'KNOWLEDGE_MC') expect(item.fact.topic).toBe(topic);
          else if (item.type === 'RHYTHM_TAP') {
            expect(item.presentation).toBe('pulse');
            expect(item.toleranceMs).toBe(160);
          } else throw new Error('Unerwartete Voraussetzung');
          const wrong =
            item.type === 'RHYTHM_TAP'
              ? 'taps:'
              : required(item.choices.find((id) => id !== expectedAnswer(item)));
          session = nextLessonExercise(answerLesson(session, wrong));
        }
        expect(session.phase).toBe('review-intro');
        required(session.review).items.forEach((item, index) => {
          const original = required(session.initial.items[index]);
          expect(itemVariantKey(item)).not.toBe(itemVariantKey(original));
          if (item.type === 'RHYTHM_TAP' && original.type === 'RHYTHM_TAP')
            expect(rhythmBeatCount(item)).not.toBe(rhythmBeatCount(original));
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
      }
    },
  );
  it('ergänzt acht Karten und dreizehn Beispiele ohne Freigabe oder Änderung früherer Lektionen', () => {
    expect(catalogue.contentVersion).toBe(15);
    expect(curriculumPlan.contentVersion).toBe(15);
    const cards = catalogue.knowledgeCards.filter((card) => card.id.startsWith('rhythm.l1.pulse.'));
    expect(cards).toHaveLength(8);
    expect(cards.flatMap((card) => card.examples)).toHaveLength(13);
    expect(
      cards.every((card) => card.examples.every((example) => example.pulse && !example.keyboard)),
    ).toBe(true);
    expect(
      catalogue.knowledgeArticles.find((article) => article.id === 'rhythm.l1.pulse.article')
        ?.sections,
    ).toHaveLength(5);
    expect(catalogue.lessons).toHaveLength(121);
    for (const [id, version] of [
      ['fundament.reading-and-listening.1', 1],
      ['notation.l1.staff.anchor', 3],
      ['notation.l1.keyboard.keys', 4],
      ['notation.l1.register.octaves', 5],
    ] as const)
      expect(resolveLesson(catalogue, id)?.contentVersion).toBe(version);
    expect(catalogue.skills.find((skill) => skill.id === 'rhythm.pulse')?.prerequisites).toEqual(
      [],
    );
    for (const id of ['rhythm.tempo', 'rhythm.beat-group'])
      expect(catalogue.skills.find((skill) => skill.id === id)?.prerequisites).toEqual([
        'rhythm.pulse',
      ]);
    expect(publicCatalogue(catalogue)).toMatchObject({
      lessons: [],
      knowledgeCards: [],
      knowledgeArticles: [],
    });
  });
  it('erhält den strengen Pulsmodus und weist unpassende Takte und Pausen zurück', () => {
    const spec = {
      type: 'RHYTHM_TAP',
      params: {
        meters: ['2/4', '3/4', '4/4'],
        level: 'pulse',
        rests: false,
        tempos: [60, 90, 120],
        toleranceMs: 160,
      },
    };
    expect(exerciseSpecSchema.parse(spec)).toEqual(spec);
    for (const params of [
      { meters: ['6/8'], level: 'pulse' },
      { meters: ['2/2'], level: 'pulse' },
      { meters: ['4/4'], level: 'pulse', rests: true },
      { meters: ['3/4'], level: 'pulse', presentation: 'score' },
    ])
      expect(exerciseSpecSchema.safeParse({ type: 'RHYTHM_TAP', params }).success).toBe(false);
    expect(
      exerciseSpecSchema.safeParse({
        type: 'METER_IDENTIFY',
        params: { meters: ['3/4'], level: 'pulse' },
      }).success,
    ).toBe(false);
    for (const topic of ['pulse', 'tempo', 'beatGroup'])
      expect(
        exerciseSpecSchema.parse({ type: 'KNOWLEDGE_MC', params: { topics: [topic] } }),
      ).toMatchObject({ params: { topics: [topic] } });
  });
  it('validiert Beispieltempo und genau eine Darstellungsart; alte Beispiele bleiben gültig', () => {
    const example = {
      score: 'treble | 3/4 | G4/4 G4/4 G4/4',
      captionKey: 'content.pulseStart.countInCaption',
    };
    expect(exampleSchema.parse(example)).toEqual(example);
    expect(exampleSchema.parse({ ...example, pulse: { bpm: 90 } })).toEqual({
      ...example,
      pulse: { bpm: 90 },
    });
    for (const pulse of [{ bpm: 59 }, { bpm: 121 }, { bpm: 90.5 }, { bpm: 90, extra: true }])
      expect(exampleSchema.safeParse({ ...example, pulse }).success).toBe(false);
    expect(
      exampleSchema.safeParse({ ...example, pulse: { bpm: 90 }, keyboard: { first: 60, last: 72 } })
        .success,
    ).toBe(false);
  });
});
