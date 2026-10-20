import { chord as scoreChord, singleStaffScore } from '@harmonia/notation';
import {
  analyzeHarmony,
  chordPitches,
  classifyCadence,
  diatonicTriads,
  duration,
  keyFromFifths,
  keyFifths,
} from '@harmonia/theory';
import type { Chord, Rng } from '@harmonia/theory';
import { options } from './parameters.ts';
import type {
  CadenceItem,
  CadenceParams,
  ExerciseItem,
  FunctionItem,
  FunctionParams,
} from './types.ts';

export const CADENCE_TYPES = ['authentic', 'plagal', 'half', 'deceptive'] as const;
const CADENCE_DEGREES = {
  authentic: [5, 1],
  plagal: [4, 1],
  half: [1, 5],
  deceptive: [5, 6],
} as const;

export function isHarmonyItem(item: ExerciseItem): item is CadenceItem | FunctionItem {
  return item.type === 'CADENCE_IDENTIFY' || item.type === 'FUNCTION_ANALYSIS';
}
export function cadenceAnswer(item: CadenceItem): string {
  const type = classifyCadence(item.progression, item.key);
  if (!type) throw new RangeError('Kadenz nicht bestimmbar');
  return `cadence:${type}`;
}
export function functionAnswer(item: FunctionItem): string {
  const findings = analyzeHarmony(item.chord, item.key).filter(
    (value) => value.role !== 'secondary-dominant',
  );
  if (findings.length !== 1) throw new RangeError('Stufe nicht eindeutig');
  return `degree:${String(findings[0]?.degree)}`;
}
function scoreEvent(value: Chord, length: 'half' | 'whole') {
  return scoreChord(
    chordPitches(value, { octave: 4 }).map((pitch) => ({ pitch, tie: false })),
    duration(length),
  );
}
function fifths(values: readonly number[] | undefined): readonly number[] {
  const selected = values ?? [-1, 0, 1];
  if (!selected.length || selected.some((value) => !Number.isInteger(value) || Math.abs(value) > 3))
    throw new RangeError('Für Harmonieaufgaben sind Tonarten bis drei Vorzeichen unterstützt');
  return [...new Set(selected)];
}
export function generateCadence(params: CadenceParams, rng: Rng): CadenceItem {
  const types = params.types ?? CADENCE_TYPES;
  if (!types.length || types.some((type) => !CADENCE_TYPES.includes(type)))
    throw new RangeError('Ungültige Kadenzart');
  const key = keyFromFifths(rng.pick(fifths(params.fifths)));
  const triads = diatonicTriads(key);
  const type = rng.pick(types);
  const degrees = CADENCE_DEGREES[type];
  const progression = degrees.map((degree) => triads[degree - 1]?.chord);
  if (progression.some((value) => !value)) throw new RangeError('Kadenzakkord fehlt');
  const complete = progression as Chord[];
  const item: CadenceItem = {
    type: 'CADENCE_IDENTIFY',
    key,
    progression: complete,
    clef: 'treble',
    score: singleStaffScore([complete.map((value) => scoreEvent(value, 'half'))], {
      clef: 'treble',
      keySignature: { fifths: keyFifths(key), key },
    }),
    choices: options(
      `cadence:${type}`,
      CADENCE_TYPES.map((value) => `cadence:${value}`),
      rng,
    ),
  };
  if (cadenceAnswer(item) !== `cadence:${type}`)
    throw new RangeError('Kadenzgenerator widerspricht Analyse');
  return item;
}
export function generateFunction(params: FunctionParams, rng: Rng): FunctionItem {
  const degrees = params.degrees ?? [1, 2, 4, 5, 6];
  if (
    !degrees.length ||
    degrees.some((value) => !Number.isInteger(value) || value < 1 || value > 7)
  )
    throw new RangeError('Ungültige Stufe');
  if (params.notation && !['roman', 'function'].includes(params.notation))
    throw new RangeError('Ungültige Analysekonvention');
  const key = keyFromFifths(rng.pick(fifths(params.fifths)));
  const degree = rng.pick([...new Set(degrees)]);
  const value = diatonicTriads(key)[degree - 1];
  if (!value) throw new RangeError('Stufenakkord fehlt');
  const item: FunctionItem = {
    type: 'FUNCTION_ANALYSIS',
    key,
    chord: value.chord,
    notation: params.notation ?? 'roman',
    clef: 'treble',
    score: singleStaffScore([[scoreEvent(value.chord, 'whole')]], {
      clef: 'treble',
      keySignature: { fifths: keyFifths(key), key },
    }),
    choices: options(
      `degree:${String(degree)}`,
      [...new Set(degrees)].map((number) => `degree:${String(number)}`),
      rng,
    ),
  };
  if (functionAnswer(item) !== `degree:${String(degree)}`)
    throw new RangeError('Stufengenerator widerspricht Analyse');
  return item;
}

export function functionChoiceLabel(item: FunctionItem, answer: string): string {
  const degree = Number(answer.slice(7));
  if (!item.choices.includes(answer) || !Number.isInteger(degree))
    throw new RangeError('Ungültige Stufenantwort');
  const value = diatonicTriads(item.key)[degree - 1];
  if (!value) throw new RangeError('Stufe fehlt');
  const analysis = analyzeHarmony(value.chord, item.key).find((entry) => entry.degree === degree);
  if (!analysis) throw new RangeError('Stufenanalyse fehlt');
  return item.notation === 'roman' ? analysis.roman : analysis.functionSymbol;
}
