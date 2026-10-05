// Prüft Theorie-Engine und Übungs-Framework unter Deno (Laufzeit der Supabase Edge Functions).
// Aufruf: pnpm check:deno

import {
  createRng as exerciseRng,
  generateExercise,
  evaluateExercise,
  expectedAnswer,
  exerciseFeedback,
  createLessonSession,
} from '../packages/exercises/src/index.ts';
import { firstLesson, catalogue } from '../packages/content/src/authoring.ts';
import { publicCatalogue, resolveLesson } from '../packages/content/src/index.ts';

import {
  buildScale,
  checkMeasure,
  duration,
  durationName,
  durationSeconds,
  durationValue,
  formatFraction,
  parseTimeSignature,
  TRIPLET,
  chordName,
  chordSymbol,
  identifyChord,
  identifyChordFromMidi,
  createRng,
  diatonicTriads,
  formatInterval,
  frequency,
  intervalBetween,
  intervalName,
  key,
  keyName,
  keySignature,
  midi,
  parseNoteName,
  parsePitch,
  pitchName,
  relativeKey,
  transpose,
} from '../packages/theory/src/index.ts';

function check(label: string, actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    throw new Error(`${label}: erwartet ${String(expected)}, erhalten ${String(actual)}`);
  }
  console.log(`ok  ${label}`);
}

const exercise = generateExercise(
  { type: 'INTERVAL_IDENTIFY_VISUAL', params: { intervals: ['m3', 'M3', 'P5'] } },
  exerciseRng('deno-exercises'),
);
check('Öffentlicher Katalog enthält keinen Entwurf', publicCatalogue(catalogue).lessons.length, 0);
check(
  'Unveröffentlichte Lektion nicht auflösbar',
  resolveLesson(publicCatalogue(catalogue), firstLesson.id),
  undefined,
);
check(
  'Versionierte Lektion mit zehn Aufgaben',
  createLessonSession(firstLesson, 'deno-lesson').initial.items.length,
  10,
);
const evaluation = evaluateExercise(exercise, expectedAnswer(exercise));
check('Übungsgenerator und Engine-Bewertung', evaluation.correct, true);
check(
  'Übungserklärung DE',
  exerciseFeedback(exercise, evaluation, 'de').message.includes('Klangabstand'),
  true,
);
check(
  'Übungserklärung UK',
  exerciseFeedback(exercise, evaluation, 'en-GB').message.includes('semitones'),
  true,
);

check('midi(C4)', midi(parsePitch('C4')), 60);
check('frequency(A4)', frequency(parsePitch('A4')), 440);
check('verminderte Quarte C4 → Fb4', pitchName(transpose(parsePitch('C4'), 3, 4)), 'F♭4');
check(
  'Helmholtz fis¹',
  pitchName(parsePitch('F#4'), { system: 'de', octave: 'helmholtz' }),
  'fis¹',
);
check('Heses', pitchName(parsePitch('Bbb3'), { system: 'de', octave: 'none' }), 'Heses');
check('Seed deterministisch', createRng('duell').int(0, 1000), createRng('duell').int(0, 1000));
check(
  'Intervall C4 → Fb4',
  formatInterval(intervalBetween(parsePitch('C4'), parsePitch('Fb4'))),
  'd4',
);
check(
  'Intervallname',
  intervalName(intervalBetween(parsePitch('C4'), parsePitch('A3'))),
  'kleine Terz abwärts',
);
check(
  'Tonleiter gis-Moll harmonisch',
  buildScale(parsePitch('G#4'), 'harmonicMinor')
    .map((n) => pitchName(n, { system: 'de', octave: 'none' }))
    .join(' '),
  'Gis Ais H Cis Dis E Fisis',
);
check('Vorzeichen Es-Dur', keySignature(key(parseNoteName('Eb'))).length, 3);
check('Paralleltonart von Es-Dur', keyName(relativeKey(key(parseNoteName('Eb')))), 'c-Moll');
check(
  'Dreiklang auf der 7. Stufe von C-Dur',
  diatonicTriads(key(parseNoteName('C'))).at(-1)?.quality,
  'diminished',
);
const sixthChord = identifyChord(['E3', 'G3', 'C4'].map((t) => parsePitch(t)))[0];
check('Akkord E–G–C', sixthChord ? chordName(sixthChord.chord) : undefined, 'C-Dur-Sextakkord');
const [keyboardChord] = identifyChordFromMidi([52, 55, 60]);
check(
  'Akkordsymbol aus MIDI 52, 55, 60',
  keyboardChord ? chordSymbol(keyboardChord.chord) : undefined,
  'C/E',
);
check(
  '6/8-Takt mit punktierter Viertel und drei Achteln',
  checkMeasure(
    [duration('quarter', 1), duration('eighth'), duration('eighth'), duration('eighth')],
    parseTimeSignature('6/8'),
  ).status,
  'complete',
);
check(
  'Triolenachtel als Bruch',
  formatFraction(durationValue(duration('eighth', 0, TRIPLET))),
  '1/12',
);
check(
  'Triolenachtel bei ♩ = 120 in Millisekunden',
  Math.round(durationSeconds(duration('eighth', 0, TRIPLET), { bpm: 120 }) * 1000),
  167,
);
check(
  'UK-Name',
  durationName(duration('quarter', 1), { language: 'en', variant: 'uk' }),
  'dotted crotchet',
);
console.log('Theorie-Engine, Übungen und erste Lektion laufen unter Deno.');
