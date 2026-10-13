// Sprachneutrale freie Antworten. Notenschreiben bewahrt die Schreibweise, Tasten die MIDI-Höhe.
import { grandStaffTarget } from '@harmonia/notation';
import type { EventRef } from '@harmonia/notation';
import { MAX_STEP, MIN_STEP, setPitch, stepOf } from '@harmonia/notation';
import type { Pitch } from '@harmonia/theory';
import { formatPitch, fromMidi, midi, parsePitch } from '@harmonia/theory';
import type { ExerciseItem, PitchInputItem } from './types.ts';
import type { ExerciseClef } from './types.ts';

export function isPitchInput(item: ExerciseItem): item is PitchInputItem {
  return ['NOTE_PLACE', 'KEY_FIND', 'INTERVAL_BUILD'].includes(item.type);
}
export function pitchAnswerId(pitch: Pitch): string {
  return formatPitch(pitch);
}
export function keyAnswerId(pitch: Pitch): string {
  return `key:${String(midi(pitch))}`;
}
export function inputTarget(item: PitchInputItem): Pitch {
  return item.type === 'INTERVAL_BUILD'
    ? item.to
    : item.type === 'KEY_FIND' && item.presentation === 'grand-staff'
      ? grandStaffTarget(item.score).pitch
      : item.pitch;
}
export function inputSlot(item: PitchInputItem): EventRef {
  return { measure: item.type === 'INTERVAL_BUILD' ? 1 : 0, event: 0 };
}
export function inputSolutionScore(item: PitchInputItem) {
  return item.type === 'KEY_FIND'
    ? item.score
    : setPitch(item.score, inputSlot(item), inputTarget(item));
}
/** Ungültige/überlange IDs werden nicht gewertet. Keine Normalisierung falscher Notenschreibweisen. */
export function answerPitch(item: PitchInputItem, answer: string): Pitch | undefined {
  if (item.type === 'KEY_FIND') {
    if (!/^key:(?:[2-9]\d|10\d)$/.test(answer)) return undefined;
    const number = Number(answer.slice(4));
    return number >= 21 && number <= 108 && answer === `key:${String(number)}`
      ? fromMidi(number)
      : undefined;
  }
  return writtenAnswerPitch(item.clef, answer);
}
export function writtenAnswerPitch(clef: ExerciseClef, answer: string): Pitch | undefined {
  if (!/^[A-G](?:bb|b|##|#)?[0-8]$/.test(answer)) return undefined;
  const pitch = parsePitch(answer);
  if (pitchAnswerId(pitch) !== answer) return undefined;
  const step = stepOf(pitch, clef);
  return midi(pitch) >= 21 && midi(pitch) <= 108 && step >= MIN_STEP && step <= MAX_STEP
    ? pitch
    : undefined;
}
