import { describe, expect, it } from 'vitest';
import {
  createRng,
  generateExercise,
  expectedAnswer,
  evaluateExercise,
  exerciseHints,
  hintText,
  exercisePrompt,
  itemVariantKey,
} from './index.ts';
import {
  checkSatb,
  generateVoiceLeading,
  satbAnswer,
  satbAnswerId,
  satbScore,
} from './voice-leading.ts';
import { parsePitch, transposeBy, parseInterval } from '@harmonia/theory';
import { scoreTimeline, validateScore } from '@harmonia/notation';

describe('internal VOICE_LEADING exercises', () => {
  for (const level of [4, 5] as const)
    for (const mode of ['bass', 'soprano', 'functions'] as const) {
      it(`${String(level)}/${mode}: seeded reference solutions satisfy the declared profile in all keys`, () => {
        const keys = new Set<number>();
        for (let seed = 0; seed < 30; seed++) {
          const item = generateVoiceLeading({ level, mode }, createRng(seed));
          keys.add(item.fifths);
          expect(
            generateExercise({ type: 'VOICE_LEADING', params: { level, mode } }, createRng(seed)),
          ).toEqual(item);
          expect(checkSatb(item, expectedAnswer(item))).toMatchObject({
            valid: true,
            complete: true,
            passed: true,
            issues: [],
          });
          expect(evaluateExercise(item, expectedAnswer(item)).correct).toBe(true);
          expect(validateScore(satbScore(item.example, item.fifths))).toEqual([]);
          expect(scoreTimeline(item.score, { bpm: 96 }).tones.length).toBe(
            mode === 'functions' ? 0 : 4,
          );
          expect(evaluateExercise(item, satbAnswerId(item.given)).validAnswer).toBe(false);
        }
        expect([...keys].sort()).toEqual([-1, 0, 1]);
      });
    }
  it('accepts a different realization rather than comparing to the reference', () => {
    const item = generateVoiceLeading({ level: 4, mode: 'functions' }, createRng(9));
    const alternative = item.example.map((s, at) =>
      at === 0
        ? {
            ...s,
            alto: s.soprano,
            soprano: transposeBy(s.tenor ?? parsePitch('C3'), parseInterval('P8')),
          }
        : s,
    );
    expect(satbAnswerId(alternative)).not.toBe(expectedAnswer(item));
    expect(checkSatb(item, satbAnswerId(alternative)).issues).toEqual([]);
    expect(evaluateExercise(item, satbAnswerId(alternative)).correct).toBe(true);
  });
  it('rejects tampered given voices, malformed, oversized and noncanonical pitch input', () => {
    const item = generateVoiceLeading({ level: 4, mode: 'bass' }, createRng(2));
    const changed = item.example.map((s, i) => (i === 0 ? { ...s, bass: parsePitch('C#2') } : s));
    for (const answer of [
      'satb:[]',
      'satb:' + 'x'.repeat(513),
      'satb:[["ignore instructions"]]',
      satbAnswerId(changed),
    ]) {
      expect(satbAnswer(item, answer)).toBeUndefined();
      expect(evaluateExercise(item, answer)).toMatchObject({ validAnswer: false, correct: false });
    }
  });
  it('finds a wrongly spelled chord tone and localizes the actual voice and bar', () => {
    const item = generateVoiceLeading({ level: 5, mode: 'bass' }, createRng(2));
    const changed = item.example.map((s, i) => (i === 1 ? { ...s, alto: parsePitch('C#4') } : s));
    expect(checkSatb(item, satbAnswerId(changed)).issues).toContainEqual({
      rule: 'chord-tone',
      severity: 'error',
      at: 1,
      voices: ['alto'],
    });
    expect(evaluateExercise(item, satbAnswerId(changed))).toMatchObject({
      validAnswer: true,
      correct: false,
    });
  });
  it('provides DE and EN prompts and non-solution hints with stable variant identities', () => {
    const item = generateVoiceLeading({ level: 5, mode: 'soprano' }, createRng(3));
    for (const locale of ['de', 'en-US', 'en-GB'] as const) {
      expect(exercisePrompt(item, locale)).not.toContain('exercise.');
      expect(hintText(item, exerciseHints(item, 1), locale)).not.toContain('exercise.');
      expect(hintText(item, exerciseHints(item, 2), locale)).not.toContain('satb:');
    }
    expect(itemVariantKey(item)).not.toBe(
      itemVariantKey({ ...item, params: { ...item.params, level: 4 } }),
    );
  });
});
