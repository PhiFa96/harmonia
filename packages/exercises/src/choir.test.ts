import { describe, expect, it } from 'vitest';
import { validateScore } from '@harmonia/notation';
import { midi } from '@harmonia/theory';
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

function required<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) throw new Error('Missing test fixture');
  return value;
}

describe('CHOIR_PART internal draft', () => {
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
  it('skips microphone work without a failed answer or denominator penalty', () => {
    const session = skipVoiceExercise(createSession([item]));
    expect(session.skipped).toEqual([0]);
    expect(session.records).toEqual([]);
    expect(sessionSummary(session)).toBeDefined();
  });
});
