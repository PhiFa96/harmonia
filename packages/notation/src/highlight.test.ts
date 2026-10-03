import { describe, expect, it } from 'vitest';

import type { Highlight } from './highlight.ts';
import {
  DARK_HIGHLIGHT_COLORS,
  DEFAULT_HIGHLIGHT_COLORS,
  MARK_BAND,
  highlightFor,
  highlightMarks,
} from './highlight.ts';
import { layoutScore } from './layout.ts';
import { parseScore } from './shorthand.ts';
import type { SvgElement } from './svg.ts';
import { layoutToSvg, svgScene } from './svg.ts';

const score = parseScore('treble | 4/4 | C4/1 | (C4 E4)/1');
const layout = layoutScore(score);

describe('Hervorhebung: Zuordnung', () => {
  const highlights: Highlight[] = [
    { ref: { measure: 0, event: 0 }, kind: 'correct' },
    { ref: { measure: 1, event: 0, note: 1 }, kind: 'wrong' },
  ];

  it('ganzes Ereignis oder ein Ton im Akkord', () => {
    expect(highlightFor(highlights, { measure: 0, event: 0, note: 0 })).toBe('correct');
    expect(highlightFor(highlights, { measure: 0, event: 0 })).toBe('correct');
    expect(highlightFor(highlights, { measure: 1, event: 0, note: 1 })).toBe('wrong');
    expect(highlightFor(highlights, { measure: 1, event: 0, note: 0 })).toBeUndefined();
    expect(highlightFor(highlights, undefined)).toBeUndefined();
  });

  it('ein Symbol je Ereignis; falsch geht vor aktiv vor richtig', () => {
    const marks = highlightMarks(layout, [
      { ref: { measure: 1, event: 0, note: 0 }, kind: 'correct' },
      { ref: { measure: 1, event: 0, note: 1 }, kind: 'wrong' },
      { ref: { measure: 0, event: 0 }, kind: 'active' },
    ]);
    expect(marks.map((m) => [m.ref.measure, m.kind])).toEqual([
      [0, 'active'],
      [1, 'wrong'],
    ]);
    // Tiefe Noten: Symbol über der obersten Linie
    expect(marks.map((m) => m.y)).toEqual([-MARK_BAND / 2, -MARK_BAND / 2]);
  });

  it('über hohen Noten steht das Symbol über dem höchsten Element', () => {
    const high = layoutScore(parseScore('treble | 4/4 | C6/1'));
    const [mark] = highlightMarks(high, [{ ref: { measure: 0, event: 0 }, kind: 'correct' }]);
    const head = high.items.find((i) => i.kind === 'glyph' && i.role === 'notehead');
    expect(head?.kind === 'glyph' && mark && mark.y < head.y - 0.5).toBe(true);
    // Und es passt in das Band über dem Layout
    expect(mark && mark.y - 0.6 >= high.top - MARK_BAND).toBe(true);
  });
});

