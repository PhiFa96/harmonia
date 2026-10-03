import { parsePitch } from '@harmonia/theory';
import { describe, expect, it } from 'vitest';

import { createAudioEngine } from './engine.ts';
import type { FakeOscillator } from './testing/fake-context.ts';
import { FakeContext, FakeTimers } from './testing/fake-context.ts';
import { SILENCE } from './voice.ts';

function setup(referenceHz?: number) {
  const ctx = new FakeContext();
  const timers = new FakeTimers();
  const engine = createAudioEngine(ctx, { timers, ...(referenceHz ? { referenceHz } : {}) });
  return { ctx, timers, engine };
}

const hz = (osc: FakeOscillator | undefined) => osc?.frequency.events[0]?.value ?? 0;
const p = parsePitch;

describe('Töne', () => {
  it('Loslassen einer Taste stoppt nur ihren Ton; andere Finger und Metronom laufen weiter', () => {
    const { ctx, timers, engine } = setup();
    engine.startMetronome(120, 4);
    const first = engine.playPitch(p('C4'), { duration: 4 });
    engine.playPitch(p('E4'), { duration: 4 });
    const notes = ctx.oscillators.filter((osc) => osc.type === 'triangle');
    ctx.currentTime = 0.5;
    first.stop();
    expect(notes[0]?.stopTimes.at(-1)).toBeCloseTo(0.53, 9);
    expect(notes[1]?.stopTimes.at(-1)).toBeCloseTo(4.02, 9);
    expect(timers.running).toBe(1);
    const count = notes[0]?.stopTimes.length;
    first.stop();
    expect(notes[0]?.stopTimes).toHaveLength(count ?? 0);
    ctx.currentTime = 1;
    engine.playPitch(p('G4'));
    expect(notes[0]?.connections).toHaveLength(0);
    expect(notes[1]?.connections).toHaveLength(1);
    engine.stopAll();
    expect(notes[1]?.stopTimes.at(-1)).toBeCloseTo(1.03, 9);
    expect(timers.running).toBe(0);
  });
  it('a¹ mit 440 Hz, sofort, mit Hüllkurve ohne Knacken', () => {
    const { ctx, engine } = setup();
    ctx.currentTime = 2;
    const playback = engine.playPitch(p('A4'));
    const [osc] = ctx.oscillators;
    expect(hz(osc)).toBe(440);
    expect(osc?.startTime).toBe(2);
    expect(playback.startTime).toBe(2);
    expect(playback.endTime).toBeCloseTo(3.5, 9);
    // Hüllkurve: von 0 einschwingen, exponentiell auf fast 0 ausklingen
    const envelope = ctx.gains[1]?.gain.events ?? [];
    expect(envelope[0]).toEqual({ kind: 'set', value: 0, time: 2 });
    expect(envelope[1]?.kind).toBe('linear');
    expect(envelope[1]?.time).toBeGreaterThan(2);
    expect(envelope.at(-1)).toEqual({ kind: 'exponential', value: SILENCE, time: 3.5 });
  });

  it('Kammerton einstellbar und gleichstufig: c¹ bei 440 Hz ≈ 261,63 Hz', () => {
    const { ctx, engine } = setup(442);
    engine.playPitch(p('A4'));
    expect(hz(ctx.oscillators[0])).toBe(442);
    const standard = setup();
    standard.engine.playPitch(p('C4'));
    expect(hz(standard.ctx.oscillators[0])).toBeCloseTo(261.626, 3);
  });

  it('Akkord: gleichzeitig, leiser je Ton, damit die Summe nicht übersteuert', () => {
    const { ctx, engine } = setup();
    engine.playChord([p('C4'), p('E4'), p('G4')]);
    expect(ctx.oscillators.map((o) => o.startTime)).toEqual([0, 0, 0]);
    const peaks = ctx.gains.slice(1).map((g) => g.gain.events[1]?.value ?? 0);
    expect(peaks.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(0.8 * Math.sqrt(3) + 1e-9);
    expect(peaks[0]).toBeCloseTo(0.8 / Math.sqrt(3), 9);
  });

  it('Arpeggio von unten nach oben, unabhängig von der Reihenfolge der Eingabe', () => {
    const { ctx, engine } = setup();
    engine.playChord([p('G4'), p('C4'), p('E4')], { arpeggio: 0.2 });
    const byStart = [...ctx.oscillators].sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0));
    expect(byStart.map((o) => Math.round(hz(o)))).toEqual([262, 330, 392]);
    expect(byStart.map((o) => o.startTime)).toEqual([0, 0.2, 0.4]);
  });

  it('Intervall nacheinander und gleichzeitig', () => {
    const melodic = setup();
    melodic.engine.playInterval(p('C4'), p('G4'), 'melodic', { duration: 1 });
    expect(melodic.ctx.oscillators.map((o) => o.startTime)).toEqual([0, 1]);
    const harmonic = setup();
    harmonic.engine.playInterval(p('C4'), p('G4'), 'harmonic');
    expect(harmonic.ctx.oscillators.map((o) => o.startTime)).toEqual([0, 0]);
  });
});

