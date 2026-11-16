// Independent interval spelling via tonal; this is not a literature or subject approval.
import { describe, expect, it } from 'vitest';
import { Interval, Note } from 'tonal';
import { createRng, formatPitch } from '@harmonia/theory';
import { generateContext, contextAnswer } from './context.ts';
import { counterpointCantusEnding, counterpointDyads } from './counterpoint-context.ts';

describe('cantus endings against an independent written-interval oracle', () => {
  it('labels actual generated clean and faulty sources without treating the cadence as the verdict', () => {
    const kinds = new Set<string>(),
      verdicts = new Map<string, Set<string>>(),
      clean = new Map<string, Set<string>>();
    for (let seed = 0; seed < 1000; seed++) {
      const item = generateContext({ topics: ['counterpoint-check'] }, createRng(seed));
      if (item.source.kind !== 'score') throw Error('Missing counterpoint source');
      const dyads = counterpointDyads(item.source.score),
        from = dyads.at(-2)?.lower,
        to = dyads.at(-1)?.lower;
      if (!from || !to) throw Error('Missing closing notes');
      const interval = Interval.distance(formatPitch(from), formatPitch(to)),
        expected =
          interval === '2m'
            ? 'ascending-semitone'
            : interval === '-2M'
              ? 'descending-tone'
              : 'other-motion',
        actual = counterpointCantusEnding(item.source.score);
      expect(actual?.kind).toBe(expected);
      kinds.add(expected);
      const answers = verdicts.get(expected) ?? new Set<string>();
      const answer = contextAnswer(item);
      answers.add(answer);
      verdicts.set(expected, answers);
      if (answer === 'boolean:yes') {
        const final = Note.midi(formatPitch(to));
        if (final === null) throw Error('Missing final note in oracle');
        const shape = JSON.stringify(
            dyads.map((d) =>
              [d.lower, d.upper].map((pitch) => {
                const value = Note.midi(formatPitch(pitch));
                if (value === null) throw Error('Missing oracle pitch');
                return value - final;
              }),
            ),
          ),
          shapes = clean.get(expected) ?? new Set<string>();
        shapes.add(shape);
        clean.set(expected, shapes);
      }
    }
    expect(kinds).toEqual(new Set(['ascending-semitone', 'descending-tone', 'other-motion']));
    for (const kind of ['ascending-semitone', 'descending-tone']) {
      expect(verdicts.get(kind)).toEqual(new Set(['boolean:yes', 'boolean:no']));
    }
    // Current integrated corpus: 11 variants and 13 descending cantus endings.
    // The v3 report's count of twelve variants does not match these actual 24 sources.
    expect(clean.get('ascending-semitone')?.size).toBe(11);
    expect(clean.get('descending-tone')?.size).toBe(13);
  });
});
