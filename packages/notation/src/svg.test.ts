import { describe, expect, it } from 'vitest';

import { eventBounds, layoutScore } from './layout.ts';
import { parseScore } from './shorthand.ts';
import { layoutToSvg, svgScene } from './svg.ts';

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

  it('Zeichenfläche umfasst Rand und Ausdehnung', () => {
    const [, viewBox = ''] = /viewBox="([^"]+)"/.exec(svg) ?? [];
    const [x, y, w, h] = viewBox.split(' ').map(Number);
    expect([x, y]).toEqual([0, 0]);
    expect(w).toBeCloseTo((layout.width + 2) * 10, 1);
    expect(h).toBeCloseTo((layout.bottom - layout.top + 2) * 10, 1);
  });

  it('Farbe und Schrift wählbar', () => {
    const custom = layoutToSvg(layout, { color: '#123456', fontFamily: 'Petaluma' });
    expect(custom).toContain('fill="#123456"');
    expect(custom).toContain('font-family="Petaluma"');
  });
});

describe('Zeichenliste für alle Renderer', () => {
  const layout = layoutScore(parseScore('C6/4 r/4 C4/2'));

  it('verschiebt um Rand und obere Ausdehnung, skaliert in Pixel', () => {
    const scene = svgScene(layout, { scale: 10, padding: 1 });
    const firstStaffLine = scene.elements[0];
    expect(firstStaffLine).toMatchObject({ kind: 'line', x1: 10, y1: (1 - layout.top) * 10 });
    expect(scene.elements.every((e) => e.kind !== 'text' || e.fontSize === 40)).toBe(true);
  });

  it('Glyphen als Zeichen (für <Text> in react-native-svg)', () => {
    const clef = svgScene(layout).elements.find((e) => e.kind === 'text');
    expect(clef).toMatchObject({ kind: 'text', text: '' });
  });
});

describe('Bereiche der Ereignisse', () => {
  it('je Ereignis von links nach rechts, ohne Überlappung', () => {
    const layout = layoutScore(parseScore('C#4/4 r/4 (C4 D4 F#4)/4 E5/8 F5/8 | G4/1'));
    const bounds = eventBounds(layout);
    expect(bounds.map((b) => `${String(b.measure)}/${String(b.event)}`)).toEqual([
      '0/0',
      '0/1',
      '0/2',
      '0/3',
      '0/4',
      '1/0',
    ]);
    bounds.forEach((b, i) => {
      expect(b.x2).toBeGreaterThan(b.x1);
      const next = bounds[i + 1];
      if (next?.measure === b.measure) {
        expect(next.x1).toBeGreaterThanOrEqual(b.x2 - 0.2);
      }
    });
  });

  it('das Vorzeichen gehört zum Bereich der Note', () => {
    const layout = layoutScore(parseScore('F#4/1'));
    const [bounds] = eventBounds(layout);
    const sharp = layout.items.find((i) => i.kind === 'glyph' && i.role === 'accidental');
    expect(sharp?.kind === 'glyph' && bounds && bounds.x1 <= sharp.x).toBe(true);
  });
});
