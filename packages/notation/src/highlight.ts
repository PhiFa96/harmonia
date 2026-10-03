// Hervorhebung von Noten: richtig, falsch, aktiv. Immer Farbe plus Symbol über der Note,
// damit die Bedeutung nicht nur an der Farbe hängt (WCAG 1.4.1).

import type { EventRef, ScoreLayout } from './layout.ts';
import { eventBounds, glyphMetrics } from './layout.ts';

export type HighlightKind = 'correct' | 'wrong' | 'active';

export interface Highlight {
  /** Ereignis; mit `note` nur dieser Ton eines Akkords. */
  readonly ref: EventRef;
  readonly kind: HighlightKind;
}

/** Platz über dem System für die Symbole (Notenlinienabstände). */
export const MARK_BAND = 2;

/**
 * Vorläufige Farben bis zum Design-System (P1.06). Kontrast zum Hintergrund mindestens 4,5 : 1
 * (geprüft in highlight.test.ts): hell gegen Weiß und Hellgrau, dunkel gegen Schwarz und Dunkelgrau.
 */
export const DEFAULT_HIGHLIGHT_COLORS: Readonly<Record<HighlightKind, string>> = {
  correct: '#1a7f37',
  wrong: '#cf222e',
  active: '#0969da',
};

/** Für dunkle Hintergründe. */
export const DARK_HIGHLIGHT_COLORS: Readonly<Record<HighlightKind, string>> = {
  correct: '#3fb950',
  wrong: '#ff7b72',
  active: '#58a6ff',
};

/** Hervorhebung eines gezeichneten Elements: gleiches Ereignis und, falls angegeben, gleicher Ton. */
export function highlightFor(
  highlights: readonly Highlight[],
  ref: EventRef | undefined,
): HighlightKind | undefined {
  if (!ref) {
    return undefined;
  }
  return highlights.find(
    (h) =>
      h.ref.measure === ref.measure &&
      h.ref.event === ref.event &&
      (h.ref.note === undefined || ref.note === undefined || h.ref.note === ref.note),
  )?.kind;
}

/** Was ein Ereignis insgesamt zeigt, wenn mehrere Töne verschieden markiert sind: falsch vor aktiv vor richtig. */
const PRIORITY: readonly HighlightKind[] = ['wrong', 'active', 'correct'];

export interface HighlightMark {
  readonly kind: HighlightKind;
  readonly ref: EventRef;
  /** Mitte des Symbols (Notenlinienabstände, wie das Layout) */
  readonly x: number;
  readonly y: number;
}

/**
 * Ein Symbol je hervorgehobenem Ereignis, mittig über dem Ereignis: einen halben Bandabstand über
 * seinem höchsten Element, mindestens aber über der obersten Linie. Liegt so immer im Band, das
 * `svgScene` über dem Layout freihält.
 */
export function highlightMarks(
  layout: ScoreLayout,
  highlights: readonly Highlight[],
): HighlightMark[] {
  return eventBounds(layout).flatMap((b) => {
    const kinds = highlights
      .filter((h) => h.ref.measure === b.measure && h.ref.event === b.event)
      .map((h) => h.kind);
    const kind = PRIORITY.find((k) => kinds.includes(k));
    if (!kind) {
      return [];
    }
    const ref = { measure: b.measure, event: b.event };
    const y = Math.min(eventTop(layout, ref), 0) - MARK_BAND / 2;
    return [{ kind, ref, x: (b.x1 + b.x2) / 2, y }];
  });
}

/** Oberkante der Elemente eines Ereignisses (Notenköpfe, Vorzeichen, Hälse, Fähnchen …). */
function eventTop(layout: ScoreLayout, ref: EventRef): number {
  let top = Infinity;
  for (const item of layout.items) {
    if (!('ref' in item) || item.ref.measure !== ref.measure || item.ref.event !== ref.event) {
      continue;
    }
    top = Math.min(
      top,
      item.kind === 'glyph'
        ? item.y - glyphMetrics(item.glyph).bBoxNE[1]
        : Math.min(item.y1, item.y2),
    );
  }
  return top;
}
