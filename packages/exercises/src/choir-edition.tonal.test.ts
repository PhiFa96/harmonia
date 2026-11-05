import { expect, it } from 'vitest';
import { Note } from 'tonal';
import { formatPitch, midi } from '@harmonia/theory';
import { createRng, generateChoir, SATB_VOICES } from './index.ts';

for (const piece of ['home', 'arch'] as const)
  for (const fifths of [-2, 0, 2] as const)
    it(`${piece}/${String(fifths)}: revised sounding pitches and their spellings agree with tonal`, () => {
      const base = generateChoir({ voice: 'alto', piece, fifths: 0, edition: 2 }, createRng(1));
      const actual = generateChoir({ voice: 'alto', piece, fifths, edition: 2 }, createRng(1));
      const interval = fifths === -2 ? '-2M' : fifths === 2 ? '2M' : '1P';
      for (const voice of SATB_VOICES)
        for (const [index, p] of actual.parts[voice].entries()) {
          const original = base.parts[voice][index];
          if (!original) throw Error('Missing reference pitch');
          const expected = Note.transpose(formatPitch(original), interval);
          expect(formatPitch(p)).toBe(expected);
          expect(midi(p)).toBe(Note.midi(expected));
        }
    });
