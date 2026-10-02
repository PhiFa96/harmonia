// Namen von Intervallen auf Deutsch und Englisch, lang („große Terz“) und kurz („gr. 3“ / „M3“).

import type { Interval, Quality } from './interval.ts';
import { simplify } from './interval.ts';

export type IntervalLanguage = 'de' | 'en';
export type IntervalNameStyle = 'long' | 'short';

export interface IntervalNameOptions {
  readonly language?: IntervalLanguage;
  readonly style?: IntervalNameStyle;
  /** Richtung „abwärts“ / „descending“ anhängen, wenn das Intervall abwärts geht (Standard: ja). */
  readonly showDirection?: boolean;
}

// Alle deutschen Intervallnamen sind feminin → Adjektiv-Endung „-e“.
const GERMAN_QUALITY: Readonly<Record<Quality, string>> = {
  dd: 'doppelt verminderte',
  d: 'verminderte',
  m: 'kleine',
  M: 'große',
  P: 'reine',
  A: 'übermäßige',
  AA: 'doppelt übermäßige',
};

const GERMAN_QUALITY_SHORT: Readonly<Record<Quality, string>> = {
  dd: 'dopp. verm.',
  d: 'verm.',
  m: 'kl.',
  M: 'gr.',
  P: 'r.',
  A: 'üb.',
  AA: 'dopp. üb.',
};

const ENGLISH_QUALITY: Readonly<Record<Quality, string>> = {
  dd: 'doubly diminished',
  d: 'diminished',
  m: 'minor',
  M: 'major',
  P: 'perfect',
  A: 'augmented',
  AA: 'doubly augmented',
};

/** Index = Intervallgröße − 1 (Prime bis Doppeloktave). */
const GERMAN_NUMBERS = [
  'Prime',
  'Sekunde',
  'Terz',
  'Quarte',
  'Quinte',
  'Sexte',
  'Septime',
  'Oktave',
  'None',
  'Dezime',
  'Undezime',
  'Duodezime',
  'Tredezime',
  'Quartdezime',
  'Quintdezime',
] as const;

const ENGLISH_NUMBERS = [
  'unison',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'octave',
  'ninth',
  'tenth',
  'eleventh',
  'twelfth',
  'thirteenth',
  'fourteenth',
  'fifteenth',
] as const;

/**
 * Name eines Intervalls.
 * Lang: „große Terz“, „übermäßige Quarte abwärts“ / „major third“, „descending augmented fourth“.
 * Kurz: „gr. 3“, „üb. 4 ↓“ / „M3“, „A4 ↓“.
 * Größer als die Doppeloktave: „große Terz + 2 Oktaven“ / „major third + 2 octaves“.
 */
export function intervalName(i: Interval, options: IntervalNameOptions = {}): string {
  const language = options.language ?? 'de';
  const style = options.style ?? 'long';
  const descending = i.direction < 0 && (options.showDirection ?? true);

  if (style === 'short') {
    const base =
      language === 'de'
        ? `${GERMAN_QUALITY_SHORT[i.quality]} ${String(i.number)}`
        : `${i.quality}${String(i.number)}`;
    return descending ? `${base} ↓` : base;
  }

  const base = longName(i, language);
  if (!descending) {
    return base;
  }
  return language === 'de' ? `${base} abwärts` : `descending ${base}`;
}

function longName(i: Interval, language: IntervalLanguage): string {
  const numbers = language === 'de' ? GERMAN_NUMBERS : ENGLISH_NUMBERS;
  const qualities = language === 'de' ? GERMAN_QUALITY : ENGLISH_QUALITY;
  const numberName = numbers[i.number - 1];
  if (numberName !== undefined) {
    return `${qualities[i.quality]} ${numberName}`;
  }
  // Jenseits der Doppeloktave: einfacher Anteil plus Oktaven
  const simple = simplify(i);
  const octaves = (i.number - simple.number) / 7;
  const simpleName = longName({ ...simple, direction: 1 }, language);
  return language === 'de'
    ? `${simpleName} + ${String(octaves)} Oktaven`
    : `${simpleName} + ${String(octaves)} octaves`;
}
