// Independent pitch/interval arithmetic via tonal; this is not specialist acceptance.
import { describe, expect, it } from 'vitest';
import { Interval, Note } from 'tonal';
import { createRng, formatPitch } from '@harmonia/theory';
import { generateContext, contextAnswer } from './context.ts';

function interval(a: string, b: string) {
  const value = Interval.distance(a, b),
    match = /^(-?)(\d+)([PmMAd]+)$/.exec(value);
  if (!match) throw Error('Oracle interval unavailable');
  return { number: Number(match[2]), quality: match[3], direction: match[1] ? -1 : 1 };
}
const number = (name: string) => {
  const value = Note.midi(name);
  if (value === null) throw Error('Oracle pitch unavailable');
  return value;
};
function profileAccepts(parts: readonly (readonly string[])[]) {
  const upper = parts[0],
    lower = parts[1];
  if (!upper || upper.length < 2 || upper.length !== lower?.length)
    throw Error('Missing oracle parts');
  for (let i = 0; i < upper.length; i++) {
    const a = lower[i],
      b = upper[i];
    if (!a || !b) throw Error('Missing oracle note');
    const v = interval(a, b),
      simple = ((v.number - 1) % 7) + 1,
      span = number(b) - number(a);
    if (
      span < 0 ||
      span > 19 ||
      v.number > 12 ||
      !(v.quality === 'P'
        ? [1, 5].includes(simple)
        : ['m', 'M'].includes(v.quality ?? '') && [3, 6].includes(simple))
    )
      return false;
    if (i === 0 && !(v.quality === 'P' && [1, 5, 8].includes(v.number))) return false;
    if (i === upper.length - 1 && !(v.quality === 'P' && [1, 8].includes(v.number))) return false;
    if (i > 0 && i < upper.length - 1 && v.quality === 'P' && v.number === 1) return false;
    const p = lower[i - 1],
      q = upper[i - 1];
    if (!p || !q) continue;
    const previous = interval(p, q),
      oldSimple = ((previous.number - 1) % 7) + 1;
    const lowMove = number(a) - number(p),
      highMove = number(b) - number(q);
    if (v.quality === 'P' && [1, 5].includes(simple)) {
      if (previous.quality === 'P' && simple === oldSimple) return false;
      if (lowMove !== 0 && highMove !== 0 && Math.sign(lowMove) === Math.sign(highMove))
        return false;
    }
    if (number(a) > number(q) || number(b) < number(p)) return false;
    if (i === upper.length - 1) {
      if (Math.sign(lowMove) === Math.sign(highMove) || !lowMove || !highMove) return false;
      for (const step of [interval(p, a), interval(q, b)])
        if (step.number !== 2 || !['m', 'M'].includes(step.quality ?? '')) return false;
      if (
        previous.direction !== 1 ||
        !(
          (oldSimple === 3 && previous.quality === 'm') ||
          (oldSimple === 6 && previous.quality === 'M')
        )
      )
        return false;
    }
  }
  return true;
}
function sourceParts(
  seed: number,
  topic: 'counterpoint-check' | 'row-validity' | 'set-cardinality' | 'set-vector',
) {
  const item = generateContext({ topics: [topic] }, createRng(seed));
  if (item.source.kind !== 'score') throw Error('Missing score');
  const parts = item.source.score.staves.map((s) =>
    s.measures.flatMap((m) =>
      m.voices.flatMap((v) =>
        v.events.map((e) => {
          if (e.kind !== 'note') throw Error('Monophonic oracle part expected');
          return formatPitch(e.pitch);
        }),
      ),
    ),
  );
  return { item, parts };
}
describe('P4.19 generated material against an independent tonal oracle', () => {
  it('agrees on all nine bounded profile conditions for clean and faulty original sources', () => {
    const answers = new Set<string>();
    for (let seed = 0; seed < 400; seed++) {
      const { item, parts } = sourceParts(seed, 'counterpoint-check'),
        expected = profileAccepts(parts) ? 'boolean:yes' : 'boolean:no';
      expect(contextAnswer(item)).toBe(expected);
      answers.add(expected);
    }
    expect(answers).toEqual(new Set(['boolean:yes', 'boolean:no']));
  });
  it('detects row completeness independently of duplicate position or cached labels', () => {
    for (let seed = 0; seed < 240; seed++) {
      const { item, parts } = sourceParts(seed, 'row-validity'),
        values = parts.flat().map(number);
      expect(contextAnswer(item)).toBe(
        'boolean:' +
          (values.length === 12 && new Set(values.map((v) => v % 12)).size === 12 ? 'yes' : 'no'),
      );
    }
  });
  it('counts unordered pairs and cardinalities from displayed notes, including octave duplicates', () => {
    for (const topic of ['set-cardinality', 'set-vector'] as const)
      for (let seed = 0; seed < 200; seed++) {
        const { item, parts } = sourceParts(seed, topic),
          classes = [...new Set(parts.flat().map((name) => number(name) % 12))];
        if (topic === 'set-cardinality')
          expect(contextAnswer(item)).toBe('cardinality:' + String(classes.length));
        else {
          const vector = Array<number>(6).fill(0);
          for (let a = 0; a < classes.length; a++)
            for (let b = a + 1; b < classes.length; b++) {
              const distance = Math.abs((classes[a] ?? 0) - (classes[b] ?? 0)),
                ic = Math.min(distance, 12 - distance);
              vector[ic - 1] = (vector[ic - 1] ?? 0) + 1;
            }
          expect(contextAnswer(item)).toBe('vector:' + vector.join(','));
          expect(vector.reduce((a, b) => a + b, 0)).toBe(
            (classes.length * (classes.length - 1)) / 2,
          );
        }
      }
  });
});
