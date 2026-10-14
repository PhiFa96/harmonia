// Unabhängiges Orakel für den eingecheckten Testkatalog, keine fachliche Freigabe nach ADR 0005.
import { Chord, Interval, Key, Note, Scale } from 'tonal';
import { describe, expect, it } from 'vitest';
import benchmark from '../../../tools/tutor-benchmark/catalogue.json';

interface Case {
  id: string;
  calls: { name: string; input: Record<string, unknown> }[];
  expectedFacts: Record<string, unknown>;
}
const cases = benchmark.cases as unknown as Case[];
const string = (value: unknown): string => {
  if (typeof value !== 'string') throw Error('String erwartet');
  return value;
};
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Objekt erwartet');
  return value as Record<string, unknown>;
};
const array = (value: unknown): unknown[] => {
  if (!Array.isArray(value)) throw Error('Array erwartet');
  return value;
};
const tonalInterval = (text: string) => {
  const m = /^(-?)([a-zA-Z]+)(\d+)$/.exec(text);
  if (!m) throw Error('Intervall');
  return `${m[1] ?? ''}${m[3] ?? ''}${m[2] ?? ''}`;
};
const ofTool = (name: string) => cases.filter((c) => c.calls[0]?.name === name);

describe('Unabhängige Katalog-Sollwerte', () => {
  it('alle Intervall- und Fangfragen bewahren Nummer, Qualität und Richtung', () => {
    const rows = ofTool('analyze_interval');
    expect(rows).toHaveLength(36);
    for (const c of rows) {
      const p = c.calls[0]?.input;
      if (!p) throw Error('Aufruf fehlt');
      expect(tonalInterval(string(c.expectedFacts['interval'])), c.id).toBe(
        Interval.distance(string(p['from']), string(p['to'])),
      );
    }
    expect(cases.find((c) => c.id === 'interval_02')?.expectedFacts['interval']).toBe('d4');
    expect(cases.find((c) => c.id === 'interval_02')?.expectedFacts['semitones']).toBe(4);
  });
  it('alle Transpositionsfälle treffen die unabhängige Schreibweise einschließlich Oktave', () => {
    const rows = ofTool('build_interval');
    expect(rows).toHaveLength(16);
    for (const c of rows) {
      const p = c.calls[0]?.input;
      if (!p) throw Error('Aufruf fehlt');
      expect(record(c.expectedFacts['pitch'])['id'], c.id).toBe(
        Note.transpose(string(p['from']), tonalInterval(string(p['interval']))),
      );
    }
  });
  it('alle Tonleiterfälle verwenden die richtige Folge einschließlich klassischem Moll abwärts', () => {
    const names: Record<string, string> = {
      major: 'major',
      naturalMinor: 'minor',
      harmonicMinor: 'harmonic minor',
      melodicMinor: 'melodic minor',
      ionian: 'ionian',
      dorian: 'dorian',
      phrygian: 'phrygian',
      lydian: 'lydian',
      mixolydian: 'mixolydian',
      aeolian: 'aeolian',
      locrian: 'locrian',
      majorPentatonic: 'major pentatonic',
      minorPentatonic: 'minor pentatonic',
      blues: 'blues',
      majorBlues: 'major blues',
      wholeTone: 'whole tone',
      chromatic: 'chromatic',
    };
    const rows = ofTool('build_scale');
    expect(rows).toHaveLength(24);
    for (const c of rows) {
      const p = c.calls[0]?.input;
      if (!p) throw Error('Aufruf fehlt');
      const type = string(p['type']),
        down = p['direction'] === 'descending',
        name = type === 'melodicMinor' && down ? 'minor' : names[type];
      const notes = Scale.get(`${string(p['tonic'])} ${name ?? ''}`).notes;
      expect(notes.length, c.id).toBeGreaterThan(0);
      const expected = down
        ? [notes[0], ...notes.slice(1).reverse(), notes[0]]
        : [...notes, notes[0]];
      const actual = array(c.expectedFacts['pitches']).map((v) => string(record(v)['id']));
      if (type === 'chromatic')
        expect(
          actual.map((p) => Note.chroma(p)),
          c.id,
        ).toEqual(expected.map((p) => Note.chroma(p ?? '')));
      else
        expect(
          actual.map((p) => Note.get(p).pc),
          c.id,
        ).toEqual(expected.map((p) => Note.get(p ?? '').pc));
    }
  });
  it('alle Vorzeichnungen stimmen mit tonal und der unabhängig notierten Reihenfolge', () => {
    const rows = ofTool('key_signature');
    expect(rows).toHaveLength(16);
    for (const c of rows) {
      const p = c.calls[0]?.input;
      if (!p) throw Error('Aufruf fehlt');
      const tonic = string(p['tonic']),
        fifths =
          p['mode'] === 'major' ? Key.majorKey(tonic).alteration : Key.minorKey(tonic).alteration;
      expect(c.expectedFacts['fifths'], c.id).toBe(fifths);
      const order =
        fifths >= 0
          ? ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#']
          : ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb'];
      expect(c.expectedFacts['accidentals'], c.id).toEqual(order.slice(0, Math.abs(fifths)));
    }
  });
  it('alle gebauten Dreiklänge stimmen in Schreibweise, Umkehrung und Basston-Oktave', () => {
    const suffix: Record<string, string> = {
      major: 'M',
      minor: 'm',
      diminished: 'dim',
      augmented: 'aug',
    };
    const rows = ofTool('build_chord');
    expect(rows).toHaveLength(16);
    for (const c of rows) {
      const p = c.calls[0]?.input;
      if (!p) throw Error('Aufruf fehlt');
      const notes = Chord.get(string(p['root']) + (suffix[string(p['type'])] ?? '')).notes;
      expect(notes).toHaveLength(3);
      const inversion = Number(p['inversion']),
        ordered = [...notes.slice(inversion), ...notes.slice(0, inversion)];
      const actual = array(c.expectedFacts['pitches']).map((v) => record(v));
      expect(
        actual.map((p) => Note.get(string(p['id'])).pc),
        c.id,
      ).toEqual(ordered);
      const bass = ordered[0];
      if (!bass) throw Error('Basston');
      expect(actual[0]?.['midi'], c.id).toBe(Note.midi(bass + String(p['bassOctave'])));
    }
  });
  it('alle erkannten Dreiklänge besitzen eine unabhängig bestätigte Grundton-Lesart', () => {
    const rows = ofTool('identify_chord');
    expect(rows).toHaveLength(16);
    for (const c of rows) {
      const p = c.calls[0]?.input;
      if (!p) throw Error('Aufruf fehlt');
      const matches = Chord.detect(array(p['pitches']).map(string)),
        roots = matches.map((label) => Chord.get(label).tonic);
      expect(matches.length, c.id).toBeGreaterThan(0);
      expect(
        array(c.expectedFacts['matches']).some((match) =>
          roots.includes(string(record(match)['rootId'])),
        ),
        c.id,
      ).toBe(true);
    }
  });
});
