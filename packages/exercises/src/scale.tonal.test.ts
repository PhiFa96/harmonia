// Zweites unabhängiges Mittel für Schreibweisen und Intervallfolgen; tonal bleibt ausschließlich im Test.
import { formatPitch } from '@harmonia/theory';
import { Scale } from 'tonal';
import { expect, it } from 'vitest';
import { createRng, generateScale, scalePitches } from './index.ts';

it('200 Tonleitern stimmen einschließlich Schreibweise und klassischer Abwärtsform mit tonal überein', () => {
  const rng = createRng('p2.06-scales-oracle');
  for (let index = 0; index < 200; index++) {
    const item = generateScale(
      {
        types: ['major', 'naturalMinor', 'harmonicMinor', 'melodicMinor'],
        fifths: [-3, -2, -1, 0, 1, 2, 3],
        direction: 'both',
        clefs: ['treble', 'bass'],
      },
      rng,
      'SCALE_BUILD',
    );
    const name =
      item.scaleType === 'major'
        ? 'major'
        : item.scaleType === 'harmonicMinor'
          ? 'harmonic minor'
          : item.scaleType === 'melodicMinor' && item.direction === 'ascending'
            ? 'melodic minor'
            : 'minor';
    const bottom =
      item.direction === 'ascending'
        ? item.tonic
        : { ...item.tonic, octave: item.tonic.octave - 1 };
    const ascending = [
      ...Scale.get(`${formatPitch(bottom)} ${name}`).notes,
      formatPitch({ ...bottom, octave: bottom.octave + 1 }),
    ];
    expect(scalePitches(item).map((pitch) => formatPitch(pitch))).toEqual(
      item.direction === 'ascending' ? ascending : ascending.reverse(),
    );
  }
});
