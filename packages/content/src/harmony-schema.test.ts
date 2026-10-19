import { describe, expect, it } from 'vitest';
import { exerciseSpecSchema } from './schema.ts';

describe('P3.14 Inhaltsschema', () => {
  it('akzeptiert die vier neuen Aufgaben und Septakkorde', () => {
    for (const spec of [
      { type: 'CADENCE_IDENTIFY', params: { fifths: [0], types: ['authentic'] } },
      { type: 'FUNCTION_ANALYSIS', params: { degrees: [5], notation: 'roman' } },
      { type: 'MELODY_DICTATION', params: { level: 1 } },
      { type: 'RHYTHM_DICTATION', params: { level: 2 } },
      { type: 'CHORD_BUILD', params: { types: ['dominant7'], roots: ['G'], inversions: [3] } },
    ])
      expect(exerciseSpecSchema.parse(spec)).toEqual(spec);
  });
  it('weist ungültige Parameter ab', () => {
    for (const spec of [
      { type: 'CADENCE_IDENTIFY', params: { types: ['unknown'] } },
      { type: 'FUNCTION_ANALYSIS', params: { degrees: [8] } },
      { type: 'MELODY_DICTATION', params: { level: 3 } },
      { type: 'CHORD_BUILD', params: { types: ['dominant13'] } },
    ])
      expect(exerciseSpecSchema.safeParse(spec).success).toBe(false);
  });
});
