// SVG-Ausgabe eines Layouts als Text: für Vorschauen, Tests und Web.
// Der App-Renderer (react-native-svg) folgt in P1.14 und zeichnet dieselben Elemente.

import type { LayoutItem, ScoreLayout } from './layout.ts';
import { glyphMetrics } from './layout.ts';
import { ENGRAVING_DEFAULTS } from './smufl-data.ts';

export interface SvgOptions {
  /** Pixel pro Notenlinienabstand. Standard: 10. */
  readonly scale?: number;
  /** Rand in Notenlinienabständen. Standard: 1. */
  readonly padding?: number;
  /** Schriftfamilie des Notenfonts (muss geladen sein). Standard: Bravura. */
  readonly fontFamily?: string;
  readonly color?: string;
}

/** Zeichnet ein Layout als SVG-Dokument (SMuFL: 1 em = 4 Notenlinienabstände). */
export function layoutToSvg(layout: ScoreLayout, options: SvgOptions = {}): string {
  const scale = options.scale ?? 10;
  const padding = options.padding ?? 1;
  const color = options.color ?? 'currentColor';
  const font = options.fontFamily ?? 'Bravura';
  const n = (value: number): string => String(Math.round(value * scale * 100) / 100);
  const minX = -padding;
  const minY = layout.top - padding;
  const width = layout.width + 2 * padding;
  const height = layout.bottom - layout.top + 2 * padding;
  const body = layout.items.map((item) => draw(item, n, color, font, scale)).join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(minX)} ${n(minY)} ${n(width)} ${n(height)}" width="${n(width)}" height="${n(height)}">
  ${body}
</svg>`;
}

function draw(
  item: LayoutItem,
  n: (value: number) => string,
  color: string,
  font: string,
  scale: number,
): string {
  switch (item.kind) {
    case 'glyph': {
      const char = `&#x${glyphMetrics(item.glyph).codepoint.toString(16).toUpperCase()};`;
      return `<text x="${n(item.x)}" y="${n(item.y)}" font-family="${font}" font-size="${String(4 * scale)}" fill="${color}">${char}</text>`;
    }
    case 'line':
      return `<line x1="${n(item.x1)}" y1="${n(item.y1)}" x2="${n(item.x2)}" y2="${n(item.y2)}" stroke="${color}" stroke-width="${n(item.thickness)}"/>`;
    case 'beam': {
      const d = item.towards * item.thickness;
      return `<polygon points="${n(item.x1)},${n(item.y1)} ${n(item.x2)},${n(item.y2)} ${n(item.x2)},${n(item.y2 + d)} ${n(item.x1)},${n(item.y1 + d)}" fill="${color}"/>`;
    }
    case 'tie': {
      const dir = item.direction === 'up' ? -1 : 1;
      const length = item.x2 - item.x1;
      const height = Math.min(1.2, 0.3 + 0.15 * length);
      const mid = (item.x1 + item.x2) / 2;
      const inner = height - ENGRAVING_DEFAULTS.tieMidpointThickness;
      return `<path d="M${n(item.x1)} ${n(item.y)} Q${n(mid)} ${n(item.y + dir * height * 2)} ${n(item.x2)} ${n(item.y)} Q${n(mid)} ${n(item.y + dir * inner * 2)} ${n(item.x1)} ${n(item.y)}Z" fill="${color}"/>`;
    }
  }
}
