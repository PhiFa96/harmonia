import { describe, expect, it } from 'vitest';
import { chord, chordPitches, identifyChord, identifyChordFromMidi } from './chord.ts';
import { chordName, chordSymbol } from './chord-naming.ts';
import {
  analyzeHarmony,
  classifyCadence,
  diatonicSevenths,
  findPivotModulation,
} from './harmony.ts';
import { ALL_KEYS, diatonicTriads, key } from './key.ts';
import { formatNoteName, formatPitch, parseNoteName, parsePitch } from './pitch.ts';

const c = (root: string, type: Parameters<typeof chord>[1], inversion = 0) =>
  chord(parseNoteName(root), type, inversion);
const k = (root: string, mode: 'major' | 'minor' = 'major') => key(parseNoteName(root), mode);

describe('Septakkorde und Erweiterungen', () => {
  it.each([
    ['dominant7', 'C E G Bb', 'C7'],
    ['major7', 'C E G B', 'Cmaj7'],
    ['minor7', 'C Eb G Bb', 'Cm7'],
    ['minorMajor7', 'C Eb G B', 'Cm(maj7)'],
    ['halfDiminished7', 'C Eb Gb Bb', 'Cø7'],
    ['diminished7', 'C Eb Gb Bbb', 'C°7'],
    ['augmented7', 'C E G# Bb', 'C+7'],
    ['augmentedMajor7', 'C E G# B', 'C+maj7'],
    ['dominant9', 'C E G Bb D', 'C9'],
    ['major9', 'C E G B D', 'Cmaj9'],
    ['minor9', 'C Eb G Bb D', 'Cm9'],
    ['dominant11', 'C E G Bb D F', 'C11'],
    ['dominant13', 'C E G Bb D F A', 'C13'],
  ] as const)('%s: Töne und Symbol', (type, notes, symbol) => {
    expect(
      chordPitches(c('C', type))
        .map((p) => formatNoteName(p))
        .join(' '),
    ).toBe(notes);
    expect(chordSymbol(c('C', type))).toBe(symbol);
  });

  it('bestimmt dritte und vierte Umkehrung mit Schreibweise', () => {
    expect(chordPitches(c('G', 'dominant7', 3)).map((p) => formatPitch(p))).toEqual([
      'F4',
      'G4',
      'B4',
      'D5',
    ]);
    expect(
      identifyChord(['F4', 'G4', 'B4', 'D5'].map(parsePitch), { extended: true })[0]?.chord,
    ).toEqual(c('G', 'dominant7', 3));
    expect(chordPitches(c('C', 'dominant9', 4)).map((p) => formatPitch(p))).toEqual([
      'D4',
      'C5',
      'E5',
      'G5',
      'Bb5',
    ]);
    expect(chordName(c('G', 'dominant7', 3))).toContain('Sekundakkord');
    expect(chordSymbol(c('G', 'dominant7', 3))).toBe('G7/F');
  });

  it('beschränkt bisherige Dreiklang-Erkennung standardmäßig', () => {
    const pitches = ['C4', 'E4', 'G4', 'Bb4'].map(parsePitch);
    expect(identifyChord(pitches)).toEqual([]);
    expect(identifyChord(pitches, { extended: true })[0]?.chord.type).toBe('dominant7');
    expect(identifyChordFromMidi([60, 64, 67, 70], { extended: true })[0]?.chord.type).toBe(
      'dominant7',
    );
  });
});

