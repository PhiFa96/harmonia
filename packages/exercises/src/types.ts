import type { AppLocale, Messages } from '@harmonia/i18n';
import type { Score } from '@harmonia/notation';
import type {
  Chord,
  Key,
  Mode,
  Pitch,
  Rng,
  TriadType,
  TimeSignature,
  Duration,
  Interval,
} from '@harmonia/theory';

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
  | 'KEYSIG_BUILD'
  | 'CHORD_IDENTIFY'
  | 'CHORD_BUILD'
  | 'RHYTHM_TAP'
  | 'METER_IDENTIFY'
  | 'KNOWLEDGE_MC'
  | 'MATCH'
  | 'ORDER';
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
export interface ChordParams extends NoteParams {
  readonly types: readonly TriadType[];
  /** Kanonische ASCII-Stammtöne, z. B. C, F#, Bb; ohne Angabe alle darstellbaren Grundtöne. */
  readonly roots?: readonly string[];
  readonly inversions?: readonly (0 | 1 | 2)[];
}
export interface ChordIdentifyParams extends ChordParams {
  readonly presentation?: 'visual' | 'aural';
}
export type MvpMeter = '2/2' | '2/4' | '3/4' | '4/4' | '3/8' | '6/8' | '9/8' | '12/8';
export interface MeterParams {
  readonly meters: readonly MvpMeter[];
  readonly clefs?: readonly ExerciseClef[];
}
export interface RhythmParams extends MeterParams {
  /** Tempo des tatsächlichen Grundschlags, auch der punktierten Viertel in 6/8. */
  readonly tempos?: readonly number[];
  readonly level?: 'basic' | 'dotted';
  readonly rests?: boolean;
  /** Maximale Abweichung in ms; zusätzlich auf 40 % des kürzesten Einsatzabstands begrenzt. */
  readonly toleranceMs?: number;
}
export type KnowledgeTopic =
  'accidentals' | 'noteValues' | 'intervals' | 'triads' | 'scales' | 'meters';
export interface KnowledgeParams {
  readonly topics: readonly KnowledgeTopic[];
}
export interface MatchParams extends KnowledgeParams {
  readonly count?: number;
}
export type OrderTopic = 'noteValues' | 'pitches';
export interface OrderParams {
  readonly topics: readonly OrderTopic[];
  readonly count?: number;
  readonly direction?: ScaleDirection | 'both';
}
export type KnowledgeFact =
  | { readonly topic: 'accidentals'; readonly alter: -2 | -1 | 0 | 1 | 2 }
  | { readonly topic: 'noteValues'; readonly duration: Duration }
  | { readonly topic: 'intervals'; readonly interval: Interval }
  | { readonly topic: 'triads'; readonly triad: TriadType }
  | { readonly topic: 'scales'; readonly scale: MvpScaleType }
  | { readonly topic: 'meters'; readonly meter: MvpMeter };
export type OrderValue =
  | { readonly kind: 'duration'; readonly duration: Duration }
  | { readonly kind: 'pitch'; readonly pitch: Pitch };
export type ExerciseSpec =
  | { readonly type: 'KNOWLEDGE_MC'; readonly params: KnowledgeParams }
  | { readonly type: 'MATCH'; readonly params: MatchParams }
  | { readonly type: 'ORDER'; readonly params: OrderParams }
  | { readonly type: 'NOTE_NAME'; readonly params: NoteParams }
  | { readonly type: 'NOTE_PLACE'; readonly params: NoteParams }
  | { readonly type: 'KEY_FIND'; readonly params: NoteParams }
  | { readonly type: 'INTERVAL_BUILD'; readonly params: VisualIntervalParams }
  | { readonly type: 'SCALE_BUILD'; readonly params: ScaleParams }
  | { readonly type: 'SCALE_IDENTIFY'; readonly params: ScaleParams }
  | { readonly type: 'KEYSIG_IDENTIFY'; readonly params: KeySignatureParams }
  | { readonly type: 'KEYSIG_BUILD'; readonly params: KeySignatureParams }
  | { readonly type: 'CHORD_BUILD'; readonly params: ChordParams }
  | { readonly type: 'CHORD_IDENTIFY'; readonly params: ChordIdentifyParams }
  | { readonly type: 'RHYTHM_TAP'; readonly params: RhythmParams }
  | { readonly type: 'METER_IDENTIFY'; readonly params: MeterParams }
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
export interface ChordItem extends ItemBase {
  readonly type: 'CHORD_BUILD' | 'CHORD_IDENTIFY';
  readonly chord: Chord;
  /** Vorgegebener Basston einschließlich Oktave; enge Lage aufwärts. */
  readonly bass: Pitch;
  readonly pitches: readonly Pitch[];
  readonly presentation: 'visual' | 'aural';
}
export interface RhythmItem extends ItemBase {
  readonly type: 'RHYTHM_TAP' | 'METER_IDENTIFY';
  readonly meter: TimeSignature;
  readonly bpm: number;
  readonly toleranceMs: number;
}
/** Wissensaufgaben benötigen kein künstliches Notenbild und keinen Notenschlüssel. */
export interface KnowledgeItem {
  readonly type: 'KNOWLEDGE_MC';
  readonly fact: KnowledgeFact;
  readonly choices: readonly string[];
}
export interface MatchItem {
  readonly type: 'MATCH';
  /** Reihenfolge der linken Begriffe; rechte Definitionen stehen in choices. */
  readonly facts: readonly KnowledgeFact[];
  readonly choices: readonly string[];
}
export interface OrderItem {
  readonly type: 'ORDER';
  readonly topic: OrderTopic;
  readonly direction: ScaleDirection;
  readonly values: readonly OrderValue[];
  readonly choices: readonly string[];
}
export type KnowledgeExerciseItem = KnowledgeItem | MatchItem | OrderItem;
export type ExerciseItem =
  | NoteItem
  | IntervalItem
  | PitchInputItem
  | ScaleItem
  | KeySignatureItem
  | ChordItem
  | RhythmItem
  | KnowledgeExerciseItem;

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
