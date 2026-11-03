import { describe, expect, it } from 'vitest';
import { createRng, midi, pitchClass } from '@harmonia/theory';
import { parseScore, scoreTimeline } from '@harmonia/notation';
import { generateContext, contextAnswer } from './context.ts';
import { counterpointContextFindings } from './advanced-context.ts';
import { contextNotationDescription, contextSourceText } from './context-text.ts';

function pitches(item: ReturnType<typeof generateContext>) {
  if (item.source.kind !== 'score') throw Error('Missing score');
  return item.source.score.staves.flatMap((s) =>
    s.measures.flatMap((m) =>
      m.voices.flatMap((v) =>
        v.events.flatMap((e) =>
          e.kind === 'note'
            ? [midi(e.pitch)]
            : e.kind === 'chord'
              ? e.notes.map((n) => midi(n.pitch))
              : [],
        ),
      ),
    ),
  );
}

describe('complete P4.19 material and identifiable parts', () => {
  it('actually asks every cardinality, including two distinct pitch classes', () => {
    const values = new Set(
      Array.from({ length: 160 }, (_, seed) =>
        contextAnswer(generateContext({ topics: ['set-cardinality'] }, createRng(seed))),
      ),
    );
    expect(values).toEqual(new Set([1, 2, 3, 4].map((n) => 'cardinality:' + String(n))));
  });
  it('invalid rows do not reveal their fault by always repeating the first pitch class', () => {
    let invalid = 0,
      withoutFirst = 0;
    const positions = new Set<number>();
    for (let seed = 0; seed < 200; seed++) {
      const item = generateContext({ topics: ['row-validity'] }, createRng(seed));
      if (contextAnswer(item) !== 'boolean:no') continue;
      invalid++;
      const values = pitches(item).map(pitchClass);
      const first = values[0];
      if (values.filter((v) => v === first).length === 1) withoutFirst++;
      for (const [i, v] of values.entries())
        if (values.filter((x) => x === v).length > 1) positions.add(i);
    }
    expect(invalid).toBeGreaterThan(50);
    expect(withoutFirst).toBeGreaterThan(30);
    expect(positions.size).toBe(12);
  });
  it('offers many genuinely different clean counterpoints, with two visibly separate parts', () => {
    const shapes = new Set<string>(),
      lengths = new Set<number>();
    for (let seed = 0; seed < 180; seed++) {
      const item = generateContext({ topics: ['counterpoint-check'] }, createRng(seed));
      if (item.source.kind !== 'score') throw Error('Missing score');
      expect(item.source.score.staves).toHaveLength(2);
      if (contextAnswer(item) === 'boolean:yes') {
        const values = pitches(item),
          first = values[0] ?? 0;
        shapes.add(values.map((v) => v - first).join(','));
        lengths.add(item.source.score.staves[0]?.measures.length ?? 0);
      }
    }
    expect(shapes.size).toBeGreaterThanOrEqual(12);
    expect(lengths.size).toBeGreaterThanOrEqual(2);
  });
  it('keeps named part identity across a crossing instead of sorting notes by height', () => {
    const score = parseScore(
      'treble | 4/4 | G4/1 | E4/1 | B4/1 | C5/1\ntreble | 4/4 | C4/1 | G4/1 | D4/1 | C4/1',
    );
    expect(
      counterpointContextFindings(score)
        .filter((f) => f.at === 1)
        .map((f) => f.rule),
    ).toEqual(['crossing']);
    const item = {
      ...generateContext({ topics: ['counterpoint-check'] }, createRng(0)),
      source: { kind: 'score' as const, score },
    };
    for (const locale of ['de', 'en-US', 'en-GB'] as const)
      expect(contextSourceText(item, locale)).toContain('Cantus');
    expect(contextNotationDescription(item, 'de').match(/Takt \d/g)).toHaveLength(8);
  });
});

describe('fixed counterpoint part alignment', () => {
  it('describes accidentals on their own staff, including the implicit first staff index', () => {
    const item = {
      ...generateContext({ topics: ['counterpoint-consonance'] }, createRng(1)),
      source: {
        kind: 'score' as const,
        score: parseScore('treble | 4/4 | F4/1\nbass | 4/4 | F#3/1'),
      },
    };
    const description = contextNotationDescription(item, 'de'),
      [first, second] = description.split('System 2:');
    expect(first).not.toContain('Kreuz');
    expect(second).toContain('Kreuz');
    expect(description).not.toMatch(/F#|fis/);
  });
  it('plays both fixed parts simultaneously for their complete displayed durations', () => {
    for (let seed = 0; seed < 30; seed++) {
      const item = generateContext({ topics: ['counterpoint-check'] }, createRng(seed));
      if (item.source.kind !== 'score') throw Error('Missing score');
      const score = item.source.score,
        timeline = scoreTimeline(score, { bpm: 60 });
      const count = score.staves[0]?.measures.length ?? 0;
      expect(timeline.tones).toHaveLength(count * 2);
      expect(timeline.durationSeconds).toBe(count * 4);
      for (let at = 0; at < count; at++) {
        const expected = score.staves
          .map((s) => s.measures[at]?.voices[0]?.events[0])
          .map((e) => {
            if (e?.kind !== 'note') throw Error('Missing part note');
            return midi(e.pitch);
          })
          .sort((a, b) => a - b);
        const actual = timeline.tones.filter((t) => t.onsetSeconds === at * 4);
        expect(actual.map((t) => midi(t.pitch)).sort((a, b) => a - b)).toEqual(expected);
        expect(actual.every((t) => t.durationSeconds === 4)).toBe(true);
      }
    }
  });
  it('rejects unaligned, incomplete or rhythmically mismatched named parts', () => {
    for (const source of [
      'treble | 4/4 | G4/1 | A4/1\ntreble | 4/4 | C4/1',
      'treble | 4/4 | G4/2 A4/2 | C5/1\ntreble | 4/4 | C4/1 | C4/1',
      'treble | 4/4 | r/1 | C5/1\ntreble | 4/4 | C4/1 | C4/1',
    ])
      expect(() => counterpointContextFindings(parseScore(source))).toThrow();
  });
});
