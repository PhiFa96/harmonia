// Tonhöhen mit vollständiger Schreibweise (Stammton + Vorzeichen + Oktave).
// Oktaven in wissenschaftlicher Notation: C4 = eingestrichenes c (c¹), A4 = 440 Hz.

export type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

/** Stammtöne in diatonischer Reihenfolge (intern englische Buchstaben). */
export const LETTERS: readonly Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/** Kleinstes und größtes unterstütztes Vorzeichen: Doppel-b bis Doppelkreuz. */
export const MIN_ALTER = -2;
export const MAX_ALTER = 2;

const NATURAL_SEMITONES: Readonly<Record<Letter, number>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** Ton ohne Oktave (Stammton + Vorzeichen), z. B. Grundton einer Tonart. Jede `Pitch` ist auch ein `NoteName`. */
export interface NoteName {
  readonly letter: Letter;
  /** -2 = Doppel-b, -1 = b, 0 = ohne, +1 = Kreuz, +2 = Doppelkreuz */
  readonly alter: number;
}

export interface Pitch extends NoteName {
  /** Oktave in wissenschaftlicher Notation (C4 = c¹) */
  readonly octave: number;
}

export function isValidAlter(alter: number): boolean {
  return Number.isInteger(alter) && alter >= MIN_ALTER && alter <= MAX_ALTER;
}

/** Erzeugt einen geprüften Ton ohne Oktave. Wirft einen RangeError bei ungültigen Werten. */
export function noteName(letter: Letter, alter = 0): NoteName {
  if (!LETTERS.includes(letter)) {
    throw new RangeError(`Unbekannter Stammton: ${letter}`);
  }
  if (!isValidAlter(alter)) {
    throw new RangeError(
      `Vorzeichen außerhalb von ${String(MIN_ALTER)}…${String(MAX_ALTER)}: ${String(alter)}`,
    );
  }
  return { letter, alter };
}

/** Erzeugt eine geprüfte Tonhöhe. Wirft einen RangeError bei ungültigen Werten. */
export function pitch(letter: Letter, alter = 0, octave = 4): Pitch {
  noteName(letter, alter);
  if (!Number.isInteger(octave)) {
    throw new RangeError(`Oktave muss ganzzahlig sein: ${String(octave)}`);
  }
  return { letter, alter, octave };
}

/** Setzt einen Ton in eine Oktave (wissenschaftliche Notation, C4 = c¹). */
export function withOctave(n: NoteName, octave: number): Pitch {
  return pitch(n.letter, n.alter, octave);
}

/** Gleiche Schreibweise ohne Rücksicht auf die Oktave (Cis4 und Cis5: ja, Cis und Des: nein). */
export function sameNoteName(a: NoteName, b: NoteName): boolean {
  return a.letter === b.letter && a.alter === b.alter;
}

export function letterIndex(letter: Letter): number {
  return LETTERS.indexOf(letter);
}

function letterAt(index: number): Letter {
  const letter = LETTERS[mod(index, 7)];
  if (letter === undefined) {
    throw new RangeError(`Ungültiger Stammton-Index: ${String(index)}`);
  }
  return letter;
}

/** Position auf der diatonischen Skala: C0 = 0, D0 = 1, … C1 = 7. */
export function diatonicIndex(p: Pitch): number {
  return p.octave * 7 + letterIndex(p.letter);
}

/** MIDI-Nummer: C4 = 60, A4 = 69. */
export function midi(p: Pitch): number {
  return 12 * (p.octave + 1) + NATURAL_SEMITONES[p.letter] + p.alter;
}

/** Tonhöhenklasse 0–11 (C = 0). */
export function chroma(p: Pitch): number {
  return mod(NATURAL_SEMITONES[p.letter] + p.alter, 12);
}

/** Frequenz im gleichstufigen System, Bezugston A4 (Standard 440 Hz). */
export function frequency(p: Pitch, referenceHz = 440): number {
  return referenceHz * 2 ** ((midi(p) - 69) / 12);
}

