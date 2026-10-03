import {
  differenceEuclidean,
  filterDeficiencyDeuter,
  filterDeficiencyProt,
  filterDeficiencyTrit,
  parse,
  wcagContrast,
} from 'culori';
import { describe, expect, it } from 'vitest';

import { contrastRatio } from './contrast.ts';
import type { ColorScheme } from './tokens.ts';
import {
  COLORS,
  CONTRAST_PAIRS,
  FONT_FAMILIES,
  RADIUS,
  SPACE,
  SPRING,
  TOUCH,
  TYPOGRAPHY,
  highlightColors,
} from './tokens.ts';

const SCHEMES: readonly ColorScheme[] = ['light', 'dark'];

describe('Farben', () => {
  it('haben in hell und dunkel dieselben Rollen im Format #RRGGBB', () => {
    expect(Object.keys(COLORS.dark).sort()).toEqual(Object.keys(COLORS.light).sort());
    for (const scheme of SCHEMES) {
      for (const value of Object.values(COLORS[scheme])) {
        expect(value).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
  });

  it.each(SCHEMES)('erfüllen alle Kontrastpaare (%s)', (scheme) => {
    const c = COLORS[scheme];
    const failures = CONTRAST_PAIRS.filter(
      ({ fg, bg, min }) => contrastRatio(c[fg], c[bg]) < min,
    ).map(
      ({ fg, bg, min }) =>
        `${fg} auf ${bg}: ${contrastRatio(c[fg], c[bg]).toFixed(2)} < ${String(min)}`,
    );
    expect(failures).toEqual([]);
  });

  it('eigene Kontrastformel stimmt mit culori überein', () => {
    for (const scheme of SCHEMES) {
      const c = COLORS[scheme];
      for (const { fg, bg } of CONTRAST_PAIRS) {
        expect(contrastRatio(c[fg], c[bg])).toBeCloseTo(wcagContrast(c[fg], c[bg]), 9);
      }
    }
  });

  it('bekannte Werte: Schwarz auf Weiß 21 : 1, gleiche Farben 1 : 1', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 10);
    expect(contrastRatio('#5B3FD9', '#5B3FD9')).toBe(1);
  });

  it.each(SCHEMES)(
    'Richtig und Falsch bleiben bei Farbfehlsichtigkeit unterscheidbar (%s)',
    (scheme) => {
      // Abstand in OKLab nach Simulation (Machado-Matrizen); klassisches Grün/Rot lag bei Deuteranopie bei 0,04
      const distance = differenceEuclidean('oklab');
      const success = parse(COLORS[scheme].success);
      const danger = parse(COLORS[scheme].danger);
      if (!success || !danger) {
        throw new Error('Farbe nicht lesbar');
      }
      for (const simulate of [
        filterDeficiencyProt(1),
        filterDeficiencyDeuter(1),
        filterDeficiencyTrit(1),
      ]) {
        expect(distance(simulate(success), simulate(danger))).toBeGreaterThan(0.1);
      }
    },
  );

  it('Hervorhebung im Notenbild nutzt Richtig, Falsch und Primär', () => {
    expect(highlightColors('light')).toEqual({
      correct: '#0B7768',
      wrong: '#C43A1E',
      active: '#5B3FD9',
    });
    expect(highlightColors('dark')).toEqual({
      correct: '#34D1AE',
      wrong: '#FF6B57',
      active: '#8E7BFF',
    });
  });
});

describe('Schrift', () => {
  const families: readonly string[] = Object.values(FONT_FAMILIES);

  it('nutzt nur geladene Figtree-Schnitte', () => {
    for (const style of Object.values(TYPOGRAPHY)) {
      expect(families).toContain(style.fontFamily);
    }
  });

  it('hat Zeilenhöhen von mindestens dem 1,15-Fachen der Größe', () => {
    for (const style of Object.values(TYPOGRAPHY)) {
      expect(style.lineHeight).toBeGreaterThanOrEqual(style.fontSize * 1.15);
    }
  });

  it('Fließtext ist mindestens 17 pt groß', () => {
    expect(TYPOGRAPHY.body.fontSize).toBeGreaterThanOrEqual(17);
  });
});

describe('Formen und Bewegung', () => {
  it('Abstände liegen im 4-pt-Raster', () => {
    for (const value of Object.values(SPACE)) {
      expect(value % 4).toBe(0);
    }
    expect(RADIUS.control % 4).toBe(0);
  });

  it('Touch-Ziele sind mindestens 48 pt groß', () => {
    expect(Math.min(TOUCH.min, TOUCH.buttonLarge, TOUCH.buttonMedium)).toBeGreaterThanOrEqual(48);
  });

  it('Federn schwingen gedämpft (Dämpfungsgrad zwischen 0,3 und 1)', () => {
    for (const { damping, stiffness, mass } of Object.values(SPRING)) {
      const ratio = damping / (2 * Math.sqrt(stiffness * mass));
      expect(ratio).toBeGreaterThan(0.3);
      expect(ratio).toBeLessThan(1);
    }
  });
});
