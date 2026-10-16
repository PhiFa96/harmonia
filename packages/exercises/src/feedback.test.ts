import { note, singleStaffScore } from '@harmonia/notation';
import { duration, parsePitch } from '@harmonia/theory';
import { describe, expect, it } from 'vitest';
import {
  choiceLabel,
  evaluateExercise,
  exerciseDescription,
  exerciseFeedback,
  exerciseHints,
  exercisePrompt,
  createRng,
  generateListening,
  hintText,
  LISTENING_QUESTIONS,
} from './index.ts';
import type { ExerciseClef, IntervalItem, NoteItem } from './types.ts';

function named(pitch: string, clef: ExerciseClef = 'treble'): NoteItem {
  const p = parsePitch(pitch);
  return {
    type: 'NOTE_NAME',
    clef,
    pitch: p,
    choices: ['B:0', 'B:-1', 'C:1', 'D:-1', 'F:-1', 'B:-2', 'C:0'],
    score: singleStaffScore([[note(p, duration('whole'))]], { clef }),
  };
}
function interval(to: string): IntervalItem {
  const from = parsePitch('C4');
  const target = parsePitch(to);
  return {
    type: 'INTERVAL_IDENTIFY_VISUAL',
    from,
    to: target,
    clef: 'treble',
    playback: 'melodic-up',
    choices: ['M3', 'd4', 'P1', 'm2'],
    score: singleStaffScore([[note(from, duration('half')), note(target, duration('half'))]]),
  };
}

describe('Engine-Bewertung und Erklärungen', () => {
  it.each([
    ['B4', 'B:0', 'H', 'B'],
    ['Bb3', 'B:-1', 'B', 'B♭'],
    ['Bbb3', 'B:-2', 'Heses', 'B𝄫'],
    ['C#4', 'C:1', 'Cis', 'C♯'],
  ])('%s behält Schreibweise und deutsche H/B-Konvention', (pitch, answer, de, en) => {
    const item = named(pitch);
    expect(choiceLabel(item, answer, 'de')).toBe(de);
    expect(choiceLabel(item, answer, 'en-US')).toBe(en);
    expect(evaluateExercise(item, answer).correct).toBe(true);
    expect(exerciseFeedback(item, evaluateExercise(item, answer), 'de').message).toContain(
      `Die Note heißt ${de}.`,
    );
  });
  it('Cis und Des sind trotz gleichen Klangs verschiedene Notennamen', () => {
    expect(evaluateExercise(named('C#4'), 'D:-1').correct).toBe(false);
  });
  it('C–Fes wird als verminderte Quarte bewertet, nicht als große Terz', () => {
    const item = interval('Fb4');
    expect(evaluateExercise(item, 'd4').correct).toBe(true);
    expect(evaluateExercise(item, 'M3').correct).toBe(false);
    expect(exerciseFeedback(item, evaluateExercise(item, 'M3'), 'de').message).toContain(
      '4 Stammtöne',
    );
    expect(exerciseFeedback(item, evaluateExercise(item, 'M3'), 'de').message).toContain(
      '4 Halbtöne',
    );
    expect(exerciseFeedback(item, evaluateExercise(item, 'M3'), 'de').message).toContain(
      'verminderte Quarte',
    );
  });
  it('US/UK-Fachbegriffe und Singular kommen aus dem Glossar', () => {
    const item = interval('Db4');
    expect(exerciseFeedback(item, evaluateExercise(item, 'm2'), 'en-US').message).toContain(
      '1 half step',
    );
    expect(exerciseFeedback(item, evaluateExercise(item, 'm2'), 'en-GB').message).toContain(
      '1 semitone',
    );
    const unison = interval('C4');
    expect(exerciseFeedback(unison, evaluateExercise(unison, 'P1'), 'de').message).toContain(
      '1 Stammton',
    );
  });
  it('Referenzlinien für Violin- und Bassschlüssel, auch bei der Referenznote', () => {
    for (const [pitch, clef, line] of [
      ['G4', 'treble', 2],
      ['F3', 'bass', 4],
    ] as const) {
      const item = named(pitch, clef);
      const message = hintText(item, exerciseHints(item, 3), 'de');
      expect(message).toContain(`auf Linie ${String(line)} von unten`);
      expect(message).toContain('genau auf dieser Linie');
    }
  });
  it('Ansage beschreibt Lage und Vorzeichen, ohne den Notennamen vorwegzunehmen', () => {
    const item = named('C#4');
    const description = exerciseDescription(item, 'de');
    expect(description).toContain('Violinschlüssel');
    expect(description).toContain('Stammtonschritte');
    expect(description).toContain('Kreuz');
    expect(description).not.toContain('Cis');
  });
  it('alle drei Hinweisstufen und Fragen sind in allen Sprachen vollständig aufgelöst', () => {
    for (const item of [
      named('Bbb3', 'bass'),
      interval('Fb4'),
      { ...interval('E4'), type: 'INTERVAL_IDENTIFY_AURAL' as const },
    ]) {
      for (const locale of ['de', 'en-US', 'en-GB'] as const) {
        expect(exercisePrompt(item, locale)).not.toMatch(/exercise\.|glossary:|\{\{/);
        for (const level of [1, 2, 3] as const) {
          const text = hintText(item, exerciseHints(item, level), locale);
          expect(text.length).toBeGreaterThan(20);
          expect(text).not.toMatch(/exercise\.|glossary:|\{\{/);
        }
      }
    }
  });
});

describe('Hörhinweise', () => {
  it('geben für jede Hörform Hinweis 1 und 2 in allen Sprachen ohne Zahlenplatzhalter aus', () => {
    for (const question of LISTENING_QUESTIONS) {
      const item = generateListening({ question }, createRng(11));
      for (const locale of ['de', 'en-US', 'en-GB'] as const) {
        for (const level of [1, 2] as const) {
          const text = hintText(item, exerciseHints(item, level), locale);
          expect(text, `${question}/${locale}/${level}`).not.toMatch(/NaN|undefined|\{\{/);
          expect(text.length).toBeGreaterThan(20);
          expect(text).not.toMatch(/Klangabstand|pitch distance/);
        }
      }
    }
  });
});
