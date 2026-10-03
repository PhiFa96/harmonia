// Bereitet Klavierproben für die App auf (P1.17):
// Auswahl in kleinen Terzen (A, C, Dis, Fis von A0 bis C8), Stille am Anfang entfernen, auf 4 s kürzen
// mit Ausblenden, Mono, jede Probe auf gleiche Lautheit (EBU R128, LUFS), damit benachbarte Töne aus
// verschiedenen Aufnahmen nicht springen; danach gemeinsam so, dass keine Spitze −1 dBFS übersteigt.
// MP3 (VBR). Schreibt die Dateien nach apps/mobile/assets/sounds/piano und eine Liste für die App.
//
// Aufruf (danach formatieren und prüfen):
//   node tools/prepare-samples.mjs <Quellordner> [--pattern "{note}.ogg"] [--source "Beschreibung"]
//   pnpm format && node tools/check-samples.mjs
//
// {note} wird durch den Notennamen ersetzt: Stammton, „s“ für Kreuz, Oktave (A0, Ds4, Fs7, C8),
// {sharp} durch dieselbe Schreibweise mit „#“ (D#4). Beispiele:
//   Tone.js-Kopie (OGG Vorbis):   --pattern "{note}.ogg"
//   Salamander-Original (FLAC):   --pattern "{sharp}v8.flac"   (Dateinamen vorher prüfen)
//
// Voraussetzung: ffmpeg mit libmp3lame.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { tuningCents } from './lib/pitch.mjs';

const root = new URL('..', import.meta.url).pathname;
const OUT_DIR = join(root, 'apps/mobile/assets/sounds/piano');
const LIST_FILE = join(root, 'apps/mobile/src/audio/piano-samples.ts');

const LENGTH = 4; // Sekunden
const FADE = 0.5; // Ausblenden am Ende (Sekunden)
const PEAK_DB = -1; // lauteste Probe nach der Aufbereitung
const QUALITY = 4; // LAME VBR-Qualität (0 = beste, 9 = kleinste)
const ATTACK = 0.6; // Lautheit wird über den Anschlag gemessen (Sekunden)

const args = process.argv.slice(2);
const sourceDir = args.find((a) => !a.startsWith('--'));
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
if (!sourceDir) {
  console.error('Quellordner fehlt (siehe Kommentar oben).');
  process.exit(1);
}
const pattern = option('pattern', '{note}.ogg');
const sourceText = option('source', 'Salamander Grand Piano V3');

/** Stützstellen: A0 (MIDI 21) und dann alle drei Halbtöne bis C8 (MIDI 108), wie die Aufnahmen. */
const NAMES = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
const notes = [];
for (let midi = 21; midi <= 108; midi += 3) {
  const name = NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  notes.push({ midi, note: `${name}${octave}`, sharp: `${name.replace('s', '#')}${octave}` });
}

/** ffmpeg aufrufen; gibt die Ausgabe auf stderr zurück (dort stehen Messwerte), wirft bei Fehlern. */
function ffmpeg(...a) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', '-y', ...a], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`ffmpeg fehlgeschlagen: ${result.stderr}`);
  }
  return result.stderr;
}

/** Filterkette ohne Verstärkung: Stille vorn weg (2 ms Vorlauf bleiben), kürzen, ausblenden, Mono. */
const shape = [
  'silenceremove=start_periods=1:start_threshold=-60dB:start_silence=0.002',
  `atrim=0:${LENGTH}`,
  `afade=t=out:st=${LENGTH - FADE}:d=${FADE}`,
  'pan=mono|c0=0.5*c0+0.5*c1',
].join(',');