/**
 * Transponiert um eine diatonische Schrittzahl und eine Halbtonzahl.
 * Beispiel: große Terz aufwärts = 2 Schritte, 4 Halbtöne.
 * Wirft einen RangeError, wenn das Ergebnis mehr als zwei Vorzeichen bräuchte.
 */
export function transpose(p: Pitch, diatonicSteps: number, semitones: number): Pitch {
  const target = diatonicIndex(p) + diatonicSteps;
  const octave = Math.floor(target / 7);
  const letter = letterAt(target);
  const alter = midi(p) + semitones - naturalMidi(letter, octave);
  return pitch(letter, alter, octave);
}

export function equals(a: Pitch, b: Pitch): boolean {
  return a.letter === b.letter && a.alter === b.alter && a.octave === b.octave;
}

/** Gleicher Klang im gleichstufigen System (z. B. Cis4 und Des4). */
export function isEnharmonic(a: Pitch, b: Pitch): boolean {
  return midi(a) === midi(b);
}

/** Alle Schreibweisen mit höchstens zwei Vorzeichen, die gleich klingen – tief nach hoch sortiert. */
export function enharmonicSpellings(p: Pitch): Pitch[] {
  const target = midi(p);
  const result: Pitch[] = [];
  for (let octave = p.octave - 1; octave <= p.octave + 1; octave++) {
    for (const letter of LETTERS) {
      const alter = target - naturalMidi(letter, octave);
      if (isValidAlter(alter)) {
        result.push({ letter, alter, octave });
      }
    }
  }
  return result.sort((a, b) => diatonicIndex(a) - diatonicIndex(b));
}

/** Tonhöhe aus MIDI-Nummer; Stammtöne bevorzugt, sonst Kreuz oder b nach Wunsch. */
export function fromMidi(midiNumber: number, prefer: 'sharp' | 'flat' = 'sharp'): Pitch {
  if (!Number.isInteger(midiNumber)) {
    throw new RangeError(`MIDI-Nummer muss ganzzahlig sein: ${String(midiNumber)}`);
  }
  const octave = Math.floor(midiNumber / 12) - 1;
  const semitone = mod(midiNumber, 12);
  const natural = LETTERS.find((l) => NATURAL_SEMITONES[l] === semitone);
  if (natural) {
    return pitch(natural, 0, octave);
  }
  // Schwarze Tasten (1, 3, 6, 8, 10) liegen nie an der Oktavgrenze – die Oktave bleibt gleich.
  const alter = prefer === 'sharp' ? 1 : -1;
  const letter = LETTERS.find((l) => NATURAL_SEMITONES[l] === semitone - alter);
  if (!letter) {
    throw new RangeError(`Keine Schreibweise für MIDI ${String(midiNumber)}`);
  }
  return pitch(letter, alter, octave);
}

/**
 * Schreibt eine MIDI-Nummer mit vorgegebenem Stammton und Vorzeichen, z. B. 60 als His3 oder Deses4.
 * Wirft einen RangeError, wenn der Ton nicht zur MIDI-Nummer passt.
 */
export function spellMidi(midiNumber: number, name: NoteName): Pitch {
  const octave = (midiNumber - NATURAL_SEMITONES[name.letter] - name.alter) / 12 - 1;
  if (!Number.isInteger(octave)) {
    throw new RangeError(
      `MIDI ${String(midiNumber)} lässt sich nicht als ${formatNoteName(name)} schreiben`,
    );
  }
  return pitch(name.letter, name.alter, octave);
}

/** Sortierung nach Klang, bei gleichem Klang nach Schreibweise (tiefer Stammton zuerst). */
export function comparePitches(a: Pitch, b: Pitch): number {
  return midi(a) - midi(b) || diatonicIndex(a) - diatonicIndex(b);
}

// ---------------------------------------------------------------------------
// Wissenschaftliche Schreibweise: „C4“, „F#3“, „Bb2“, „C##5“, „Dbb4“, „F♯3“, „B♭2“

