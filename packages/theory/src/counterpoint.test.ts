import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  analyzeFirstSpecies,
  contrapuntalMotion,
  isCounterpointConsonance,
  type CounterpointRule,
} from './counterpoint.ts';
import { parsePitch, transpose } from './pitch.ts';
const dyad = (lower: string, upper: string) => ({
  lower: parsePitch(lower),
  upper: parsePitch(upper),
});
const model = [dyad('C4', 'G4'), dyad('E4', 'G4'), dyad('D4', 'B4'), dyad('C4', 'C5')];

describe('bounded first-species teaching profile', () => {
  it('accepts an original 1:1 model and reports exact transition positions', () => {
    expect(analyzeFirstSpecies(model)).toEqual([]);
    const findings = analyzeFirstSpecies([
      dyad('C4', 'G4'),
      dyad('D4', 'A4'),
      dyad('D4', 'B4'),
      dyad('C4', 'C5'),
    ]);
    expect(findings).toEqual([
      { rule: 'consecutive-perfect', at: 1 },
      { rule: 'direct-perfect', at: 1 },
    ]);
  });
  it.each([
    ['C4', 'E4', true],
    ['C4', 'Eb4', true],
    ['C4', 'D#4', false],
    ['C4', 'F4', false],
    ['C4', 'G4', true],
    ['C4', 'Bbb4', false],
    ['C4', 'Ab4', true],
    ['C4', 'A4', true],
    ['C4', 'C5', true],
    ['C4', 'E5', true],
    ['C4', 'G5', true],
    ['C4', 'F##4', false],
    ['G4', 'C4', false],
  ] as const)('%s–%s consonance: %s', (low, high, consonant) => {
    expect(isCounterpointConsonance(parsePitch(low), parsePitch(high))).toBe(consonant);
  });
  it.each([
    ['crossing', ['C4', 'G4'], ['G4', 'E4']],
    ['interior-unison', ['C4', 'G4'], ['E4', 'E4']],
    ['spacing', ['C4', 'G4'], ['C4', 'A5']],
    ['overlap', ['C4', 'E4'], ['F4', 'A4']],
    ['boundary', ['C4', 'E4'], ['E4', 'G4']],
    ['consonance', ['C4', 'G4'], ['E4', 'A4']],
  ] as const)('detects %s without relying on cached labels', (rule, a, b) => {
    expect(
      analyzeFirstSpecies([
        dyad(a[0], a[1]),
        dyad(b[0], b[1]),
        dyad('D4', 'B4'),
        dyad('C4', 'C5'),
      ]).map((f) => f.rule),
    ).toContain(rule satisfies CounterpointRule);
  });
  it('requires contrary steps and a m3/M6 before the closing unison/octave', () => {
    expect(analyzeFirstSpecies([dyad('C4', 'C5'), dyad('B3', 'D4'), dyad('C4', 'C4')])).toEqual([]);
    expect(
      analyzeFirstSpecies([dyad('C4', 'G4'), dyad('E4', 'C5'), dyad('C4', 'C5')]),
    ).toContainEqual({ rule: 'closing-motion', at: 2 });
  });
  it('accepts the compound minor third (m10) before a closing octave, but not a tenth of another quality', () => {
    // Cantus ti–do below, counterpoint re–do above: B3/D5 → C4/C5.
    expect(analyzeFirstSpecies([dyad('C4', 'C5'), dyad('B3', 'D5'), dyad('C4', 'C5')])).toEqual(
      [],
    );
    expect(
      analyzeFirstSpecies([dyad('C4', 'C5'), dyad('Bb3', 'D5'), dyad('C4', 'C5')]),
    ).toContainEqual({ rule: 'closing-motion', at: 2 });
  });
  it('rejects consecutive perfect classes in contrary motion and compound fifths', () => {
    expect(analyzeFirstSpecies([dyad('C4', 'G4'), dyad('B3', 'F#5')])).toContainEqual({
      rule: 'consecutive-perfect',
      at: 1,
    });
  });
  it('distinguishes static, oblique, similar and contrary motion', () => {
    for (const [end, expected] of [
      [dyad('C4', 'G4'), 'static'],
      [dyad('C4', 'A4'), 'oblique'],
      [dyad('D4', 'A4'), 'similar'],
      [dyad('D4', 'F4'), 'contrary'],
    ] as const)
      expect(contrapuntalMotion(dyad('C4', 'G4'), end)).toBe(expected);
  });
  it('does not accept missing material or invalid spellings as a clean report', () => {
    expect(() => analyzeFirstSpecies([])).toThrow(RangeError);
    expect(() => analyzeFirstSpecies(model.slice(0, 1))).toThrow(RangeError);
    expect(() =>
      isCounterpointConsonance({ ...parsePitch('C4'), alter: 3 }, parsePitch('G4')),
    ).toThrow(RangeError);
  });
  it('preserves findings across octave transposition and does not mutate source', () => {
    const input = [...model, dyad('D4', 'A4')];
    const before = JSON.stringify(input),
      findings = analyzeFirstSpecies(input);
    fc.assert(
      fc.property(fc.integer({ min: -3, max: 3 }), (octaves) => {
        expect(
          analyzeFirstSpecies(
            input.map((d) => ({
              lower: transpose(d.lower, octaves * 7, octaves * 12),
              upper: transpose(d.upper, octaves * 7, octaves * 12),
            })),
          ),
        ).toEqual(findings);
      }),
    );
    expect(JSON.stringify(input)).toBe(before);
  });
});
