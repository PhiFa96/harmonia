// SVG-Elemente aus einem Layout. Dieselbe Liste nutzen die Textausgabe (Vorschau, Tests, Web)
// und der React-Native-Renderer (`@harmonia/notation/native`), damit alle Plattformen gleich zeichnen.

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

/** Ein zu zeichnendes Element in Pixeln (Ursprung: linke obere Ecke der Zeichenfläche). */
export type SvgElement =
  | {
      readonly kind: 'text';
      readonly x: number;
      readonly y: number;
      readonly text: string;
      readonly fontSize: number;
    }
  | {
      readonly kind: 'line';
      readonly x1: number;
      readonly y1: number;
      readonly x2: number;
      readonly y2: number;
      readonly strokeWidth: number;
    }
  | { readonly kind: 'polygon'; readonly points: string }
  | { readonly kind: 'path'; readonly d: string };

export interface SvgScene {
  readonly width: number;
  readonly height: number;
  readonly elements: readonly SvgElement[];
}

/** Rechnet ein Layout in Pixel-Elemente um (SMuFL: 1 em = 4 Notenlinienabstände). */
export function svgScene(layout: ScoreLayout, options: SvgOptions = {}): SvgScene {
  const scale = options.scale ?? 10;
  const padding = options.padding ?? 1;
  const px = (value: number): number => Math.round(value * scale * 100) / 100;
  const ox = padding;
  const oy = padding - layout.top;
  const x = (value: number): number => px(value + ox);
  const y = (value: number): number => px(value + oy);
  return {
    width: px(layout.width + 2 * padding),
    height: px(layout.bottom - layout.top + 2 * padding),
    elements: layout.items.map((item) => element(item, x, y, px, scale)),
  };
}

function element(
  item: LayoutItem,
  x: (value: number) => number,
  y: (value: number) => number,
  px: (value: number) => number,
  scale: number,
): SvgElement {
  switch (item.kind) {
    case 'glyph':
      return {
        kind: 'text',
        x: x(item.x),
        y: y(item.y),
        text: String.fromCodePoint(glyphMetrics(item.glyph).codepoint),
        fontSize: 4 * scale,
      };
    case 'line':
      return {
        kind: 'line',
        x1: x(item.x1),
        y1: y(item.y1),
        x2: x(item.x2),
        y2: y(item.y2),
        strokeWidth: px(item.thickness),
      };
    case 'beam': {
      const d = item.towards * item.thickness;
      return {
        kind: 'polygon',
        points: [
          [item.x1, item.y1],
          [item.x2, item.y2],
          [item.x2, item.y2 + d],
          [item.x1, item.y1 + d],
        ]
          .map(([a = 0, b = 0]) => `${String(x(a))},${String(y(b))}`)
          .join(' '),
      };
    }
    case 'tie': {
      const dir = item.direction === 'up' ? -1 : 1;
      const length = item.x2 - item.x1;
      const height = Math.min(1.2, 0.3 + 0.15 * length);
      const mid = (item.x1 + item.x2) / 2;
      const inner = height - ENGRAVING_DEFAULTS.tieMidpointThickness;
      const n = (value: number): string => String(value);
      return {
        kind: 'path',
        d: `M${n(x(item.x1))} ${n(y(item.y))} Q${n(x(mid))} ${n(y(item.y + dir * height * 2))} ${n(x(item.x2))} ${n(y(item.y))} Q${n(x(mid))} ${n(y(item.y + dir * inner * 2))} ${n(x(item.x1))} ${n(y(item.y))}Z`,
      };
    }
  }
}

/** Zeichnet ein Layout als SVG-Dokument (Text). */
export function layoutToSvg(layout: ScoreLayout, options: SvgOptions = {}): string {
  const color = options.color ?? 'currentColor';
  const font = options.fontFamily ?? 'Bravura';
  const scene = svgScene(layout, options);
  const n = (value: number): string => String(value);
  const body = scene.elements
    .map((e) => {
      switch (e.kind) {
        case 'text':
          return `<text x="${n(e.x)}" y="${n(e.y)}" font-family="${font}" font-size="${n(e.fontSize)}" fill="${color}">&#x${(e.text.codePointAt(0) ?? 0).toString(16).toUpperCase()};</text>`;
        case 'line':
          return `<line x1="${n(e.x1)}" y1="${n(e.y1)}" x2="${n(e.x2)}" y2="${n(e.y2)}" stroke="${color}" stroke-width="${n(e.strokeWidth)}"/>`;
        case 'polygon':
          return `<polygon points="${e.points}" fill="${color}"/>`;
        case 'path':
          return `<path d="${e.d}" fill="${color}"/>`;
      }
    })
    .join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(scene.width)} ${n(scene.height)}" width="${n(scene.width)}" height="${n(scene.height)}">
  ${body}
</svg>`;
}
