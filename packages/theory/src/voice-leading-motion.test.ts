import { describe, expect, it } from 'vitest';
import { parsePitch } from './pitch.ts';
import {
  analyzeVoiceLeading,
  type FourPartSlice,
  type Voice,
  type VoiceLeadingOptions,
  type VoiceLeadingRule,
} from './voice-leading.ts';

function slice(bass: string, tenor: string, alto: string, soprano: string): FourPartSlice {
  return {
    bass: parsePitch(bass),
    tenor: parsePitch(tenor),
    alto: parsePitch(alto),
    soprano: parsePitch(soprano),
  };
}

describe('P4.09 – konfigurierbare Bewegungsmuster', () => {
  it.each<readonly [Voice, Voice]>([
    ['bass', 'tenor'],
    ['bass', 'alto'],
    ['bass', 'soprano'],
    ['tenor', 'alto'],
    ['tenor', 'soprano'],
    ['alto', 'soprano'],
  ])('prüft Quintparallelen zwischen %s und %s', (lower, upper) => {
    const held = slice('C4', 'C4', 'C4', 'C4');
    const before = { ...held, [lower]: parsePitch('C3'), [upper]: parsePitch('G3') };
    const after = { ...held, [lower]: parsePitch('D3'), [upper]: parsePitch('A3') };
    expect(analyzeVoiceLeading([before, after], { 'parallel-fifth': 'error' })).toEqual([
      { rule: 'parallel-fifth', severity: 'error', at: 1, voices: [lower, upper] },
    ]);
  });

  it('findet Gegenquinten in den Außenstimmen, getrennt von Parallelbewegung', () => {
    const findings = analyzeVoiceLeading(
      [slice('C3', 'A3', 'C4', 'G4'), slice('G3', 'A3', 'C4', 'D4')],
      { 'contrary-fifth': 'warning', 'parallel-fifth': 'error' },
      { contraryPerfectScope: 'outer' },
    );
    expect(findings).toEqual([
      { rule: 'contrary-fifth', severity: 'warning', at: 1, voices: ['bass', 'soprano'] },
    ]);
  });

  it('beschränkt Gegenparallelen auf Außenstimmen oder prüft alle Paare', () => {
    const passage = [slice('C2', 'C3', 'G4', 'E5'), slice('C2', 'G3', 'D4', 'E5')];
    const rules = { 'contrary-fifth': 'warning' } as const;
    expect(analyzeVoiceLeading(passage, rules, { contraryPerfectScope: 'outer' })).toEqual([]);
    expect(analyzeVoiceLeading(passage, rules, { contraryPerfectScope: 'all' })).toEqual([
      { rule: 'contrary-fifth', severity: 'warning', at: 1, voices: ['tenor', 'alto'] },
    ]);
  });

  it('findet Gegenoktaven auch bei wechselnder Oktavierung', () => {
    expect(
      analyzeVoiceLeading(
        [slice('C3', 'B3', 'D4', 'C5'), slice('G3', 'B3', 'D4', 'G4')],
        { 'contrary-octave': 'error' },
        { contraryPerfectScope: 'outer' },
      ),
    ).toEqual([{ rule: 'contrary-octave', severity: 'error', at: 1, voices: ['bass', 'soprano'] }]);
  });

  it.each([
    ['hidden-fifth', 'A4'],
    ['hidden-octave', 'D5'],
  ] as const)(
    'findet %s bei gleichgerichteter Außenstimmenbewegung mit Sopransprung',
    (rule, soprano) => {
      expect(
        analyzeVoiceLeading(
          [slice('C3', 'G3', 'C4', 'E4'), slice('D3', 'G3', 'C4', soprano)],
          { [rule]: 'warning' },
          { hiddenPerfectMotion: 'soprano-leap' },
        ),
      ).toEqual([{ rule, severity: 'warning', at: 1, voices: ['bass', 'soprano'] }]);
    },
  );

  it('erlaubt einen Sopranschritt, sofern die ausgewählte Konvention dies vorsieht', () => {
    const passage = [slice('C3', 'A3', 'C4', 'E4'), slice('F3', 'A3', 'C4', 'F4')];
    const rules = { 'hidden-octave': 'warning' } as const;
    expect(analyzeVoiceLeading(passage, rules, { hiddenPerfectMotion: 'soprano-leap' })).toEqual(
      [],
    );
    expect(analyzeVoiceLeading(passage, rules, { hiddenPerfectMotion: 'any' })).toEqual([
      { rule: 'hidden-octave', severity: 'warning', at: 1, voices: ['bass', 'soprano'] },
    ]);
  });

  it('meldet offene Quintparallelen nicht zusätzlich als verdeckten Quintgang', () => {
    expect(
      analyzeVoiceLeading(
        [slice('C3', 'G3', 'C4', 'G4'), slice('D3', 'G3', 'C4', 'A4')],
        { 'parallel-fifth': 'error', 'hidden-fifth': 'warning' },
        { hiddenPerfectMotion: 'any' },
      ),
    ).toEqual([{ rule: 'parallel-fifth', severity: 'error', at: 1, voices: ['bass', 'soprano'] }]);
  });

  it('zählt den Wechsel von Prim- zu Oktavverdopplung zur Oktavfamilie', () => {
    expect(
      analyzeVoiceLeading([slice('C3', 'G3', 'C4', 'C4'), slice('C3', 'G3', 'D4', 'D5')], {
        'parallel-octave': 'error',
        'parallel-unison': 'warning',
      }),
    ).toEqual([{ rule: 'parallel-octave', severity: 'error', at: 1, voices: ['alto', 'soprano'] }]);
  });

  it('behandelt einen erlaubten verdeckten Quintgang im OMT-Generalbassmodell nicht als Fehler', () => {
    // OMT bassoContinuo.md: Schlussliste; keine allgemeine SATB-Stilvorgabe.
    expect(
      analyzeVoiceLeading(
        [slice('C3', 'A3', 'C4', 'E4'), slice('D3', 'A3', 'C4', 'A4')],
        {
          'parallel-fifth': 'error',
          'parallel-octave': 'error',
          'contrary-fifth': 'error',
          'contrary-octave': 'error',
          'hidden-octave': 'error',
        },
        { contraryPerfectScope: 'outer', hiddenPerfectMotion: 'soprano-leap' },
      ),
    ).toEqual([]);
  });

  it('verwendet ausschließlich die angegebenen Stimmumfänge und erlaubt beide Grenzen', () => {
    const range = { min: parsePitch('C3'), max: parsePitch('C5') };
    expect(
      analyzeVoiceLeading(
        [slice('B2', 'C3', 'C5', 'C#5')],
        { 'voice-range': 'warning' },
        { ranges: { bass: range, tenor: range, alto: range, soprano: range } },
      ),
    ).toEqual([
      { rule: 'voice-range', severity: 'warning', at: 0, voices: ['bass'] },
      { rule: 'voice-range', severity: 'warning', at: 0, voices: ['soprano'] },
    ]);
    const enharmonic = { min: parsePitch('B3'), max: parsePitch('B3') };
    expect(
      analyzeVoiceLeading(
        [slice('Cb4', 'B3', 'Cb4', 'B3')],
        { 'voice-range': 'error' },
        { ranges: { bass: enharmonic, tenor: enharmonic, alto: enharmonic, soprano: enharmonic } },
      ),
    ).toEqual([]);
  });

  it.each([
    ['Eb4', 'F#4', 1],
    ['F#4', 'Eb4', 1],
    ['Eb4', 'Gb4', 0],
    ['C4', 'Eb4', 0],
  ] as const)(
    'unterscheidet geschriebene übermäßige Sekunde von kleiner Terz: %s → %s',
    (from, to, count) => {
      const findings = analyzeVoiceLeading(
        [slice('C3', 'G3', 'C4', from), slice('C3', 'G3', 'C4', to)],
        { 'augmented-second': 'hint' },
      );
      expect(findings).toHaveLength(count);
      if (count)
        expect(findings[0]).toEqual({
          rule: 'augmented-second',
          severity: 'hint',
          at: 1,
          voices: ['soprano'],
        });
    },
  );

  it('konfiguriert die Grenze für Melodiesprünge einschließlich der Oktave', () => {
    expect(
      analyzeVoiceLeading(
        [slice('C3', 'G3', 'C4', 'E4'), slice('C4', 'G4', 'D5', 'E5')],
        { 'melodic-leap': 'hint' },
        { maxMelodicInterval: 8 },
      ),
    ).toEqual([{ rule: 'melodic-leap', severity: 'hint', at: 1, voices: ['alto'] }]);
  });

  it.each<readonly [VoiceLeadingRule, VoiceLeadingOptions]>([
    ['voice-range', {}],
    ['contrary-fifth', {}],
    ['contrary-octave', {}],
    ['hidden-fifth', {}],
    ['hidden-octave', {}],
    ['melodic-leap', {}],
    ['melodic-leap', { maxMelodicInterval: 0 }],
    ['melodic-leap', { maxMelodicInterval: 2.5 }],
    ['melodic-leap', { maxMelodicInterval: Infinity }],
  ])('verweigert %s bei unvollständiger oder ungültiger Konfiguration', (rule, options) => {
    expect(() => analyzeVoiceLeading([], { [rule]: 'error' }, options)).toThrow(RangeError);
  });

  it('verweigert einen umgekehrt angegebenen Stimmumfang', () => {
    const range = { min: parsePitch('C5'), max: parsePitch('C3') };
    expect(() =>
      analyzeVoiceLeading(
        [],
        { 'voice-range': 'error' },
        {
          ranges: { bass: range, tenor: range, alto: range, soprano: range },
        },
      ),
    ).toThrow(RangeError);
  });
});
