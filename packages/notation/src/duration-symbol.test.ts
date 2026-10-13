import { describe, expect, it } from 'vitest';
import { duration } from '@harmonia/theory';
import { durationSymbolLayout, glyphMetrics, svgScene } from './index.ts';
describe('Einzelne Dauerzeichen aus dem bestehenden Notensatz', () => {
  it.each(['note', 'rest'] as const)(
    '%s: fünf eindeutige, vollständig sichtbare Zeichen',
    (kind) => {
      const scenes = new Set<string>();
      for (const value of ['whole', 'half', 'quarter', 'eighth', 'sixteenth'] as const) {
        const layout = durationSymbolLayout(duration(value), kind);
        expect(
          layout.items.some(
            (i) => i.kind === 'glyph' && ['clef', 'timeSignature', 'keySignature'].includes(i.role),
          ),
        ).toBe(false);
        for (const item of layout.items) {
          if (item.kind === 'glyph') {
            const metrics = glyphMetrics(item.glyph);
            expect(item.x + metrics.bBoxSW[0]).toBeGreaterThanOrEqual(-0.01);
            expect(item.x + metrics.bBoxNE[0]).toBeLessThanOrEqual(layout.width + 0.01);
            expect(item.y - metrics.bBoxNE[1]).toBeGreaterThanOrEqual(layout.top);
            expect(item.y - metrics.bBoxSW[1]).toBeLessThanOrEqual(layout.bottom);
          }
        }
        scenes.add(JSON.stringify(svgScene(layout).elements));
      }
      expect(scenes.size).toBe(5);
    },
  );
  it('ganze Pause hängt unter, halbe Pause sitzt auf der Bezugslinie', () => {
    for (const value of ['whole', 'half'] as const) {
      const layout = durationSymbolLayout(duration(value), 'rest');
      const glyph = layout.items.find((i) => i.kind === 'glyph');
      const line = layout.items.find((i) => i.kind === 'line' && i.role === 'staffLine');
      if (glyph?.kind !== 'glyph' || line?.kind !== 'line') throw new Error('Bezug fehlt');
      const box = glyphMetrics(glyph.glyph);
      if (value === 'whole') expect(glyph.y - box.bBoxNE[1]).toBeGreaterThanOrEqual(line.y1 - 0.05);
      else expect(glyph.y - box.bBoxSW[1]).toBeLessThanOrEqual(line.y1 + 0.05);
    }
  });
  it('enthält die richtige Anzahl von Notenhälsen und Fähnchen', () => {
    for (const [value, head, flag] of [
      ['whole', 'noteheadWhole', undefined],
      ['half', 'noteheadHalf', undefined],
      ['quarter', 'noteheadBlack', undefined],
      ['eighth', 'noteheadBlack', 'flag8thUp'],
      ['sixteenth', 'noteheadBlack', 'flag16thUp'],
    ] as const) {
      const { items } = durationSymbolLayout(duration(value), 'note');
      expect(items.filter((i) => i.kind === 'glyph' && i.role === 'notehead')).toMatchObject([
        { glyph: head },
      ]);
      expect(items.filter((i) => i.kind === 'line' && i.role === 'stem')).toHaveLength(
        value === 'whole' ? 0 : 1,
      );
      const flags = items.filter((i) => i.kind === 'glyph' && i.role === 'flag');
      expect(flags).toHaveLength(flag ? 1 : 0);
      if (flag) expect(flags[0]).toMatchObject({ glyph: flag });
    }
  });
});
