import {
  duration,
  formatPitch,
  key,
  parseNoteName,
  timeSignature,
  TRIPLET,
} from '@harmonia/theory';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { Score, VoiceEvent } from './score.ts';
import { keySignature, note, singleStaffScore } from './score.ts';
import { formatScore, parseScore } from './shorthand.ts';
import { scoreArbitrary } from './testing/arbitraries.ts';

/** Erstes System. */
const staff = (text: string) => {
  const [first] = parseScore(text).staves;
  if (!first) {
    throw new Error('kein System');
  }
  return first;
};

/** Ereignisse der ersten Stimme eines Takts als Kurzform. */
const events = (text: string, measure = 0): string[] =>
  (staff(text).measures[measure]?.voices[0]?.events ?? []).map(show);

function show(e: VoiceEvent): string {
  const d = `${e.duration.value}${'.'.repeat(e.duration.dots)}`;
  switch (e.kind) {
    case 'note':
      return `note ${formatPitch(e.pitch)} ${d}${e.tie ? ' tie' : ''}`;
    case 'rest':
      return `rest ${d}`;
    case 'chord':
      return `chord ${e.notes.map((n) => formatPitch(n.pitch) + (n.tie ? '~' : '')).join(' ')} ${d}`;
  }
}

describe('Lesen', () => {
  it('Beispiel aus dem Plan', () => {
    const s = staff('treble | 4/4 | C4/4 E4/4 G4/2');
    expect(s.clef).toBe('treble');
    expect(s.timeSignature).toEqual(timeSignature(4, 4));
    expect(s.keySignature).toEqual({ fifths: 0 });
    expect(events('treble | 4/4 | C4/4 E4/4 G4/2')).toEqual([
      'note C4 quarter',
      'note E4 quarter',
      'note G4 half',
    ]);
  });

  it('Standardwerte ohne Angaben', () => {
    const s = staff('C4/1');
    expect([s.clef, s.timeSignature, s.keySignature]).toEqual([
      'treble',
      timeSignature(4, 4),
      { fifths: 0 },
    ]);
  });

  it('Angaben in beliebiger Reihenfolge, auch in einem Abschnitt', () => {
    const s = staff('3/4 bass key:G | G2/2.');
    expect([s.clef, s.timeSignature.numerator, s.keySignature.fifths]).toEqual(['bass', 3, 1]);
  });

  it.each([
    ['key:Eb', -3, 'E', -1, 'major'],
    ['key:c', -3, 'C', 0, 'minor'],
    ['key:f#', 3, 'F', 1, 'minor'],
    ['key:bb', -5, 'B', -1, 'minor'],
    ['key:b', 2, 'B', 0, 'minor'],
    ['key:B', 5, 'B', 0, 'major'],
    ['key:C#', 7, 'C', 1, 'major'],
  ] as const)('Vorzeichnung %s', (text, fifths, letter, alter, mode) => {
    expect(staff(`${text} | C4/1`).keySignature).toEqual({
      fifths,
      key: key({ letter, alter }, mode),
    });
  });

  it.each([
    ['key:3b', -3],
    ['key:2#', 2],
    ['key:0', 0],
    ['key:7#', 7],
  ])('Vorzeichenzahl %s', (text, fifths) => {
    expect(staff(`${text} | C4/1`).keySignature).toEqual({ fifths });
  });

  it.each(['key:3', 'key:8#', 'key:H', 'key:G#', 'key:x', 'key:Ebb#'])(
    'ungültige Vorzeichnung %s',
    (text) => {
      expect(() => parseScore(`${text} | C4/1`)).toThrow(SyntaxError);
    },
  );

  it('Taktarten mit Gruppierung', () => {
    expect(staff('3+2+2/8 | C4/4. D4/4 E4/4').timeSignature.grouping).toEqual([3, 2, 2]);
    expect(staff('6/8 | C4/4.').timeSignature.grouping).toEqual([3, 3]);
    expect(() => parseScore('8/8 | C4/1')).toThrow(SyntaxError);
    expect(staff('3+3+2/8 | C4/1').timeSignature).toEqual(timeSignature(8, 8, [3, 3, 2]));
  });

  it('Notenwerte, Punkte, Pausen, Akkorde', () => {
    expect(events('C4/breve D4/1 E4/2. F4/4.. G4/8... A4/64 r/16 r/2.')).toEqual([
      'note C4 breve',
      'note D4 whole',
      'note E4 half.',
      'note F4 quarter..',
      'note G4 eighth...',
      'note A4 sixtyFourth',
      'rest sixteenth',
      'rest half.',
    ]);
    expect(events('(C4 E4 G4)/2 ( F#4  Bb4 )/4.')).toEqual([
      'chord C4 E4 G4 half',
      'chord F#4 Bb4 quarter.',
    ]);
  });

  it('Vorzeichen in allen Schreibweisen', () => {
    expect(events('C#4/4 Bb3/4 F##4/4 Ebb4/4 F♯4/4 Cx5/4')).toEqual([
      'note C#4 quarter',
      'note Bb3 quarter',
      'note F##4 quarter',
      'note Ebb4 quarter',
      'note F#4 quarter',
      'note C##5 quarter',
    ]);
  });

  it('Haltebögen an Noten, einzelnen Akkordtönen und ganzen Akkorden', () => {
    expect(events('C4/2~ C4/2 | (C4~ E4)/2 (C4 E4)/2~')).toEqual([
      'note C4 half tie',
      'note C4 half',
    ]);
    expect(events('C4/2~ C4/2 | (C4~ E4)/2 (C4 E4)/2~', 1)).toEqual([
      'chord C4~ E4 half',
      'chord C4~ E4~ half',
    ]);
  });

  it('Wechsel zwischen Takten gelten ab dem nächsten Takt', () => {
    const s = staff('treble | 4/4 | C4/1 | bass 3/4 | C3/2. | key:0 | C3/2.');
    expect(s.measures[0]?.changes).toBeUndefined();
    expect(s.measures[1]?.changes).toEqual({ clef: 'bass', timeSignature: timeSignature(3, 4) });
    expect(s.measures[2]?.changes).toEqual({ keySignature: { fifths: 0 } });
  });

  it('mehrere Stimmen und Systeme', () => {
    const score = parseScore('treble | 4/4 | C5/1 & E4/2 G4/2\nbass | 4/4 | C3/1');
    expect(score.staves).toHaveLength(2);
    expect(score.staves[0]?.measures[0]?.voices).toHaveLength(2);
    expect(score.staves[1]?.clef).toBe('bass');
  });

  it('abschließender Taktstrich ist erlaubt', () => {
    expect(staff('C4/1 | D4/1 |').measures).toHaveLength(2);
  });

  it.each([
    ['', 'Leere'],
    ['C4', 'Dauer fehlt'],
    ['/4', 'Dauer fehlt'],
    ['C4/3', 'unbekannter Notenwert'],
    ['C4/4....', 'Punkte'],
    ['C4/4x', 'ungültige Dauer'],
    ['r/4~', 'Pausen'],
    ['(C4)/4', 'mindestens zwei'],
    ['(C4 C4)/4', 'doppelt'],
    ['H4/4', 'Tonhöhe'],
    ['C4/1 || D4/1', 'leer'],
    ['treble C4/1', 'gemischt'],
    ['C4/1 | bass', 'am Ende'],
    ['treble | bass | C4/1', 'Schlüssel doppelt'],
    ['C4/1 & ', 'leer'],
  ])('Fehler: „%s“ (%s)', (text, reason) => {
    expect(() => parseScore(text)).toThrow(SyntaxError);
    expect(() => parseScore(text)).toThrow(new RegExp(reason, 'i'));
  });

  it('Fehlermeldung nennt die Stelle', () => {
    expect(() => parseScore('treble | 4/4 | C4/4 E4/4 G4/2 | C4/5')).toThrow(/Abschnitt 4/);
    expect(() => parseScore('C4/1\nD4/7')).toThrow(/System 2: Abschnitt 1/);
  });
});