describe('Harmonik', () => {
  it('bildet die diatonischen Vierklänge von C-Dur und a-Moll harmonisch', () => {
    expect(diatonicSevenths(k('C')).map((d) => d.chord.type)).toEqual([
      'major7',
      'minor7',
      'minor7',
      'major7',
      'dominant7',
      'minor7',
      'halfDiminished7',
    ]);
    expect(
      diatonicSevenths(k('A', 'minor'), { minorForm: 'harmonic' }).map((d) => d.chord.type),
    ).toEqual([
      'minorMajor7',
      'halfDiminished7',
      'augmentedMajor7',
      'minor7',
      'dominant7',
      'major7',
      'diminished7',
    ]);
  });

  it('bildet alle 30 gebräuchlichen Tonarten in ihren Mollformen', () => {
    for (const tonalKey of ALL_KEYS) {
      for (const minorForm of tonalKey.mode === 'major'
        ? (['natural'] as const)
        : (['natural', 'harmonic', 'melodic'] as const)) {
        expect(
          diatonicSevenths(tonalKey, { minorForm }),
          `${tonalKey.tonic.letter} ${tonalKey.mode} ${minorForm}`,
        ).toHaveLength(7);
      }
    }
  });

  it('analysiert Stufe, Funktion, Zwischendominante und Neapolitaner', () => {
    expect(analyzeHarmony(c('C', 'major7'), k('C'))[0]?.roman).toBe('Imaj7');
    expect(analyzeHarmony(c('G', 'dominant7'), k('C'))[0]).toMatchObject({
      degree: 5,
      roman: 'V7',
      functionSymbol: 'D7',
    });
    expect(
      analyzeHarmony(c('A', 'dominant7'), k('C')).find((a) => a.role === 'secondary-dominant'),
    ).toMatchObject({ targetDegree: 2, roman: 'V7/II' });
    expect(
      analyzeHarmony(c('Db', 'major'), k('C')).find((a) => a.role === 'neapolitan'),
    ).toMatchObject({ roman: '♭II', functionSymbol: 'N' });
  });

  it('erkennt in melodischem a-Moll die Dreiklänge der aufwärts geführten Leiter', () => {
    const a = k('A', 'minor');
    const expected: readonly [string, Parameters<typeof chord>[1], number, string][] = [
      ['A', 'minor', 1, 'i'],
      ['B', 'minor', 2, 'ii'],
      ['C', 'augmented', 3, 'III+'],
      ['D', 'major', 4, 'IV'],
      ['E', 'major', 5, 'V'],
      ['F#', 'diminished', 6, 'vi°'],
      ['G#', 'diminished', 7, 'vii°'],
    ];
    for (const [root, type, degree, roman] of expected) {
      expect(
        analyzeHarmony(c(root, type), a, { minorForm: 'melodic' }).find((x) => x.degree === degree),
        `${root} ${String(type)}`,
      ).toMatchObject({ roman });
    }
    // In natürlichem Moll bleibt Fis° unbekannt, Septakkorde weiter richtig.
    expect(analyzeHarmony(c('F#', 'diminished'), a, { minorForm: 'natural' })).toEqual([]);
  });

  it('erkennt in allen Tonarten und Mollformen jeden leitereigenen Dreiklang auf seiner Stufe', () => {
    for (const tonalKey of ALL_KEYS) {
      for (const minorForm of tonalKey.mode === 'major'
        ? (['natural'] as const)
        : (['natural', 'harmonic', 'melodic'] as const)) {
        for (const triad of diatonicTriads(tonalKey, { minorForm })) {
          expect(
            analyzeHarmony(triad.chord, tonalKey, { minorForm }).some(
              (found) => found.degree === triad.degree && found.role !== 'secondary-dominant',
            ),
            `${tonalKey.tonic.letter}${String(tonalKey.tonic.alter)} ${tonalKey.mode} ${minorForm} Stufe ${String(triad.degree)}`,
          ).toBe(true);
        }
      }
    }
  });

  it('klassifiziert Kadenzschlüsse und belegt einen Tonartwechsel mit Pivot und V–I', () => {
    expect(classifyCadence([c('G', 'dominant7'), c('C', 'major')], k('C'))).toBe('authentic');
    expect(classifyCadence([c('F', 'major'), c('C', 'major')], k('C'))).toBe('plagal');
    expect(classifyCadence([c('G', 'major'), c('A', 'minor')], k('C'))).toBe('deceptive');
    expect(classifyCadence([c('C', 'major'), c('G', 'major')], k('C'))).toBe('half');
    expect(
      findPivotModulation([c('A', 'minor'), c('D', 'dominant7'), c('G', 'major')], k('C'), k('G')),
    ).toMatchObject({ pivotIndex: 0, fromDegree: 6, toDegree: 2 });
    expect(
      findPivotModulation([c('A', 'minor'), c('D', 'dominant7')], k('C'), k('G')),
    ).toBeUndefined();
    // Der Neapolitaner ist kein diatonischer Pivot (♭II in C, aber nicht diatonisch in As).
    expect(
      findPivotModulation(
        [c('Db', 'major'), c('Eb', 'dominant7'), c('Ab', 'major')],
        k('C'),
        k('Ab'),
      ),
    ).toBeUndefined();
    // F ist IV in C-Dur und III (natürliches Moll) in d-Moll.
    expect(
      findPivotModulation(
        [c('F', 'major'), c('A', 'dominant7'), c('D', 'minor')],
        k('C'),
        k('D', 'minor'),
      ),
    ).toMatchObject({ pivotIndex: 0, fromDegree: 4, toDegree: 3 });
  });
});
