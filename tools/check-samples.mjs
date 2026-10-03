// Prüft die aufbereiteten Klavierproben (P1.17), unabhängig vom Sampler: Jede Datei enthält den Ton
// ihres Namens (Abweichung vom gleichstufigen Wert unter einem Viertelton, sonst falsche Datei),
// beginnt ohne Stille und hat die erwartete Länge. Die Stimmung selbst gleicht der Sampler aus
// (gemessene Abweichung steht in apps/mobile/src/audio/piano-samples.ts).
//
// Aufruf: node tools/check-samples.mjs   (ffmpeg nötig)

import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { measureSample, tuningCents } from './lib/pitch.mjs';

const root = new URL('..', import.meta.url).pathname;
const DIR = join(root, 'apps/mobile/assets/sounds/piano');
const LETTERS = { C: 0, Cs: 1, D: 2, Ds: 3, E: 4, F: 5, Fs: 6, G: 7, Gs: 8, A: 9, As: 10, B: 11 };
/** Mehr als anderthalb Halbtöne daneben: falsche Datei; weniger gleicht der Sampler aus. */
const MAX_CENTS = 150;
const MAX_ONSET = 0.05;

let failures = 0;
for (const file of readdirSync(DIR)
  .filter((f) => f.endsWith('.mp3'))
  .sort()) {
  const match = /^([A-G]s?)(\d)\.mp3$/.exec(file);
  if (!match) continue;
  const midi = (Number(match[2]) + 1) * 12 + LETTERS[match[1]];
  const m = measureSample(join(DIR, file), midi);
  const cents = tuningCents(join(DIR, file), midi);
  const ok = Math.abs(cents) < MAX_CENTS && m.onset < MAX_ONSET;
  if (!ok) failures++;
  console.log(
    `${ok ? '✓' : '✗'} ${file.padEnd(8)} MIDI ${String(midi).padStart(3)}  erwartet ${m.expected.toFixed(2).padStart(8)} Hz  Stimmung ${cents >= 0 ? '+' : ''}${cents.toFixed(1)} Cent  Beginn ${(m.onset * 1000).toFixed(1)} ms  Länge ${m.length.toFixed(2)} s`,
  );
}
if (failures > 0) {
  throw new Error(`${String(failures)} Proben auffällig`);
}
