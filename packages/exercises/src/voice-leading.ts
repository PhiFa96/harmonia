import { parseScore } from '@harmonia/notation';
import type { Score } from '@harmonia/notation';
import {
  VOICE_LEADING_RULE_PHASE,
  analyzeVoiceLeading,
  chord,
  chordTones,
  equals,
  formatPitch,
  keyFromFifths,
  parseInterval,
  parsePitch,
  sameNoteName,
  transposeBy,
  midi,
} from '@harmonia/theory';
import type {
  Chord,
  FourPartSlice,
  Pitch,
  Rng,
  Voice,
  VoiceLeadingFinding,
  VoiceLeadingOptions,
  VoiceLeadingRules,
} from '@harmonia/theory';
import type { Evaluation } from './types.ts';

export const SATB_VOICES = ['soprano', 'alto', 'tenor', 'bass'] as const;
export type VoiceLeadingMode = 'bass' | 'soprano' | 'functions';
export interface VoiceLeadingParams {
  readonly mode: VoiceLeadingMode;
  readonly level: 4 | 5;
}
export type SatbAnswer = readonly FourPartSlice[];
export interface VoiceLeadingItem {
  readonly type: 'VOICE_LEADING';
  readonly status: 'draft';
  readonly params: VoiceLeadingParams;
  readonly fifths: number;
  readonly chords: readonly Chord[];
  /** Explicit task labels, not an inferred/general function convention (F03 remains open). */
  readonly functions: readonly string[];
  readonly given: SatbAnswer;
  readonly example: SatbAnswer;
  readonly score: Score;
  readonly choices: readonly string[];
  readonly clef: 'treble';
}

