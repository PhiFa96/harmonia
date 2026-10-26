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
  ratingBucket,
} from './index.ts';
import {
  checkSatb,
  generateVoiceLeading,
  satbAnswer,
  satbAnswerId,
  satbScore,
  SATB_DRAFT_RULES,
} from './voice-leading.ts';
import { parsePitch, transposeBy, parseInterval } from '@harmonia/theory';
import { scoreTimeline, validateScore } from '@harmonia/notation';

describe('internal VOICE_LEADING exercises', () => {
  it('keeps the optional augmented-interval detector outside the existing grading profile', () => {
    expect(SATB_DRAFT_RULES['augmented-melodic-interval']).toBeUndefined();
    expect(SATB_DRAFT_RULES['augmented-second']).toBe('error');
  });
  it('keeps legacy rating profiles stable and binds each fixed key to its own new profile', () => {
    const spec = {
      type: 'VOICE_LEADING' as const,
      params: { level: 4 as const, mode: 'bass' as const },
    };
    expect(ratingBucket(spec, 19)).toBe('g2:1:19:VOICE_LEADING:{"level":4,"mode":"bass"}');
    const keys = ([-1, 0, 1] as const).map((fifths) =>
      ratingBucket({ ...spec, params: { ...spec.params, fifths } }, 22),
    );
    expect(new Set(keys).size).toBe(3);
    expect(keys[1]).toBe('g2:1:22:VOICE_LEADING:{"fifths":0,"level":4,"mode":"bass"}');
  });
  it.each([
    [0, [-1, -1, -1], 0.1462021479383111],
    [1, [0, -1, 0], 0.9810509674716741],
    [42, [0, 0, 1], 0.6697340414393693],
    ['p410-content', [1, -1, 1], 0.10393149964511395],
    ['satb-tutor', [1, -1, -1], 0.5846859118901193],
  ] as const)('preserves legacy seeded keys and RNG consumption for %s', (seed, keys, next) => {
    const rng = createRng(seed);
    const items = Array.from({ length: 3 }, () =>
      generateVoiceLeading({ level: 4, mode: 'bass' }, rng),
    );
    expect(items.map((item) => item.fifths)).toEqual(keys);
    expect(items.every((item) => !('fifths' in item.params))).toBe(true);
    expect(rng.next()).toBe(next);
  });
  it('uses each authored key independently of the seed and preserves the draft profile', () => {
    for (const level of [4, 5] as const)
      for (const mode of ['bass', 'soprano', 'functions'] as const)
        for (const fifths of [-1, 0, 1] as const)
          for (const seed of [0, 'fixed-key']) {
            const item = generateVoiceLeading({ level, mode, fifths }, createRng(seed));
            expect(item.fifths).toBe(fifths);
            expect(checkSatb(item, expectedAnswer(item))).toMatchObject({
              valid: true,
              complete: true,
              passed: true,
              issues: [],
            });
            expect(validateScore(satbScore(item.example, item.fifths))).toEqual([]);
          }
  });
  it('rejects keys outside the bounded draft profile at runtime', () => {
    for (const fifths of [-2, 2, 0.5, NaN, null, '0'])
      expect(() =>
        // @ts-expect-error Deliberately invalid runtime input.
        generateVoiceLeading({ level: 4, mode: 'bass', fifths }, createRng(0)),
      ).toThrow(RangeError);
  });
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

describe('VOICE_LEADING accepts the standard textbook V(7)–I resolutions', () => {
  const cMajor = (level: 4 | 5) => {
    for (let seed = 0; seed < 100; seed++) {
      const item = generateVoiceLeading({ level, mode: 'functions' }, createRng(seed));
      if (item.fifths === 0) return item;
    }
    throw new Error('No C-major seed found');
  };
  // Zeilen: Sopran, Alt, Tenor, Bass je Akkord.
  const answer = (rows: readonly (readonly [string, string, string, string])[]) =>
    satbAnswerId(
      rows.map(([soprano, alto, tenor, bass]) => ({
        soprano: parsePitch(soprano),
        alto: parsePitch(alto),
        tenor: parsePitch(tenor),
        bass: parsePitch(bass),
      })),
    );
  it('complete V7 resolving to an incomplete I (fifth omitted, root tripled)', () => {
    const item = cMajor(5);
    const result = checkSatb(
      item,
      answer([
        ['C5', 'E4', 'G3', 'C3'],
        ['C5', 'F4', 'A3', 'F2'],
        ['B4', 'F4', 'D4', 'G2'],
        ['C5', 'E4', 'C4', 'C3'],
      ]),
    );
    expect(result).toMatchObject({ passed: true, issues: [] });
  });
  it('complete V7 resolving to a complete I with the leading tone falling in an inner voice', () => {
    const item = cMajor(5);
    const result = checkSatb(
      item,
      answer([
        ['G4', 'E4', 'C4', 'C3'],
        ['A4', 'F4', 'C4', 'F2'],
        ['F4', 'D4', 'B3', 'G2'],
        ['E4', 'C4', 'G3', 'C3'],
      ]),
    );
    expect(result).toMatchObject({ passed: true, issues: [] });
  });
  it('V resolving to I with the leading tone falling to the fifth in the tenor', () => {
    const item = cMajor(4);
    const result = checkSatb(
      item,
      answer([
        ['E5', 'G4', 'C4', 'C3'],
        ['F5', 'A4', 'C4', 'F2'],
        ['D5', 'G4', 'B3', 'G2'],
        ['C5', 'E4', 'G3', 'C3'],
      ]),
    );
    expect(result).toMatchObject({ passed: true, issues: [] });
  });
  it('still rejects a leading tone that falls in an outer voice', () => {
    const item = cMajor(4);
    const result = checkSatb(
      item,
      answer([
        ['G4', 'E4', 'C4', 'C3'],
        ['A4', 'F4', 'C4', 'F2'],
        ['B4', 'D4', 'G3', 'G2'],
        ['G4', 'E4', 'C4', 'C3'],
      ]),
    );
    expect(result.passed).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ rule: 'leading-tone-resolution', voices: ['soprano'] }),
    );
  });
  it('still requires a complete I in the level-4 progression', () => {
    const item = cMajor(4);
    const result = checkSatb(
      item,
      answer([
        ['C5', 'E4', 'G3', 'C3'],
        ['C5', 'F4', 'A3', 'F2'],
        ['B4', 'D4', 'G3', 'G2'],
        ['C5', 'E4', 'C4', 'C3'],
      ]),
    );
    expect(result.passed).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ rule: 'chord-incomplete' }));
  });
});
