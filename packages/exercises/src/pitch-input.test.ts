import {
  MAX_STEP,
  MIN_STEP,
  eventPitches,
  pitchAt,
  stepOf,
  validateScore,
} from '@harmonia/notation';
import {
  enharmonicSpellings,
  formatPitch,
  intervalBetween,
  midi,
  parsePitch,
} from '@harmonia/theory';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  activeLessonSession,
  answerLesson,
  answerSession,
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
  generateExercise,
  generateIntervalBuild,
  generateKeyFind,
  generateNotePlace,
  hintText,
  inputSlot,
  inputSolutionScore,
  inputTarget,
  isPitchInput,
  itemVariantKey,
  keyAnswerId,
  lessonSummary,
  nextLessonExercise,
  revealHint,
  sessionSummary,
  startLessonReview,
} from './index.ts';
import type { ExerciseSpec, PitchInputItem } from './index.ts';

const SPECS: readonly ExerciseSpec[] = [
  ...([0, 1, 2] as const).flatMap((maxAccidentals) => [
    { type: 'NOTE_PLACE' as const, params: { clefs: ['treble', 'bass'] as const, maxAccidentals } },
    {
      type: 'KEY_FIND' as const,
      params: {
        clefs: ['treble', 'bass'] as const,
        maxAccidentals,
        range: { minMidi: 21, maxMidi: 108 },
      },
    },
    {
      type: 'INTERVAL_BUILD' as const,
      params: {
        clefs: ['treble', 'bass'] as const,
        maxAccidentals,
        intervals: ['P1', 'm3', 'M3', 'P4', 'P5', 'P8'],
        direction: 'both' as const,
      },
    },
  ]),
  {
    type: 'INTERVAL_BUILD',
    params: {
      intervals: ['A4', 'd5', 'd4', 'M9', 'P15'],
      range: { minMidi: 21, maxMidi: 108 },
      maxAccidentals: 2,
      direction: 'down',
    },
  },
];

