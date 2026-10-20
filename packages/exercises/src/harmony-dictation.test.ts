import { validateScore } from '@harmonia/notation';
import { chord, parseNoteName } from '@harmonia/theory';
import { describe, expect, it } from 'vitest';
import {
  ambiguousFunctionDegrees,
  cadenceAnswer,
  chordAnswerId,
  chordChoiceId,
  chordTargets,
  createHarmonySession,
  createRng,
  dictationAnswerId,
  dictationInputValues,
  evaluateExercise,
  exerciseDescription,
  exerciseFeedback,
  exercisePrompt,
  expectedAnswer,
  functionAnswer,
  functionChoiceLabel,
  generateCadence,
  generateChord,
  generateDictation,
  generateFunction,
  hintText,
  exerciseHints,
  SEVENTH_TYPES,
} from './index.ts';

describe('P3.14: Harmonik und Diktat', () => {
  it('klassifiziert vier Kadenzen aus den Akkorden in C-Dur', () => {
    for (const type of ['authentic', 'plagal', 'half', 'deceptive'] as const) {
      const item = generateCadence({ fifths: [0], types: [type] }, createRng(4));
      expect(validateScore(item.score)).toEqual([]);
      expect(cadenceAnswer(item)).toBe(`cadence:${type}`);
      expect(evaluateExercise(item, expectedAnswer(item)).correct).toBe(true);
      expect(evaluateExercise(item, 'cadence:unknown').validAnswer).toBe(false);
    }
  });
  it('erzeugt keine Funktionsaufgabe mit zwei gleich beschrifteten Auswahlknöpfen', () => {
    expect(ambiguousFunctionDegrees([5, 7])).toBe(true);
    expect(ambiguousFunctionDegrees([1, 2, 4, 5, 6])).toBe(false);
    expect(() =>
      generateFunction({ fifths: [0], degrees: [5, 7], notation: 'function' }, createRng(1)),
    ).toThrow(/Funktionskürzel/);
    for (let seed = 0; seed < 60; seed++) {
      const item = generateFunction({ notation: 'function' }, createRng(seed));
      const labels = item.choices.map((choice) => functionChoiceLabel(item, choice));
      expect(new Set(labels).size).toBe(labels.length);
    }
    // Römische Stufen sind immer eindeutig.
    expect(() =>
      generateFunction({ fifths: [0], degrees: [5, 7], notation: 'roman' }, createRng(1)),
    ).not.toThrow();
  });
  it('beschreibt die Stufenaufgabe für Screenreader über Positionen statt Tonnamen', () => {
    for (const locale of ['de', 'en-US', 'en-GB'] as const) {
      for (const degree of [1, 4, 5] as const) {
        const item = generateFunction({ fifths: [0], degrees: [degree] }, createRng(2));
        const text = exerciseDescription(item, locale);
        // Drei Akkordtöne, jeweils mit Position auf dem Liniensystem.
        expect(text, `${locale} ${String(degree)}`).toMatch(/1/);
        expect(text).toMatch(/3/);
        expect(text).toMatch(locale === 'de' ? /Violinschlüssel/ : /treble clef/i);
        expect(text).toMatch(locale === 'de' ? /unterste/ : /bottom/i);
        // Kein Lösungsleck: weder Stufe noch Tonname des Akkords.
        expect(text).not.toMatch(/\bI\b|\bIV\b|\bV\b/);
        expect(text).not.toContain('G-Dur');
      }
    }
  });
  it('gibt jeder Harmonie- und Diktataufgabe eigene Hinweise ohne Lösungsleck', () => {
    const items = [
      generateCadence({ fifths: [0], types: ['authentic'] }, createRng(5)),
      generateFunction({ fifths: [0], degrees: [1, 4, 5] }, createRng(5)),
      generateDictation({ level: 1 }, createRng(5), 'MELODY_DICTATION'),
      generateDictation({ level: 1 }, createRng(5), 'RHYTHM_DICTATION'),
    ];
    for (const locale of ['de', 'en-US', 'en-GB'] as const) {
      const texts = items.map((item) =>
        ([1, 2] as const).map((level) => hintText(item, exerciseHints(item, level), locale)),
      );
      expect(new Set(texts.map((entry) => entry.join('|'))).size, locale).toBe(items.length);
      for (const entry of texts) expect(entry[0]).not.toBe(entry[1]);
    }
    const cadence = items[0];
    if (!cadence) throw new Error('Kadenz fehlt');
    // Britische Kadenznamen im Hinweis, kein Lösungsleck (die Antwort ist hier ein Ganzschluss).
    expect(hintText(cadence, exerciseHints(cadence, 2), 'en-GB')).toContain('perfect cadence');
    expect(hintText(cadence, exerciseHints(cadence, 2), 'en-US')).toContain('authentic cadence');
  });
  it('bestimmt die Stufe aus dem Akkord statt einer gespeicherten Auswahl', () => {
    for (const degree of [1, 2, 4, 5, 6] as const) {
      const item = generateFunction({ fifths: [0], degrees: [degree] }, createRng(8));
      expect(validateScore(item.score)).toEqual([]);
      expect(functionAnswer(item)).toBe(`degree:${String(degree)}`);
      expect(evaluateExercise(item, functionAnswer(item)).correct).toBe(true);
    }
  });
  it('bewertet vollständige Diktatfolgen aus dem hörbaren Score', () => {
    for (const type of ['MELODY_DICTATION', 'RHYTHM_DICTATION'] as const)
      for (let seed = 0; seed < 30; seed++) {
        const item = generateDictation({ level: 2 }, createRng(seed), type);
        expect(validateScore(item.score)).toEqual([]);
        const answer = expectedAnswer(item);
        expect(dictationInputValues(item, answer)).toHaveLength(item.pitches.length);
        expect(evaluateExercise(item, answer).correct).toBe(true);
        expect(evaluateExercise(item, dictationAnswerId(['quarter'])).validAnswer).toBe(false);
        expect(evaluateExercise(item, 'dictation:bogus,bogus').validAnswer).toBe(false);
      }
  });
  it('erzeugt Septakkorde mit vier Tönen bis zur dritten Umkehrung', () => {
    for (const inversion of [0, 1, 2, 3] as const) {
      const item = generateChord(
        {
          types: ['dominant7'],
          roots: ['G'],
          inversions: [inversion],
          clefs: ['treble'],
          maxAccidentals: 1,
        },
        createRng(12),
        'CHORD_BUILD',
      );
      expect(chordTargets(item)).toHaveLength(4);
      expect(validateScore(item.score)).toEqual([]);
      expect(evaluateExercise(item, expectedAnswer(item)).correct).toBe(true);
      expect(evaluateExercise(item, chordAnswerId([item.bass, null, null, null])).validAnswer).toBe(
        false,
      );
    }
    expect(chordChoiceId(chord(parseNoteName('G'), 'dominant7', 3))).toBe('chord:G:dominant7:3');
  });
  it('erkennt alle Septakkordarten in der dritten Umkehrung auch nach Gehör', () => {
    for (const type of SEVENTH_TYPES)
      for (const presentation of ['visual', 'aural'] as const) {
        const item = generateChord(
          {
            types: [type],
            roots: ['C'],
            inversions: [3],
            clefs: ['treble'],
            maxAccidentals: 2,
            presentation,
          },
          createRng(22),
          'CHORD_IDENTIFY',
        );
        expect(expectedAnswer(item)).toBe(`chord:C:${type}:3`);
        expect(evaluateExercise(item, expectedAnswer(item)).correct).toBe(true);
        for (const locale of ['de', 'en-US', 'en-GB'] as const)
          expect(
            exerciseFeedback(item, evaluateExercise(item, expectedAnswer(item)), locale).message,
          ).not.toMatch(/\{\{|exercise\.|glossary:/);
      }
  });
  it('bietet spielbare Aufgaben und übersetzte Rückmeldungen im freien Satz', () => {
    const session = createHarmonySession(9);
    expect(session.items).toHaveLength(12);
    for (const item of session.items) {
      for (const locale of ['de', 'en-US', 'en-GB'] as const) {
        const prompt = exercisePrompt(item, locale);
        const feedback = exerciseFeedback(
          item,
          evaluateExercise(item, expectedAnswer(item)),
          locale,
        );
        expect(prompt + feedback.message).not.toMatch(/\{\{|exercise\.|glossary:/);
      }
    }
  });
});
