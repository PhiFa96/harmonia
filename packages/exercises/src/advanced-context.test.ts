import { describe, expect, it } from 'vitest';
import { parseScore, scoreTimeline } from '@harmonia/notation';
import { createRng } from '@harmonia/theory';
import {
  advancedContextAnswer,
  ADVANCED_CONTEXT_TOPICS,
  counterpointContextFindings,
} from './advanced-context.ts';
import { contextAnswer, contextVariantKey, generateContext } from './context.ts';
import { contextExplanation } from './context-text.ts';
import { feedbackMedia } from './feedback-media.ts';
import { evaluateExercise } from './evaluate.ts';
describe('P4.19 analysis from visible, playable source', () => {
  it.each(ADVANCED_CONTEXT_TOPICS)(
    '%s has exactly one correct choice and diverse deterministic review sources',
    (topic) => {
      const seen = new Set<string>();
      for (let seed = 0; seed < 50; seed++) {
        const item = generateContext({ topics: [topic] }, createRng(seed));
        expect(item).toEqual(generateContext({ topics: [topic] }, createRng(seed)));
        expect(item.choices.filter((answer) => evaluateExercise(item, answer).correct)).toEqual([
          contextAnswer(item),
        ]);
        seen.add(contextVariantKey(item));
        if (item.source.kind !== 'score') throw new Error('Score missing');
        const audio = feedbackMedia(item).audio;
        if (!audio) throw new Error('Audio missing');
        expect(scoreTimeline(audio, { bpm: 84 })).toEqual(
          scoreTimeline(item.source.score, { bpm: 84 }),
        );
      }
      expect(seen.size).toBeGreaterThan(3);
    },
  );
  it('responds to changed notation rather than cached topic/choice data', () => {
    const item = generateContext({ topics: ['set-cardinality'] }, createRng(3));
    const source = {
      kind: 'score' as const,
      score: parseScore('treble | 4/4 | C4/4 C5/4 B#3/4 C4/4'),
    };
    expect(contextAnswer({ ...item, source })).toBe('cardinality:1');
    expect(contextAnswer({ ...item, source, choices: [] })).toBe('cardinality:1');
    expect(
      advancedContextAnswer(
        'motif-transform',
        parseScore('treble | 4/4 | C4/4 D4/4 F4/4 E4/4 | G4/4 F4/4 D4/4 Eb4/4'),
      ),
    ).toBe('transform:I');
    expect(
      advancedContextAnswer('set-vector', parseScore('treble | 4/4 | C4/4 E4/4 G4/4 C5/4')),
    ).toBe('vector:0,0,1,1,1,0');
  });
  it('refuses ambiguity, unequal rhythms, rests and incomplete counterpoint', () => {
    expect(() =>
      advancedContextAnswer(
        'motif-transform',
        parseScore('treble | 4/4 | C4/4 D4/4 E4/4 F#4/4 | F#4/4 E4/4 D4/4 C4/4'),
      ),
    ).toThrow(/Ambiguous/);
    expect(() =>
      advancedContextAnswer('motif-transform', parseScore('treble | 4/4 | C4/2 D4/2 | D4/2 C4/2')),
    ).toThrow();
    expect(() =>
      advancedContextAnswer('set-cardinality', parseScore('treble | 4/4 | r/1')),
    ).toThrow();
    expect(() => counterpointContextFindings(parseScore('treble | 4/4 | (C4 G4)/1'))).toThrow();
    expect(() =>
      counterpointContextFindings(parseScore('treble | 4/4 | (C4 G4)/2 (D4 A4)/2')),
    ).toThrow();
  });
  it('explains actual findings with measure references in all locales', () => {
    const item = {
      ...generateContext({ topics: ['counterpoint-check'] }, createRng(0)),
      source: {
        kind: 'score' as const,
        score: parseScore('treble | 4/4 | (C4 G4)/1 | (D4 A4)/1 | (D4 B4)/1 | (C4 C5)/1'),
      },
    };
    expect(contextExplanation(item, 'de')).toContain('Takt 2');
    expect(contextExplanation(item, 'en-US')).toContain('Measure 2');
    expect(contextExplanation(item, 'en-GB')).toContain('Bar 2');
  });
});