describe('Freie Tonhöheneingaben', () => {
  it.each(SPECS.map((spec, index) => [index, spec] as const))(
    'Parametersatz %i: 150 Seeds sind reproduzierbar, spielbar und korrekt bewertbar',
    (_index, spec) => {
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const item = generateExercise(spec, createRng(seed));
          expect(item).toEqual(generateExercise(spec, createRng(seed)));
          if (!isPitchInput(item)) throw new Error('Eingabeaufgabe fehlt');
          const target = inputTarget(item);
          expect(item.choices).toEqual([]);
          expect(validateScore(item.score, { allowPickup: false })).toEqual([]);
          expect(validateScore(inputSolutionScore(item), { allowPickup: false })).toEqual([]);
          expect(evaluateExercise(item, expectedAnswer(item))).toMatchObject({
            correct: true,
            validAnswer: true,
          });
          if (item.type !== 'KEY_FIND') {
            expect(pitchAt(item.score, inputSlot(item))).toBeUndefined();
            expect(pitchAt(inputSolutionScore(item), inputSlot(item))).toEqual(target);
            const pitches = item.type === 'INTERVAL_BUILD' ? [item.from, item.to] : [item.pitch];
            for (const pitch of pitches) {
              expect(stepOf(pitch, item.clef)).toBeGreaterThanOrEqual(MIN_STEP);
              expect(stepOf(pitch, item.clef)).toBeLessThanOrEqual(MAX_STEP);
            }
          }
          const range =
            spec.params.range ??
            (item.type === 'KEY_FIND'
              ? { minMidi: 60, maxMidi: 76 }
              : item.clef === 'treble'
                ? { minMidi: 60, maxMidi: 84 }
                : { minMidi: 36, maxMidi: 60 });
          expect(midi(target)).toBeGreaterThanOrEqual(range.minMidi);
          expect(midi(target)).toBeLessThanOrEqual(range.maxMidi);
          expect(Math.abs(target.alter)).toBeLessThanOrEqual(spec.params.maxAccidentals ?? 1);
          expect(
            evaluateExercise(
              item,
              item.type === 'KEY_FIND'
                ? `key:${String(midi(target) === 60 ? 61 : 60)}`
                : formatPitch({ ...target, octave: target.octave === 4 ? 3 : 4 }),
            ).correct,
          ).toBe(false);
        }),
        { numRuns: 150, seed: 206 },
      );
    },
  );

  it('Cis4/Des4: gleicher Klang ist beim Schreiben falsch, auf der Klaviatur richtig', () => {
    const written = { ...generateNotePlace({}, createRng(1)), pitch: parsePitch('C#4') };
    expect(evaluateExercise(written, 'Db4')).toMatchObject({
      validAnswer: true,
      correct: false,
      expected: 'C#4',
    });
    expect(evaluateExercise(written, 'C#5').correct).toBe(false);
    const keyboard = { ...generateKeyFind({}, createRng(1)), pitch: parsePitch('C#4') };
    expect(evaluateExercise(keyboard, keyAnswerId(parsePitch('Db4'))).correct).toBe(true);
    expect(evaluateExercise(keyboard, 'key:73').correct).toBe(false);
    expect(evaluateExercise(keyboard, 'Db4').validAnswer).toBe(false);
    const boundary = { ...keyboard, pitch: parsePitch('B#3') };
    expect(evaluateExercise(boundary, keyAnswerId(parsePitch('C4'))).correct).toBe(true);
  });

  it.each([
    ['C4', 'Fb4', 'E4', 'd4'],
    ['C4', 'Ab3', 'G#3', '-M3'],
  ])('Intervall %s → %s bewahrt die Zielschreibweise und Richtung', (from, to, wrong, interval) => {
    const item = {
      ...generateIntervalBuild({ intervals: ['M3'] }, createRng(1)),
      from: parsePitch(from),
      to: parsePitch(to),
    };
    expect(midi(item.to)).toBe(midi(parsePitch(wrong)));
    expect(evaluateExercise(item, to).correct).toBe(true);
    expect(evaluateExercise(item, wrong)).toMatchObject({ correct: false, validAnswer: true });
    expect(intervalBetween(item.from, item.to)).toEqual(
      intervalBetween(parsePitch(from), parsePitch(to)),
    );
    expect(exercisePrompt(item, 'en-US')).toContain(
      interval.startsWith('-') ? 'descending' : 'diminished',
    );
  });

  it('freie IDs werden streng geprüft; ungültige Antworten erzeugen keinen Datensatz', () => {
    const item = generateNotePlace({}, createRng(1));
    const session = createSession([item]);
    for (const answer of [
      '',
      'C:0:4',
      'C♯4',
      ' C4',
      'C###4',
      'C-1',
      'C99',
      'A0',
      '<script>',
      'C4\n',
    ]) {
      expect(evaluateExercise(item, answer).validAnswer, answer).toBe(false);
      expect(answerSession(session, answer)).toBe(session);
    }
    const keyboard = generateKeyFind({}, createRng(1));
    for (const answer of ['key:20', 'key:109', 'key:060', 'key:60.0', 'key:NaN', 'key:60\n'])
      expect(evaluateExercise(keyboard, answer).validAnswer, answer).toBe(false);
  });

  it('eine falsche Antwort bleibt fest; Hilfen zählen auch bei freien Eingaben getrennt', () => {
    const item = { ...generateNotePlace({}, createRng(1)), pitch: parsePitch('E4') };
    const state = answerSession(revealHint(createSession([item])), 'F4');
    expect(state.records).toHaveLength(1);
    expect(answerSession(state, 'E4')).toBe(state);
    expect(sessionSummary(state)).toMatchObject({
      correct: 0,
      answered: 1,
      assisted: 1,
      skipped: 0,
    });
  });

  it.each(['de', 'en-US', 'en-GB'] as const)(
    'alle Eingabetypen haben aufgelöste Aufgaben, Hinweise und Erklärungen in %s',
    (locale) => {
      for (const spec of SPECS.slice(0, 3)) {
        const item = generateExercise(spec, createRng(19));
        const texts = [
          exercisePrompt(item, locale),
          exerciseDescription(item, locale),
          exerciseFeedback(item, evaluateExercise(item, expectedAnswer(item)), locale).message,
          ...([1, 2, 3] as const).map((level) =>
            hintText(item, exerciseHints(item, level), locale),
          ),
        ];
        for (const text of texts) {
          expect(text.length).toBeGreaterThan(10);
          expect(text).not.toMatch(/exercise\.|\{\{|\$t\(/);
        }
      }
      const item = generateIntervalBuild({ intervals: ['M3'] }, createRng(3));
      expect(exercisePrompt(item, locale)).toContain(
        locale === 'en-GB' ? 'bar' : locale === 'en-US' ? 'measure' : 'Takt',
      );
    },
  );

  it('Fragebilder enthalten nur die Vorgabe; keine Zielnote oder versteckte Antwortoption', () => {
    const note = generateNotePlace({}, createRng(1));
    const interval = generateIntervalBuild({ intervals: ['M3'] }, createRng(1));
    const pitches = (item: PitchInputItem) =>
      item.score.staves.flatMap((staff) =>
        staff.measures.flatMap((measure) =>
          measure.voices.flatMap((voice) => voice.events.flatMap(eventPitches)),
        ),
      );
    expect(pitches(note)).toEqual([]);
    expect(pitches(interval)).toEqual([interval.from]);
    expect(exerciseDescription(interval, 'en-US')).not.toContain('Note 2');
  });

  it('unmögliche Eingabebereiche und Intervalle scheitern vor der Zufallsauswahl', () => {
    expect(() => generateNotePlace({ range: { minMidi: 21, maxMidi: 21 } }, createRng(1))).toThrow(
      RangeError,
    );
    expect(() =>
      generateIntervalBuild(
        { intervals: ['M3', 'P15'], range: { minMidi: 60, maxMidi: 65 } },
        createRng(1),
      ),
    ).toThrow(RangeError);
  });

  it('Wiederholungen erzeugen neue Tonhöhenvarianten für alle drei Typen und behalten die Erstwertung', () => {
    let lesson = createLessonSession(
      { id: 'test.pitch-input', contentVersion: 1, exercises: SPECS.slice(0, 3) },
      'review',
    );
    const originals = lesson.initial.items;
    while (lesson.phase === 'initial') {
      const item = currentItem(required(activeLessonSession(lesson)));
      if (!item || !isPitchInput(item)) throw new Error('Aufgabe fehlt');
      const target = inputTarget(item);
      const wrong =
        item.type === 'KEY_FIND'
          ? `key:${String(midi(target) === 60 ? 61 : 60)}`
          : (enharmonicSpellings(target)
              .map((pitch) => formatPitch(pitch))
              .find(
                (answer) =>
                  answer !== expectedAnswer(item) && evaluateExercise(item, answer).validAnswer,
              ) ?? (target.letter === 'C' ? 'D4' : 'C4'));
      lesson = nextLessonExercise(answerLesson(lesson, wrong));
    }
    expect(lesson.phase).toBe('review-intro');
    lesson = startLessonReview(lesson);
    while (lesson.phase === 'review') {
      const session = required(activeLessonSession(lesson));
      const item = required(currentItem(session));
      expect(itemVariantKey(item)).not.toBe(itemVariantKey(required(originals[session.index])));
      lesson = nextLessonExercise(answerLesson(lesson, expectedAnswer(item)));
    }
    expect(lessonSummary(lesson)).toMatchObject({
      correct: 0,
      answered: 3,
      reviewCorrect: 3,
      unresolved: 0,
    });
    expect(JSON.parse(JSON.stringify(lesson))).toEqual(lesson);
  });

  it('ein bloßer Schlüssel-/Enharmonikwechsel ist keine neue Tastenvariante', () => {
    const item = generateKeyFind({}, createRng(1));
    expect(itemVariantKey({ ...item, pitch: parsePitch('C#4') })).toBe(
      itemVariantKey({ ...item, clef: 'bass', pitch: parsePitch('Db4') }),
    );
  });
});
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Erwarteter Testwert fehlt');
  return value;
}
