// Tonhöhe von Audiodateien messen (für die Aufbereitung der Klavierproben). Node + ffmpeg.

import { spawnSync } from 'node:child_process';

/** Hohe Abtastrate: bei hohen Tönen ist eine Periode sonst nur wenige Samples lang (ungenau). */
export const ANALYSIS_RATE = 176400;

/** Datei als Mono-Float32 dekodieren. */
export function decode(file, rate = ANALYSIS_RATE) {
  const result = spawnSync(
    'ffmpeg',
    ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '1', '-ar', String(rate), '-'],
    {
      maxBuffer: 256 * 1024 * 1024,
    },
  );
  if (result.status !== 0) {
    throw new Error(String(result.stderr));
  }
  const bytes = result.stdout;
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.length / 4);
}

/**
 * Grundfrequenz nach YIN (de Cheveigné & Kawahara 2002): kumulierte, normierte Differenzfunktion,
 * erstes Minimum unter der Schwelle, parabolisch verfeinert.
 */
export function yin(signal, rate, minHz, maxHz) {
  const maxLag = Math.ceil(rate / minHz);
  const minLag = Math.floor(rate / maxHz);
  const size = Math.min(signal.length - maxLag, 4 * maxLag);
  const d = new Float64Array(maxLag + 2);
  for (let lag = 1; lag <= maxLag + 1; lag++) {
    let sum = 0;
    for (let i = 0; i < size; i++) {
      const diff = signal[i] - signal[i + lag];
      sum += diff * diff;
    }
    d[lag] = sum;
  }
  const cmnd = new Float64Array(maxLag + 2);
  cmnd[0] = 1;
  let running = 0;
  for (let lag = 1; lag <= maxLag + 1; lag++) {
    running += d[lag];
    cmnd[lag] = (d[lag] * lag) / running;
  }
  let best = -1;
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (cmnd[lag] < 0.15) {
      while (lag + 1 <= maxLag && cmnd[lag + 1] < cmnd[lag]) lag++;
      best = lag;
      break;
    }
  }
  if (best < 0) {
    best = minLag;
    for (let lag = minLag; lag <= maxLag; lag++) if (cmnd[lag] < cmnd[best]) best = lag;
  }
  const a = cmnd[best - 1];
  const b = cmnd[best];
  const c = cmnd[best + 1];
  const shift = (a - c) / (2 * (a - 2 * b + c)) || 0;
  return rate / (best + shift);
}

/** Gleichstufige Frequenz (a¹ = 440 Hz). */
export function equalTempered(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

/**
 * Misst eine Klavierprobe: Beginn (erstes Sample über −40 dBFS) und Abweichung des Grundtons
 * von der gleichstufigen Erwartung in Cent, gemessen 150 ms nach dem Anschlag (Hammergeräusch abgeklungen).
 */
export function measureSample(file, midi) {
  const samples = decode(file);
  const expected = equalTempered(midi);
  const onset = samples.findIndex((x) => Math.abs(x) > 0.01) / ANALYSIS_RATE;
  const start = Math.round((onset + 0.15) * ANALYSIS_RATE);
  const window = samples.subarray(start, start + ANALYSIS_RATE / 4);
  const measured = yin(window, ANALYSIS_RATE, expected / 1.5, expected * 1.5);
  return {
    expected,
    measured,
    cents: 1200 * Math.log2(measured / expected),
    onset,
    length: samples.length / ANALYSIS_RATE,
  };
}

/**
 * Stärkste Spektralspitze im Bereich ±150 Cent um den erwarteten Grundton (Hann-Fenster, Schritt 0,5 Cent),
 * gemessen 150 ms nach dem Anschlag. Für hohe Töne genauer als YIN (dort ist die Periode sehr kurz und die
 * Saiten sind stark inharmonisch); für tiefe Töne ungeeignet (Grundton schwach).
 */
export function spectralCents(file, midi) {
  const rate = 44100;
  const samples = decode(file, rate);
  const expected = equalTempered(midi);
  const onset = samples.findIndex((x) => Math.abs(x) > 0.01);
  const start = onset + Math.round(0.15 * rate);
  const w = samples.subarray(start, start + 32768);
  let best = { cents: 0, magnitude: -1 };
  for (let cents = -150; cents <= 150; cents += 0.5) {
    const f = expected * 2 ** (cents / 1200);
    let re = 0;
    let im = 0;
    for (let i = 0; i < w.length; i++) {
      const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (w.length - 1));
      const phase = (2 * Math.PI * f * i) / rate;
      re += w[i] * hann * Math.cos(phase);
      im -= w[i] * hann * Math.sin(phase);
    }
    const magnitude = Math.hypot(re, im);
    if (magnitude > best.magnitude) {
      best = { cents, magnitude };
    }
  }
  return best.cents;
}

/** Ab diesem Ton (C6) misst das Spektrum genauer als YIN, darunter umgekehrt (verglichen in P1.17). */
export const SPECTRAL_FROM_MIDI = 84;

/** Stimmung einer Probe in Cent gegenüber gleichstufig, mit dem für die Lage genaueren Verfahren. */
export function tuningCents(file, midi) {
  return midi >= SPECTRAL_FROM_MIDI ? spectralCents(file, midi) : measureSample(file, midi).cents;
}
