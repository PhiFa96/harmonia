import {
  note,
  chord,
  rest,
  singleStaffScore,
  parseScore,
  scoreTimeline,
  validateScore,
} from '@harmonia/notation';
import type { Score } from '@harmonia/notation';
import { duration, midi, parsePitch, parseTimeSignature } from '@harmonia/theory';
import type { Rng } from '@harmonia/theory';
import type { ListeningItem, ListeningParams } from './types.ts';

export const LISTENING_QUESTIONS = [
  'pulse',
  'rhythm-compare',
  'rhythm-choice',
  'pitch-direction',
  'melody-compare',
  'observation',
] as const;
// Eigene vollständige Viertel-/Achtel-Beispiele; gleiche Tonhöhe isoliert den Rhythmus.
export const LISTENING_RHYTHMS = [
  'G4/4 G4/4 G4/4 G4/4',
  'G4/8 G4/8 G4/4 G4/4 G4/4',
  'G4/4 G4/8 G4/8 G4/4 G4/4',
  'G4/4 G4/4 G4/8 G4/8 G4/4',
  'G4/8 G4/8 G4/4 r/4 G4/4',
  'G4/4 r/8 G4/8 G4/4 G4/4',
] as const;
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new RangeError('Hörquelle fehlt');
  return value;
}
function rhythm(index: number): Score {
  const source = LISTENING_RHYTHMS[index];
  if (!source) throw new RangeError('Rhythmus fehlt');
  return parseScore(`treble | 4/4 | ${source}`);
}
function checked(item: ListeningItem) {
  if (
    !LISTENING_QUESTIONS.includes(item.question) ||
    !Number.isFinite(item.bpm) ||
    item.bpm < 60 ||
    item.bpm > 120
  )
    throw new RangeError('Ungültige Hörfrage');
  const count = ['pulse', 'rhythm-compare', 'melody-compare'].includes(item.question) ? 2 : 1;
  if (
    item.clips.length !== count ||
    item.clips.some(
      (s) =>
        validateScore(s, { allowPickup: false }).length ||
        s.staves.length !== 1 ||
        s.staves[0]?.measures.length !== 1,
    )
  )
    throw new RangeError('Hörfrage braucht vollständige eintaktige Klangquellen');
  return item.clips.map((s) => scoreTimeline(s, { bpm: 60 }));
}
/** Ganze hörbare Quellen, einschließlich Tonende und Pausen, unabhängig von Übersetzung/Metadaten. */
function soundKey(score: Score, pitch: boolean): string {
  const t = scoreTimeline(score, { bpm: 60 });
  return JSON.stringify([
    t.durationSeconds,
    t.tones.map((n) => [n.onsetSeconds, n.durationSeconds, ...(pitch ? [midi(n.pitch)] : [])]),
  ]);
}
export function listeningAnswer(item: ListeningItem): string {
  const clips = checked(item),
    first = clips[0],
    second = clips[1];
  if (!first) throw new RangeError('Hörquelle fehlt');
  if (item.question === 'pulse') {
    const notes = first.tones,
      n = notes.length;
    if (
      ![2, 3, 4].includes(n) ||
      first.durationSeconds !== n ||
      notes.some(
        (tone, i) =>
          tone.onsetSeconds !== i ||
          tone.durationSeconds !== 1 ||
          midi(tone.pitch) !== (i === 0 ? 84 : 79),
      ) ||
      soundKey(required(item.clips[0]), true) !== soundKey(required(item.clips[1]), true)
    )
      throw new RangeError('Pulsbeispiel braucht zwei gleiche Gruppen mit betontem Start');
    return `listening:pulse:${String(n)}`;
  }
  if (item.question === 'rhythm-compare' || item.question === 'melody-compare') {
    if (!second) throw new RangeError('Zweite Hörquelle fehlt');
    const same =
      soundKey(required(item.clips[0]), item.question === 'melody-compare') ===
      soundKey(required(item.clips[1]), item.question === 'melody-compare');
    return same ? 'listening:same' : 'listening:different';
  }
  if (item.question === 'pitch-direction') {
    const a = first.tones[0],
      b = first.tones[1];
    if (
      first.tones.length !== 2 ||
      !a ||
      !b ||
      a.onsetSeconds !== 0 ||
      b.onsetSeconds !== a.durationSeconds
    )
      throw new RangeError('Richtungsfrage braucht zwei nacheinander klingende Töne');
    const distance = midi(b.pitch) - midi(a.pitch);
    return distance === 0 ? 'listening:repeat' : distance > 0 ? 'listening:up' : 'listening:down';
  }
  if (item.question === 'rhythm-choice') {
    if (
      item.candidates?.length !== 3 ||
      new Set(item.candidates.map((s) => soundKey(s, false))).size !== 3
    )
      throw new RangeError('Rhythmusauswahl braucht drei verschiedene vollständige Möglichkeiten');
    const index = item.candidates.findIndex(
      (s) => soundKey(s, false) === soundKey(required(item.clips[0]), false),
    );
    if (index < 0) throw new RangeError('Passendes Notenbild fehlt');
    return `listening:option:${String(index + 1)}`;
  }
  const together = first.tones.some((tone, i) =>
    first.tones
      .slice(i + 1)
      .some(
        (other) =>
          midi(tone.pitch) !== midi(other.pitch) &&
          tone.onsetSeconds < other.onsetSeconds + other.durationSeconds &&
          other.onsetSeconds < tone.onsetSeconds + tone.durationSeconds,
      ),
  );
  return together ? 'listening:together' : 'listening:one-at-a-time';
}
/** Absolute Ton-/Rhythmusvarianten: keine Änderung durch bloßes Mischen der Antwortknöpfe. */
export function listeningVariantKey(item: ListeningItem): string {
  checked(item);
  return JSON.stringify([
    item.question,
    item.clips.map((s) =>
      soundKey(s, item.question !== 'rhythm-compare' && item.question !== 'rhythm-choice'),
    ),
  ]);
}
export function listeningTimeline(item: ListeningItem) {
  checked(item);
  let offset = 0;
  const tones: ReturnType<typeof scoreTimeline>['tones'][number][] = [];
  for (const [index, score] of item.clips.entries()) {
    if (index && item.question !== 'pulse') offset += 0.75;
    const timeline = scoreTimeline(score, { bpm: item.bpm });
    tones.push(
      ...timeline.tones.map((tone) => ({ ...tone, onsetSeconds: tone.onsetSeconds + offset })),
    );
    offset += timeline.durationSeconds;
  }
  return { tones, durationSeconds: offset };
}
export function generateListening(params: ListeningParams, rng: Rng): ListeningItem {
  if (
    !LISTENING_QUESTIONS.includes(params.question) ||
    params.tempos?.length === 0 ||
    params.tempos?.some((n) => !Number.isInteger(n) || n < 60 || n > 120)
  )
    throw new RangeError('Ungültige Hörparameter');
  const bpm = rng.pick(params.tempos ?? [72, 90, 108]),
    question = params.question;
  let clips: readonly Score[], candidates: readonly Score[] | undefined, choices: readonly string[];
  if (question === 'pulse') {
    const n = rng.pick([2, 3, 4]),
      score = singleStaffScore(
        [
          Array.from({ length: n }, (_, i) =>
            note(parsePitch(i === 0 ? 'C6' : 'G5'), duration('quarter')),
          ),
        ],
        { timeSignature: parseTimeSignature(`${String(n)}/4`) },
      );
    clips = [score, score];
    choices = [2, 3, 4].map((n) => `listening:pulse:${String(n)}`);
  } else if (question === 'rhythm-compare' || question === 'rhythm-choice') {
    const indices = rng.shuffle(LISTENING_RHYTHMS.map((_, i) => i)),
      a = indices[0],
      b = indices[1];
    if (a === undefined || b === undefined) throw new RangeError('Rhythmen fehlen');
    if (question === 'rhythm-choice') {
      candidates = indices.slice(0, 3).map(rhythm);
      clips = [rng.pick(candidates)];
      choices = [1, 2, 3].map((n) => `listening:option:${String(n)}`);
    } else {
      clips = [rhythm(a), rhythm(rng.pick([true, false]) ? a : b)];
      choices = ['listening:same', 'listening:different'];
    }
  } else if (question === 'pitch-direction') {
    const from = rng.pick(['F4', 'G4', 'A4', 'B4']),
      to = rng.pick(['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5']);
    clips = [
      singleStaffScore([
        [note(parsePitch(from), duration('half')), note(parsePitch(to), duration('half'))],
      ]),
    ];
    choices = ['listening:up', 'listening:down', 'listening:repeat'];
  } else if (question === 'melody-compare') {
    const pitches = ['E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
      sequence = Array.from({ length: 4 }, () => rng.pick(pitches));
    const other = [...sequence];
    if (rng.pick([true, false])) {
      const index = rng.int(0, 3);
      other[index] = rng.pick(pitches.filter((p) => p !== sequence[index]));
    }
    const score = (s: readonly string[]) =>
      singleStaffScore([s.map((p) => note(parsePitch(p), duration('quarter')))]);
    clips = [score(sequence), score(other)];
    choices = ['listening:same', 'listening:different'];
  } else {
    const together = rng.pick([true, false]),
      p = rng.pick(['E4', 'F4', 'G4']);
    const sound = together
      ? chord(
          [p, 'B4'].map((p) => ({ pitch: parsePitch(p), tie: false })),
          duration('half'),
        )
      : note(parsePitch(p), duration('half'));
    clips = [
      singleStaffScore([
        [sound, rest(duration('quarter')), note(parsePitch('A4'), duration('quarter'))],
      ]),
    ];
    choices = [
      'listening:one-at-a-time',
      'listening:together',
      'listening:date',
      'listening:place',
    ];
  }
  const item: ListeningItem = {
    type: 'LISTENING_CHOICE',
    question,
    bpm,
    clips,
    ...(candidates ? { candidates } : {}),
    choices: rng.shuffle(choices),
  };
  listeningAnswer(item);
  return item;
}
