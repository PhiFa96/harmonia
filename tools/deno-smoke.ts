// Prüft, dass die Theorie-Engine unverändert unter Deno läuft (Laufzeit der Supabase Edge Functions).
// Aufruf: pnpm check:deno

import {
  buildScale,
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
console.log('Theorie-Engine läuft unter Deno.');
