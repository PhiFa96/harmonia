// Seedbarer Zufallsgenerator: gleicher Seed → gleiche Folge, auf Client und Server.
// Grundlage: Mulberry32 (32-Bit-Zustand, schnell, für Übungsgeneratoren ausreichend; nicht kryptografisch).

export interface Rng {
  /** Gleichverteilte Zahl in [0, 1). */
  next(): number;
  /** Ganze Zahl zwischen `min` und `max` (beide eingeschlossen). */
  int(min: number, max: number): number;
  /** Zufälliges Element einer nicht leeren Liste. */
  pick<T>(items: readonly T[]): T;
  /** Neue, zufällig gemischte Kopie (Fisher-Yates). */
  shuffle<T>(items: readonly T[]): T[];
}

export function createRng(seed: number | string): Rng {
  let state = typeof seed === 'string' ? hashString(seed) : seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
      throw new RangeError(`Ungültiger Bereich: ${String(min)}…${String(max)}`);
    }
    return min + Math.floor(next() * (max - min + 1));
  };

  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) {
      throw new RangeError('Aus einer leeren Liste kann nichts gewählt werden.');
    }
    return items[int(0, items.length - 1)] as T;
  };

  const shuffle = <T>(items: readonly T[]): T[] => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = int(0, i);
      [result[i], result[j]] = [result[j] as T, result[i] as T];
    }
    return result;
  };

  return { next, int, pick, shuffle };
}

/** FNV-1a (32 Bit) für Text-Seeds, z. B. Duell-IDs. */
function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}
