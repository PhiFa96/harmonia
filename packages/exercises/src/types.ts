import type { VoiceLeadingItem, VoiceLeadingParams } from './voice-leading.ts';
import type { ContextItem, ContextParams } from './context.ts';
import type { AppLocale, Messages } from '@harmonia/i18n';
import type { KeyboardRange, Score } from '@harmonia/notation';
import type {
  Chord,
  Key,
  Mode,
  Pitch,
  Rng,
  TriadType,
  SeventhType,
  TimeSignature,
  Duration,
  Interval,
} from '@harmonia/theory';

export type ExerciseType =
  | VoiceExerciseType
  | 'VOICE_LEADING'
  | 'CONTEXT_CHOICE'
  | 'LISTENING_CHOICE'
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
  | 'ORDER'
  | 'CADENCE_IDENTIFY'
  | 'FUNCTION_ANALYSIS'
  | 'MELODY_DICTATION'
  | 'RHYTHM_DICTATION';
export type VoiceExerciseType = 'SING_INTERVAL' | 'SIGHT_SING' | 'PLAY_BACK';
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
export interface NoteNameParams extends NoteParams {
  /** Vollständige Tonhöhen statt allein Stammton und Vorzeichen. Standard: false. */
  readonly includeOctave?: boolean;
  readonly presentation?: 'octave-name';
  readonly sourceSystem?: 'helmholtz' | 'scientific' | 'both';
}
export interface KeyFindParams extends NoteParams {
  /** Namen innerhalb eines festen Ausschnitts; Notenbild bleibt der bisherige Standard. */
  readonly presentation?: 'notation' | 'name' | 'score' | 'grand-staff';
}
export interface VisualIntervalParams extends NoteParams {
  /** Positive Kurzschreibweise, z. B. m3/M3/P5; Richtung separat. */
  readonly intervals: readonly string[];
  readonly direction?: 'up' | 'down' | 'both';
  /** Gestufte Lesefragen mit natürlichen Tönen, Prime bis Oktave. */
  readonly question?: IntervalReadingQuestion;
}
export type IntervalReadingQuestion =
  'number' | 'direction' | 'motion' | 'semitones' | 'quality' | 'perfect';
export interface AuralIntervalParams extends NoteParams {
  readonly intervals: readonly string[];
  readonly playback?: IntervalPlayback;
}
export interface VoiceParams extends NoteParams {
  readonly level: 1 | 2 | 3;
}
export interface VoiceSequenceParams extends VoiceParams {
  readonly intervals: readonly string[];
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
  readonly types: readonly (TriadType | SeventhType)[];
  /** Kanonische ASCII-Stammtöne, z. B. C, F#, Bb; ohne Angabe alle darstellbaren Grundtöne. */
  readonly roots?: readonly string[];
  readonly inversions?: readonly (0 | 1 | 2 | 3)[];
  readonly diatonic?: boolean;
}
export interface ChordIdentifyParams extends ChordParams {
  readonly presentation?: 'visual' | 'aural';
}
export type MvpMeter = '2/2' | '2/4' | '3/4' | '4/4' | '3/8' | '6/8' | '9/8' | '12/8';
export interface MeterParams {
  readonly meters: readonly MvpMeter[];
  readonly clefs?: readonly ExerciseClef[];
}
export interface MeterIdentifyParams extends MeterParams {
  /** Auftakt aus zwei sichtbaren Takten anhand der Dauer vor dem ersten Taktstrich erkennen. */
  readonly presentation?: 'pickup';
}
export interface RhythmParams extends MeterParams {
  /** Tempo des tatsächlichen Grundschlags, auch der punktierten Viertel in 6/8. */
  readonly tempos?: readonly number[];
  /** pulse: nur gleichmäßige Schläge in 2/4, 3/4 oder 4/4, ohne Notenlesen. */
  readonly level?: 'basic' | 'dotted' | 'pulse' | 'quarters' | 'triplets';
  readonly rests?: boolean;
  /** Maximale Abweichung in ms; zusätzlich auf 40 % des kürzesten Einsatzabstands begrenzt. */
  readonly toleranceMs?: number;
}
export interface CadenceParams {
  readonly fifths?: readonly number[];
  readonly types?: readonly ('authentic' | 'plagal' | 'half' | 'deceptive')[];
}
export interface FunctionParams {
  readonly fifths?: readonly number[];
  readonly degrees?: readonly (1 | 2 | 3 | 4 | 5 | 6 | 7)[];
  readonly notation?: 'roman' | 'function';
}
export interface DictationParams {
  readonly level?: 1 | 2;
}
export type ListeningQuestion =
  | 'pulse'
  | 'rhythm-compare'
  | 'rhythm-choice'
  | 'pitch-direction'
  | 'melody-compare'
  | 'observation'
  | 'rhythm-choice-dotted'
  | 'pulse-subdivision'
  | 'rhythm-completion'
  | 'scale-mode'
  | 'melodic-memory';
