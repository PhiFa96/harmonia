// Zweites Orakel für vollständige Schreibweise und Oktavlage; tonal bleibt im Test.
import { formatNoteName, formatPitch } from '@harmonia/theory';
import type { TriadType } from '@harmonia/theory';
import { Chord as TonalChord, Note as TonalNote } from 'tonal';
import { expect, it } from 'vitest';
import { chordTargets, createRng, generateChord } from './index.ts';

it('200 geschriebene Dreiklänge in allen Umkehrungen stimmen mit tonal überein', () => {
  const types = { major: 'M', minor: 'm', diminished: 'dim', augmented: 'aug' } as const;
  const rng = createRng('chord-independent-oracle');
  for (let index = 0; index < 200; index++) {
    const item = generateChord(
      {
        types: ['major', 'minor', 'diminished', 'augmented'],
        maxAccidentals: 2,
        clefs: ['treble', 'bass'],
      },
      rng,
      'CHORD_BUILD',
    );
    const oracle = TonalChord.getChord(
      types[item.chord.type as TriadType],
      formatNoteName(item.chord.root),
    );
    const rootPosition = oracle.intervals.map((interval) =>
      TonalNote.transpose(formatPitch({ ...item.chord.root, octave: 4 }), interval),
    );
    expect(rootPosition).toHaveLength(3);
    const rotated = [
      ...rootPosition.slice(item.chord.inversion),
      ...rootPosition.slice(0, item.chord.inversion).map((name) => TonalNote.transpose(name, '8P')),
    ];
    const referenceOctave = TonalNote.get(rotated[0] ?? '').oct;
    if (referenceOctave === undefined) throw new Error('Tonal-Basston fehlt');
    const octaveShift = item.bass.octave - referenceOctave;
    const shift = `${octaveShift < 0 ? '-' : ''}${String(Math.abs(octaveShift) * 7 + 1)}P`;
    const expected = rotated.map((name) => TonalNote.transpose(name, shift));
    expect(chordTargets(item).map((pitch) => formatPitch(pitch))).toEqual(expected);
  }
});
