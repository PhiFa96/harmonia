// Klaviatur-Geometrie und Benennung (P1.18). Die Schreibweise kommt aus der Theorie-Engine.
import type { Pitch } from '@harmonia/theory';
import { fromMidi, midi, pitchName, spokenPitchName } from '@harmonia/theory';

export type KeyboardLabels = 'none' | 'de' | 'intl';
export interface KeyboardRange {
  readonly first: number;
  readonly last: number;
}
export interface PianoKey {
  readonly midi: number;
  readonly black: boolean;
  readonly left: number;
  readonly width: number;
}
export interface KeyboardLayout {
  readonly keys: readonly PianoKey[];
  readonly width: number;
  readonly height: number;
  readonly blackHeight: number;
}

export const PIANO_RANGE: KeyboardRange = { first: 21, last: 108 };
export const PRACTICE_RANGE: KeyboardRange = { first: 60, last: 76 };

/** Alle 88 Tasten; schwarze Tasten mindestens 48 pt breit bei whiteWidth >= 80. */
export function keyboardLayout(range: KeyboardRange, whiteWidth = 80): KeyboardLayout {
  if (
    !Number.isInteger(range.first) ||
    !Number.isInteger(range.last) ||
    range.first < PIANO_RANGE.first ||
    range.last > PIANO_RANGE.last ||
    range.first > range.last ||
    !Number.isFinite(whiteWidth) ||
    whiteWidth < 80
  ) {
    throw new RangeError('Ungültiger Klaviatur-Ausschnitt oder zu schmale Tasten');
  }
  const keys: PianoKey[] = [];
  let whites = 0;
  for (let number = range.first; number <= range.last; number++) {
    const black = fromMidi(number).alter !== 0;
    // Auch Ausschnitte, die mit einer schwarzen Taste beginnen, bekommen eine volle Trefferfläche.
    if (black && keys.length === 0) whites = 0.3;
    keys.push({
      midi: number,
      black,
      left: black ? (whites - 0.3) * whiteWidth : whites * whiteWidth,
      width: black ? whiteWidth * 0.6 : whiteWidth,
    });
    if (!black) whites++;
  }
  const width = Math.max(...keys.map((key) => key.left + key.width));
  return { keys, width, height: 200, blackHeight: 124 };
}

/** Schwarze Tasten haben im überlappenden Bereich Vorrang. Außerhalb: kein Ton. */
export function keyboardHit(layout: KeyboardLayout, x: number, y: number): PianoKey | undefined {
  if (x < 0 || x >= layout.width || y < 0 || y >= layout.height) return undefined;
  if (y < layout.blackHeight) {
    const black = layout.keys.find((key) => key.black && x >= key.left && x < key.left + key.width);
    if (black) return black;
  }
  return layout.keys.find((key) => !key.black && x >= key.left && x < key.left + key.width);
}

/** Die Übung kann auch enharmonische Schreibweisen vorgeben (z. B. Des statt Cis). */
export function keyboardPitch(number: number, spelling?: Pitch): Pitch {
  return spelling && midi(spelling) === number ? spelling : fromMidi(number);
}

export function keyboardLabel(pitch: Pitch, labels: KeyboardLabels): string {
  if (labels === 'none') return '';
  return pitchName(pitch, { system: labels, octave: labels === 'de' ? 'helmholtz' : 'scientific' });
}

/** Schwarze Tasten werden mit beiden üblichen Namen angesagt, unabhängig von sichtbaren Labels. */
export function keyboardSpokenNames(
  number: number,
  language: 'de' | 'en',
  spelling?: Pitch,
): readonly string[] {
  const sharp = fromMidi(number);
  const names = [spokenPitchName(sharp, language)];
  if (sharp.alter !== 0) names.push(spokenPitchName(fromMidi(number, 'flat'), language));
  if (spelling && midi(spelling) === number) {
    const name = spokenPitchName(spelling, language);
    if (!names.includes(name)) names.unshift(name);
  }
  return names;
}

export function keyboardMidi(pitch: Pitch): number {
  return midi(pitch);
}

/** Physische Web-Tasten: eine chromatische Oktave plus Quinte ab c¹. Nur bei Klaviatur-Fokus. */
export const KEYBOARD_SHORTCUTS: Readonly<Record<string, number>> = {
  KeyA: 60,
  KeyW: 61,
  KeyS: 62,
  KeyE: 63,
  KeyD: 64,
  KeyF: 65,
  KeyT: 66,
  KeyG: 67,
  KeyY: 68,
  KeyH: 69,
  KeyU: 70,
  KeyJ: 71,
  KeyK: 72,
  KeyO: 73,
  KeyL: 74,
  KeyP: 75,
  Semicolon: 76,
};