export interface ListeningParams {
  readonly question: ListeningQuestion;
  readonly tempos?: readonly number[];
}
export interface ListeningItem {
  readonly type: 'LISTENING_CHOICE';
  readonly question: ListeningQuestion;
  readonly bpm: number;
  /** Bewertungs- und Audioquelle; keine gespeicherte Zielantwort. */
  readonly clips: readonly Score[];
  /** Nur bei Rhythmusauswahl vor der Wertung sichtbar. */
  readonly candidates?: readonly Score[];
  readonly promptScore?: Score;
  readonly choices: readonly string[];
}
export type KnowledgeTopic =
  | 'soundSources'
  | 'sourceTypes'
  | 'context'
  | 'periods'
  | 'genreContext'
  | 'evidence'
  | 'accidentals'
  | 'noteValues'
  | 'rests'
  | 'barlines'
  | 'intervals'
  | 'triads'
  | 'scales'
  | 'meters'
  | 'keyboard'
  | 'pulse'
  | 'tempo'
  | 'beatGroup'
  | 'modes'
  | 'modulation'
  | 'phrases'
  | 'forms'
  | 'instrumentFamilies'
  | 'instrumentScores'
  | 'jazzHarmony'
  | 'historyMethods'
  | 'multivoice'
  | 'complexRhythm'
  | 'extendedChords'
  | 'appliedHarmony'
  | 'voiceLeading'
  | 'figuredBass'
  | 'sonata'
  | 'analysis'
  | 'jazzVoicings'
  | 'orchestration'
  | 'tuning'
  | 'examAural'
  | 'historySurvey';
export interface DurationLimits {
  /** 0: nur unpunktierte Werte; Standard 1 bewahrt bestehende Aufgaben. */
  readonly maxDots?: 0 | 1;
}
export interface KnowledgeParams extends DurationLimits {
  readonly topics: readonly KnowledgeTopic[];
  /** Einfache Zeichen oder zusätzlich doppelte Vorzeichen. Standard: 2. */
  readonly maxAccidentals?: 1 | 2;
}
export interface KnowledgeMcParams extends KnowledgeParams {
  readonly presentation?: 'symbol' | 'measure-gap';
}
export interface MatchParams extends KnowledgeParams {
  readonly count?: number;
}
export type OrderTopic = 'noteValues' | 'pitches' | 'periods';
export interface OrderParams extends DurationLimits {
  readonly topics: readonly OrderTopic[];
  readonly count?: number;
  readonly direction?: ScaleDirection | 'both';
}
export type HistoryTopic =
  | 'soundSources'
  | 'sourceTypes'
  | 'context'
  | 'periods'
  | 'genreContext'
  | 'evidence'
  | 'modes'
  | 'modulation'
  | 'phrases'
  | 'forms'
  | 'instrumentFamilies'
  | 'instrumentScores'
  | 'jazzHarmony'
  | 'historyMethods'
  | 'multivoice'
  | 'complexRhythm'
  | 'extendedChords'
  | 'appliedHarmony'
  | 'voiceLeading'
  | 'figuredBass'
  | 'sonata'
  | 'analysis'
  | 'jazzVoicings'
  | 'orchestration'
  | 'tuning'
  | 'examAural'
  | 'historySurvey';
