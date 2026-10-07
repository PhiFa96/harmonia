import type { AppLocale, Messages } from '@harmonia/i18n';
import type { Score } from '@harmonia/notation';
import type { Key, Mode, Pitch, Rng } from '@harmonia/theory';

export type ExerciseType =
  | 'NOTE_NAME'
  | 'INTERVAL_IDENTIFY_VISUAL'
  | 'INTERVAL_IDENTIFY_AURAL'
  | 'NOTE_PLACE'
  | 'KEY_FIND'
  | 'INTERVAL_BUILD'
  | 'SCALE_BUILD'
  | 'SCALE_IDENTIFY'
  | 'KEYSIG_IDENTIFY'
  | 'KEYSIG_BUILD';
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
export type MvpScaleType = 'major' | 'naturalMinor' | 'harmonicMinor' | 'melodicMinor';
export type ScaleDirection = 'ascending' | 'descending';
export interface ScaleParams extends NoteParams {
  readonly types: readonly MvpScaleType[];
  /** Vorzeichnung der zugrunde liegenden Dur-/natürlichen Molltonart, -7 bis +7. */
  readonly fifths?: readonly number[];
  readonly direction?: ScaleDirection | 'both';
}
export interface KeySignatureParams {
  readonly clefs?: readonly ExerciseClef[];
  readonly modes?: readonly Mode[];
  readonly fifths?: readonly number[];
}
export type ExerciseSpec =
  | { readonly type: 'NOTE_NAME'; readonly params: NoteParams }
  | { readonly type: 'NOTE_PLACE'; readonly params: NoteParams }
  | { readonly type: 'KEY_FIND'; readonly params: NoteParams }
  | { readonly type: 'INTERVAL_BUILD'; readonly params: VisualIntervalParams }
  | { readonly type: 'SCALE_BUILD'; readonly params: ScaleParams }
  | { readonly type: 'SCALE_IDENTIFY'; readonly params: ScaleParams }
  | { readonly type: 'KEYSIG_IDENTIFY'; readonly params: KeySignatureParams }
  | { readonly type: 'KEYSIG_BUILD'; readonly params: KeySignatureParams }
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
export interface NotePlaceItem extends ItemBase {
  readonly type: 'NOTE_PLACE';
  readonly pitch: Pitch;
}
export interface KeyFindItem extends ItemBase {
  readonly type: 'KEY_FIND';
  readonly pitch: Pitch;
}
export interface IntervalBuildItem extends ItemBase {
  readonly type: 'INTERVAL_BUILD';
  readonly from: Pitch;
  readonly to: Pitch;
  readonly playback: IntervalPlayback;
}
export type PitchInputItem = NotePlaceItem | KeyFindItem | IntervalBuildItem;
export interface ScaleItem extends ItemBase {
  readonly type: 'SCALE_BUILD' | 'SCALE_IDENTIFY';
  readonly tonic: Pitch;
  readonly scaleType: MvpScaleType;
  readonly direction: ScaleDirection;
  readonly pitches: readonly Pitch[];
}
export interface KeySignatureItem extends ItemBase {
  readonly type: 'KEYSIG_IDENTIFY' | 'KEYSIG_BUILD';
  readonly key: Key;
}
export type ExerciseItem = NoteItem | IntervalItem | PitchInputItem | ScaleItem | KeySignatureItem;

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