describe('Schreiben', () => {
  it('kanonische Form', () => {
    expect(formatScore(parseScore('C4/4 E4/4 G4/2'))).toBe('treble | 4/4 | C4/4 E4/4 G4/2');
    expect(formatScore(parseScore('(C4 E4)/2~ (C4 E4)/2'))).toBe(
      'treble | 4/4 | (C4~ E4~)/2 (C4 E4)/2',
    );
    expect(formatScore(parseScore('3/4 key:c bass | C3/2.'))).toBe('bass | key:c | 3/4 | C3/2.');
    expect(formatScore(parseScore('3+2+2/8 | C4/4. D4/4 E4/4'))).toBe(
      'treble | 3+2+2/8 | C4/4. D4/4 E4/4',
    );
    expect(formatScore(parseScore('C4/1 | key:0 | C4/1'))).toBe(
      'treble | 4/4 | C4/1 | key:0 | C4/1',
    );
  });

  it('aus Bausteinen', () => {
    const score: Score = singleStaffScore(
      [
        [
          note(parseNoteNamePitch('F#', 4), duration('half', 1)),
          note(parseNoteNamePitch('E', 4), duration('quarter')),
        ],
      ],
      { keySignature: keySignature(key(parseNoteName('D'))), timeSignature: timeSignature(3, 4) },
    );
    expect(formatScore(score)).toBe('treble | key:D | 3/4 | F#4/2. E4/4');
  });

  it('Wechsel im ersten Takt gehören ins System', () => {
    const base = singleStaffScore([[note(parseNoteNamePitch('C', 4), duration('whole'))]]);
    const [first] = base.staves;
    if (!first?.measures[0]) {
      throw new Error('kein Takt');
    }
    const score: Score = {
      staves: [{ ...first, measures: [{ ...first.measures[0], changes: { clef: 'bass' } }] }],
    };
    expect(() => formatScore(score)).toThrow(RangeError);
  });

  it('andere N-tolen als Achteltriolen bleiben außerhalb der Kurzschreibweise', () => {
    const score = singleStaffScore([
      [note(parseNoteNamePitch('C', 4), duration('quarter', 0, TRIPLET))],
    ]);
    expect(() => formatScore(score)).toThrow(RangeError);
  });

  it('Rundreise: Schreiben und Lesen ergeben dieselbe Partitur', () => {
    fc.assert(
      fc.property(scoreArbitrary, (score) => {
        expect(parseScore(formatScore(score))).toEqual(score);
      }),
      { numRuns: 300 },
    );
  });

  it('Rundreise: Lesen und Schreiben sind stabil', () => {
    fc.assert(
      fc.property(scoreArbitrary, (score) => {
        const text = formatScore(score);
        expect(formatScore(parseScore(text))).toBe(text);
      }),
    );
  });
});

function parseNoteNamePitch(name: string, octave: number) {
  const n = parseNoteName(name);
  return { letter: n.letter, alter: n.alter, octave };
}
