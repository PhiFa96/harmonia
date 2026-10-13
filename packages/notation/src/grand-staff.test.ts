import { describe, expect, it } from 'vitest';
import { parsePitch } from '@harmonia/theory';
import { grandStaffExample, grandStaffTarget, layoutGrandStaff } from './grand-staff.ts';
import { parseScore, validateScore, keyboardMidi } from './index.ts';
import { scoreTimeline } from './timeline.ts';

// Unabhängige Tabelle: C4 liegt unter dem Violinsystem, aber über dem Basssystem.
const pitches = [
  ['A3', 57, 6, 10],
  ['B3', 59, 5.5, 9.5],
  ['C4', 60, 5, 9],
  ['D4', 62, 4.5, 8.5],
  ['E4', 64, 4, 8],
] as const;
describe('Begrenztes großes Lernsystem', () => {
  it.each(pitches)(
    '%s klingt genau einmal und bleibt in beiden Schlüsseln richtig positioniert',
    (name, expectedMidi, trebleY, bassY) => {
      for (const clef of ['treble', 'bass'] as const) {
        const pitch = parsePitch(name),
          score = grandStaffExample(pitch, clef),
          layout = layoutGrandStaff(score);
        expect(validateScore(score)).toEqual([]);
        expect(keyboardMidi(pitch)).toBe(expectedMidi);
        expect(grandStaffTarget(score)).toEqual({ pitch, clef });
        expect(scoreTimeline(score, { bpm: 90 }).tones).toMatchObject([
          { pitch, onsetSeconds: 0, durationSeconds: 8 / 3 },
        ]);
        const head = layout.items.find((i) => i.kind === 'glyph' && i.role === 'notehead');
        expect(head).toMatchObject({ y: clef === 'treble' ? trebleY : bassY });
        expect(layout.items.filter((i) => i.kind === 'glyph' && i.role === 'rest')).toHaveLength(1);
        const lines = layout.items.filter((i) => i.kind === 'line' && i.role === 'staffLine');
        expect(lines).toHaveLength(10);
        expect(new Set(lines.map((i) => (i.kind === 'line' ? i.x2 : 0))).size).toBe(1);
        const times = layout.items.filter((i) => i.kind === 'glyph' && i.role === 'timeSignature');
        expect(new Set(times.map((i) => (i.kind === 'glyph' ? i.x : 0))).size).toBe(1);
      }
    },
  );
  it.each([
    'treble | 4/4 | C4/1',
    'bass | 4/4 | C4/1\ntreble | 4/4 | r/1',
    'treble | 4/4 | C4/1\nbass | 4/4 | C3/1',
    'treble | 4/4 | r/1\nbass | 4/4 | r/1',
    'treble | 4/4 | C4/2 D4/2\nbass | 4/4 | r/1',
    'treble | 4/4 | C#4/1\nbass | 4/4 | r/1',
    'treble | 4/4 | C3/1\nbass | 4/4 | r/1',
    'treble | key:G | 4/4 | C4/1\nbass | 4/4 | r/1',
    'treble | 4/4 | C4/1\nbass | 3/4 | r/2.',
  ])('weist nicht unterstützte oder mehrdeutige Quellen ab: %s', (source) => {
    expect(() => layoutGrandStaff(parseScore(source))).toThrow(RangeError);
  });
});
