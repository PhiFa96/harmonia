// Prüft, dass die Theorie-Engine unverändert unter Deno läuft (Laufzeit der Supabase Edge Functions).
// Aufruf: pnpm check:deno

import {
  createRng,
  formatInterval,
  frequency,
  intervalBetween,
  intervalName,
  midi,
  parsePitch,
  pitchName,
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
console.log('Theorie-Engine läuft unter Deno.');
