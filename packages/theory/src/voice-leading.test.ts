import { describe, expect, it } from 'vitest';
import { parsePitch } from './pitch.ts';
import {
  analyzeVoiceLeading,
  type FourPartSlice,
  type VoiceLeadingRule,
  type VoiceLeadingRules,
} from './voice-leading.ts';

function slice(bass: string, tenor: string, alto: string, soprano: string): FourPartSlice {
  return {
    bass: parsePitch(bass),
    tenor: parsePitch(tenor),
    alto: parsePitch(alto),
    soprano: parsePitch(soprano),
  };
}

const allRules: VoiceLeadingRules = {
  'parallel-fifth': 'error',
  'parallel-octave': 'error',
  'parallel-unison': 'warning',
  'voice-crossing': 'error',
  'voice-overlap': 'warning',
  'upper-voice-spacing': 'hint',
};

const rulesOf = (findings: ReturnType<typeof analyzeVoiceLeading>): VoiceLeadingRule[] =>
  findings.map((finding) => finding.rule);

describe('P4.09 – interner SATB-Musterkorpus', () => {
  it('liefert ohne gewählte Stilregeln kein normatives Urteil', () => {
    expect(
      analyzeVoiceLeading([slice('C3', 'G3', 'C4', 'E4'), slice('D3', 'A3', 'D4', 'F4')], {}),
    ).toEqual([]);
  });

  it('akzeptiert einen eigenen I–V-Satz mit gehaltenem Ton und Gegenbewegung', () => {
    const findings = analyzeVoiceLeading(
      [slice('C3', 'G3', 'C4', 'E4'), slice('G2', 'G3', 'B3', 'D4')],
      allRules,
    );
    expect(findings).toEqual([]);
  });

  it('findet reine Quintparallelen auch als Duodezimen, aber keine bloßen Klangquinten', () => {
    const fifths = analyzeVoiceLeading(
      [slice('C3', 'G4', 'C5', 'E5'), slice('D3', 'A4', 'C5', 'E5')],
      { 'parallel-fifth': 'warning' },
    );
    expect(fifths).toEqual([
      { rule: 'parallel-fifth', severity: 'warning', at: 1, voices: ['bass', 'tenor'] },
    ]);

    // Bbb klingt wie A, ist über D aber eine verminderte Sexte, keine reine Quinte.
    expect(
      analyzeVoiceLeading([slice('C3', 'G3', 'C4', 'E4'), slice('D3', 'Bbb3', 'C4', 'E4')], {
        'parallel-fifth': 'error',
      }),
    ).toEqual([]);
  });

  it('unterscheidet Oktaven und Primen, auch bei oktavierten Stimmen', () => {
    const octaves = analyzeVoiceLeading(
      [slice('C3', 'G3', 'C4', 'E4'), slice('D3', 'A3', 'D4', 'F4')],
      { 'parallel-octave': 'error' },
    );
    expect(octaves).toEqual([
      { rule: 'parallel-octave', severity: 'error', at: 1, voices: ['bass', 'alto'] },
    ]);

    const unisons = analyzeVoiceLeading(
      [slice('C3', 'C4', 'C4', 'G4'), slice('D3', 'D4', 'D4', 'A4')],
      { 'parallel-unison': 'hint' },
    );
    expect(unisons).toEqual([
      { rule: 'parallel-unison', severity: 'hint', at: 1, voices: ['tenor', 'alto'] },
    ]);
  });

  it('meldet Stimmkreuzung und meldet sie nicht doppelt als Übergreifen', () => {
    const findings = analyzeVoiceLeading(
      [slice('C3', 'G3', 'C4', 'E4'), slice('D3', 'D4', 'B3', 'F4')],
      { 'voice-crossing': 'error', 'voice-overlap': 'warning' },
    );
    expect(findings).toEqual([
      { rule: 'voice-crossing', severity: 'error', at: 1, voices: ['tenor', 'alto'] },
    ]);
  });

  it('meldet Übergreifen ohne aktuelle Stimmkreuzung', () => {
    const findings = analyzeVoiceLeading(
      [slice('C3', 'G3', 'C4', 'G4'), slice('D3', 'D4', 'E4', 'A4')],
      { 'voice-overlap': 'warning' },
    );
    expect(findings).toEqual([
      { rule: 'voice-overlap', severity: 'warning', at: 1, voices: ['tenor', 'alto'] },
    ]);
  });

  it('prüft nur die beiden oberen Nachbarabstände und erlaubt genau eine Oktave', () => {
    expect(
      analyzeVoiceLeading([slice('C2', 'G3', 'G4', 'C5')], {
        'upper-voice-spacing': 'hint',
      }),
    ).toEqual([]);
    expect(
      analyzeVoiceLeading([slice('C2', 'G3', 'A4', 'C6')], {
        'upper-voice-spacing': 'hint',
      }),
    ).toEqual([
      { rule: 'upper-voice-spacing', severity: 'hint', at: 0, voices: ['tenor', 'alto'] },
      { rule: 'upper-voice-spacing', severity: 'hint', at: 0, voices: ['alto', 'soprano'] },
    ]);
  });

  it('verwechselt Gegenbewegung, Liegeton und verdeckte Quinten nicht mit Parallelen', () => {
    const contrary = analyzeVoiceLeading(
      [slice('C3', 'G4', 'C5', 'E5'), slice('G3', 'D4', 'C5', 'E5')],
      { 'parallel-fifth': 'error' },
    );
    const oblique = analyzeVoiceLeading(
      [slice('C3', 'G3', 'C4', 'E4'), slice('D3', 'G3', 'C4', 'E4')],
      { 'parallel-fifth': 'error' },
    );
    const hidden = analyzeVoiceLeading(
      [slice('C3', 'A3', 'C4', 'E4'), slice('D3', 'A3', 'C4', 'A4')],
      { 'parallel-fifth': 'error' },
    );
    expect([contrary, oblique, hidden].map(rulesOf)).toEqual([[], [], []]);
  });

  it('liefert bei mehreren Schnitten stabile Zielindizes und Stimmpaare', () => {
    const findings = analyzeVoiceLeading(
      [slice('C3', 'G3', 'C4', 'E4'), slice('D3', 'A3', 'C4', 'E4'), slice('E3', 'B3', 'C4', 'E4')],
      { 'parallel-fifth': 'error' },
    );
    expect(findings).toEqual([
      { rule: 'parallel-fifth', severity: 'error', at: 1, voices: ['bass', 'tenor'] },
      { rule: 'parallel-fifth', severity: 'error', at: 2, voices: ['bass', 'tenor'] },
    ]);
  });
});
