import { describe, expect, it } from 'vitest';
import { eventBounds, layoutScore } from './layout.ts';
import { highlightMarks } from './highlight.ts';
import { formatScore, parseScore } from './shorthand.ts';
import { layoutToSvg } from './svg.ts';
import { slurs, validateScore } from './score.ts';

describe('Notation für Stufe 3–4', () => {
  it('setzt Alt-/Tenorschlüssel und Klaviersystem im SVG', () => {
    const score = parseScore('treble | key:G | C5/2 D5/2\nbass | key:G | G2/1');
    const layout = layoutScore(score);
    expect(
      layout.items.filter((item) => item.kind === 'glyph' && item.role === 'clef'),
    ).toHaveLength(2);
    expect(eventBounds(layout).map((bound) => bound.staff)).toEqual([0, 0, 1]);
    expect(layoutToSvg(layout)).toContain('<svg');
    expect(
      layoutScore(parseScore('alto | C4/1')).items.some(
        (item) => item.kind === 'glyph' && item.glyph === 'cClef',
      ),
    ).toBe(true);
    expect(
      layoutScore(parseScore('tenor | C4/1')).items.some(
        (item) => item.kind === 'glyph' && item.glyph === 'cClef',
      ),
    ).toBe(true);
  });

  it('behält Stimmen, Triolen und Haltebögen getrennt', () => {
    const score = parseScore('treble | C5/8{3:2} D5/8{3:2} E5/8{3:2} F5/4~ G5/2 & C4/2 C4/2');
    const layout = layoutScore(score);
    expect(
      layout.items.filter((item) => item.kind === 'glyph' && item.role === 'tuplet'),
    ).toHaveLength(1);
    expect(eventBounds(layout).filter((bound) => bound.voice === 1)).toHaveLength(2);
    expect(validateScore(score).some((issue) => issue.type === 'tie-without-target')).toBe(true);
  });

  it('ordnet Markierungen getrennt nach System und Stimme zu', () => {
    const layout = layoutScore(parseScore('treble | C5/1 & E4/1\nbass | C3/1'));
    expect(eventBounds(layout)).toHaveLength(3);
    const marks = highlightMarks(layout, [
      { ref: { staff: 0, measure: 0, voice: 1, event: 0 }, kind: 'wrong' },
      { ref: { staff: 1, measure: 0, voice: 0, event: 0 }, kind: 'correct' },
    ]);
    expect(marks.map((mark) => [mark.ref.staff, mark.ref.voice, mark.kind])).toEqual([
      [0, 1, 'wrong'],
      [1, undefined, 'correct'],
    ]);
  });

  it('unterscheidet Phrasierungs- und Haltebogen über Taktgrenzen', () => {
    const score = parseScore('treble | 2/4 | C5/4[ D5/4~ | D5/4 E5/4]');
    expect(formatScore(score)).toContain('C5/4[');
    expect(slurs(score)).toHaveLength(1);
    expect(validateScore(score)).toEqual([]);
    const layout = layoutScore(score);
    expect(layout.items.filter((item) => item.kind === 'slur')).toHaveLength(1);
    expect(layout.items.filter((item) => item.kind === 'tie')).toHaveLength(1);
    expect(layoutToSvg(layout).match(/<path /g)).toHaveLength(2);
    expect(validateScore(parseScore('C5/4[ D5/4 E5/2'))).toContainEqual({
      type: 'slur-without-end',
      from: { staff: 0, measure: 0, voice: 0, event: 0 },
    });
  });

  it('zeichnet Akkord- und Funktionssymbole und maskiert SVG-Text', () => {
    const source = 'treble | (C4 E4 G4 B4)/2@ch:Cmaj7@fn:T7 G4/2@ch:G7@fn:D7';
    const score = parseScore(source);
    expect(formatScore(score)).toContain('@ch:Cmaj7@fn:T7');
    const result = layoutScore(score);
    expect(result.items.filter((item) => item.kind === 'label')).toHaveLength(4);
    expect(layoutToSvg(result)).toContain('Cmaj7');
    const escaped = layoutToSvg(layoutScore(parseScore('C4/1@ch:C<7')));
    expect(escaped).toContain('C&lt;7');
    expect(() => parseScore('r/1@fn:T')).toThrow(SyntaxError);
  });
});
