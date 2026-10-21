import { describe, expect, it } from 'vitest';
import { chord } from './chord.ts';
import { parseNoteName, parsePitch } from './pitch.ts';
import {
  analyzeVoiceLeading,
  type FourPartSlice,
  type VoiceLeadingHarmonyContext,
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

const unknown: VoiceLeadingHarmonyContext = { tonic: null, chord: null };
const dominant: VoiceLeadingHarmonyContext = {
  tonic: parseNoteName('C'),
  chord: chord(parseNoteName('G'), 'dominant7'),
  resolveToNext: { leadingTone: 'up', seventh: 'down' },
};
const resolutionRules = {
  'leading-tone-resolution': 'error',
  'seventh-resolution': 'warning',
} as const;

describe('P4.09 – ausdrücklich vorgegebene Harmonieübergänge', () => {
  it('prüft Leitton aufwärts und Akkordseptime abwärts im selben Stimmpart', () => {
    expect(
      analyzeVoiceLeading(
        [slice('G2', 'D3', 'F3', 'B3'), slice('C3', 'E3', 'E3', 'C4')],
        resolutionRules,
        { harmonies: [dominant, unknown] },
      ),
    ).toEqual([]);
    expect(
      analyzeVoiceLeading(
        [slice('G2', 'D3', 'F3', 'B3'), slice('C3', 'E3', 'G3', 'A3')],
        resolutionRules,
        { harmonies: [dominant, unknown] },
      ),
    ).toEqual([
      { rule: 'seventh-resolution', severity: 'warning', at: 1, voices: ['alto'] },
      { rule: 'leading-tone-resolution', severity: 'error', at: 1, voices: ['soprano'] },
    ]);
  });

  it('erkennt in Moll nur den Halbton unter der Tonika als Leitton', () => {
    const minor: VoiceLeadingHarmonyContext = {
      tonic: parseNoteName('A'),
      chord: chord(parseNoteName('E'), 'dominant7'),
      resolveToNext: { leadingTone: 'up', seventh: 'down' },
    };
    expect(
      analyzeVoiceLeading(
        [slice('E3', 'G#3', 'B3', 'D4'), slice('A2', 'A3', 'C4', 'C4')],
        resolutionRules,
        { harmonies: [minor, unknown] },
      ),
    ).toEqual([]);
    expect(
      analyzeVoiceLeading(
        [slice('E3', 'G3', 'B3', 'G4'), slice('A2', 'E3', 'C4', 'E4')],
        { 'leading-tone-resolution': 'error', 'doubled-leading-tone': 'warning' },
        { harmonies: [minor, unknown] },
      ),
    ).toEqual([]);
  });

  it('verlangt die richtige Schreibweise und Richtung der Auflösung', () => {
    expect(
      analyzeVoiceLeading(
        [slice('G2', 'D3', 'F3', 'B3'), slice('C3', 'E3', 'D##3', 'B#3')],
        resolutionRules,
        { harmonies: [dominant, unknown] },
      ),
    ).toEqual([
      { rule: 'seventh-resolution', severity: 'warning', at: 1, voices: ['alto'] },
      { rule: 'leading-tone-resolution', severity: 'error', at: 1, voices: ['soprano'] },
    ]);
  });

  it('verschiebt die Auflösungsprüfung bis zur markierten Grenze', () => {
    const from = slice('G2', 'D3', 'F3', 'B3');
    const beforeBoundary: VoiceLeadingHarmonyContext = {
      tonic: dominant.tonic,
      chord: dominant.chord,
    };
    expect(
      analyzeVoiceLeading([from, from, slice('C3', 'E3', 'E3', 'C4')], resolutionRules, {
        harmonies: [beforeBoundary, dominant, unknown],
      }),
    ).toEqual([]);
    expect(
      analyzeVoiceLeading([from, from], resolutionRules, { harmonies: [dominant, unknown] }),
    ).toEqual([
      { rule: 'seventh-resolution', severity: 'warning', at: 1, voices: ['alto'] },
      { rule: 'leading-tone-resolution', severity: 'error', at: 1, voices: ['soprano'] },
    ]);
  });

  it('erlaubt den abspringenden Leitton nur in Innenstimmen und nach ausdrücklicher Wahl', () => {
    const passage = [slice('G2', 'B3', 'D4', 'F4'), slice('C3', 'G3', 'C4', 'E4')];
    expect(
      analyzeVoiceLeading(passage, resolutionRules, { harmonies: [dominant, unknown] }),
    ).toEqual([{ rule: 'leading-tone-resolution', severity: 'error', at: 1, voices: ['tenor'] }]);
    const optionalException: VoiceLeadingHarmonyContext = {
      ...dominant,
      resolveToNext: { leadingTone: 'up-or-frustrated-inner', seventh: 'down' },
    };
    expect(
      analyzeVoiceLeading(passage, resolutionRules, { harmonies: [optionalException, unknown] }),
    ).toEqual([]);
    expect(
      analyzeVoiceLeading(
        [slice('G2', 'D3', 'F3', 'B4'), slice('C3', 'E3', 'E3', 'G4')],
        resolutionRules,
        { harmonies: [optionalException, unknown] },
      ),
    ).toEqual([{ rule: 'leading-tone-resolution', severity: 'error', at: 1, voices: ['soprano'] }]);
  });

  it('fasst alle Stimmen mit verdoppeltem Leitton in einem Befund zusammen', () => {
    expect(
      analyzeVoiceLeading(
        [slice('B2', 'F3', 'B3', 'B4')],
        { 'doubled-leading-tone': 'hint' },
        { harmonies: [{ tonic: parseNoteName('C'), chord: null }] },
      ),
    ).toEqual([
      {
        rule: 'doubled-leading-tone',
        severity: 'hint',
        at: 0,
        voices: ['bass', 'alto', 'soprano'],
      },
    ]);
    expect(
      analyzeVoiceLeading(
        [slice('Cb3', 'F3', 'B3', 'Cb5')],
        { 'doubled-leading-tone': 'error' },
        { harmonies: [{ tonic: parseNoteName('C'), chord: null }] },
      ),
    ).toEqual([]);
  });

  it('interpretiert unbekannte Harmonik und unmarkierte Grenzen nicht automatisch', () => {
    expect(
      analyzeVoiceLeading(
        [slice('B2', 'D3', 'F3', 'B3'), slice('A2', 'D3', 'G3', 'A3')],
        { ...resolutionRules, 'doubled-leading-tone': 'error' },
        { harmonies: [unknown, unknown] },
      ),
    ).toEqual([]);
  });

  it('berechnet bei ausgeschalteten Harmonieregeln keine nicht benötigten Töne', () => {
    // Unter Disis läge ein Leitton mit drei Kreuzen; Lageprüfungen benötigen ihn nicht.
    expect(
      analyzeVoiceLeading(
        [slice('C3', 'G3', 'C4', 'E4'), slice('D3', 'A3', 'D4', 'F4')],
        { 'voice-crossing': 'error' },
        { harmonies: [{ tonic: parseNoteName('D##'), chord: null }, unknown] },
      ),
    ).toEqual([]);
  });

  it.each<VoiceLeadingRule>([
    'leading-tone-resolution',
    'seventh-resolution',
    'doubled-leading-tone',
  ])('verlangt einen Kontext für %s', (rule) => {
    expect(() => analyzeVoiceLeading([], { [rule]: 'error' })).toThrow(RangeError);
  });

  it('verweigert fehlende Kontexte, fehlende Tonika, einen Dreiklang als Septakkord und ein fehlendes Ziel', () => {
    const passage = [slice('G2', 'D3', 'F3', 'B3'), slice('C3', 'E3', 'E3', 'C4')];
    for (const harmonies of [
      [dominant],
      [{ ...dominant, tonic: null }, unknown],
      [{ ...dominant, chord: chord(parseNoteName('G')) }, unknown],
      [unknown, dominant],
    ]) {
      expect(() => analyzeVoiceLeading(passage, resolutionRules, { harmonies })).toThrow(
        RangeError,
      );
    }
  });
});
