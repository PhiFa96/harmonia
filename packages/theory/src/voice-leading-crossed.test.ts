import { describe, expect, it } from 'vitest';
import { parsePitch } from './pitch.ts';
import { analyzeVoiceLeading, type FourPartSlice } from './voice-leading.ts';

function slice(bass: string, tenor: string, alto: string, soprano: string): FourPartSlice {
  return {
    bass: parsePitch(bass),
    tenor: parsePitch(tenor),
    alto: parsePitch(alto),
    soprano: parsePitch(soprano),
  };
}

describe('Parallelen zwischen gekreuzten Stimmen', () => {
  // Alt und Sopran bleiben liegen; der Bass liegt über dem Tenor (C3–G3 → D3–A3).
  const crossed = [slice('G3', 'C3', 'E5', 'C6'), slice('A3', 'D3', 'E5', 'C6')];

  it('meldet Quintparallelen auch ohne die Kreuzungsregel', () => {
    expect(analyzeVoiceLeading(crossed, { 'parallel-fifth': 'error' })).toEqual([
      { rule: 'parallel-fifth', severity: 'error', at: 1, voices: ['bass', 'tenor'] },
    ]);
  });

  it('meldet Kreuzung und Parallele getrennt nebeneinander', () => {
    const rules = analyzeVoiceLeading(crossed, {
      'parallel-fifth': 'error',
      'voice-crossing': 'error',
    }).map((finding) => finding.rule);
    expect(rules).toContain('parallel-fifth');
    expect(rules).toContain('voice-crossing');
  });

  it('meldet Oktavparallelen zwischen gekreuzten Stimmen', () => {
    const octaves = [slice('C4', 'C3', 'E5', 'C6'), slice('D4', 'D3', 'E5', 'C6')];
    expect(analyzeVoiceLeading(octaves, { 'parallel-octave': 'error' }).map((f) => f.rule)).toEqual(
      ['parallel-octave'],
    );
  });

  it('meldet keine Parallele, wenn aus der Quinte eine Quarte wird', () => {
    // Tenor C3→E3, Bass G3→A3: Quinte → Quarte bei Gleichbewegung.
    const inversion = [slice('G3', 'C3', 'E5', 'C6'), slice('A3', 'E3', 'E5', 'C6')];
    expect(analyzeVoiceLeading(inversion, { 'parallel-fifth': 'error' })).toEqual([]);
  });
});

describe('Optionen', () => {
  it('weist unvollständige Stimmumfänge mit RangeError ab', () => {
    const ranges = {
      bass: { min: parsePitch('E2'), max: parsePitch('C4') },
      tenor: { min: parsePitch('C3'), max: parsePitch('G4') },
      soprano: { min: parsePitch('C4'), max: parsePitch('G5') },
    } as never;
    expect(() =>
      analyzeVoiceLeading([slice('C3', 'G3', 'E4', 'C5')], { 'voice-range': 'error' }, { ranges }),
    ).toThrow(new RangeError('Stimmumfang fehlt: alto'));
  });
});
