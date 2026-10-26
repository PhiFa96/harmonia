// Unabhängiger Intervallabgleich des eigenen Korpus; kein Stil- oder Fachgutachten.
import { Interval as TonalInterval, Note as TonalNote } from 'tonal';
import { describe, expect, it } from 'vitest';
import { parsePitch } from './pitch.ts';
import { analyzeVoiceLeading } from './voice-leading.ts';

describe('P4.09 – Korpus gegen tonal', () => {
  it('matches 19,312 consistent tonal distances and exposes 288 invalid oracle results', () => {
    const pitches = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].flatMap((letter) =>
      ['bb', 'b', '', '#', '##'].flatMap((alter) =>
        [2, 3, 4, 5].map((octave) => `${letter}${alter}${String(octave)}`),
      ),
    );
    let checked = 0,
      invalidOracle = 0,
      emptyOracle = 0;
    for (const from of pitches)
      for (const to of pitches) {
        const distance = TonalInterval.distance(from, to);
        if (distance === '') {
          emptyOracle++;
          invalidOracle++;
          continue;
        }
        const source = TonalNote.get(from),
          target = TonalNote.get(to),
          measured = TonalInterval.get(distance);
        if (source.oct === undefined || target.oct === undefined)
          throw new Error('Missing oracle octave');
        const size = Math.abs(7 * (target.oct - source.oct) + target.step - source.step) + 1;
        // tonal sometimes changes the generic size/octave for extreme enharmonic spellings.
        // Its own note coordinates expose these invalid distances. Do not treat them as truth.
        // Cbb3 → A#2 is a written descending third at zero semitones, not tonal's -1AAA.
        if (
          Math.abs(measured.num) !== size ||
          measured.semitones !== (target.midi ?? NaN) - (source.midi ?? NaN)
        ) {
          invalidOracle++;
          continue;
        }
        const report = analyzeVoiceLeading(
          [
            { bass: null, tenor: null, alto: null, soprano: parsePitch(from) },
            { bass: null, tenor: null, alto: null, soprano: parsePitch(to) },
          ],
          { 'augmented-melodic-interval': 'hint' },
        );
        expect(report.length, `${from} → ${to}: ${distance}`).toBe(/A+$/.test(distance) ? 1 : 0);
        checked++;
      }
    expect(checked).toBe(19_312);
    expect(invalidOracle).toBe(288);
    expect(emptyOracle).toBe(14);
  });
  it.each([
    ['C3', 'G3', 'D3', 'A3', '5P', '5P', true],
    ['C3', 'G4', 'D3', 'A4', '12P', '12P', true],
    ['C3', 'G3', 'D3', 'Bbb3', '5P', '6d', false],
    ['C3', 'G3', 'D3', 'Ab3', '5P', '5d', false],
  ] as const)(
    'Quintpaar %s/%s → %s/%s',
    (bassFrom, sopranoFrom, bassTo, sopranoTo, before, after, parallel) => {
      expect(TonalInterval.distance(bassFrom, sopranoFrom)).toBe(before);
      expect(TonalInterval.distance(bassTo, sopranoTo)).toBe(after);
      const held = { tenor: parsePitch('C4'), alto: parsePitch('E4') };
      expect(
        analyzeVoiceLeading(
          [
            { ...held, bass: parsePitch(bassFrom), soprano: parsePitch(sopranoFrom) },
            { ...held, bass: parsePitch(bassTo), soprano: parsePitch(sopranoTo) },
          ],
          { 'parallel-fifth': 'error' },
        ),
      ).toHaveLength(parallel ? 1 : 0);
    },
  );

  it.each([
    ['Eb4', 'F#4', '2A', true],
    ['F#4', 'Eb4', '-2A', true],
    ['Eb4', 'Gb4', '3m', false],
    ['C4', 'Eb4', '3m', false],
  ] as const)('Melodieintervall %s → %s', (from, to, interval, augmented) => {
    expect(TonalInterval.distance(from, to)).toBe(interval);
    const held = { bass: parsePitch('C3'), tenor: parsePitch('G3'), alto: parsePitch('C4') };
    expect(
      analyzeVoiceLeading(
        [
          { ...held, soprano: parsePitch(from) },
          { ...held, soprano: parsePitch(to) },
        ],
        { 'augmented-second': 'warning' },
      ),
    ).toHaveLength(augmented ? 1 : 0);
  });
});
