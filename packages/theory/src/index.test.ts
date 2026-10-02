import { describe, expect, it } from 'vitest';

import { SEMITONES_PER_OCTAVE } from './index.ts';

describe('@harmonia/theory', () => {
  it('kennt die Anzahl der Halbtöne pro Oktave', () => {
    expect(SEMITONES_PER_OCTAVE).toBe(12);
  });
});
