import { describe, expect, it } from 'vitest';
import { Note as TonalNote } from 'tonal';
import { scoreTimeline, validateScore } from '@harmonia/notation';
import { analyzeVoiceLeading, formatPitch, midi, parsePitch } from '@harmonia/theory';
import {
  createRng,
  generateExercise,
  evaluateExercise,
  expectedAnswer,
  exercisePrompt,
  exerciseFeedback,
  exerciseHints,
  hintText,
  createSession,
  skipVoiceExercise,
  sessionSummary,
  SATB_VOICES,
  itemVariantKey,
  createLessonSession,
  answerLesson,
  nextLessonExercise,
  lessonReviewItem,
  ratingBucket,
} from './index.ts';
import {
  assessChoir,
  choirAnswer,
  choirAnswerId,
  choirEvents,
  choirScore,
  createChoirCollector,
  generateChoir,
} from './choir.ts';
import { SATB_DRAFT_RULES } from './voice-leading.ts';

function required<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) throw new Error('Missing test fixture');
  return value;
}

describe('CHOIR_PART internal draft', () => {
  it.each([
    [0, [60, 60, 60], 0.1462021479383111],
    [1, [72, 60, 72], 0.9810509674716741],
    [42, [72, 72, 80], 0.6697340414393693],
    ['choir-legacy', [60, 60, 60], 0.6946458027232438],
    ['choir-tutor', [72, 80, 72], 0.8027321980334818],
  ] as const)(
    'preserves legacy tempos, C-major pitches and RNG consumption for %s',
    (seed, tempos, next) => {
      const rng = createRng(seed);
      const items = Array.from({ length: 3 }, () =>
        generateChoir({ voice: 'alto', piece: 'home' }, rng),
      );
      expect(items.map((item) => item.bpm)).toEqual(tempos);
      expect(items.every((item) => item.params.fifths === undefined)).toBe(true);
      expect(items[0]?.parts.alto.map((p) => formatPitch(p))).toEqual([
        'C4',
        'C4',
        'C4',
        'C4',
        'B3',
        'B3',
        'C4',
        'C4',
      ]);
      expect(rng.next()).toBe(next);
    },
  );

  it('separates explicit key rating profiles without changing legacy profiles', () => {
    const spec = { type: 'CHOIR_PART', params: { voice: 'alto', piece: 'home' } } as const;
    expect(ratingBucket(spec, 20)).toBe('g2:1:20:CHOIR_PART:{"piece":"home","voice":"alto"}');
    const keys = ([-2, 0, 2] as const).map((fifths) =>
      ratingBucket({ ...spec, params: { ...spec.params, fifths } }, 25),
    );
    expect(new Set(keys).size).toBe(3);
    expect(keys[1]).toBe('g2:1:25:CHOIR_PART:{"fifths":0,"piece":"home","voice":"alto"}');
    for (const fifths of [-3, -1, 1, 3, 0.5, NaN, Infinity])
      expect(() => generateChoir({ ...spec.params, fifths } as never, createRng(1))).toThrow();
  });

  for (const voice of SATB_VOICES)
    for (const piece of ['home', 'arch'] as const)
      for (const fifths of [-2, 0, 2] as const)
        it(`${voice}/${piece}/${String(fifths)}: written key, complete score, backing and grading use the same transposition`, () => {
          const item = generateChoir({ voice, piece, fifths }, createRng('choir-keys'));
          const original = generateChoir({ voice, piece }, createRng('choir-keys'));
          const shift = fifths;
          expect(validateScore(item.score)).toEqual([]);
          expect(item.score.staves.map((staff) => staff.keySignature.fifths)).toEqual([
            fifths,
            fifths,
          ]);
          for (const v of SATB_VOICES) {
            expect(item.parts[v].map(midi)).toEqual(original.parts[v].map((p) => midi(p) + shift));
            expect(item.parts[v].map((p) => formatPitch(p))).toEqual(
              original.parts[v].map((p) =>
                TonalNote.transpose(
                  formatPitch(p),
                  fifths === -2 ? '-2M' : fifths === 2 ? '2M' : '1P',
                ),
              ),
            );
            const solo = choirScore(item, v);
            expect(validateScore(solo)).toEqual([]);
            expect(solo.staves[0]?.keySignature.fifths).toBe(fifths);
            expect(scoreTimeline(solo, { bpm: item.bpm }).tones.map((note) => note.pitch)).toEqual(
              item.parts[v],
            );
          }
          expect(choirEvents(item, 'backing').map((event) => event.pitches)).toEqual(
            item.parts[voice].map((_, index) =>
              SATB_VOICES.filter((v) => v !== voice).map((v) => item.parts[v][index]),
            ),
          );
          expect(evaluateExercise(item, expectedAnswer(item)).correct).toBe(true);
          if (fifths !== 0)
            expect(evaluateExercise(item, expectedAnswer(original)).correct).toBe(false);
          expect(itemVariantKey({ ...item, bpm: item.bpm === 60 ? 80 : 60 })).toBe(
            itemVariantKey(item),
          );
        });

  it.each(SATB_VOICES)(
    '%s: fixed-key reviews change every target and reconstruct without relying on tempo',
    (voice) => {
      for (const piece of ['home', 'arch'] as const)
        for (const fifths of [-2, 0, 2] as const)
          for (const seed of [0, 1, 42, 'choir-review', 'other-review']) {
            const definition = {
              id: 'choir-review',
              contentVersion: 25,
              exercises: [{ type: 'CHOIR_PART', params: { voice, piece, fifths } }],
            } as const;
            let state = createLessonSession(definition, seed);
            const original = required(state.initial.items[0]);
            state = nextLessonExercise(
              answerLesson(
                state,
                choirAnswerId(Array.from({ length: 8 }, () => Array<null>(12).fill(null))),
              ),
            );
            expect(state.phase).toBe('review-intro');
            const repeated = required(state.review?.items[0]);
            if (original.type !== 'CHOIR_PART' || repeated.type !== 'CHOIR_PART')
              throw new Error('Choir fixture');
            expect(repeated.params.fifths).not.toBe(original.params.fifths);
            expect(repeated.params.piece).toBe(piece);
            expect(repeated.params.voice).toBe(voice);
            expect(
              repeated.parts[voice].every(
                (p, index) => midi(p) !== midi(required(original.parts[voice][index])),
              ),
            ).toBe(true);
            expect(itemVariantKey(repeated)).not.toBe(itemVariantKey(original));
            expect(evaluateExercise(repeated, expectedAnswer(original)).correct).toBe(false);
            expect(evaluateExercise(repeated, expectedAnswer(repeated)).correct).toBe(true);
            expect(lessonReviewItem(definition, seed, 0)).toEqual(repeated);
          }
    },
  );
  for (const voice of SATB_VOICES)
    for (const piece of ['home', 'arch'] as const) {
      it(`${voice}/${piece}: complete original score, reproducible generation and three backing parts`, () => {
        const spec = { type: 'CHOIR_PART', params: { voice, piece } } as const;
        const item = generateChoir(spec.params, createRng(42));
        expect(generateExercise(spec, createRng(42))).toEqual(item);
        expect(validateScore(item.score)).toEqual([]);
        expect(validateScore(choirScore(item, voice))).toEqual([]);
        for (const [index, event] of choirEvents(item, 'backing').entries()) {
          expect(event.pitches).toEqual(
            SATB_VOICES.filter((v) => v !== voice).map((v) => item.parts[v][index]),
          );
          expect(event.beats).toBe(2);
        }
        expect(choirEvents(item, 'solo').every((e) => e.pitches.length === 1)).toBe(true);
        expect(choirEvents(item, 'all').every((e) => e.pitches.length === 4)).toBe(true);
        expect(evaluateExercise(item, expectedAnswer(item))).toMatchObject({
          correct: true,
          validAnswer: true,
        });
        for (const locale of ['de', 'en-US', 'en-GB'] as const) {
          expect(exercisePrompt(item, locale)).not.toContain('exercise.');
          expect(
            exerciseFeedback(item, evaluateExercise(item, expectedAnswer(item)), locale).message,
          ).not.toContain('{{');
          expect(hintText(item, exerciseHints(item, 1), locale)).not.toContain('exercise.');
        }
      });
    }
  const item = generateChoir({ voice: 'soprano', piece: 'home' }, createRng(1));
  const perfect = () => required(choirAnswer(item, expectedAnswer(item))).map((row) => [...row]);
  it('reports every window in order with exact inclusive pitch boundaries and unchanged note grading', () => {
    const rows = perfect(),
      target = required(rows[0]?.[0]);
    rows[0] = [-51, -50, 0, 50, 51, 700, null, 0, 0, 0, 0, 0].map((offset) =>
      offset === null ? null : target + offset,
    );
    const note = required(assessChoir(item, choirAnswerId(rows)).notes[0]);
    expect(note).toMatchObject({
      index: 0,
      detectedWindows: 11,
      matchingWindows: 8,
      coverage: 11 / 12,
      deviation: 0,
      passed: false,
    });
    expect(note.windows.map((window) => window.index)).toEqual(
      Array.from({ length: 12 }, (_, i) => i),
    );
    expect(note.windows.map((window) => window.deviation)).toEqual([
      -51,
      -50,
      0,
      50,
      51,
      700,
      null,
      0,
      0,
      0,
      0,
      0,
    ]);
    expect(note.windows.map((window) => window.status)).toEqual([
      'low',
      'in-tune',
      'in-tune',
      'in-tune',
      'high',
      'high',
      'missing',
      'in-tune',
      'in-tune',
      'in-tune',
      'in-tune',
      'in-tune',
    ]);
  });

  it('distinguishes detection from matching windows, including the unchanged 75-percent boundary', () => {
    const rows = perfect(),
      target = required(rows[0]?.[0]);
    rows[0] = Array.from({ length: 12 }, (_, i) => target + (i < 9 ? 0 : 700));
    rows[1] = Array.from({ length: 12 }, (_, i) =>
      i < 6 ? required(rows[1]?.[0]) : i < 8 ? required(rows[1]?.[0]) + 700 : null,
    );
    const report = assessChoir(item, choirAnswerId(rows));
    expect(report.notes[0]).toMatchObject({
      detectedWindows: 12,
      matchingWindows: 9,
      deviation: 0,
      passed: true,
    });
    expect(report.notes[1]).toMatchObject({
      detectedWindows: 8,
      matchingWindows: 6,
      coverage: 8 / 12,
      passed: true,
    });
    expect(report.notes[1]?.windows.map((window) => window.status)).toEqual([
      ...Array<string>(6).fill('in-tune'),
      'high',
      'high',
      ...Array<string>(4).fill('missing'),
    ]);
  });

  it.each([-2, -1, 0, 1, 2])(
    'uses the same whole-take octave correction for displayed windows and grading (%s)',
    (shift) => {
      const rows = perfect().map((row) => row.map((n) => required(n) + shift * 1200));
      const target = required(rows[0]?.[0]);
      rows[0] = Array.from(
        { length: 12 },
        (_, index) => target + (index === 0 ? -51 : index === 11 ? 51 : 0),
      );
      const report = assessChoir(item, choirAnswerId(rows));
      expect(report.octaveShift).toBe(shift);
      expect(report.notes[0]?.windows[0]).toEqual({ index: 0, deviation: -51, status: 'low' });
      expect(report.notes[0]?.windows[11]).toEqual({ index: 11, deviation: 51, status: 'high' });
      expect(report.notes[0]).toMatchObject({
        matchingWindows: 10,
        detectedWindows: 12,
        passed: true,
      });
    },
  );

  it('keeps missing and invalid input explicit without inventing pitch values', () => {
    for (const answer of [
      null,
      'invalid',
      choirAnswerId(Array.from({ length: 8 }, () => Array<null>(12).fill(null))),
    ]) {
      const report = assessChoir(item, answer);
      expect(report.passed).toBe(false);
      for (const note of report.notes) {
        expect(note).toMatchObject({
          detectedWindows: 0,
          matchingWindows: 0,
          coverage: 0,
          deviation: null,
          passed: false,
        });
        expect(note.windows).toEqual(
          Array.from({ length: 12 }, (_, index) => ({ index, deviation: null, status: 'missing' })),
        );
      }
    }
  });
  it('grades each note, rejects silence and sparse detections', () => {
    const rows = perfect();
    rows[2] = Array<null>(12).fill(null);
    rows[4] = required(rows[4]).map((n, i) => (i < 7 ? n : null));
    const report = assessChoir(item, choirAnswerId(rows));
    expect(report.valid).toBe(true);
    expect(report.passed).toBe(false);
    expect(report.notes.map((n) => n.passed)).toEqual([
      true,
      true,
      false,
      true,
      false,
      true,
      true,
      true,
    ]);
  });
  it('accepts a consistent octave displacement, not changes within the take', () => {
    const rows = perfect().map((row) => row.map((n) => required(n) - 1200));
    expect(assessChoir(item, choirAnswerId(rows))).toMatchObject({ passed: true, octaveShift: -1 });
    rows[3] = required(rows[3]).map((n) => n + 1200);
    expect(assessChoir(item, choirAnswerId(rows)).notes[3]?.passed).toBe(false);
  });
  it('uses tolerance and proportion, not just a misleading median', () => {
    const rows = perfect();
    rows[0] = required(rows[0]).map((n, i) => required(n) + (i < 8 ? 0 : 180));
    rows[1] = required(rows[1]).map((n) => required(n) + 51);
    rows[2] = required(rows[2]).map((n) => required(n) - 50);
    const notes = assessChoir(item, choirAnswerId(rows)).notes;
    expect(notes[0]?.passed).toBe(false);
    expect(notes[1]?.passed).toBe(false);
    expect(notes[2]?.passed).toBe(true);
  });
  it('rejects malformed, oversized and wrong-length readings', () => {
    for (const answer of [
      '',
      'voice:6000',
      'choir:{}',
      'choir:[]',
      'choir:' + ' '.repeat(1400),
      choirAnswerId([[6000]]),
      choirAnswerId(perfect().map((row) => row.map(() => 2000))),
      choirAnswerId(perfect().map((row) => row.map(() => 6000.1))),
    ]) {
      expect(evaluateExercise(item, answer).validAnswer).toBe(false);
    }
  });
  it('collects timed notes, excludes boundaries/count-in and bounds callback floods', () => {
    const collector = createChoirCollector(item),
      duration = 120 / item.bpm;
    collector.add(-1, 6000);
    for (const [i, p] of item.parts.soprano.entries()) {
      collector.add(i * duration, midi(p) * 100 + 700);
      for (let bin = 0; bin < 12; bin++)
        collector.add((i + 0.15 + ((bin + 0.5) / 12) * 0.7) * duration, midi(p) * 100);
    }
    expect(assessChoir(item, collector.answer()).passed).toBe(true);
    const flood = createChoirCollector(item);
    for (let n = 0; n < 10000; n++) flood.add(duration * 0.2, 6400);
    expect(assessChoir(item, flood.answer()).notes[0]?.coverage).toBe(1 / 12);
  });
  it('requires raw PCM coverage separately from pitch detection and rejects gaps', () => {
    const quiet = createChoirCollector(item),
      incomplete = createChoirCollector(item),
      duration = 120 / item.bpm;
    for (let note = 0; note < 8; note++)
      for (let bin = 0; bin < 12; bin++) {
        const at = (note + 0.15 + ((bin + 0.5) / 12) * 0.7) * duration;
        quiet.add(at, null);
        if (note !== 7 || bin < 9) incomplete.add(at, 6400);
      }
    expect(quiet.inputComplete()).toBe(true);
    expect(assessChoir(item, quiet.answer()).passed).toBe(false);
    expect(incomplete.inputComplete()).toBe(false);
  });
  it('skips microphone work without a failed answer or denominator penalty', () => {
    const session = skipVoiceExercise(createSession([item]));
    expect(session.skipped).toEqual([0]);
    expect(session.records).toEqual([]);
    expect(sessionSummary(session)).toBeDefined();
  });
});

