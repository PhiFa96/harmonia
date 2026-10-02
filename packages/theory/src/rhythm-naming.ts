// Namen von Noten- und Pausenwerten: Deutsch und Englisch, Englisch wahlweise US oder UK (F02).

import type { Duration, NoteValue, Tuplet } from './rhythm.ts';

export interface DurationNameOptions {
  readonly language?: 'de' | 'en';
  /** Nur für Englisch: US „quarter note“ (Standard) oder UK „crotchet“. */
  readonly variant?: 'us' | 'uk';
  /** Note (Standard) oder Pause. */
  readonly kind?: 'note' | 'rest';
}

/** Deutsch: Note und Pause. Ganze und Halbe sind Adjektive („halbe Note“), die übrigen zusammengesetzt („Viertelnote“). */
const GERMAN: Readonly<Record<NoteValue, { readonly note: string; readonly rest: string }>> = {
  breve: { note: 'doppelganze Note', rest: 'doppelganze Pause' },
  whole: { note: 'ganze Note', rest: 'ganze Pause' },
  half: { note: 'halbe Note', rest: 'halbe Pause' },
  quarter: { note: 'Viertelnote', rest: 'Viertelpause' },
  eighth: { note: 'Achtelnote', rest: 'Achtelpause' },
  sixteenth: { note: 'Sechzehntelnote', rest: 'Sechzehntelpause' },
  thirtySecond: { note: 'Zweiunddreißigstelnote', rest: 'Zweiunddreißigstelpause' },
  sixtyFourth: { note: 'Vierundsechzigstelnote', rest: 'Vierundsechzigstelpause' },
};

const US: Readonly<Record<NoteValue, string>> = {
  breve: 'double whole',
  whole: 'whole',
  half: 'half',
  quarter: 'quarter',
  eighth: 'eighth',
  sixteenth: 'sixteenth',
  thirtySecond: 'thirty-second',
  sixtyFourth: 'sixty-fourth',
};

const UK: Readonly<Record<NoteValue, string>> = {
  breve: 'breve',
  whole: 'semibreve',
  half: 'minim',
  quarter: 'crotchet',
  eighth: 'quaver',
  sixteenth: 'semiquaver',
  thirtySecond: 'demisemiquaver',
  sixtyFourth: 'hemidemisemiquaver',
};

const GERMAN_DOTS = ['', 'punktierte ', 'doppelt punktierte ', 'dreifach punktierte '];
const ENGLISH_DOTS = ['', 'dotted ', 'double-dotted ', 'triple-dotted '];

const GERMAN_TUPLETS: Readonly<Record<number, string>> = {
  2: 'Duole',
  3: 'Triole',
  4: 'Quartole',
  5: 'Quintole',
  6: 'Sextole',
  7: 'Septole',
};

const ENGLISH_TUPLETS: Readonly<Record<number, string>> = {
  2: 'duplet',
  3: 'triplet',
  4: 'quadruplet',
  5: 'quintuplet',
  6: 'sextuplet',
  7: 'septuplet',
};

/**
 * Name eines Noten- oder Pausenwerts.
 * Deutsch: „punktierte Viertelnote“, „halbe Pause“, „Achtelnote (Triole)“.
 * Englisch US: „dotted quarter note“, „half rest“, „triplet eighth note“; UK: „dotted crotchet“, „minim rest“, „triplet quaver“.
 */
export function durationName(d: Duration, options: DurationNameOptions = {}): string {
  const kind = options.kind ?? 'note';
  if (options.language === 'en') {
    const tuplet = d.tuplet ? `${englishTuplet(d.tuplet)} ` : '';
    const base =
      options.variant === 'uk'
        ? `${UK[d.value]}${kind === 'rest' ? ' rest' : ''}`
        : `${US[d.value]} ${kind}`;
    return `${ENGLISH_DOTS[d.dots] ?? ''}${tuplet}${base}`;
  }
  const base = `${GERMAN_DOTS[d.dots] ?? ''}${GERMAN[d.value][kind]}`;
  return d.tuplet ? `${base} (${germanTuplet(d.tuplet)})` : base;
}

function germanTuplet(t: Tuplet): string {
  return tupletLabel(t, GERMAN_TUPLETS[t.actual], (ratio) => `N-tole ${ratio}`);
}

function englishTuplet(t: Tuplet): string {
  return tupletLabel(t, ENGLISH_TUPLETS[t.actual], (ratio) => `${ratio} tuplet`);
}

/** Übliche Namen gelten für das gewohnte Verhältnis (Triole 3:2 …); sonst wird das Verhältnis angehängt. */
function tupletLabel(
  t: Tuplet,
  name: string | undefined,
  generic: (ratio: string) => string,
): string {
  const ratio = `${String(t.actual)}:${String(t.normal)}`;
  if (name === undefined) {
    return generic(ratio);
  }
  return t.normal === usualNormal(t.actual) ? name : `${name} ${ratio}`;
}

/** Gewohntes Verhältnis: Duole 2:3, Triole 3:2, Quartole 4:3, Quintole 5:4, Sextole 6:4, Septole 7:4. */
function usualNormal(actual: number): number {
  switch (actual) {
    case 2:
      return 3;
    case 3:
      return 2;
    case 4:
      return 3;
    default:
      return 4;
  }
}
