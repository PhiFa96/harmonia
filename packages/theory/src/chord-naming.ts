// Benennung von Akkorden auf Deutsch und Englisch, dazu Akkordsymbole.

import type { Chord, ChordType } from './chord.ts';
import { chordBass, chordFactors } from './chord.ts';
import { germanName, internationalName } from './naming.ts';
import type { AccidentalStyle, NoteName } from './pitch.ts';
import { accidentalSymbol } from './pitch.ts';

const INVERSION_NAMES = {
  de: {
    3: ['Grundstellung', 'Sextakkord', 'Quartsextakkord'],
    4: ['Grundstellung', 'Quintsextakkord', 'Terzquartakkord', 'Sekundakkord'],
  },
  en: {
    3: ['root position', 'first inversion', 'second inversion'],
    4: ['root position', 'first inversion', 'second inversion', 'third inversion'],
  },
} as const;

/**
 * Name einer Umkehrung. Dreiklänge: Grundstellung, Sextakkord, Quartsextakkord.
 * Vierklänge: Grundstellung, Quintsextakkord, Terzquartakkord, Sekundakkord.
 */
export function inversionName(
  inversion: number,
  language: 'de' | 'en' = 'de',
  chordSize: 3 | 4 = 3,
): string {
  const name = INVERSION_NAMES[language][chordSize][inversion];
  if (name === undefined) {
    throw new RangeError(`Keine Umkehrung ${String(inversion)} bei ${String(chordSize)} Tönen`);
  }
  return name;
}

const GERMAN_QUALITY: Readonly<Record<'major' | 'minor' | 'diminished' | 'augmented', string>> = {
  major: 'Dur',
  minor: 'Moll',
  diminished: 'verminderter',
  augmented: 'übermäßiger',
};

const GERMAN_TRIAD_FORMS = ['Dreiklang', 'Sextakkord', 'Quartsextakkord'] as const;

export interface ChordNameOptions {
  readonly noteNaming?: 'de' | 'intl';
  readonly language?: 'de' | 'en';
}

/**
 * Ausgeschriebener Name.
 * Deutsch: „C-Dur-Dreiklang“, „a-Moll-Sextakkord“, „verminderter Dreiklang auf H als Quartsextakkord“.
 * Vermindert und übermäßig absichtlich nicht als „übermäßiger Sextakkord“: Das ist ein anderer Akkord
 * (mit übermäßiger Sexte).
 * Englisch: „C major triad“, „A minor triad, first inversion“.
 */
export function chordName(c: Chord, options: ChordNameOptions = {}): string {
  const size = chordFactors(c.type).length;
  const seventhOrNinth = size > 3;
  const typeNames: Readonly<
    Record<
      Exclude<ChordType, 'major' | 'minor' | 'diminished' | 'augmented'>,
      readonly [string, string]
    >
  > = {
    dominant7: ['Dominantseptakkord', 'dominant seventh chord'],
    major7: ['großer Septakkord', 'major seventh chord'],
    minor7: ['Mollseptakkord', 'minor seventh chord'],
    minorMajor7: ['Mollakkord mit großer Septime', 'minor-major seventh chord'],
    halfDiminished7: ['halbverminderter Septakkord', 'half-diminished seventh chord'],
    diminished7: ['verminderter Septakkord', 'diminished seventh chord'],
    augmented7: ['übermäßiger Septakkord', 'augmented seventh chord'],
    augmentedMajor7: ['übermäßiger Akkord mit großer Septime', 'augmented major seventh chord'],
    dominant9: ['Dominantnonakkord', 'dominant ninth chord'],
    major9: ['großer Nonakkord', 'major ninth chord'],
    minor9: ['Mollnonakkord', 'minor ninth chord'],
    dominant11: ['Dominantundezimakkord', 'dominant eleventh chord'],
    dominant13: ['Dominanttredezimakkord', 'dominant thirteenth chord'],
  };
  const quality = seventhOrNinth ? typeNames[c.type as keyof typeof typeNames] : undefined;
  const rootName =
    options.noteNaming === 'de'
      ? germanName(c.root.letter, c.root.alter)
      : internationalName(c.root.letter, c.root.alter);
  if (quality) {
    const base =
      options.language === 'en'
        ? `${rootName} ${quality[1]}`
        : `${quality[0]} auf ${options.noteNaming === 'intl' ? rootName : germanName(c.root.letter, c.root.alter)}`;
    if (c.inversion === 0) return base;
    const inversion =
      size === 4
        ? inversionName(c.inversion, options.language ?? 'de', 4)
        : options.language === 'en'
          ? `${String(c.inversion)}${ordinalSuffix(c.inversion)} inversion`
          : `${String(c.inversion)}. Umkehrung`;
    return options.language === 'en' ? `${base}, ${inversion}` : `${base} als ${inversion}`;
  }
  if (options.language === 'en') {
    const base = `${rootName} ${c.type} triad`;
    return c.inversion === 0 ? base : `${base}, ${inversionName(c.inversion, 'en', 3)}`;
  }
  const root =
    options.noteNaming === 'intl'
      ? internationalName(c.root.letter, c.root.alter)
      : germanName(c.root.letter, c.root.alter);
  const form = GERMAN_TRIAD_FORMS[c.inversion] ?? inversionName(c.inversion, 'de', 3);
  switch (c.type) {
    case 'major':
      return `${root}-${GERMAN_QUALITY.major}-${form}`;
    case 'minor':
      return `${root.toLowerCase()}-${GERMAN_QUALITY.minor}-${form}`;
    case 'diminished':
    case 'augmented': {
      const base = `${GERMAN_QUALITY[c.type]} Dreiklang auf ${root}`;
      return c.inversion === 0 ? base : `${base} als ${inversionName(c.inversion, 'de', 3)}`;
    }
    default:
      throw new RangeError(`Unbekannter Akkordtyp: ${c.type}`);
  }
}