describe('Sequenz und Metronom', () => {
  it('Noten im Takt des Tempos, Metronom mit betontem ersten Schlag und Vorzähler', () => {
    const { ctx, timers, engine } = setup();
    const playback = engine.playSequence(
      [
        { pitches: [p('C4')], beats: 1 },
        { pitches: [], beats: 1 },
        { pitches: [p('E4'), p('G4')], beats: 2 },
      ],
      { tempo: 120, metronome: 4, countIn: 4 },
    );
    const lead = 0.05;
    const notes = ctx.oscillators.filter((o) => o.type === 'triangle');
    expect(notes.map((o) => o.startTime)).toEqual([lead + 2, lead + 3, lead + 3]);
    expect(playback.startTime).toBeCloseTo(lead + 2, 9);
    expect(playback.endTime).toBeCloseTo(lead + 4, 9);
    while (ctx.currentTime < 5) {
      ctx.currentTime += 0.025;
      timers.tick();
    }
    const clicks = ctx.oscillators.filter((o) => o.type === 'sine');
    // 4 Vorzähler + 4 Schläge der Sequenz; Betonung auf Schlag 1 jedes Takts
    expect(clicks.map((o) => o.startTime)).toEqual(
      [0, 1, 2, 3, 4, 5, 6, 7].map((i) => expect.closeTo(lead + i * 0.5, 9) as unknown),
    );
    expect(clicks.map(hz)).toEqual([1500, 1000, 1000, 1000, 1500, 1000, 1000, 1000]);
    expect(timers.running).toBe(0);
  });

  it('Metronom läuft bis stop', () => {
    const { ctx, timers, engine } = setup();
    const metronome = engine.startMetronome(60, 3);
    while (ctx.currentTime < 3.5) {
      ctx.currentTime += 0.025;
      timers.tick();
    }
    metronome.stop();
    const count = ctx.oscillators.length;
    ctx.currentTime += 5;
    timers.tick();
    expect(ctx.oscillators.length).toBe(count);
    expect(ctx.oscillators.map(hz)).toEqual([1500, 1000, 1000, 1500]);
  });

  it('stopAll beendet geplante Töne kurz nach jetzt und hält das Metronom an', () => {
    const { ctx, timers, engine } = setup();
    engine.startMetronome(120, 4);
    engine.playChord([p('C4'), p('E4')], { when: 1, duration: 4 });
    ctx.currentTime = 0.5;
    timers.tick();
    engine.stopAll();
    for (const osc of ctx.oscillators.filter((o) => o.type === 'triangle')) {
      expect(osc.stopTimes.at(-1)).toBeCloseTo(0.53, 9);
    }
    // Ausblenden statt hart abschneiden: Hüllkurve geht in 20 ms auf 0
    const envelope = ctx.gains.at(-1)?.gain.events.slice(-3);
    expect(envelope?.map((e) => e.kind)).toEqual(['cancel', 'set', 'linear']);
    expect(envelope?.at(-1)).toEqual({ kind: 'linear', value: 0, time: 0.52 });
    expect(timers.running).toBe(0);
  });

  it('verklungene Stimmen werden abgehängt', () => {
    const { ctx, engine } = setup();
    engine.playPitch(p('C4'), { duration: 0.5 });
    const [first] = ctx.oscillators;
    expect(first?.connections).toHaveLength(1);
    ctx.currentTime = 1;
    engine.playPitch(p('D4'));
    expect(first?.connections).toHaveLength(0);
    expect(ctx.oscillators[1]?.connections).toHaveLength(1);
  });
});

describe('Start und Latenz', () => {
  it('resume startet den Kontext nach einer Nutzeraktion', async () => {
    const { ctx, engine } = setup();
    expect(ctx.state).toBe('suspended');
    await engine.resume();
    expect(ctx.state).toBe('running');
  });

  it('meldet Abtastrate und, falls vorhanden, die vom System gemeldete Latenz', () => {
    const { engine } = setup();
    expect(engine.latency()).toEqual({ sampleRate: 48000 });
    const ctx = new FakeContext();
    const reported = createAudioEngine(ctx, {
      timers: new FakeTimers(),
      reportedLatency: () => ({ base: 0.01, output: 0.032 }),
    });
    expect(reported.latency()).toEqual({ sampleRate: 48000, base: 0.01, output: 0.032 });
  });
});
