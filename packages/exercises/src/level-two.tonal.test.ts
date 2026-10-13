// Unabhängige Vergleichsquelle nur im Test (ADR 0004).
import { Interval, Key, Note } from 'tonal';
import { describe, expect, it } from 'vitest';
import { formatNoteName, formatPitch, intervalBetween, formatInterval } from '@harmonia/theory';
import { createRng } from '@harmonia/theory';
import { CONTEXT_TOPICS, contextAnswer, generateContext } from './context.ts';
import { chordTargets, generateChord } from './chords.ts';
import { eventPitches } from '@harmonia/notation';
function suffix(id: string) {
  const m = /^(\d+)(dd|d|m|M|P|A|AA)$/.exec(id);
  if (!m) throw new Error(id);
  return `${m[2] ?? ''}${m[1] ?? ''}`;
}
describe('Stufe-2-Quellen gegen tonal', () => {
  it.each([
    'interval-inversion',
    'interval-reduction',
    'relative-key',
    'enharmonic-spelling',
  ] as const)('%s: 200 unabhängige Vergleiche', (topic) => {
    expect(CONTEXT_TOPICS).toContain(topic);
    for (let seed = 0; seed < 200; seed++) {
      const item = generateContext({ topics: [topic] }, createRng(seed));
      if (item.source.kind === 'key') {
        const name = formatNoteName(item.source.key.tonic),
          expected =
            item.source.key.mode === 'major'
              ? Key.majorKey(name).minorRelative
              : Key.minorKey(name).relativeMajor;
        expect(contextAnswer(item).split(':')[2]).toBe(expected);
      } else if (item.source.kind === 'score') {
        const pitches = item.source.score.staves.flatMap((s) =>
          s.measures.flatMap((m) => m.voices.flatMap((v) => v.events.flatMap(eventPitches))),
        );
        if (!pitches[0]) throw new Error('Ton fehlt');
        if (topic === 'enharmonic-spelling')
          expect(Note.midi(contextAnswer(item).slice(6))).toBe(Note.midi(formatPitch(pitches[0])));
        else {
          if (!pitches[1]) throw new Error('Ton fehlt');
          const distance = Interval.distance(formatPitch(pitches[0]), formatPitch(pitches[1]));
          const expected =
            topic === 'interval-inversion'
              ? Interval.invert(distance)
              : Interval.simplify(distance);
          const edge =
            topic === 'interval-inversion' && distance === '1P'
              ? 'P8'
              : topic === 'interval-inversion' && distance === '8P'
                ? 'P1'
                : topic === 'interval-reduction' && distance === '15P'
                  ? 'P8'
                  : suffix(expected);
          expect(contextAnswer(item)).toBe('interval:' + edge);
        }
      }
    }
  });
  it('300 leitereigene Schreibaufgaben stimmen mit Dur/natürlichem Moll aus tonal überein', () => {
    const types = ['major', 'minor', 'diminished'] as const,
      suffixes = { major: '', minor: 'm', diminished: 'dim' };
    for (let seed = 0; seed < 300; seed++) {
      const item = generateChord(
        {
          types,
          diatonic: true,
          inversions: [0],
          range: { minMidi: 60, maxMidi: 84 },
          maxAccidentals: 1,
        },
        createRng(seed),
        'CHORD_BUILD',
      );
      const source = item.diatonic;
      if (!source) throw new Error('Tonart fehlt');
      const name = formatNoteName(source.key.tonic),
        triads =
          source.key.mode === 'major'
            ? Key.majorKey(name).triads
            : Key.minorKey(name).natural.triads;
      const target = triads[source.degree - 1];
      const quality = item.chord.type;
      if (quality !== 'major' && quality !== 'minor' && quality !== 'diminished') {
        throw new Error('Unerwartete leitereigene Dreiklangart');
      }
      expect(formatNoteName(item.chord.root) + suffixes[quality]).toBe(target);
      const p = chordTargets(item);
      expect(p).toHaveLength(3);
      const first = p[0],
        last = p[2];
      if (!first || !last) throw new Error('Akkordtöne fehlen');
      expect(formatInterval(intervalBetween(first, last))).toMatch(/^(?:P|d)5$/);
    }
  });
});
