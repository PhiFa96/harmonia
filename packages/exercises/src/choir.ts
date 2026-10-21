import { parseScore } from '@harmonia/notation';
import type { Score } from '@harmonia/notation';
import { formatPitch, midi, parsePitch } from '@harmonia/theory';
import type { Pitch, Rng, Voice } from '@harmonia/theory';
import type { Evaluation } from './types.ts';
import { SATB_VOICES } from './voice-leading.ts';

export interface ChoirParams {
  readonly voice: Voice;
  readonly piece: 'home' | 'arch';
}
export interface ChoirItem {
  readonly type: 'CHOIR_PART';
  readonly status: 'draft';
  readonly params: ChoirParams;
  readonly bpm: number;
  readonly parts: Readonly<Record<Voice, readonly Pitch[]>>;
  readonly score: Score;
  readonly choices: readonly string[];
  readonly clef: 'treble' | 'bass';
}
/** Original exercises, written for this project; no arrangements of third-party scores. */
const PIECES = {
  home: {
    soprano: 'E4 G4 F4 F4 D4 D4 E4 E4',
    alto: 'C4 C4 C4 C4 B3 B3 C4 C4',
    tenor: 'G3 G3 A3 A3 G3 G3 G3 G3',
    bass: 'C3 E3 F3 F3 G2 G2 C3 C3',
  },
  arch: {
    soprano: 'E4 E4 F4 E4 D4 F4 E4 E4',
    alto: 'C4 C4 C4 C4 B3 B3 C4 C4',
    tenor: 'G3 G3 A3 G3 G3 G3 G3 G3',
    bass: 'C3 C3 F3 E3 G2 G2 C3 C3',
  },
} as const;
export function choirScore(item: Pick<ChoirItem, 'parts'>, solo?: Voice): Score {
  const staff = (clef: string, voices: readonly Voice[]) =>
    `${clef} | key:C | 4/4 | ` +
    Array.from({ length: 4 }, (_, bar) =>
      voices
        .map((voice) =>
          item.parts[voice]
            .slice(bar * 2, bar * 2 + 2)
            .map((p) => `${formatPitch(p)}/2`)
            .join(' '),
        )
        .join(' & '),
    ).join(' | ');
  return parseScore(
    solo
      ? staff(solo === 'bass' || solo === 'tenor' ? 'bass' : 'treble', [solo])
      : `${staff('treble', ['soprano', 'alto'])}\n${staff('bass', ['tenor', 'bass'])}`,
  );
}
export function generateChoir(params: ChoirParams, rng: Rng): ChoirItem {
  if (!SATB_VOICES.includes(params.voice) || !Object.hasOwn(PIECES, params.piece))
    throw new RangeError('Choir parameters');
  const parts = Object.fromEntries(
    SATB_VOICES.map((v) => [v, PIECES[params.piece][v].split(' ').map(parsePitch)]),
  ) as unknown as ChoirItem['parts'];
  return {
    type: 'CHOIR_PART',
    status: 'draft',
    params,
    parts,
    bpm: rng.pick([60, 72, 80]),
    score: choirScore({ parts }),
    choices: [],
    clef: params.voice === 'bass' || params.voice === 'tenor' ? 'bass' : 'treble',
  };
}
export function choirEvents(item: ChoirItem, mode: 'backing' | 'all' | 'solo') {
  const voices =
    mode === 'solo'
      ? [item.params.voice]
      : SATB_VOICES.filter((v) => mode === 'all' || v !== item.params.voice);
  return item.parts.soprano.map((_, index) => ({
    beats: 2,
    pitches: voices.map((voice) => {
      const p = item.parts[voice][index];
      if (!p) throw new RangeError('Missing choir note');
      return p;
    }),
  }));
}
/** Twelve equally spaced bins over the central 70% of each note. No raw audio is retained. */
export const CHOIR_BINS = 12;
export type ChoirSamples = readonly (readonly (number | null)[])[];
export function choirAnswerId(samples: ChoirSamples): string {
  return `choir:${JSON.stringify(samples)}`;
}
export function choirAnswer(item: ChoirItem, answer: string | null): ChoirSamples | undefined {
  if (!answer?.startsWith('choir:') || answer.length > 1400) return undefined;
  try {
    const data: unknown = JSON.parse(answer.slice(6));
    if (!Array.isArray(data) || data.length !== item.parts[item.params.voice].length)
      return undefined;
    if (
      !data.every(
        (row: unknown) =>
          Array.isArray(row) &&
          row.length === CHOIR_BINS &&
          row.every(
            (n: unknown) =>
              n === null ||
              (typeof n === 'number' && Number.isInteger(n) && n >= 2100 && n <= 10800),
          ),
      )
    )
      return undefined;
    return data as ChoirSamples;
  } catch {
    return undefined;
  }
}
const median = (xs: readonly number[]) => {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};
export function choirExpected(item: ChoirItem): string {
  return choirAnswerId(
    item.parts[item.params.voice].map((p) => Array<number>(CHOIR_BINS).fill(midi(p) * 100)),
  );
}
export function assessChoir(item: ChoirItem, answer: string | null) {
  const samples = choirAnswer(item, answer);
  const targets = item.parts[item.params.voice].map((p) => midi(p) * 100);
  // One octave displacement for the whole take, never a separate correction for each note.
  const differences =
    samples?.flatMap((row, i) =>
      row.filter((n): n is number => n !== null).map((n) => n - (targets[i] ?? 0)),
    ) ?? [];
  const octaveShift = Math.round(median(differences) / 1200);
  const notes = targets.map((target, index) => {
    const values = (samples?.[index] ?? []).filter((n): n is number => n !== null);
    const inTune = values.filter((n) => Math.abs(n - target - octaveShift * 1200) <= 50).length;
    return {
      index,
      coverage: values.length / CHOIR_BINS,
      deviation: values.length ? median(values) - target - octaveShift * 1200 : null,
      passed: values.length >= 8 && inTune / values.length >= 0.75,
    };
  });
  return {
    valid: !!samples,
    octaveShift,
    notes,
    passed: !!samples && notes.every((n) => n.passed),
  };
}
export function evaluateChoir(item: ChoirItem, answer: string): Evaluation {
  const report = assessChoir(item, answer);
  return {
    answer,
    expected: choirExpected(item),
    validAnswer: report.valid,
    correct: report.passed,
  };
}
/** Audio-relative seconds, after compensating frame midpoint/output latency in the caller. */
export function createChoirCollector(item: ChoirItem) {
  const duration = 120 / item.bpm;
  const bins = item.parts[item.params.voice].map(() =>
    Array.from({ length: CHOIR_BINS }, () => [] as number[]),
  );
  return {
    add(seconds: number, pitchCents: number | null) {
      if (
        !Number.isFinite(seconds) ||
        seconds < 0 ||
        pitchCents === null ||
        !Number.isFinite(pitchCents) ||
        pitchCents < 2100 ||
        pitchCents > 10800
      )
        return;
      const index = Math.floor(seconds / duration),
        fraction = seconds / duration - index;
      if (fraction < 0.15 || fraction >= 0.85) return;
      const bin = bins[index]?.[Math.floor(((fraction - 0.15) / 0.7) * CHOIR_BINS)];
      // Bounded memory; many callbacks cannot manufacture more temporal coverage.
      if (bin && bin.length < 8) bin.push(Math.round(pitchCents));
    },
    answer: () =>
      choirAnswerId(bins.map((row) => row.map((bin) => (bin.length ? median(bin) : null)))),
  };
}