const ACCIDENTAL_VALUES: Readonly<Record<string, number>> = {
  '#': 1,
  '♯': 1,
  x: 2,
  '𝄪': 2,
  b: -1,
  '♭': -1,
  '𝄫': -2,
  '♮': 0,
};

const SCIENTIFIC_PATTERN = /^([A-G])([#♯x𝄪b♭𝄫♮]*)(-?\d+)$/u;
const NOTE_NAME_PATTERN = /^([A-G])([#♯x𝄪b♭𝄫♮]*)$/u;

/** Liest eine Tonhöhe in wissenschaftlicher Notation (Stammton immer als Großbuchstabe). */
export function parsePitch(text: string): Pitch {
  const match = SCIENTIFIC_PATTERN.exec(text.trim());
  if (!match) {
    throw new SyntaxError(`Keine gültige Tonhöhe in wissenschaftlicher Notation: „${text}“`);
  }
  const [, letterText, accidentalText = '', octaveText = ''] = match;
  return pitch(
    letterText as Letter,
    parseAccidentals(accidentalText, text),
    Number.parseInt(octaveText, 10),
  );
}

/** Liest einen Ton ohne Oktave: „C“, „F#“, „Bb“, „C##“, „E♭“. */
export function parseNoteName(text: string): NoteName {
  const match = NOTE_NAME_PATTERN.exec(text.trim());
  if (!match) {
    throw new SyntaxError(`Kein gültiger Tonname: „${text}“`);
  }
  const [, letterText, accidentalText = ''] = match;
  return noteName(letterText as Letter, parseAccidentals(accidentalText, text));
}

function parseAccidentals(accidentalText: string, text: string): number {
  // Einzelne Zeichen per Regex (Doppel-b und Doppelkreuz sind Unicode-Zeichen außerhalb der BMP).
  const symbols = accidentalText.match(/[#♯x𝄪b♭𝄫♮]/gu) ?? [];
  const values = symbols.map((symbol) => {
    const value = ACCIDENTAL_VALUES[symbol];
    if (value === undefined) {
      throw new SyntaxError(`Unbekanntes Vorzeichen „${symbol}“ in „${text}“`);
    }
    return value;
  });
  const mixesDirections = values.some((v) => v > 0) && values.some((v) => v < 0);
  const naturalWithOthers = accidentalText.includes('♮') && values.length > 1;
  if (mixesDirections || naturalWithOthers) {
    throw new SyntaxError(`Widersprüchliche Vorzeichen in „${text}“`);
  }
  return values.reduce((sum, v) => sum + v, 0);
}

export type AccidentalStyle = 'unicode' | 'ascii';

const ACCIDENTAL_SYMBOLS: Readonly<Record<AccidentalStyle, readonly string[]>> = {
  // Index = alter + 2
  unicode: ['𝄫', '♭', '', '♯', '𝄪'],
  ascii: ['bb', 'b', '', '#', '##'],
};

export function accidentalSymbol(alter: number, style: AccidentalStyle = 'unicode'): string {
  const symbol = ACCIDENTAL_SYMBOLS[style][alter + 2];
  if (symbol === undefined || !isValidAlter(alter)) {
    throw new RangeError(
      `Vorzeichen außerhalb von ${String(MIN_ALTER)}…${String(MAX_ALTER)}: ${String(alter)}`,
    );
  }
  return symbol;
}

/** Wissenschaftliche Schreibweise, z. B. „F♯3“ oder (ascii) „F#3“. */
export function formatPitch(p: Pitch, style: AccidentalStyle = 'ascii'): string {
  return `${formatNoteName(p, style)}${String(p.octave)}`;
}

/** Ton ohne Oktave, z. B. „F#“ oder (unicode) „F♯“. Bei einer `Pitch` wird die Oktave weggelassen. */
export function formatNoteName(n: NoteName, style: AccidentalStyle = 'ascii'): string {
  return `${n.letter}${accidentalSymbol(n.alter, style)}`;
}

// ---------------------------------------------------------------------------

function naturalMidi(letter: Letter, octave: number): number {
  return 12 * (octave + 1) + NATURAL_SEMITONES[letter];
}

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
