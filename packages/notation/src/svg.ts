// SVG-Elemente aus einem Layout. Dieselbe Liste nutzen die Textausgabe (Vorschau, Tests, Web)
// und der React-Native-Renderer (`@harmonia/notation/native`), damit alle Plattformen gleich zeichnen.

import type { Highlight, HighlightKind } from './highlight.ts';
import { DEFAULT_HIGHLIGHT_COLORS, MARK_BAND, highlightFor, highlightMarks } from './highlight.ts';
import type { EventRef, LayoutItem, ScoreLayout } from './layout.ts';
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
  /**
   * Hervorhebungen (richtig, falsch, aktiv). Ist die Liste angegeben (auch leer), bleibt über dem
   * System Platz für die Symbole, damit das Notenbild nicht springt, wenn eins dazukommt.
   */
  readonly highlights?: readonly Highlight[];
  readonly highlightColors?: Readonly<Partial<Record<HighlightKind, string>>>;
  /**
   * Mindestens dargestellter Bereich (y in Notenlinienabständen, oberste Linie = 0).
   * Für die Eingabe: fester Ausschnitt, der beim Verschieben von Noten nicht springt.
   */
  readonly extent?: { readonly top: number; readonly bottom: number };
}

/** Ein zu zeichnendes Element in Pixeln (Ursprung: linke obere Ecke der Zeichenfläche). */
export type SvgElement = (
  | {
      readonly kind: 'text';
      readonly x: number;
      readonly y: number;
      readonly text: string;
      readonly fontSize: number;
      readonly literal?: boolean;
    }
  | {
      readonly kind: 'line';
      readonly x1: number;
      readonly y1: number;
      readonly x2: number;
      readonly y2: number;
      readonly strokeWidth: number;
      readonly lineCap?: 'round';
    }
  | { readonly kind: 'polygon'; readonly points: string }
  | { readonly kind: 'path'; readonly d: string }
) & {
  /** Bezug auf die Partitur (Notenköpfe, Vorzeichen, Hälse …). */
  readonly ref?: EventRef;
  /** Hervorhebung: Element in dieser Farbe zeichnen. */
  readonly highlight?: HighlightKind;
};

export interface SvgScene {
  readonly width: number;
  readonly height: number;
  readonly elements: readonly SvgElement[];
  /** Umrechnung Pixel → Layout-Koordinaten (für Treffer beim Antippen). */
  readonly toLayout: (px: number, py: number) => { readonly x: number; readonly y: number };
  /** Umrechnung Layout-Koordinaten → Pixel. */
  readonly toPixels: (x: number, y: number) => { readonly x: number; readonly y: number };
}