function ordinalSuffix(value: number): string {
  return value === 1 ? 'st' : value === 2 ? 'nd' : value === 3 ? 'rd' : 'th';
}

export interface ChordSymbolOptions {
  /** `intl`: B und B♭ (Standard, wie in internationalen Leadsheets) · `de`: H und B */
  readonly system?: 'intl' | 'de';
  /** `symbol`: C, Cm, C°, C+ (Standard) · `text`: C, Cm, Cdim, Caug */
  readonly style?: 'symbol' | 'text';
  readonly accidentals?: AccidentalStyle;
  /** Umkehrung mit Schrägstrich und Basston anzeigen (C/E). Standard: ja. */
  readonly slashBass?: boolean;
}

const SUFFIXES: Readonly<Record<'symbol' | 'text', Readonly<Record<ChordType, string>>>> = {
  symbol: {
    major: '',
    minor: 'm',
    diminished: '°',
    augmented: '+',
    dominant7: '7',
    major7: 'maj7',
    minor7: 'm7',
    minorMajor7: 'm(maj7)',
    halfDiminished7: 'ø7',
    diminished7: '°7',
    augmented7: '+7',
    augmentedMajor7: '+maj7',
    dominant9: '9',
    major9: 'maj9',
    minor9: 'm9',
    dominant11: '11',
    dominant13: '13',
  },
  text: {
    major: '',
    minor: 'm',
    diminished: 'dim',
    augmented: 'aug',
    dominant7: '7',
    major7: 'maj7',
    minor7: 'm7',
    minorMajor7: 'm(maj7)',
    halfDiminished7: 'm7b5',
    diminished7: 'dim7',
    augmented7: 'aug7',
    augmentedMajor7: 'augmaj7',
    dominant9: '9',
    major9: 'maj9',
    minor9: 'm9',
    dominant11: '11',
    dominant13: '13',
  },
};

/** Akkordsymbol, z. B. „C“, „F♯m“, „B°“, „E♭+“, „C/E“ – mit `system: 'de'` „H°“, „B“ (= B♭), „G/H“. */
export function chordSymbol(c: Chord, options: ChordSymbolOptions = {}): string {
  const name = (n: NoteName): string => symbolRoot(n, options);
  const base = name(c.root) + SUFFIXES[options.style ?? 'symbol'][c.type];
  if (c.inversion === 0 || options.slashBass === false) {
    return base;
  }
  return `${base}/${name(chordBass(c))}`;
}

function symbolRoot(n: NoteName, options: ChordSymbolOptions): string {
  const accidentals = options.accidentals ?? 'unicode';
  if (options.system === 'de' && n.letter === 'B') {
    // Deutsch: H ist der Stammton, B das einfach erniedrigte H.
    return n.alter === -1 ? 'B' : `H${accidentalSymbol(n.alter, accidentals)}`;
  }
  return internationalName(n.letter, n.alter, accidentals);
}
