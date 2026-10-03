// Kontrastverhältnis nach WCAG 2.2 (relative Leuchtdichte im sRGB-Farbraum).
// Eigene Umsetzung; der Test vergleicht sie mit culori als zweitem, unabhängigem Mittel.

/** #RRGGBB → Kanäle 0–255 */
function channels(hex: string): readonly [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match?.[1]) {
    throw new Error(`Keine Farbe im Format #RRGGBB: ${hex}`);
  }
  const n = Number.parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** sRGB-Kanal → linear (Schwelle 0,04045 wie in der sRGB-Norm IEC 61966-2-1) */
function linear(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Relative Leuchtdichte 0 (Schwarz) bis 1 (Weiß) */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** Kontrastverhältnis 1 bis 21 (Reihenfolge der Farben egal) */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