// 1. Durchgang: Lautheit (EBU R128, integriert) und Spitzenpegel jeder Probe nach der Formung
const peaks = notes.map((n) => {
  const file = join(sourceDir, pattern.replace('{note}', n.note).replace('{sharp}', n.sharp));
  if (!existsSync(file)) {
    throw new Error(`Probe fehlt: ${file}`);
  }
  const log = ffmpeg('-i', file, '-af', `${shape},volumedetect`, '-f', 'null', '-');
  const max = /max_volume: (-?[\d.]+) dB/.exec(log);
  // Lautheit des Anschlags (erste 0,6 s): Übungstöne sind kurz, das Abklingen zählt kaum
  const early = ffmpeg(
    '-i',
    file,
    '-af',
    `${shape},atrim=0:${ATTACK},ebur128=framelog=quiet`,
    '-f',
    'null',
    '-',
  );
  // Zusammenfassung von ebur128: „I: -23.4 LUFS“
  const loudness = /\bI:\s+(-?[\d.]+) LUFS/.exec(early);
  if (!max || !loudness) {
    throw new Error(`Pegel nicht lesbar: ${file}`);
  }
  return { ...n, file, max: Number(max[1]), lufs: Number(loudness[1]) };
});

// Gleiche Lautheit: jede Probe auf den Mittelwert, dann gemeinsam absenken, bis keine Spitze über −1 dBFS liegt
const target = peaks.reduce((sum, p) => sum + p.lufs, 0) / peaks.length;
for (const p of peaks) {
  p.gain = target - p.lufs;
}
const headroom = Math.min(...peaks.map((p) => PEAK_DB - (p.max + p.gain)));
// headroom > 0: alle lauter, bis die höchste Spitze −1 dBFS erreicht; < 0: alle leiser
for (const p of peaks) {
  p.gain += headroom;
}
const gain = peaks.reduce((sum, p) => sum + p.gain, 0) / peaks.length;

// 2. Durchgang: gemeinsame Verstärkung, MP3
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });
for (const p of peaks) {
  ffmpeg(
    '-i',
    p.file,
    '-af',
    `${shape},volume=${p.gain.toFixed(2)}dB`,
    '-ar',
    '44100',
    '-c:a',
    'libmp3lame',
    '-q:a',
    String(QUALITY),
    '-map_metadata',
    '-1',
    join(OUT_DIR, `${p.note}.mp3`),
  );
}

// Stimmung jeder fertigen Datei messen; der Sampler gleicht sie auf gleichstufig aus
for (const p of peaks) {
  p.cents = Math.round(tuningCents(join(OUT_DIR, `${p.note}.mp3`), p.midi) * 10) / 10;
}

const imports = peaks
  .map((p) => `import ${p.note} from '../../assets/sounds/piano/${p.note}.mp3';`)
  .join('\n');
const entries = peaks
  .map((p) => `  { midi: ${p.midi}, asset: ${p.note}, cents: ${p.cents} },`)
  .join('\n');
writeFileSync(
  LIST_FILE,
  `// Generiert von tools/prepare-samples.mjs – nicht von Hand ändern.
// Klavier: ${sourceText}, Alexander Holm, Lizenz CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/).
// Bearbeitet: Auswahl in kleinen Terzen, Stille am Anfang entfernt, auf ${String(LENGTH)} s gekürzt und ausgeblendet,
// Mono, gleiche Lautheit je Probe (EBU R128, mittlere Verstärkung ${gain.toFixed(1)} dB), MP3 (LAME VBR ${String(QUALITY)}).

${imports}

/**
 * Stützstellen: MIDI-Nummer, Asset und gemessene Stimmung in Cent gegenüber gleichstufig (a¹ = 440 Hz).
 * Gemessen mit tools/lib/pitch.mjs (YIN unter C6, Spektrum ab C6); der Sampler gleicht sie aus.
 */
export const PIANO_SAMPLES: readonly {
  readonly midi: number;
  readonly asset: number;
  readonly cents: number;
}[] = [
${entries}
];
`,
);

const files = readdirSync(OUT_DIR);
const size = files.reduce((sum, f) => sum + statSync(join(OUT_DIR, f)).size, 0);
console.log(
  `${String(files.length)} Proben, ${(size / 1024 / 1024).toFixed(2)} MB, Lautheit vorher ${Math.min(...peaks.map((p) => p.lufs)).toFixed(1)} bis ${Math.max(...peaks.map((p) => p.lufs)).toFixed(1)} LUFS → angeglichen, mittlere Verstärkung ${gain.toFixed(1)} dB → ${OUT_DIR}`,
);