/** Bounded exercise profile, pending F05 and independent subject review. */
export const SATB_DRAFT_PROFILE = 'p4.10-root-position-v1';
export const SATB_DRAFT_RULES: VoiceLeadingRules = {
  'parallel-fifth': 'error',
  'parallel-octave': 'error',
  'parallel-unison': 'error',
  'voice-crossing': 'error',
  'voice-overlap': 'error',
  'upper-voice-spacing': 'error',
  'voice-range': 'error',
  'leading-tone-resolution': 'error',
  'seventh-resolution': 'error',
  'doubled-leading-tone': 'error',
  'augmented-second': 'error',
  'hidden-fifth': 'warning',
  'hidden-octave': 'warning',
  'melodic-leap': 'warning',
};
export function satbOptions(item: VoiceLeadingItem): VoiceLeadingOptions {
  return {
    ranges: {
      bass: { min: parsePitch('E2'), max: parsePitch('C4') },
      tenor: { min: parsePitch('C3'), max: parsePitch('G4') },
      alto: { min: parsePitch('G3'), max: parsePitch('D5') },
      soprano: { min: parsePitch('C4'), max: parsePitch('G5') },
    },
    hiddenPerfectMotion: 'soprano-leap',
    maxMelodicInterval: 8,
    harmonies: item.chords.map((chord, index) => ({
      tonic: keyFromFifths(item.fifths).tonic,
      chord,
      ...(index === 2
        ? {
            resolveToNext: {
              leadingTone: 'up' as const,
              ...(item.params.level === 5 ? { seventh: 'down' as const } : {}),
            },
          }
        : {}),
    })),
  };
}
export function satbScore(slices: SatbAnswer, fifths: number, solo?: Voice): Score {
  const key = ['F', 'C', 'G'][fifths + 1];
  if (!key || slices.length !== 4) throw new RangeError('SATB task shape');
  const token = (p: Pitch | null) => (p ? `${formatPitch(p)}/1` : 'r/1');
  const staff = (clef: string, voices: readonly Voice[]) =>
    `${clef} | key:${key} | 4/4 | ` +
    slices.map((slice) => voices.map((v) => token(slice[v])).join(' & ')).join(' | ');
  return parseScore(
    solo
      ? staff(solo === 'bass' || solo === 'tenor' ? 'bass' : 'treble', [solo])
      : `${staff('treble', ['soprano', 'alto'])}\n${staff('bass', ['tenor', 'bass'])}`,
  );
}
export function generateVoiceLeading(params: VoiceLeadingParams, rng: Rng): VoiceLeadingItem {
  if (![4, 5].includes(params.level) || !['bass', 'soprano', 'functions'].includes(params.mode))
    throw new RangeError('SATB task parameters');
  const fifths = rng.pick([-1, 0, 1]),
    interval = parseInterval(fifths === -1 ? 'P4' : fifths === 1 ? 'P5' : 'P1');
  const pitch = (text: string) => transposeBy(parsePitch(text), interval);
  // Own four-bar, root-position exercises. Whole notes define the task rhythm.
  const rows: readonly (readonly [string, string, string, string])[] =
    params.level === 4
      ? [
          ['C3', 'G3', 'C4', 'E4'],
          ['F2', 'A3', 'C4', 'F4'],
          ['G2', 'G3', 'B3', 'D4'],
          ['C3', 'G3', 'C4', 'E4'],
        ]
      : [
          ['C3', 'G3', 'C4', 'E4'],
          ['F2', 'A3', 'C4', 'F4'],
          ['G2', 'G3', 'B3', 'F4'],
          ['C3', 'G3', 'C4', 'E4'],
        ];
  const example: SatbAnswer = rows.map((row) => ({
    bass: pitch(row[0]),
    tenor: pitch(row[1]),
    alto: pitch(row[2]),
    soprano: pitch(row[3]),
  }));
  const given = example.map(
    (slice) =>
      Object.fromEntries(
        SATB_VOICES.map((v) => [v, params.mode === v ? slice[v] : null]),
      ) as unknown as FourPartSlice,
  );
  const chords = ['C3', 'F3', 'G3', 'C3'].map((root, i) =>
    chord(pitch(root), params.level === 5 && i === 2 ? 'dominant7' : 'major'),
  );
  return {
    type: 'VOICE_LEADING',
    status: 'draft',
    params,
    fifths,
    chords,
    functions: ['T (I)', 'S (IV)', params.level === 5 ? 'D7 (V7)' : 'D (V)', 'T (I)'],
    given,
    example,
    score: satbScore(given, fifths),
    choices: [],
    clef: 'treble',
  };
}
/** Canonical, bounded answer format. No arbitrary score, rules or prose enter the tutor. */
export function satbAnswerId(slices: SatbAnswer): string {
  return (
    'satb:' +
    JSON.stringify(
      slices.map((slice) => SATB_VOICES.map((v) => (slice[v] ? formatPitch(slice[v]) : null))),
    )
  );
}
export function satbAnswer(item: VoiceLeadingItem, answer: string | null): SatbAnswer | undefined {
  if (!answer?.startsWith('satb:') || answer.length > 512) return undefined;
  try {
    const value: unknown = JSON.parse(answer.slice(5));
    if (!Array.isArray(value) || value.length !== 4) return undefined;
    const slices = value.map((row: unknown) => {
      if (!Array.isArray(row) || row.length !== 4) throw new RangeError('row');
      return Object.fromEntries(
        SATB_VOICES.map((v, i) => {
          const token: unknown = row[i];
          if (token === null) return [v, null];
          if (typeof token !== 'string' || !/^[A-G](?:bb|b|##|#)?[1-7]$/.test(token))
            throw new RangeError('pitch');
          const pitch = parsePitch(token);
          if (midi(pitch) < 21 || midi(pitch) > 108) throw new RangeError('range');
          return [v, pitch];
        }),
      ) as unknown as FourPartSlice;
    });
    if (
      slices.some((slice, at) =>
        SATB_VOICES.some((v) => {
          const fixed = item.given[at]?.[v];
          return fixed && (!slice[v] || !equals(fixed, slice[v]));
        }),
      )
    )
      return undefined;
    return slices;
  } catch {
    return undefined;
  }
}
export type SatbIssue =
  | VoiceLeadingFinding
  | {
      readonly rule: 'missing-note' | 'chord-tone' | 'chord-incomplete' | 'root-bass';
      readonly severity: 'error';
      readonly at: number;
      readonly voices: readonly Voice[];
    };
export function checkSatb(item: VoiceLeadingItem, answer: string | null) {
  const slices = satbAnswer(item, answer);
  const issues: SatbIssue[] = [];
  if (slices) {
    for (const [at, slice] of slices.entries()) {
      const harmony = item.chords[at];
      if (!harmony) throw new RangeError('SATB task harmony missing');
      const tones = chordTones(harmony);
      for (const voice of SATB_VOICES) {
        const p = slice[voice];
        if (!p) issues.push({ rule: 'missing-note', severity: 'error', at, voices: [voice] });
        else if (!tones.some((t) => sameNoteName(t, p)))
          issues.push({ rule: 'chord-tone', severity: 'error', at, voices: [voice] });
      }
      // Triads complete; in V7 only the fifth may be omitted. Bass remains the root.
      const required = tones.filter((_, i) => !(tones.length === 4 && i === 2));
      if (required.some((t) => !SATB_VOICES.some((v) => slice[v] && sameNoteName(t, slice[v]))))
        issues.push({ rule: 'chord-incomplete', severity: 'error', at, voices: SATB_VOICES });
      if (slice.bass && !sameNoteName(slice.bass, harmony.root))
        issues.push({ rule: 'root-bass', severity: 'error', at, voices: ['bass'] });
    }
    issues.push(...analyzeVoiceLeading(slices, SATB_DRAFT_RULES, satbOptions(item)));
  }
  const complete = !!slices && slices.every((s) => SATB_VOICES.every((v) => s[v] !== null));
  return {
    status: 'draft' as const,
    profile: SATB_DRAFT_PROFILE,
    valid: !!slices,
    complete,
    passed: complete && !issues.some((i) => i.severity === 'error'),
    issues,
  };
}
export function evaluateSatb(item: VoiceLeadingItem, answer: string): Evaluation {
  const checked = checkSatb(item, answer);
  return {
    answer,
    expected: satbAnswerId(item.example),
    validAnswer: checked.valid && checked.complete,
    correct: checked.passed,
  };
}

export type { Voice } from '@harmonia/theory';
export function satbIssueBars(issue: SatbIssue): readonly number[] {
  return issue.rule in VOICE_LEADING_RULE_PHASE &&
    VOICE_LEADING_RULE_PHASE[issue.rule as keyof typeof VOICE_LEADING_RULE_PHASE] === 'motion' &&
    issue.at > 0
    ? [issue.at - 1, issue.at]
    : [issue.at];
}