export type HistoryKind =
  | 'voice'
  | 'instrument'
  | 'recording'
  | 'electronic'
  | 'score'
  | 'report'
  | 'programme'
  | 'place'
  | 'time'
  | 'occasion'
  | 'author'
  | 'medieval'
  | 'renaissance'
  | 'baroque'
  | 'classical'
  | 'romantic'
  | 'since1900'
  | 'genre'
  | 'forces'
  | 'function'
  | 'observation'
  | 'metadata'
  | 'inference'
  | 'uncertainty'
  | 'ionian'
  | 'dorian'
  | 'mixolydian'
  | 'aeolian'
  | 'pivot'
  | 'tonicization'
  | 'newTonic'
  | 'commonTone'
  | 'motive'
  | 'phrase'
  | 'antecedent'
  | 'consequent'
  | 'binary'
  | 'ternary'
  | 'rondo'
  | 'variation'
  | 'strings'
  | 'woodwinds'
  | 'brass'
  | 'percussion'
  | 'concertPitch'
  | 'writtenPitch'
  | 'transposition'
  | 'scoreOrder'
  | 'leadSheet'
  | 'twoFiveOne'
  | 'backbeat'
  | 'loop'
  | 'manuscript'
  | 'edition'
  | 'recordingDate'
  | 'oralHistory'
  | 'voices'
  | 'alignment'
  | 'clefs'
  | 'systems'
  | 'subdivision'
  | 'tuplet'
  | 'syncopation'
  | 'hemiola'
  | 'ninth'
  | 'inversions'
  | 'altered'
  | 'spacing'
  | 'secondary'
  | 'confirmation'
  | 'cadence'
  | 'common'
  | 'leading'
  | 'parallels'
  | 'range'
  | 'bass'
  | 'six'
  | 'sixFour'
  | 'realisation'
  | 'exposition'
  | 'development'
  | 'recapitulation'
  | 'coda'
  | 'motivic'
  | 'harmonic'
  | 'guideTones'
  | 'extensions'
  | 'doubling'
  | 'transposing'
  | 'harmonics'
  | 'pureFifth'
  | 'equal'
  | 'meantone'
  | 'dictation'
  | 'sight'
  | 'chords'
  | 'intervals'
  | 'context'
  | 'evidence';
export type KnowledgeFact =
  | { readonly topic: HistoryTopic; readonly kind: HistoryKind }
  | { readonly topic: 'pulse'; readonly kind: 'pulse' | 'rhythm' | 'metronome' | 'countIn' }
  | { readonly topic: 'tempo'; readonly kind: 'tempo' | 'bpm' | 'faster' | 'slower' }
  | { readonly topic: 'beatGroup'; readonly kind: 'first' | 'duple' | 'triple' | 'quadruple' }
  | {
      readonly topic: 'keyboard';
      readonly kind: 'semitone' | 'wholeTone' | 'twoBlackKeys' | 'threeBlackKeys';
    }
  | { readonly topic: 'accidentals'; readonly alter: -2 | -1 | 0 | 1 | 2 }
  | { readonly topic: 'noteValues' | 'rests'; readonly duration: Duration }
  | { readonly topic: 'barlines'; readonly kind: 'single' | 'final' }
  | { readonly topic: 'intervals'; readonly interval: Interval }
  | { readonly topic: 'triads'; readonly triad: TriadType }
  | { readonly topic: 'scales'; readonly scale: MvpScaleType }
  | { readonly topic: 'meters'; readonly meter: MvpMeter };
export type OrderValue =
  | { readonly kind: 'period'; readonly period: HistoryKind }
  | { readonly kind: 'duration'; readonly duration: Duration }
  | { readonly kind: 'pitch'; readonly pitch: Pitch };
