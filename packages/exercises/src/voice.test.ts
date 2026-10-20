import { validateScore } from '@harmonia/notation';
import { createRng, midi } from '@harmonia/theory';
import { describe, expect, it } from 'vitest';
import { evaluateExercise, expectedAnswer } from './evaluate.ts';
import { generateExercise } from './generate.ts';
import { createLessonSession, skipLessonVoice, lessonSummary } from './lesson.ts';
import { voiceAnswerValues, voiceOctaveShifted, voiceTargets } from './voice.ts';
import type { ExerciseSpec, VoiceItem } from './types.ts';

const common = {
  clefs: ['treble'] as const,
  range: { minMidi: 60, maxMidi: 76 },
  maxAccidentals: 0 as const,
};
const specs: readonly ExerciseSpec[] = [
  { type: 'SIGHT_SING', params: { ...common, level: 1 } },
  { type: 'SING_INTERVAL', params: { ...common, level: 1, intervals: ['m3', 'M3', 'P4', 'P5'] } },
  { type: 'PLAY_BACK', params: { ...common, level: 2, intervals: ['M2', 'm3', 'M3', 'P4'] } },
];
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Testwert fehlt');
  return value;
}
const answer = (value: number) => `voice:${String(value)}`;

describe('Mikrofonübungen', () => {
  it.each(specs)('%s erzeugt gültige, wiederholbare Tonfolgen', (spec) => {
    for (let seed = 0; seed < 100; seed++) {
      const item = generateExercise(spec, createRng(seed)) as VoiceItem;
      expect(item).toEqual(generateExercise(spec, createRng(seed)));
      expect(validateScore(item.score, { allowPickup: false })).toEqual([]);
      expect(item.pitches).toHaveLength(
        item.type === 'PLAY_BACK' ? 3 : item.type === 'SING_INTERVAL' ? 2 : 1,
      );
      expect(item.pitches.every((pitch) => midi(pitch) >= 60 && midi(pitch) <= 76)).toBe(true);
      expect(evaluateExercise(item, expectedAnswer(item))).toMatchObject({
        correct: true,
        validAnswer: true,
      });
      expect(evaluateExercise(item, 'voice:garbage')).toMatchObject({
        correct: false,
        validAnswer: false,
      });
    }
  });

  it('wendet die Toleranz je Stufe an und lässt die Oktavlage frei, aber keinen falschen Ton', () => {
    for (const level of [1, 2, 3] as const) {
      const item = generateExercise(
        { type: 'SIGHT_SING', params: { ...common, level } },
        createRng(4),
      ) as VoiceItem;
      const target = midi(required(voiceTargets(item)[0])) * 100;
      const tolerance = level === 1 ? 50 : 25;
      expect(item.toleranceCents).toBe(tolerance);
      expect(evaluateExercise(item, answer(target + tolerance)).correct).toBe(true);
      expect(evaluateExercise(item, answer(target + tolerance + 1)).correct).toBe(false);
      expect(evaluateExercise(item, answer(target - tolerance)).correct).toBe(true);
      expect(evaluateExercise(item, answer(target + 600)).correct).toBe(false);
      expect(evaluateExercise(item, answer(target + 1200)).correct).toBe(true);
      expect(evaluateExercise(item, answer(target + 1200 + tolerance + 1)).correct).toBe(false);
      expect(voiceOctaveShifted(item, answer(target + 1200))).toBe(true);
      expect(voiceOctaveShifted(item, answer(target))).toBe(false);
    }
  });

  it('prüft beim Nachspielen jeden Ton in der richtigen Reihenfolge', () => {
    const item = generateExercise(required(specs[2]), createRng(7)) as VoiceItem;
    const values = required(voiceAnswerValues(expectedAnswer(item), 3));
    expect(
      evaluateExercise(item, `voice:${[values[1], values[0], values[2]].join(',')}`).correct,
    ).toBe(false);
    expect(evaluateExercise(item, `voice:${values.slice(0, 2).join(',')}`).validAnswer).toBe(false);
    expect(
      evaluateExercise(
        item,
        `voice:${[values[0], values[1], required(values[2]) + 1200].join(',')}`,
      ).correct,
    ).toBe(false);
    const shifted = values.map((value) => value + 1200).join(',');
    expect(evaluateExercise(item, `voice:${shifted}`).correct).toBe(true);
  });

  it('überspringt eine Mikrofonaufgabe ohne Fehler oder Wiederholung', () => {
    const lesson = createLessonSession({ id: 'voice', contentVersion: 1, exercises: specs }, 2);
    const skipped = skipLessonVoice(lesson);
    expect(skipped.initial.index).toBe(1);
    expect(lessonSummary(skipped)).toMatchObject({ skipped: 1, answered: 0, reviewTotal: 0 });
  });
});
