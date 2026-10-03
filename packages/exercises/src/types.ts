import type { AppLocale, Messages } from '@harmonia/i18n';
import type { Score } from '@harmonia/notation';
import type { Pitch, Rng } from '@harmonia/theory';

export type ExerciseType = 'NOTE_NAME' | 'INTERVAL_IDENTIFY_VISUAL' | 'INTERVAL_IDENTIFY_AURAL';
export type ExerciseClef = 'treble' | 'bass';
export type IntervalPlayback = 'melodic-up' | 'melodic-down' | 'harmonic';

export interface PitchRange {
  readonly minMidi: number;
  readonly maxMidi: number;
}
export interface NoteParams {
  readonly clefs?: readonly ExerciseClef[];
  readonly range?: PitchRange;
  readonly maxAccidentals?: 0 | 1 | 2;
}
export interface VisualIntervalParams extends NoteParams {
  /** Positive Kurzschreibweise, z. B. m3/M3/P5; Richtung separat. */
  readonly intervals: readonly string[];
  readonly direction?: 'up' | 'down' | 'both';
}
export interface AuralIntervalParams extends NoteParams {
  readonly intervals: readonly string[];
  readonly playback?: IntervalPlayback;
}
export type ExerciseSpec =
  | { readonly type: 'NOTE_NAME'; readonly params: NoteParams }
  | { readonly type: 'INTERVAL_IDENTIFY_VISUAL'; readonly params: VisualIntervalParams }
  | { readonly type: 'INTERVAL_IDENTIFY_AURAL'; readonly params: AuralIntervalParams };

interface ItemBase {
  readonly clef: ExerciseClef;
  readonly score: Score;
  /** Sprachneutrale Antwort-IDs, gemischt mit dem übergebenen RNG. */
  readonly choices: readonly string[];
}
export interface NoteItem extends ItemBase {
  readonly type: 'NOTE_NAME';
  readonly pitch: Pitch;
}
export interface IntervalItem extends ItemBase {
  readonly type: 'INTERVAL_IDENTIFY_VISUAL' | 'INTERVAL_IDENTIFY_AURAL';
  /** Reihenfolge der gespielten / notierten Töne. */
  readonly from: Pitch;
  readonly to: Pitch;
  readonly playback: IntervalPlayback;
}
export type ExerciseItem = NoteItem | IntervalItem;

export interface Evaluation {
  readonly answer: string;
  readonly expected: string;
  readonly correct: boolean;
  readonly validAnswer: boolean;
}
export interface ExerciseFeedback {
  readonly title: string;
  readonly message: string;
}
export interface ExerciseHint {
  readonly level: 1 | 2 | 3;
  readonly key: `exercise.${keyof Messages['exercise']}` | 'solution';
  readonly values: Readonly<Record<string, string | number>>;
}
export interface ExerciseDefinition<Params, Item extends ExerciseItem> {
  generate(params: Params, rng: Rng): Item;
  evaluate(item: Item, answer: string): Evaluation;
  feedback(item: Item, result: Evaluation, locale: AppLocale): ExerciseFeedback;
  hints(item: Item, level: 1 | 2 | 3): ExerciseHint;
}