/** Rechnet ein Layout in Pixel-Elemente um (SMuFL: 1 em = 4 Notenlinienabstände). */
export function svgScene(layout: ScoreLayout, options: SvgOptions = {}): SvgScene {
  const scale = options.scale ?? 10;
  const padding = options.padding ?? 1;
  const highlights = options.highlights;
  // Band für die Symbole über dem Layout; ein fester Ausschnitt (Eingabe) bietet meist schon genug Platz.
  const band = highlights === undefined ? 0 : MARK_BAND;
  const top = Math.min(layout.top - band, options.extent?.top ?? Infinity);
  const bottom = Math.max(layout.bottom, options.extent?.bottom ?? -Infinity);
  const px = (value: number): number => Math.round(value * scale * 100) / 100;
  const ox = padding;
  const oy = padding - top;
  const x = (value: number): number => px(value + ox);
  const y = (value: number): number => px(value + oy);
  const elements = layout.items.map((item) => {
    const e = element(item, x, y, px, scale);
    const ref = 'ref' in item ? item.ref : undefined;
    const highlight = highlights ? highlightFor(highlights, ref) : undefined;
    return { ...e, ...(ref ? { ref } : {}), ...(highlight ? { highlight } : {}) };
  });
  const marks = highlights
    ? highlightMarks(layout, highlights).flatMap((m) =>
        markElements(m.kind, x(m.x), y(m.y), scale).map((e) => ({
          ...e,
          ref: m.ref,
          highlight: m.kind,
        })),
      )
    : [];
  return {
    width: px(layout.width + 2 * padding),
    height: px(bottom - top + 2 * padding),
    elements: [...elements, ...marks],
    toLayout: (pxX, pxY) => ({ x: pxX / scale - ox, y: pxY / scale - oy }),
    toPixels: (lx, ly) => ({ x: (lx + ox) * scale, y: (ly + oy) * scale }),
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
    case 'label':
      return {
        kind: 'text',
        x: x(item.x),
        y: y(item.y),
        text: item.text,
        fontSize: 1.4 * scale,
        literal: true,
      };
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
    case 'tie':
    case 'slur': {
      const dir = item.direction === 'up' ? -1 : 1;
      const length = item.x2 - item.x1;
      const height =
        item.kind === 'slur'
          ? Math.min(2, 0.5 + 0.12 * length)
          : Math.min(1.2, 0.3 + 0.15 * length);
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

/**
 * Symbole der Hervorhebung als Vektorformen (keine Schrift nötig), etwa einen Abstand groß:
 * Haken (richtig), Kreuz (falsch), Dreieck nach unten (aktiv, wie eine Markierung „hier“).
 */
function markElements(kind: HighlightKind, cx: number, cy: number, scale: number): SvgElement[] {
  const s = scale;
  const r = (value: number): number => Math.round(value * 100) / 100;
  const stroke = r(0.2 * s);
  const line = (x1: number, y1: number, x2: number, y2: number): SvgElement => ({
    kind: 'line',
    x1: r(cx + x1 * s),
    y1: r(cy + y1 * s),
    x2: r(cx + x2 * s),
    y2: r(cy + y2 * s),
    strokeWidth: stroke,
    lineCap: 'round',
  });
  switch (kind) {
    case 'correct':
      return [line(-0.45, 0, -0.12, 0.38), line(-0.12, 0.38, 0.5, -0.45)];
    case 'wrong':
      return [line(-0.4, -0.4, 0.4, 0.4), line(-0.4, 0.4, 0.4, -0.4)];
    case 'active':
      return [
        {
          kind: 'polygon',
          points: [
            [-0.45, -0.35],
            [0.45, -0.35],
            [0, 0.4],
          ]
            .map(([a = 0, b = 0]) => `${String(r(cx + a * s))},${String(r(cy + b * s))}`)
            .join(' '),
        },
      ];
  }
}

/** Zeichnet ein Layout als SVG-Dokument (Text). */
export function layoutToSvg(layout: ScoreLayout, options: SvgOptions = {}): string {
  const color = options.color ?? 'currentColor';
  const colors = { ...DEFAULT_HIGHLIGHT_COLORS, ...options.highlightColors };
  const font = options.fontFamily ?? 'Bravura';
  const scene = svgScene(layout, options);
  const n = (value: number): string => String(value);
  const body = scene.elements
    .map((e) => {
      const c = e.highlight ? colors[e.highlight] : color;
      switch (e.kind) {
        case 'text':
          return e.literal
            ? `<text x="${n(e.x)}" y="${n(e.y)}" font-family="sans-serif" font-size="${n(e.fontSize)}" fill="${c}">${escapeXml(e.text)}</text>`
            : `<text x="${n(e.x)}" y="${n(e.y)}" font-family="${font}" font-size="${n(e.fontSize)}" fill="${c}">&#x${(e.text.codePointAt(0) ?? 0).toString(16).toUpperCase()};</text>`;
        case 'line':
          return `<line x1="${n(e.x1)}" y1="${n(e.y1)}" x2="${n(e.x2)}" y2="${n(e.y2)}" stroke="${c}" stroke-width="${n(e.strokeWidth)}"${e.lineCap ? ` stroke-linecap="${e.lineCap}"` : ''}/>`;
        case 'polygon':
          return `<polygon points="${e.points}" fill="${c}"/>`;
        case 'path':
          return `<path d="${e.d}" fill="${c}"/>`;
      }
    })
    .join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(scene.width)} ${n(scene.height)}" width="${n(scene.width)}" height="${n(scene.height)}">
  ${body}
</svg>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
