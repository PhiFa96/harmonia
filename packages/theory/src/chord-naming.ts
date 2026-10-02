// Benennung von Akkorden auf Deutsch und Englisch, dazu Akkordsymbole (F04, Stand: Dreiklänge).

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

const GERMAN_QUALITY: Readonly<Record<ChordType, string>> = {
  major: 'Dur',
  minor: 'Moll',
  diminished: 'verminderter',
  augmented: 'übermäßiger',
};

const GERMAN_TRIAD_FORMS = ['Dreiklang', 'Sextakkord', 'Quartsextakkord'] as const;

export interface ChordNameOptions {
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
  const size = chordFactors(c.type).length === 4 ? 4 : 3;
  if (options.language === 'en') {
    const base = `${internationalName(c.root.letter, c.root.alter)} ${c.type} triad`;
    return c.inversion === 0 ? base : `${base}, ${inversionName(c.inversion, 'en', size)}`;
  }
  const root = germanName(c.root.letter, c.root.alter);
  const form = GERMAN_TRIAD_FORMS[c.inversion] ?? inversionName(c.inversion, 'de', size);
  switch (c.type) {
    case 'major':
      return `${root}-${GERMAN_QUALITY.major}-${form}`;
    case 'minor':
      return `${root.toLowerCase()}-${GERMAN_QUALITY.minor}-${form}`;
    case 'diminished':
    case 'augmented': {
      const base = `${GERMAN_QUALITY[c.type]} Dreiklang auf ${root}`;
      return c.inversion === 0 ? base : `${base} als ${inversionName(c.inversion, 'de', size)}`;
    }
  }
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
  symbol: { major: '', minor: 'm', diminished: '°', augmented: '+' },
  text: { major: '', minor: 'm', diminished: 'dim', augmented: 'aug' },
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
