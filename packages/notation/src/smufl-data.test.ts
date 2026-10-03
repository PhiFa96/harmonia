import metadataJson from '@vexflow-fonts/bravura/metadata.json' with { type: 'json' };
import { describe, expect, it } from 'vitest';

import { ENGRAVING_DEFAULTS, FONT, GLYPHS } from './smufl-data.ts';

/** Bravura-Metadaten aus dem Font-Paket (Quelle des Generators tools/generate-smufl-data.mjs). */
const metadata = metadataJson as {
  fontVersion: number;
  engravingDefaults: Record<string, unknown>;
  glyphBBoxes: Record<string, { bBoxNE: number[]; bBoxSW: number[] } | undefined>;
  glyphsWithAnchors: Record<string, Record<string, number[]> | undefined>;
};

describe('Glyphendaten stimmen mit dem Font-Paket überein', () => {
  it('Version', () => {
    expect(FONT.version).toBe(String(metadata.fontVersion));
  });

  it('Standardstärken', () => {
    for (const [key, value] of Object.entries(ENGRAVING_DEFAULTS)) {
      expect(value, key).toBe(metadata.engravingDefaults[key]);
    }
  });

  it('Begrenzungsrahmen und Ankerpunkte', () => {
    for (const [name, data] of Object.entries(GLYPHS)) {
      expect(data.bBoxNE, name).toEqual(metadata.glyphBBoxes[name]?.bBoxNE);
      expect(data.bBoxSW, name).toEqual(metadata.glyphBBoxes[name]?.bBoxSW);
      expect('anchors' in data ? data.anchors : undefined, name).toEqual(
        metadata.glyphsWithAnchors[name],
      );
    }
  });

  it('Codepoints im SMuFL-Bereich (U+E000–U+F8FF), z. B. Violinschlüssel U+E050', () => {
    expect(GLYPHS.gClef.codepoint).toBe(0xe050);
    expect(GLYPHS.noteheadBlack.codepoint).toBe(0xe0a4);
    for (const data of Object.values(GLYPHS)) {
      expect(data.codepoint).toBeGreaterThanOrEqual(0xe000);
      expect(data.codepoint).toBeLessThanOrEqual(0xf8ff);
    }
  });
});
