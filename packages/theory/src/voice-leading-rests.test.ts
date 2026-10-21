import { describe, expect, it } from 'vitest';
import { chord } from './chord.ts';
import { parseNoteName, parsePitch } from './pitch.ts';
import { analyzeVoiceLeading, type FourPartSlice } from './voice-leading.ts';

const silence: FourPartSlice = { bass: null, tenor: null, alto: null, soprano: null };

describe('P4.09 – Pausen in einzelnen Stimmen', () => {
  it('erfindet zwischen zwei durch eine Pause getrennten Quinten keine Parallele', () => {
    const before = { ...silence, bass: parsePitch('C3'), soprano: parsePitch('G4') };
    const after = { ...silence, bass: parsePitch('D3'), soprano: parsePitch('A4') };
    expect(
      analyzeVoiceLeading(
        [before, silence, after],
        {
          'parallel-fifth': 'error',
          'voice-overlap': 'warning',
          'melodic-leap': 'hint',
        },
        { maxMelodicInterval: 3 },
      ),
    ).toEqual([]);
  });

  it('prüft weiter erklingende Stimmen, wenn eine andere Stimme pausiert', () => {
    expect(
      analyzeVoiceLeading(
        [
          {
            ...silence,
            bass: parsePitch('C3'),
            tenor: parsePitch('G3'),
            soprano: parsePitch('E4'),
          },
          { ...silence, bass: parsePitch('D3'), tenor: parsePitch('A3') },
        ],
        { 'parallel-fifth': 'error' },
      ),
    ).toEqual([{ rule: 'parallel-fifth', severity: 'error', at: 1, voices: ['bass', 'tenor'] }]);
  });

  it('prüft Kreuzungen und Abstände nur zwischen tatsächlich klingenden Stimmen', () => {
    expect(
      analyzeVoiceLeading(
        [
          { ...silence, alto: parsePitch('G4'), soprano: parsePitch('C4') },
          { ...silence, tenor: parsePitch('C3'), alto: parsePitch('D4') },
        ],
        { 'voice-crossing': 'error', 'upper-voice-spacing': 'warning' },
      ),
    ).toEqual([
      { rule: 'voice-crossing', severity: 'error', at: 0, voices: ['alto', 'soprano'] },
      { rule: 'upper-voice-spacing', severity: 'warning', at: 1, voices: ['tenor', 'alto'] },
    ]);
  });

  it('wertet eine Pause an der markierten Grenze nicht als erfüllte Auflösung', () => {
    expect(
      analyzeVoiceLeading(
        [{ ...silence, alto: parsePitch('F4'), soprano: parsePitch('B4') }, silence],
        { 'leading-tone-resolution': 'error', 'seventh-resolution': 'warning' },
        {
          harmonies: [
            {
              tonic: parseNoteName('C'),
              chord: chord(parseNoteName('G'), 'dominant7'),
              resolveToNext: { leadingTone: 'up', seventh: 'down' },
            },
            { tonic: null, chord: null },
          ],
        },
      ),
    ).toEqual([
      { rule: 'seventh-resolution', severity: 'warning', at: 1, voices: ['alto'] },
      { rule: 'leading-tone-resolution', severity: 'error', at: 1, voices: ['soprano'] },
    ]);
  });

  it('zählt Pausen weder als Leittonverdopplung noch als Verletzung eines Stimmumfangs', () => {
    const range = { min: parsePitch('C3'), max: parsePitch('C5') };
    expect(
      analyzeVoiceLeading(
        [silence, { ...silence, soprano: parsePitch('B4') }],
        { 'doubled-leading-tone': 'error', 'voice-range': 'warning' },
        {
          ranges: { bass: range, tenor: range, alto: range, soprano: range },
          harmonies: [
            { tonic: parseNoteName('C'), chord: null },
            { tonic: parseNoteName('C'), chord: null },
          ],
        },
      ),
    ).toEqual([]);
  });
});
