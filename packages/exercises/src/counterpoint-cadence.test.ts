import { describe, expect, it } from 'vitest';
import { parseScore } from '@harmonia/notation';
import { createRng, formatPitch } from '@harmonia/theory';
import { generateContext, contextAnswer } from './context.ts';
import type { ContextItem } from './context.ts';
import {
  contextExplanation,
  contextSourceText,
  contextPrompt,
  contextHint,
} from './context-text.ts';
import { counterpointCantusEnding } from './counterpoint-context.ts';
import { exerciseHints, hintText } from './feedback.ts';

function itemFor(lower: string, upper = 'C5/1 | G4/1 | D5/1 | C5/1'): ContextItem {
  return {
    ...generateContext({ topics: ['counterpoint-check'] }, createRng(0)),
    source: {
      kind: 'score',
      score: parseScore(`treble | 4/4 | ${upper}\ntreble | 4/4 | ${lower}`),
    },
  };
}

describe('cantus closing convention in the counterpoint explanation', () => {
  it.each(['de', 'en-US', 'en-GB'] as const)(
    '%s identifies the leading-tone cantus as a variant',
    (locale) => {
      const item = itemFor('C4/1 | E4/1 | B3/1 | C4/1');
      const text = contextExplanation(item, locale);
      expect(text).toContain('7→1');
      expect(text).toContain('Fux');
      expect(text).toMatch(locale === 'de' ? /Schlussvariante/ : /closing variant/);
    },
  );

  it('explains the exercise convention before grading without exposing the result', () => {
    const clean = itemFor('C4/1 | E4/1 | B3/1 | C4/1'),
      faulty = itemFor('C4/1 | E4/1 | B3/1 | C4/1', 'C5/1 | G4/1 | D5/1 | G4/1');
    const before = contextSourceText(clean, 'de');
    expect(contextAnswer(clean)).toBe('boolean:yes');
    expect(contextAnswer(faulty)).toBe('boolean:no');
    expect(before).toContain('7→1');
    expect(before).toContain('2→1');
    expect(before).toBe(contextSourceText(faulty, 'de'));
    expect(before).not.toMatch(/Kein Befund|unzulässiges|Takt 4/);
  });

  it.each(['de', 'en-US', 'en-GB'] as const)(
    '%s distinguishes the descending cantus from the ascending variant using the actual notes',
    (locale) => {
      const variant = itemFor('C4/1 | E4/1 | B3/1 | C4/1'),
        standard = itemFor('C4/1 | G4/1 | D4/1 | C4/1', 'C5/1 | E5/1 | B4/1 | C5/1');
      expect(contextAnswer(standard)).toBe('boolean:yes');
      if (variant.source.kind !== 'score' || standard.source.kind !== 'score')
        throw Error('Missing score');
      expect(counterpointCantusEnding(variant.source.score)?.kind).toBe('ascending-semitone');
      expect(counterpointCantusEnding(standard.source.score)?.kind).toBe('descending-tone');
      const first = contextExplanation(variant, locale),
        second = contextExplanation(standard, locale);
      expect(first).toContain('7→1');
      expect(second).toContain('2→1');
      expect(second).not.toContain('7→1');
      expect(first).toContain(locale === 'de' ? 'h → c¹' : 'B3 → C4');
      expect(second).toContain(locale === 'de' ? 'd¹ → c¹' : 'D4 → C4');
      expect(first).toContain(
        locale === 'de' ? 'Halbton' : locale === 'en-GB' ? 'semitone' : 'half step',
      );
      expect(second).toContain(
        locale === 'de' ? 'Ganzton' : locale === 'en-GB' ? 'a tone' : 'whole step',
      );
      expect(first + second).not.toMatch(/\$t\(|\{\{|undefined/);
      expect(contextSourceText(variant, locale)).toBe(contextSourceText(standard, locale));
      expect(contextPrompt(variant, locale)).toBe(contextPrompt(standard, locale));
      for (const level of [1, 2] as const) {
        expect(contextHint(variant, level, locale)).toBe(contextHint(standard, level, locale));
        expect(hintText(variant, exerciseHints(variant, level), locale)).not.toContain('Cantus: ');
      }
      expect(hintText(variant, exerciseHints(variant, 3), locale)).toBe(first);
    },
  );

  it.each([
    ['B3', 'C4', 'ascending-semitone'],
    ['C#4', 'D4', 'ascending-semitone'],
    ['D4', 'C4', 'descending-tone'],
    ['Eb4', 'Db4', 'descending-tone'],
    ['Cb4', 'C4', 'other-motion'],
    ['B#3', 'C4', 'other-motion'],
    ['D#4', 'C4', 'other-motion'],
    ['D5', 'C4', 'other-motion'],
    ['C4', 'C4', 'other-motion'],
  ] as const)(
    'describes written cantus motion %s → %s as %s without enharmonic shortcuts',
    (from, to, kind) => {
      const score = parseScore(`treble | 4/4 | D5/1 | C5/1\ntreble | 4/4 | ${from}/1 | ${to}/1`),
        before = JSON.stringify(score),
        ending = counterpointCantusEnding(score);
      expect(ending?.kind).toBe(kind);
      expect(ending && [formatPitch(ending.from), formatPitch(ending.to)]).toEqual([from, to]);
      expect(JSON.stringify(score)).toBe(before);
    },
  );

  it('uses the second staff as cantus even when the parts cross', () => {
    const score = parseScore('treble | 4/4 | D3/1 | C3/1\ntreble | 4/4 | B3/1 | C4/1');
    expect(counterpointCantusEnding(score)?.kind).toBe('ascending-semitone');
  });

  it('keeps note-naming preferences separate from the explanation language', () => {
    const item = itemFor('C4/1 | E4/1 | B3/1 | C4/1'),
      international = contextExplanation(item, { locale: 'de', noteNaming: 'intl' }),
      german = contextExplanation(item, { locale: 'en-GB', noteNaming: 'de' });
    expect(international).toContain('Cantus: B3 → C4.');
    expect(international).toContain('Schlussvariante');
    expect(german).toContain('Cantus: h → c¹.');
    expect(german).toContain('diatonic semitone');
  });

  it('does not assign a fixed cantus convention to historical single-staff dyads', () => {
    const score = parseScore('treble | 4/4 | (B3 D5)/1 | (C4 C5)/1');
    expect(counterpointCantusEnding(score)).toBeUndefined();
    const item = {
      ...itemFor('C4/1 | E4/1 | B3/1 | C4/1'),
      source: { kind: 'score' as const, score },
    };
    expect(contextSourceText(item, 'de')).not.toContain('Fux');
    expect(contextExplanation(item, 'de')).not.toContain('Fux');
  });

  it('keeps other counterpoint topics and unrecognised cantus motions free of a false cadence label', () => {
    const other = itemFor('C4/1 | E4/1 | C4/1 | C4/1');
    expect(contextExplanation(other, 'de')).not.toContain('7→1');
    expect(contextExplanation(other, 'de')).not.toContain('2→1');
    for (const topic of ['counterpoint-consonance', 'counterpoint-motion'] as const) {
      const item = generateContext({ topics: [topic] }, createRng(1));
      expect(contextSourceText(item, 'de')).not.toContain('Fux');
      expect(contextExplanation(item, 'de')).not.toContain('Fux');
    }
  });
});
