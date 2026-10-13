import { parseScore, validateScore } from '@harmonia/notation';
import { describe, expect, it } from 'vitest';
import {
  answerLesson,
  createLessonSession,
  createRng,
  evaluateExercise,
  exerciseDescription,
  exerciseFeedback,
  exerciseHints,
  exercisePrompt,
  generateRhythm,
  hintText,
  itemVariantKey,
  nextLessonExercise,
  pulseExample,
  rhythmAnswerId,
  rhythmBeatCount,
  rhythmMeasureMs,
  rhythmOnsets,
} from './index.ts';
import type { RhythmParams } from './index.ts';

describe('Puls ohne Notenlese-Voraussetzung', () => {
  it.each([
    ['2/4', 60, [0, 1000]],
    ['3/4', 90, [0, 667, 1333]],
    ['4/4', 120, [0, 500, 1000, 1500]],
  ] as const)(
    '%s bei %s BPM hat ausschließlich gleichmäßige Soll-Einsätze',
    (meter, bpm, times) => {
      const item = generateRhythm(
        { meters: [meter], tempos: [bpm], level: 'pulse', toleranceMs: 160 },
        createRng(1),
        'RHYTHM_TAP',
      );
      expect(item.presentation).toBe('pulse');
      expect(rhythmOnsets(item)).toEqual(times);
      expect(rhythmMeasureMs(item)).toBeCloseTo((times.length * 60000) / bpm, 8);
      for (const offset of [-160, 0, 160])
        expect(
          evaluateExercise(item, rhythmAnswerId(times.map((time) => time + offset))).correct,
        ).toBe(true);
      expect(evaluateExercise(item, rhythmAnswerId(times.map((time) => time + 161))).correct).toBe(
        false,
      );
      expect(evaluateExercise(item, rhythmAnswerId(times.slice(1))).correct).toBe(false);
      expect(evaluateExercise(item, rhythmAnswerId([0, ...times])).correct).toBe(false);
    },
  );
  it('150 Seeds bleiben vollständig und bekommen bei Fehlern eine neue Gruppengröße', () => {
    const spec = {
      type: 'RHYTHM_TAP',
      params: {
        meters: ['2/4', '3/4', '4/4'],
        level: 'pulse',
        tempos: [60, 90, 120],
        rests: false,
      },
    } as const;
    for (let seed = 0; seed < 150; seed++) {
      let lesson = createLessonSession(
        { id: 'test.pulse', contentVersion: 6, exercises: [spec] },
        seed,
      );
      const original = lesson.initial.items[0];
      if (original?.type !== 'RHYTHM_TAP') throw new Error('Puls fehlt');
      expect(lesson.initial.items).toEqual(createLessonSession(lesson.lesson, seed).initial.items);
      expect(validateScore(original.score, { allowPickup: false })).toEqual([]);
      expect(rhythmOnsets(original).length).toBe(rhythmBeatCount(original));
      lesson = nextLessonExercise(answerLesson(lesson, 'taps:'));
      const review = lesson.review?.items[0];
      if (review?.type !== 'RHYTHM_TAP') throw new Error('Wiederholung fehlt');
      expect(review.presentation).toBe('pulse');
      expect(rhythmBeatCount(review)).not.toBe(rhythmBeatCount(original));
      expect(itemVariantKey({ ...original, bpm: original.bpm === 60 ? 120 : 60 })).toBe(
        itemVariantKey(original),
      );
    }
  });
  it('weist zusammengesetzte Takte, Pausen und typfremden Pulsmodus zurück', () => {
    for (const params of [
      { meters: ['6/8'], level: 'pulse' },
      { meters: ['2/2'], level: 'pulse' },
      { meters: ['3/4', '6/8'], level: 'pulse' },
      { meters: ['4/4'], level: 'pulse', rests: true },
    ] as RhythmParams[])
      expect(() => generateRhythm(params, createRng(1), 'RHYTHM_TAP')).toThrow(RangeError);
    expect(() =>
      generateRhythm({ meters: ['4/4'], level: 'pulse' }, createRng(1), 'METER_IDENTIFY'),
    ).toThrow(RangeError);
  });
  it('prüft Beispielquelle und Tempo, einschließlich Pausen, Haltebögen und Taktwechseln', () => {
    const source = 'treble | 3/4 | G4/4 G4/4 G4/4';
    const item = pulseExample(parseScore(source), 90);
    expect(rhythmOnsets(item)).toEqual([0, 667, 1333]);
    for (const bpm of [59, 121, 90.5, NaN])
      expect(() => pulseExample(parseScore(source), bpm)).toThrow(RangeError);
    for (const source of [
      'treble | 3/4 | G4/2 G4/4',
      'treble | 3/4 | G4/4 r/4 G4/4',
      'treble | 6/8 | G4/4. G4/4.',
      'treble | 3/4 | G4/4~ G4/4 G4/4',
      'treble | 3/4 | G4/4 G4/4 G4/4 | G4/4 G4/4 G4/4',
    ])
      expect(() => pulseExample(parseScore(source), 90)).toThrow();
    const score = parseScore(source),
      staff = score.staves[0],
      measure = staff?.measures[0];
    if (!staff || !measure) throw new Error('Beispiel fehlt');
    expect(() =>
      pulseExample(
        { ...score, staves: [{ ...staff, measures: [{ ...measure, changes: { clef: 'bass' } }] }] },
        90,
      ),
    ).toThrow(RangeError);
  });
  it('erklärt in allen Sprachen Klicks und Zählgruppen ohne Notenwerte oder Pausenanweisung', () => {
    const item = generateRhythm(
      { meters: ['3/4'], level: 'pulse', tempos: [90] },
      createRng(1),
      'RHYTHM_TAP',
    );
    for (const locale of ['de', 'en-US', 'en-GB'] as const) {
      const texts = [
        exercisePrompt(item, locale),
        exerciseDescription(item, locale),
        ...([1, 2, 3] as const).map((level) => hintText(item, exerciseHints(item, level), locale)),
        exerciseFeedback(item, evaluateExercise(item, 'taps:'), locale).message,
      ];
      for (const text of texts) {
        expect(text).not.toMatch(/Viertel|quarter|crotchet|3\/4|note onset|Notenanfang|\$t\(|\{\{/);
        expect(text.length).toBeGreaterThan(20);
      }
      expect(texts[0]).toContain('90');
      expect(texts[1]).toContain('3');
    }
  });
});
