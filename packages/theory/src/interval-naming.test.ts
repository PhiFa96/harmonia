import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { parseInterval } from './interval.ts';
import { intervalName } from './interval-naming.ts';
import { intervalArbitrary } from './testing/arbitraries.ts';

// Referenztabelle für die fachliche Abnahme: Kurzform, Deutsch lang, Englisch lang.
const NAMES: readonly (readonly [string, string, string])[] = [
  ['P1', 'reine Prime', 'perfect unison'],
  ['A1', 'übermäßige Prime', 'augmented unison'],
  ['d2', 'verminderte Sekunde', 'diminished second'],
  ['m2', 'kleine Sekunde', 'minor second'],
  ['M2', 'große Sekunde', 'major second'],
  ['A2', 'übermäßige Sekunde', 'augmented second'],
  ['d3', 'verminderte Terz', 'diminished third'],
  ['m3', 'kleine Terz', 'minor third'],
  ['M3', 'große Terz', 'major third'],
  ['A3', 'übermäßige Terz', 'augmented third'],
  ['d4', 'verminderte Quarte', 'diminished fourth'],
  ['P4', 'reine Quarte', 'perfect fourth'],
  ['A4', 'übermäßige Quarte', 'augmented fourth'],
  ['d5', 'verminderte Quinte', 'diminished fifth'],
  ['P5', 'reine Quinte', 'perfect fifth'],
  ['A5', 'übermäßige Quinte', 'augmented fifth'],
  ['m6', 'kleine Sexte', 'minor sixth'],
  ['M6', 'große Sexte', 'major sixth'],
  ['m7', 'kleine Septime', 'minor seventh'],
  ['d7', 'verminderte Septime', 'diminished seventh'],
  ['M7', 'große Septime', 'major seventh'],
  ['P8', 'reine Oktave', 'perfect octave'],
  ['m9', 'kleine None', 'minor ninth'],
  ['M9', 'große None', 'major ninth'],
  ['m10', 'kleine Dezime', 'minor tenth'],
  ['M10', 'große Dezime', 'major tenth'],
  ['P11', 'reine Undezime', 'perfect eleventh'],
  ['A11', 'übermäßige Undezime', 'augmented eleventh'],
  ['P12', 'reine Duodezime', 'perfect twelfth'],
  ['m13', 'kleine Tredezime', 'minor thirteenth'],
  ['M13', 'große Tredezime', 'major thirteenth'],
  ['m14', 'kleine Quartdezime', 'minor fourteenth'],
  ['P15', 'reine Quintdezime', 'perfect fifteenth'],
  ['AA4', 'doppelt übermäßige Quarte', 'doubly augmented fourth'],
  ['dd5', 'doppelt verminderte Quinte', 'doubly diminished fifth'],
];

describe('intervalName – Referenztabelle', () => {
  it.each(NAMES)('%s: %s / %s', (short, german, english) => {
    const i = parseInterval(short);
    expect(intervalName(i, { language: 'de' })).toBe(german);
    expect(intervalName(i, { language: 'en' })).toBe(english);
    expect(intervalName(i, { language: 'en', style: 'short' })).toBe(short);
  });
});

describe('intervalName – Richtung, Kurzform, große Intervalle', () => {
  it('kennzeichnet abwärts gerichtete Intervalle', () => {
    const down = parseInterval('-m3');
    expect(intervalName(down)).toBe('kleine Terz abwärts');
    expect(intervalName(down, { language: 'en' })).toBe('descending minor third');
    expect(intervalName(down, { showDirection: false })).toBe('kleine Terz');
    expect(intervalName(down, { language: 'en', style: 'short' })).toBe('m3 ↓');
  });

  it('deutsche Kurzform', () => {
    expect(intervalName(parseInterval('M3'), { style: 'short' })).toBe('gr. 3');
    expect(intervalName(parseInterval('m6'), { style: 'short' })).toBe('kl. 6');
    expect(intervalName(parseInterval('P5'), { style: 'short' })).toBe('r. 5');
    expect(intervalName(parseInterval('A4'), { style: 'short' })).toBe('üb. 4');
    expect(intervalName(parseInterval('d7'), { style: 'short' })).toBe('verm. 7');
    expect(intervalName(parseInterval('AA2'), { style: 'short' })).toBe('dopp. üb. 2');
    expect(intervalName(parseInterval('-M2'), { style: 'short' })).toBe('gr. 2 ↓');
  });

  it('jenseits der Doppeloktave: einfacher Anteil plus Oktaven', () => {
    expect(intervalName(parseInterval('M17'))).toBe('große Terz + 2 Oktaven');
    expect(intervalName(parseInterval('M17'), { language: 'en' })).toBe('major third + 2 octaves');
    expect(intervalName(parseInterval('P22'))).toBe('reine Oktave + 2 Oktaven');
  });

  it('jedes Intervall hat in beiden Sprachen einen Namen', () => {
    fc.assert(
      fc.property(intervalArbitrary, (i) =>
        (['de', 'en'] as const).every(
          (language) =>
            intervalName(i, { language }).length > 0 &&
            intervalName(i, { language, style: 'short' }).length > 0,
        ),
      ),
    );
  });
});
