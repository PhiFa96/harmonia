import { note, rest, singleStaffScore, validateScore } from '@harmonia/notation';
import { checkMeasure, duration, parseTimeSignature } from '@harmonia/theory';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  activeLessonSession,
  answerLesson,
  answerSession,
  assessRhythm,
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
  generateRhythm,
  hintText,
  itemVariantKey,
  lessonSummary,
  meterFromId,
  MVP_METERS,
  nextLessonExercise,
  rhythmAnswerId,
  rhythmAnswerTaps,
  rhythmBeatCount,
  rhythmMeasureMs,
  rhythmMeter,
  rhythmOnsets,
  rhythmTimeline,
  rhythmTolerance,
  skipAuralExercises,
  startLessonReview,
} from './index.ts';
import type { ExerciseSpec, RhythmItem, RhythmParams } from './index.ts';

const pitch = { letter: 'G', alter: 0, octave: 4 } as const;
function item(
  meter = '4/4',
  events = [
    note(pitch, duration('quarter')),
    rest(duration('quarter')),
    note(pitch, duration('eighth')),
    note(pitch, duration('eighth')),
    note(pitch, duration('quarter')),
  ],
  bpm = 120,
): RhythmItem {
  return {
    ...generateRhythm({ meters: ['4/4'] }, createRng(1), 'RHYTHM_TAP'),
    bpm,
    meter: parseTimeSignature(meter),
    score: singleStaffScore([events], { timeSignature: parseTimeSignature(meter) }),
  };
}
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Testwert fehlt');
  return value;
}
describe('Rhythmus- und Taktaufgaben', () => {
  it.each([
    { meters: MVP_METERS, level: 'basic', rests: true },
    { meters: MVP_METERS, level: 'dotted', rests: true, tempos: [60, 120], toleranceMs: 180 },
    { meters: ['6/8', '9/8', '12/8'], level: 'dotted', rests: false },
    {
      meters: ['2/2', '3/8'],
      level: 'dotted',
      rests: true,
      clefs: ['treble', 'bass'],
      tempos: [60, 72, 96, 120],
      toleranceMs: 40,
    },
  ] satisfies RhythmParams[])(
    '150 Seeds: voller Takt, reproduzierbares Notenbild und richtige Einsatzzeiten bei %j',
    (params) => {
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const source = generateRhythm(params, createRng(seed), 'RHYTHM_TAP');
          expect(source).toEqual(generateRhythm(params, createRng(seed), 'RHYTHM_TAP'));
          expect(validateScore(source.score, { allowPickup: false })).toEqual([]);
          const events = required(source.score.staves[0]?.measures[0]?.voices[0]?.events);
          expect(
            checkMeasure(
              events.map((event) => event.duration),
              rhythmMeter(source),
            ).status,
          ).toBe('complete');
          expect(rhythmOnsets(source).length).toBeGreaterThan(0);
          expect(
            rhythmTimeline(source).reduce((total, event) => total + event.durationMs, 0),
          ).toBeCloseTo(rhythmMeasureMs(source), 7);
          expect(evaluateExercise(source, expectedAnswer(source))).toMatchObject({
            validAnswer: true,
            correct: true,
          });
          expect(evaluateExercise(source, 'taps:')).toMatchObject({
            validAnswer: true,
            correct: false,
          });
          if (!params.rests) expect(events.some((event) => event.kind === 'rest')).toBe(false);
        }),
        { numRuns: 150, seed: 2064 },
      );
    },
  );
  it.each(MVP_METERS)(
    '%s: Notenbild bestimmt Taktantwort und jede Auswahl hat eine verschiedene Grundschlagbeschreibung',
    (meter) => {
      for (let seed = 0; seed < 25; seed++) {
        const source = generateRhythm(
          { meters: [meter, ...MVP_METERS], clefs: ['treble', 'bass'] },
          createRng(seed),
          'METER_IDENTIFY',
        );
        expect(new Set(source.choices).size).toBe(source.choices.length);
        expect(
          new Set(source.choices.map((answer) => choiceLabel(source, answer, 'en-GB'))).size,
        ).toBe(source.choices.length);
        expect(source.choices.filter((answer) => evaluateExercise(source, answer).correct)).toEqual(
          [expectedAnswer(source)],
        );
        expect(
          expectedAnswer({
            ...source,
            meter: parseTimeSignature(source.meter.numerator === 4 ? '3/4' : '4/4'),
          }),
        ).toBe(expectedAnswer(source));
        expect(validateScore(source.score, { allowPickup: false })).toEqual([]);
      }
    },
  );
  it('feste Beispiele prüfen Viertel, Pausen, Achtel und den punktierten Viertel-Grundschlag unabhängig', () => {
    expect(rhythmOnsets(item())).toEqual([0, 1000, 1250, 1500]);
    const triple = item(
      '3/4',
      Array.from({ length: 3 }, () => note(pitch, duration('quarter'))),
    );
    expect(rhythmOnsets(triple)).toEqual([0, 500, 1000]);
    expect(rhythmBeatCount(triple)).toBe(3);
    expect(rhythmMeasureMs(triple)).toBe(1500);
    const compound = item('6/8', [
      note(pitch, duration('quarter')),
      note(pitch, duration('eighth')),
      note(pitch, duration('quarter', 1)),
    ]);
    expect(rhythmOnsets(compound)).toEqual([0, 333, 500]);
    expect(rhythmBeatCount(compound)).toBe(2);
    expect(rhythmMeasureMs(compound)).toBe(1000);
    const startingRest = item(
      '2/4',
      [rest(duration('eighth')), note(pitch, duration('eighth')), note(pitch, duration('quarter'))],
      60,
    );
    expect(rhythmOnsets(startingRest)).toEqual([500, 1000]);
  });
  it('Grenzwerte sind inklusive; fehlender/zusätzlicher Anschlag und falscher Taktbeginn bleiben Fehler', () => {
    const source = item(),
      times = rhythmOnsets(source),
      window = rhythmTolerance(source);
    expect(window).toBe(100);
    for (const offset of [-window, window])
      expect(
        evaluateExercise(source, rhythmAnswerId(times.map((time) => time + offset))).correct,
      ).toBe(true);
    expect(
      evaluateExercise(source, rhythmAnswerId(times.map((time) => time + window + 1))).correct,
    ).toBe(false);
    expect(evaluateExercise(source, rhythmAnswerId(times.slice(1))).correct).toBe(false);
    expect(evaluateExercise(source, rhythmAnswerId([0, ...times])).correct).toBe(false);
    const result = assessRhythm(source, [0, 100, 1000, 1500]);
    expect(result).toMatchObject({ matched: 3, missing: 1, extras: [100], correct: false });
    expect(result.targets[2]).toEqual({ expectedMs: 1250 });
    expect(result.targets[3]).toMatchObject({ expectedMs: 1500, tapMs: 1500 });
    expect(assessRhythm(source, [0, 0, 1000, 1250, 1500]).extras).toEqual([0]);
  });
  it('die optimale Zuordnung stimmt für 150 kleine Folgen mit einer unabhängigen vollständigen Aufzählung überein', () => {
    const source = item(
      '3/4',
      Array.from({ length: 3 }, () => note(pitch, duration('quarter'))),
    );
    const targets = rhythmOnsets(source),
      window = rhythmTolerance(source);
    function enumerate(taps: readonly number[], i = 0, j = 0): { count: number; cost: number } {
      if (i >= targets.length || j >= taps.length) return { count: 0, cost: 0 };
      const possibilities = [enumerate(taps, i + 1, j), enumerate(taps, i, j + 1)],
        delta = Math.abs(required(targets[i]) - required(taps[j]));
      if (delta <= window) {
        const rest = enumerate(taps, i + 1, j + 1);
        possibilities.push({ count: rest.count + 1, cost: rest.cost + delta });
      }
      return required(possibilities.sort((a, b) => b.count - a.count || a.cost - b.cost)[0]);
    }
    fc.assert(
      fc.property(fc.array(fc.integer({ min: -120, max: 1500 }), { maxLength: 5 }), (values) => {
        const taps = [...values].sort((a, b) => a - b),
          oracle = enumerate(taps),
          actual = assessRhythm(source, taps);
        expect(actual.matched).toBe(oracle.count);
        expect(
          actual.targets.reduce((cost, target) => cost + Math.abs(target.offsetMs ?? 0), 0),
        ).toBe(oracle.cost);
      }),
      { numRuns: 150, seed: 2065 },
    );
  });
  it('ASCII-Zeitwerte werden streng geprüft; ungültige Antworten erzeugen keine Wertung', () => {
    const source = item(),
      session = createSession([source]);
    for (const answer of [
      'taps:0,',
      'taps:00',
      'taps:-0',
      'taps:1.5',
      'taps:0,1\n',
      'taps:NaN',
      'taps:Infinity',
      'taps:5,4',
      'taps:-121',
      'taps:2121',
      'taps:1e3',
      'taps:+1',
      'taps: 0',
      'taps:' + Array.from({ length: 129 }, () => 0).join(','),
    ]) {
      expect(rhythmAnswerTaps(source, answer)).toBeUndefined();
      expect(answerSession(session, answer)).toBe(session);
    }
    expect(rhythmAnswerTaps(source, 'taps:-100,900,1200,1400')).toEqual([-100, 900, 1200, 1400]);
    for (const id of ['meter:6/8\n', 'meter:7/8', 'meter:06/8', 'meter:3+3/8'])
      expect(() => meterFromId(id)).toThrow();
  });
  it('Hör-Pause nimmt nur die rhythmische Aufnahme heraus; Taktfragen bleiben erhalten', () => {
    const tap = generateRhythm({ meters: ['4/4'] }, createRng(1), 'RHYTHM_TAP'),
      meter = generateRhythm({ meters: ['4/4', '6/8'] }, createRng(2), 'METER_IDENTIFY');
    const state = skipAuralExercises(createSession([tap, meter, tap]));
    expect(state.skipped).toEqual([0, 2]);
    expect(currentItem(state)).toBe(meter);
  });
  it('Wiederholung wechselt das Rhythmusbild, bewahrt Erstwertung und lässt Tempo-, Schlüssel- oder Tonhöhenänderung allein nicht genügen', () => {
    const specs: readonly ExerciseSpec[] = [
      { type: 'RHYTHM_TAP', params: { meters: ['4/4'], tempos: [96] } },
      { type: 'METER_IDENTIFY', params: { meters: ['3/4', '6/8'] } },
    ];
    let state = createLessonSession(
      { id: 'test.rhythm', contentVersion: 1, exercises: specs },
      2064,
    );
    const original = state.initial.items;
    while (state.phase === 'initial') {
      const source = required(currentItem(state.initial));
      const answer =
        source.type === 'RHYTHM_TAP'
          ? 'taps:'
          : required(source.choices.find((answer) => answer !== expectedAnswer(source)));
      state = nextLessonExercise(answerLesson(state, answer));
    }
    state = startLessonReview(state);
    while (state.phase === 'review') {
      const active = required(activeLessonSession(state)),
        source = required(currentItem(active));
      expect(itemVariantKey(source)).not.toBe(itemVariantKey(required(original[active.index])));
      state = nextLessonExercise(answerLesson(state, expectedAnswer(source)));
    }
    expect(lessonSummary(state)).toMatchObject({
      answered: 2,
      correct: 0,
      reviewCorrect: 2,
      unresolved: 0,
    });
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
    const source = item();
    expect(itemVariantKey({ ...source, bpm: 72, clef: 'bass' })).toBe(itemVariantKey(source));
  });
  it.each(['de', 'en-US', 'en-GB'] as const)(
    'Erklärungen, Notenwertnamen und Hinweise in %s sind vollständig',
    (locale) => {
      for (const type of ['RHYTHM_TAP', 'METER_IDENTIFY'] as const) {
        const source = generateRhythm({ meters: ['3/4', '6/8'] }, createRng(3), type);
        const texts = [
          exercisePrompt(source, locale),
          exerciseDescription(source, locale),
          exerciseFeedback(source, evaluateExercise(source, expectedAnswer(source)), locale)
            .message,
          ...([1, 2, 3] as const).map((level) =>
            hintText(source, exerciseHints(source, level), locale),
          ),
        ];
        texts.forEach((text) => {
          expect(text.length).toBeGreaterThan(10);
          expect(text).not.toMatch(/exercise\.|glossary:|\{\{|\$t\(/);
        });
      }
      const meter = generateRhythm({ meters: ['3/4', '6/8'] }, createRng(1), 'METER_IDENTIFY');
      expect(choiceLabel(meter, 'meter:6/8', locale)).toContain(
        locale === 'de'
          ? 'punktierte Viertelnote'
          : locale === 'en-GB'
            ? 'dotted crotchet'
            : 'dotted quarter note',
      );
    },
  );
  it('unerlaubte Parameter scheitern bei jedem Seed', () => {
    for (const params of [
      { meters: [] },
      { meters: ['7/8'] },
      { meters: ['4/4'], tempos: [] },
      { meters: ['4/4'], tempos: [59] },
      { meters: ['4/4'], tempos: [121] },
      { meters: ['4/4'], tempos: [NaN] },
      { meters: ['4/4'], toleranceMs: 39 },
      { meters: ['4/4'], toleranceMs: 181 },
      { meters: ['4/4'], level: 'triplet' },
      { meters: ['4/4'], clefs: [] },
      { meters: ['4/4'], rests: 1 },
    ])
      for (let seed = 0; seed < 3; seed++)
        expect(() =>
          generateRhythm(params as RhythmParams, createRng(seed), 'RHYTHM_TAP'),
        ).toThrow();
  });
});