export type ExerciseSpec =
  | { readonly type: 'VOICE_LEADING'; readonly params: VoiceLeadingParams }
  | { readonly type: 'SIGHT_SING'; readonly params: VoiceParams }
  | { readonly type: 'SING_INTERVAL' | 'PLAY_BACK'; readonly params: VoiceSequenceParams }
  | { readonly type: 'CONTEXT_CHOICE'; readonly params: ContextParams }
  | { readonly type: 'LISTENING_CHOICE'; readonly params: ListeningParams }
  | { readonly type: 'KNOWLEDGE_MC'; readonly params: KnowledgeMcParams }
  | { readonly type: 'MATCH'; readonly params: MatchParams }
  | { readonly type: 'ORDER'; readonly params: OrderParams }
  | { readonly type: 'NOTE_NAME'; readonly params: NoteNameParams }
  | { readonly type: 'NOTE_PLACE'; readonly params: NoteParams }
  | { readonly type: 'KEY_FIND'; readonly params: KeyFindParams }
  | { readonly type: 'INTERVAL_BUILD'; readonly params: VisualIntervalParams }
  | { readonly type: 'SCALE_BUILD'; readonly params: ScaleParams }
  | { readonly type: 'SCALE_IDENTIFY'; readonly params: ScaleParams }
  | { readonly type: 'KEYSIG_IDENTIFY'; readonly params: KeySignatureParams }
  | { readonly type: 'KEYSIG_BUILD'; readonly params: KeySignatureParams }
  | { readonly type: 'CHORD_BUILD'; readonly params: ChordParams }
  | { readonly type: 'CHORD_IDENTIFY'; readonly params: ChordIdentifyParams }
  | { readonly type: 'CADENCE_IDENTIFY'; readonly params: CadenceParams }
  | { readonly type: 'FUNCTION_ANALYSIS'; readonly params: FunctionParams }
  | { readonly type: 'MELODY_DICTATION' | 'RHYTHM_DICTATION'; readonly params: DictationParams }
  | { readonly type: 'RHYTHM_TAP'; readonly params: RhythmParams }
  | { readonly type: 'METER_IDENTIFY'; readonly params: MeterIdentifyParams }
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
  readonly includeOctave?: true;
  readonly presentation?: 'octave-name';
  readonly sourceSystem?: 'helmholtz' | 'scientific';
}
export interface IntervalItem extends ItemBase {
  readonly type: 'INTERVAL_IDENTIFY_VISUAL' | 'INTERVAL_IDENTIFY_AURAL';
  /** Reihenfolge der gespielten / notierten Töne. */
  readonly from: Pitch;
  readonly to: Pitch;
  readonly playback: IntervalPlayback;
  readonly question?: IntervalReadingQuestion;
}
export interface NotePlaceItem extends ItemBase {
  readonly type: 'NOTE_PLACE';
  readonly pitch: Pitch;
}
export interface KeyFindItem extends ItemBase {
  readonly type: 'KEY_FIND';
  readonly pitch: Pitch;
  readonly presentation?: 'name' | 'score' | 'grand-staff';
  readonly keyboardRange?: KeyboardRange;
}
export interface IntervalBuildItem extends ItemBase {
  readonly type: 'INTERVAL_BUILD';
  readonly from: Pitch;
  readonly to: Pitch;
  readonly playback: IntervalPlayback;
}
export type PitchInputItem = NotePlaceItem | KeyFindItem | IntervalBuildItem;
interface VoiceItemBase extends ItemBase {
  readonly pitches: readonly Pitch[];
  readonly toleranceCents: 25 | 50;
}
export type VoiceItem = VoiceItemBase &
  (
    | { readonly type: 'SING_INTERVAL' }
    | { readonly type: 'SIGHT_SING' }
    | { readonly type: 'PLAY_BACK' }
  );
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
  readonly diatonic?: { readonly key: Key; readonly degree: number };
}
export interface CadenceItem extends ItemBase {
  readonly type: 'CADENCE_IDENTIFY';
  readonly key: Key;
  readonly progression: readonly Chord[];
}
export interface FunctionItem extends ItemBase {
  readonly type: 'FUNCTION_ANALYSIS';
  readonly key: Key;
  readonly chord: Chord;
  readonly notation: 'roman' | 'function';
}
export interface DictationItem extends ItemBase {
  readonly type: 'MELODY_DICTATION' | 'RHYTHM_DICTATION';
  readonly pitches: readonly Pitch[];
  readonly durations: readonly Duration[];
  readonly inputPitches: readonly Pitch[];
  readonly inputDurations: readonly Duration[];
}
export interface RhythmItem extends ItemBase {
  readonly type: 'RHYTHM_TAP' | 'METER_IDENTIFY';
  readonly meter: TimeSignature;
  readonly bpm: number;
  readonly toleranceMs: number;
  /** Zahlen und gleichmäßige Klicks statt eines sichtbaren Notenbilds. */
  readonly presentation?: 'pulse' | 'pickup';
}
/** Wissensaufgaben benötigen kein künstliches Notenbild und keinen Notenschlüssel. */
export interface RhythmValue {
  readonly kind: 'note' | 'rest';
  readonly duration: Duration;
}
/** Ein Vier-Viertel-Takt mit genau einer fehlenden Dauer am Ende. */
export interface MeasureGap {
  readonly events: readonly RhythmValue[];
  readonly missingKind: 'note' | 'rest';
}
export interface KnowledgeItem {
  readonly type: 'KNOWLEDGE_MC';
  readonly fact: KnowledgeFact;
  readonly presentation?: 'symbol' | 'measure-gap';
  readonly gap?: MeasureGap;
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
  | VoiceLeadingItem
  | ContextItem
  | ListeningItem
  | NoteItem
  | IntervalItem
  | PitchInputItem
  | VoiceItem
  | ScaleItem
  | KeySignatureItem
  | ChordItem
  | CadenceItem
  | FunctionItem
  | DictationItem
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
