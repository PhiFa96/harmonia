// Benennung von Tonhöhen auf Deutsch und international.
// Das Datenmodell bleibt sprachneutral (siehe pitch.ts); hier entsteht nur die Anzeige.

import type { AccidentalStyle, Letter, Pitch } from './pitch.ts';
import { accidentalSymbol, isValidAlter } from './pitch.ts';

/** `de`: H/B, -is/-es · `intl`: B/B♭, ♯/♭ */
export type NamingSystem = 'de' | 'intl';

/**
 * `none`: ohne Oktave („Fis“) · `scientific`: „Fis4“ / „F♯4“ ·
 * `helmholtz`: Groß-/Kleinschreibung mit Hoch- bzw. Tiefzahlen („fis¹“, „H“, „C₁“)
 */
export type OctaveStyle = 'none' | 'scientific' | 'helmholtz';

export interface PitchNameOptions {
  readonly system?: NamingSystem;
  readonly octave?: OctaveStyle;
  /** Nur für `intl`: Unicode-Zeichen (♯ ♭ 𝄪 𝄫) oder ASCII (# b ## bb). */
  readonly accidentals?: AccidentalStyle;
}

const GERMAN_NATURAL: Readonly<Record<Letter, string>> = {
  C: 'C',
  D: 'D',
  E: 'E',
  F: 'F',
  G: 'G',
  A: 'A',
  B: 'H',
};

/** Deutsche Namen mit b-Vorzeichen; Index 0 = einfaches b, 1 = Doppel-b. Ausnahmen: Es, As, B, Heses. */
const GERMAN_FLATS: Readonly<Record<Letter, readonly [string, string]>> = {
  C: ['Ces', 'Ceses'],
  D: ['Des', 'Deses'],
  E: ['Es', 'Eses'],
  F: ['Fes', 'Feses'],
  G: ['Ges', 'Geses'],
  A: ['As', 'Asas'],
  B: ['B', 'Heses'],
};

/** Deutscher Name ohne Oktave, z. B. „Fis“, „Es“, „B“, „H“, „Cisis“, „Heses“. */
export function germanName(letter: Letter, alter: number): string {
  if (!isValidAlter(alter)) {
    throw new RangeError(`Vorzeichen außerhalb von -2…2: ${String(alter)}`);
  }
  if (alter >= 0) {
    return GERMAN_NATURAL[letter] + 'is'.repeat(alter);
  }
  return GERMAN_FLATS[letter][-alter - 1] ?? '';
}

/** Internationaler Name ohne Oktave, z. B. „F♯“, „B♭“, „C𝄪“ (oder ASCII „F#“, „Bb“, „C##“). */
export function internationalName(
  letter: Letter,
  alter: number,
  style: AccidentalStyle = 'unicode',
): string {
  return letter + accidentalSymbol(alter, style);
}

/** Name einer Tonhöhe nach gewähltem System und Oktavschreibweise. */
export function pitchName(p: Pitch, options: PitchNameOptions = {}): string {
  const system = options.system ?? 'intl';
  const octaveStyle = options.octave ?? 'scientific';
  const base =
    system === 'de'
      ? germanName(p.letter, p.alter)
      : internationalName(p.letter, p.alter, options.accidentals ?? 'unicode');

  switch (octaveStyle) {
    case 'none':
      return base;
    case 'scientific':
      return base + String(p.octave);
    case 'helmholtz':
      return helmholtz(base, p.octave);
  }
}

/**
 * Helmholtz-Schreibweise:
 * - ab der kleinen Oktave (C3) klein geschrieben, ab der eingestrichenen (C4) mit Hochzahl: c, c¹, c², c³, c⁴
 * - große Oktave (C2) groß ohne Zeichen: C, H; darunter mit tiefgestellter Zahl: C₁ (Kontra), C₂ (Subkontra)
 */
function helmholtz(base: string, octave: number): string {
  if (octave >= 3) {
    return base.toLowerCase() + superscript(octave - 3);
  }
  return base + subscript(2 - octave);
}

const SUPERSCRIPT_DIGITS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

function superscript(value: number): string {
  if (value === 0) {
    return '';
  }
  return String(value).replace(/\d/g, (digit) => SUPERSCRIPT_DIGITS[Number(digit)] ?? digit);
}

const SUBSCRIPT_DIGITS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

function subscript(value: number): string {
  if (value === 0) {
    return '';
  }
  return String(value).replace(/\d/g, (digit) => SUBSCRIPT_DIGITS[Number(digit)] ?? digit);
}

// ---------------------------------------------------------------------------
// Gesprochene Namen (Screenreader)

/** Deutsche Oktavbezeichnungen nach wissenschaftlicher Oktave (Tonnamen sind sächlich: „das c“). */
const GERMAN_OCTAVES: Readonly<Record<number, string>> = {
  0: 'Subkontra-',
  1: 'Kontra-',
  2: 'großes ',
  3: 'kleines ',
  4: 'eingestrichenes ',
  5: 'zweigestrichenes ',
  6: 'dreigestrichenes ',
  7: 'viergestrichenes ',
  8: 'fünfgestrichenes ',
};

const ENGLISH_ACCIDENTALS: Readonly<Record<number, string>> = {
  [-2]: ' double flat',
  [-1]: ' flat',
  0: '',
  1: ' sharp',
  2: ' double sharp',
};

/**
 * Ausgeschriebener Name zum Vorlesen.
 * Deutsch: „eingestrichenes c“, „kleines fis“, „großes H“, „Kontra-Es“ (außerhalb Subkontra bis fünfgestrichen: „Fis9“).
 * Englisch: „C 4“, „F sharp 3“, „B flat 2“.
 */
export function spokenPitchName(p: Pitch, language: 'de' | 'en' = 'de'): string {
  if (language === 'en') {
    return `${p.letter}${ENGLISH_ACCIDENTALS[p.alter] ?? ''} ${String(p.octave)}`;
  }
  const name = germanName(p.letter, p.alter);
  const octave = GERMAN_OCTAVES[p.octave];
  if (octave === undefined) {
    return `${name}${String(p.octave)}`;
  }
  return octave + (p.octave >= 3 ? name.toLowerCase() : name);
}
