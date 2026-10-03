import { describe, expect, it } from 'vitest';

import { layoutScore } from './layout.ts';
import { parseScore } from './shorthand.ts';
import { layoutToSvg } from './svg.ts';

describe('SVG-Ausgabe', () => {
  const layout = layoutScore(parseScore('treble | 2/4 | C5/8. D5/16 (C4 E4)/4~ | (C4 E4)/2'));
  const svg = layoutToSvg(layout, { scale: 10 });

  it('ein Element je Layout-Element', () => {
    const elements = svg.match(/<(text|line|polygon|path) /g) ?? [];
    expect(elements).toHaveLength(layout.items.length);
  });

  it('Glyphen als SMuFL-Codepoints im Notenfont', () => {
    expect(svg).toContain('&#xE050;');
    expect(svg).toContain('font-family="Bravura"');
    expect(svg).toContain('font-size="40"');
  });

  it('Ausschnitt umfasst Rand und Ausdehnung', () => {
    const [, viewBox = ''] = /viewBox="([^"]+)"/.exec(svg) ?? [];
    const [x, y, w, h] = viewBox.split(' ').map(Number);
    expect(x).toBe(-10);
    expect(y).toBeCloseTo((layout.top - 1) * 10, 1);
    expect(w).toBeCloseTo((layout.width + 2) * 10, 1);
    expect(h).toBeCloseTo((layout.bottom - layout.top + 2) * 10, 1);
  });

  it('Farbe und Schrift wählbar', () => {
    const custom = layoutToSvg(layout, { color: '#123456', fontFamily: 'Petaluma' });
    expect(custom).toContain('fill="#123456"');
    expect(custom).toContain('font-family="Petaluma"');
  });
});
