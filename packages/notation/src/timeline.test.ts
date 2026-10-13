import { describe, expect, it } from 'vitest';
import { duration, parsePitch, TRIPLET } from '@harmonia/theory';
import { note, singleStaffScore } from './score.ts';
import { parseScore } from './shorthand.ts';
import { scoreTimeline } from './timeline.ts';

describe('Zeitfolge einer Partitur', () => {
  it('bewahrt exakte Triolenwerte und verändert die ursprünglichen Noten nicht', () => {
    const score = singleStaffScore([
      Array.from({ length: 12 }, () => note(parsePitch('C4'), duration('eighth', 0, TRIPLET))),
    ]);
    const before = JSON.stringify(score);
    const timeline = scoreTimeline(score, { bpm: 120 });
    expect(timeline.tones).toHaveLength(12);
    timeline.tones.forEach((tone, index) => {
      expect(tone.onsetSeconds).toBeCloseTo(index / 6, 12);
      expect(tone.durationSeconds).toBeCloseTo(1 / 6, 12);
    });
    expect(timeline.durationSeconds).toBe(2);
    expect(JSON.stringify(score)).toBe(before);
  });
  it('setzt punktierte Werte über Taktwechsel fort und verwendet den tatsächlichen Temponotenwert', () => {
    const parsed = parseScore('treble | 4/4 | C4/4. D4/8 E4/2 | F4/2 G4/4');
    const staff = parsed.staves[0];
    const first = staff?.measures[0];
    const second = staff?.measures[1];
    if (!staff || !first || !second) throw new Error('Takte fehlen');
    const score = {
      staves: [
        {
          ...staff,
          measures: [
            first,
            {
              ...second,
              changes: { timeSignature: { numerator: 3, denominator: 4, grouping: [1, 1, 1] } },
            },
          ],
        },
      ],
    };
    const timeline = scoreTimeline(score, { bpm: 120 });
    expect(timeline.tones.map((tone) => tone.onsetSeconds)).toEqual([0, 0.75, 1, 2, 3]);
    expect(timeline.tones.map((tone) => tone.durationSeconds)).toEqual([0.75, 0.25, 1, 1, 0.5]);
    expect(timeline.durationSeconds).toBe(3.5);
    expect(scoreTimeline(score, { bpm: 60, beat: duration('half') })).toEqual(timeline);
  });
});
