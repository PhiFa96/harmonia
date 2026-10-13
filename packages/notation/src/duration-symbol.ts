import type { Duration } from '@harmonia/theory';
import { note, rest, singleStaffScore } from './score.ts';
import { eventBounds, glyphMetrics, layoutScore } from './layout.ts';
import type { LayoutItem, ScoreLayout } from './layout.ts';

/** Ein einzelnes Dauerzeichen, ohne Schlüssel/Taktangabe oder Tonhöhen-Voraussetzung. */
export function durationSymbolLayout(value: Duration, kind: 'note' | 'rest'): ScoreLayout {
  if (
    !['whole', 'half', 'quarter', 'eighth', 'sixteenth'].includes(value.value) ||
    value.dots !== 0 ||
    value.tuplet ||
    !['note', 'rest'].includes(kind)
  )
    throw new RangeError('Dauerzeichen unterstützt unpunktierte Werte von ganz bis Sechzehntel');
  const event = kind === 'rest' ? rest(value) : note({ letter: 'G', alter: 0, octave: 4 }, value);
  const layout = layoutScore(singleStaffScore([[event]]));
  const bounds = eventBounds(layout)[0];
  if (!bounds) throw new RangeError('Dauerzeichen fehlt');
  const offset = bounds.x1;
  const items: LayoutItem[] = layout.items.flatMap<LayoutItem>((item) => {
    if (!('ref' in item)) return [];
    if (item.kind === 'glyph') return [{ ...item, x: item.x - offset }];
    if (item.role === 'stem') return [{ ...item, x1: item.x1 - offset, x2: item.x2 - offset }];
    return [];
  });
  let width = bounds.x2 - offset;
  if (kind === 'rest' && ['whole', 'half'].includes(value.value)) {
    const glyph = items.find((item) => item.kind === 'glyph');
    if (glyph?.kind === 'glyph') {
      items.push({
        kind: 'line',
        role: 'staffLine',
        x1: -0.5,
        x2: width + 0.5,
        y1: glyph.y,
        y2: glyph.y,
        thickness: 0.1,
      });
      width += 0.5;
    }
  }
  const ys = items.flatMap((item) =>
    item.kind === 'glyph'
      ? [item.y - glyphMetrics(item.glyph).bBoxNE[1], item.y - glyphMetrics(item.glyph).bBoxSW[1]]
      : item.kind === 'line'
        ? [item.y1, item.y2]
        : [],
  );
  return { width, top: Math.min(...ys), bottom: Math.max(...ys), items };
}
