import { describe, expect, it } from 'vitest';
import { formatScore, parseScore, validateScore } from './index.ts';
import { layoutScore } from './layout.ts';
import { scoreTimeline } from './timeline.ts';
import { GLYPHS } from './smufl-data.ts';
describe('Begrenzte Achteltriolen in Kurzschrift und Notensatz', () => {
  it('parst und formatiert 3:2 ohne Änderung der bestehenden Dauern', () => {
    const source = 'treble | 4/4 | C4/8{3:2} D4/8{3:2} E4/8{3:2} F4/2.';
    const score = parseScore(source);
    expect(parseScore(formatScore(score))).toEqual(score);
    expect(validateScore(score, { allowPickup: false })).toEqual([]);
    expect(scoreTimeline(score, { bpm: 60 }).tones.map((t) => t.onsetSeconds)).toEqual([
      0,
      1 / 3,
      2 / 3,
      1,
    ]);
    expect(
      layoutScore(score).items.filter((i) => i.kind === 'glyph' && i.role === 'tuplet'),
    ).toMatchObject([{ glyph: 'tuplet3' }]);
    expect(GLYPHS.tuplet3.codepoint).toBe(0xe883);
  });
  it.each([
    'treble | 4/4 | C4/8{3:2} D4/4 E4/2',
    'treble | 4/4 | C4/4{3:2} D4/4{3:2} E4/4{3:2} F4/2',
    'treble | 4/4 | C4/8{3:2} r/8{3:2} E4/8{3:2} F4/2.',
    'treble | 4/4 | C4/8 C4/8{3:2} D4/8{3:2} E4/8{3:2} F4/2',
  ])(
    'weist unvollständige, andere oder außerhalb der Viertel begonnene Gruppen ab: %s',
    (source) => {
      expect(() => layoutScore(parseScore(source))).toThrow();
    },
  );
});