describe('CHOIR_PART miniatures follow the draft part-writing profile', () => {
  const ranges = {
    bass: { min: parsePitch('E2'), max: parsePitch('C4') },
    tenor: { min: parsePitch('C3'), max: parsePitch('G4') },
    alto: { min: parsePitch('G3'), max: parsePitch('D5') },
    soprano: { min: parsePitch('C4'), max: parsePitch('G5') },
  };
  // Die Miniaturen tragen keinen Akkordkontext: Leitton-/Septimregeln entfallen. Strenger als
  // das Aufgabenprofil: auch Gegen- und verdeckte Quinten/Oktaven sind hier Fehler.
  const harmonic = ['leading-tone-resolution', 'seventh-resolution', 'doubled-leading-tone'];
  const profile = Object.fromEntries(
    Object.entries(SATB_DRAFT_RULES).filter(([rule]) => !harmonic.includes(rule)),
  );
  const strict = Object.fromEntries(
    [...Object.keys(profile), 'contrary-fifth', 'contrary-octave'].map((rule) => [rule, 'error']),
  );
  for (const piece of ['home', 'arch'] as const)
    for (const fifths of [-2, 0, 2] as const)
      it(`${piece}/${String(fifths)}: no findings under the exercise profile or the strict rule set`, () => {
        const { parts } = generateChoir({ voice: 'soprano', piece, fifths }, createRng(1));
        const slices = parts.soprano.map((_, i) => ({
          soprano: required(parts.soprano[i]),
          alto: required(parts.alto[i]),
          tenor: required(parts.tenor[i]),
          bass: required(parts.bass[i]),
        }));
        const options = {
          ranges,
          hiddenPerfectMotion: 'soprano-leap',
          maxMelodicInterval: 8,
          contraryPerfectScope: 'all',
        } as const;
        expect(analyzeVoiceLeading(slices, profile, options)).toEqual([]);
        expect(analyzeVoiceLeading(slices, strict, options)).toEqual([]);
      });
});