describe('Hervorhebung im Notenbild', () => {
  const plain = svgScene(layout, { scale: 10 });
  const marked = svgScene(layout, {
    scale: 10,
    highlights: [
      { ref: { measure: 0, event: 0 }, kind: 'correct' },
      { ref: { measure: 1, event: 0, note: 1 }, kind: 'wrong' },
    ],
  });
  const heads = (elements: readonly SvgElement[]) =>
    elements.filter((e) => e.kind === 'text' && e.ref?.note !== undefined);

  it('Platz für Symbole über dem System, auch bei leerer Liste', () => {
    expect(marked.height).toBeCloseTo(plain.height + MARK_BAND * 10, 5);
    expect(svgScene(layout, { scale: 10, highlights: [] }).height).toBe(marked.height);
  });

  it('färbt Notenköpfe des Ereignisses bzw. nur den markierten Akkordton', () => {
    const sorted = heads(marked.elements)
      .map((e) => [e.ref?.measure ?? 0, e.ref?.note ?? 0, e.highlight] as const)
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    expect(sorted).toEqual([
      [0, 0, 'correct'],
      [1, 0, undefined],
      [1, 1, 'wrong'],
    ]);
  });

  it('Symbole als Vektorformen über dem Ereignis, innerhalb der Zeichenfläche', () => {
    const marks = marked.elements.filter((e) => e.kind === 'line' && e.lineCap === 'round');
    expect(marks).toHaveLength(4); // Haken und Kreuz aus je zwei Strichen
    for (const measure of [0, 1]) {
      const own = marks.filter((e) => e.ref?.measure === measure);
      const heads = marked.elements.filter(
        (e) => e.kind === 'text' && e.ref?.measure === measure && e.ref.note !== undefined,
      );
      const lowestMark = Math.max(
        ...own.map((e) => (e.kind === 'line' ? Math.max(e.y1, e.y2) : 0)),
      );
      const highestHead = Math.min(...heads.map((e) => (e.kind === 'text' ? e.y - 5 : 0)));
      expect(lowestMark).toBeLessThan(highestHead);
      expect(
        Math.min(...own.map((e) => (e.kind === 'line' ? Math.min(e.y1, e.y2) : 0))),
      ).toBeGreaterThan(0);
    }
  });

  it('aktiv: Dreieck', () => {
    const active = svgScene(layout, {
      highlights: [{ ref: { measure: 0, event: 0 }, kind: 'active' }],
    });
    expect(
      active.elements.filter((e) => e.kind === 'polygon' && e.highlight === 'active'),
    ).toHaveLength(1);
  });

  it('SVG-Text mit Farben der Hervorhebung', () => {
    const svg = layoutToSvg(layout, {
      highlights: [{ ref: { measure: 0, event: 0 }, kind: 'correct' }],
      color: '#000',
    });
    expect(svg).toContain(`fill="${DEFAULT_HIGHLIGHT_COLORS.correct}"`);
    expect(svg).toContain(
      `stroke="${DEFAULT_HIGHLIGHT_COLORS.correct}" stroke-width="2" stroke-linecap="round"`,
    );
    const custom = layoutToSvg(layout, {
      highlights: [{ ref: { measure: 0, event: 0 }, kind: 'correct' }],
      highlightColors: { correct: '#00ff00' },
    });
    expect(custom).toContain('fill="#00ff00"');
  });
});

describe('Fester Ausschnitt und Umrechnung', () => {
  it('Ausschnitt deckt den gewünschten Bereich ab', () => {
    const scene = svgScene(layout, { scale: 10, padding: 1, extent: { top: -5, bottom: 9 } });
    expect(scene.height).toBe((9 - -5 + 2) * 10);
  });

  it('Pixel zurück in Layout-Koordinaten', () => {
    const scene = svgScene(layout, {
      scale: 12,
      padding: 1,
      highlights: [],
      extent: { top: -5, bottom: 9 },
    });
    const item = layout.items.find((i) => i.kind === 'glyph' && i.role === 'notehead');
    const drawn = scene.elements.find((e) => e.kind === 'text' && e.ref?.note === 0);
    if (item?.kind !== 'glyph' || drawn?.kind !== 'text') {
      throw new Error('Notenkopf fehlt');
    }
    const back = scene.toLayout(drawn.x, drawn.y);
    expect(back.x).toBeCloseTo(item.x, 1);
    expect(back.y).toBeCloseTo(item.y, 1);
    const there = scene.toPixels(item.x, item.y);
    expect(there.x).toBeCloseTo(drawn.x, 1);
    expect(there.y).toBeCloseTo(drawn.y, 1);
  });
});

describe('Kontrast der Farben (WCAG 2.2, relative Leuchtdichte)', () => {
  const luminance = (hex: string): number => {
    const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
      const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a: string, b: string): number => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
  };

  it('Referenzwerte der Formel', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
  });

  // Hintergründe: Weiß, Hellgrau der App (React Navigation hell: rgb(242, 242, 242)),
  // Schwarz und Dunkelgrau (React Navigation dunkel: rgb(1, 1, 1) und Karten rgb(18, 18, 18))
  it.each(Object.entries(DEFAULT_HIGHLIGHT_COLORS))('hell, %s: mindestens 4,5 : 1', (_, color) => {
    for (const background of ['#ffffff', '#f2f2f2']) {
      expect(contrast(color, background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(Object.entries(DARK_HIGHLIGHT_COLORS))('dunkel, %s: mindestens 4,5 : 1', (_, color) => {
    for (const background of ['#000000', '#010101', '#121212']) {
      expect(contrast(color, background)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
