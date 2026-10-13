import { describe, expect, it } from 'vitest';
import { parseScore, validateScore } from '@harmonia/notation';
import {
  createRng,
  generateListening,
  LISTENING_QUESTIONS,
  listeningAnswer,
  listeningTimeline,
  evaluateExercise,
  exerciseFeedback,
  exercisePrompt,
  exerciseHints,
  hintText,
  choiceLabel,
  createSession,
  skipAuralExercises,
  sessionSummary,
} from './index.ts';
import type { ListeningItem, ListeningQuestion } from './types.ts';
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Testwert fehlt');
  return value;
}
function item(
  question: ListeningQuestion,
  sources: readonly string[],
  candidates?: readonly string[],
): ListeningItem {
  return {
    ...generateListening({ question }, createRng(7)),
    clips: sources.map(parseScore),
    ...(candidates ? { candidates: candidates.map(parseScore) } : {}),
  };
}
const quarters = 'treble | 4/4 | G4/4 G4/4 G4/4 G4/4';
const firstDivided = 'treble | 4/4 | G4/8 G4/8 G4/4 G4/4 G4/4';
const secondDivided = 'treble | 4/4 | G4/4 G4/8 G4/8 G4/4 G4/4';
describe('Hörquellen und Bewertung', () => {
  it.each(LISTENING_QUESTIONS)(
    '%s: 200 reproduzierbare Seeds mit vollständigen Quellen und genau einer richtigen Antwort',
    (question) => {
      const answers = new Set<string>();
      for (let seed = 0; seed < 200; seed++) {
        const generated = generateListening({ question }, createRng(seed));
        expect(generated).toEqual(generateListening({ question }, createRng(seed)));
        for (const score of [...generated.clips, ...(generated.candidates ?? [])])
          expect(validateScore(score, { allowPickup: false })).toEqual([]);
        expect(
          generated.choices.filter((answer) => evaluateExercise(generated, answer).correct),
        ).toEqual([listeningAnswer(generated)]);
        expect(evaluateExercise(generated, 'listening:option:01').validAnswer).toBe(false);
        answers.add(listeningAnswer(generated));
        for (const locale of ['de', 'en-US', 'en-GB'] as const) {
          const result = evaluateExercise(generated, listeningAnswer(generated));
          for (const text of [
            exercisePrompt(generated, locale),
            exerciseFeedback(generated, result, locale).message,
            ...generated.choices.map((a) => choiceLabel(generated, a, locale)),
            ...([1, 2, 3] as const).map((n) =>
              hintText(generated, exerciseHints(generated, n), locale),
            ),
          ]) {
            expect(text.trim()).not.toBe('');
            expect(text).not.toMatch(/\$t\(|glossary:|exercise\.|\{\{/);
          }
        }
      }
      expect(answers.size).toBe(
        question === 'pulse' || question === 'pitch-direction' || question === 'rhythm-choice'
          ? 3
          : 2,
      );
    },
  );
  it('Rhythmusvergleich ignoriert die Tonhöhe und berücksichtigt Stille und Dauern', () => {
    expect(
      listeningAnswer(item('rhythm-compare', [quarters, quarters.replaceAll('G4', 'A4')])),
    ).toBe('listening:same');
    expect(listeningAnswer(item('rhythm-compare', [firstDivided, secondDivided]))).toBe(
      'listening:different',
    );
    expect(
      listeningAnswer(
        item('rhythm-compare', ['treble | 4/4 | G4/4 r/4 G4/2', 'treble | 4/4 | G4/2 G4/2']),
      ),
    ).toBe('listening:different');
  });
  it('Melodievergleich benötigt die tatsächlichen Tonhöhen und ihre Reihenfolge', () => {
    const a = 'treble | 4/4 | F4/4 G4/4 A4/4 G4/4';
    expect(listeningAnswer(item('melody-compare', [a, a]))).toBe('listening:same');
    expect(listeningAnswer(item('melody-compare', [a, 'treble | 4/4 | F4/4 A4/4 G4/4 G4/4']))).toBe(
      'listening:different',
    );
    expect(listeningAnswer(item('melody-compare', [a, a.replace('F4', 'G4')]))).toBe(
      'listening:different',
    );
  });
  it('Richtung und Tonwiederholung stimmen mit festen Tonpaaren überein', () => {
    for (const [source, answer] of [
      ['treble | 4/4 | F4/2 A4/2', 'listening:up'],
      ['treble | 4/4 | A4/2 F4/2', 'listening:down'],
      ['treble | 4/4 | F4/2 F4/2', 'listening:repeat'],
    ])
      expect(listeningAnswer(item('pitch-direction', [required(source)]))).toBe(answer);
  });
  it('Rhythmusauswahl kommt aus der Klangquelle und nicht aus Knopfreihenfolge oder Tonhöhe', () => {
    const source = item(
      'rhythm-choice',
      [firstDivided.replaceAll('G4', 'E4')],
      [quarters, firstDivided, secondDivided],
    );
    expect(listeningAnswer(source)).toBe('listening:option:2');
    expect(listeningAnswer({ ...source, choices: [...source.choices].reverse() })).toBe(
      'listening:option:2',
    );
    expect(() =>
      listeningAnswer({
        ...source,
        candidates: [
          parseScore(quarters),
          parseScore(quarters.replaceAll('G4', 'F4')),
          parseScore(secondDivided),
        ],
      }),
    ).toThrow();
  });
  it('Hörbeobachtungen erkennen auch versetzte Einsätze verschiedener, überlappender Tonhöhen', () => {
    expect(listeningAnswer(item('observation', ['treble | 4/4 | E4/2 r/4 A4/4']))).toBe(
      'listening:one-at-a-time',
    );
    expect(listeningAnswer(item('observation', ['treble | 4/4 | (E4 B4)/2 r/4 A4/4']))).toBe(
      'listening:together',
    );
    expect(listeningAnswer(item('observation', ['treble | 4/4 | E4/1 & r/4 G4/2 r/4']))).toBe(
      'listening:together',
    );
  });
  it('Zwei Dreiergruppen zählen drei Schläge; Audio hat sechs echte Einsätze ohne Trennpause', () => {
    const source = 'treble | 3/4 | C6/4 G5/4 G5/4';
    const example = { ...item('pulse', [source, source]), bpm: 120 };
    expect(listeningAnswer(example)).toBe('listening:pulse:3');
    expect(listeningTimeline(example).tones.map((t) => t.onsetSeconds)).toEqual([
      0, 0.5, 1, 1.5, 2, 2.5,
    ]);
    expect(listeningTimeline(example).durationSeconds).toBe(3);
  });
  it('A/B-Trennpause und Gesamtzeit sind unabhängig berechnet', () => {
    const source = { ...item('rhythm-compare', [quarters, firstDivided]), bpm: 120 };
    const plan = listeningTimeline(source);
    expect(plan.tones.map((t) => t.onsetSeconds)).toEqual([
      0, 0.5, 1, 1.5, 2.75, 3, 3.25, 3.75, 4.25,
    ]);
    expect(plan.durationSeconds).toBe(4.75);
  });
  it('Audio-Pause überspringt neue Hörfragen, ohne richtige Antworten oder Fehler zu erfinden', () => {
    const state = skipAuralExercises(
      createSession(
        LISTENING_QUESTIONS.map((question) => generateListening({ question }, createRng(2))),
      ),
    );
    expect(sessionSummary(state)).toMatchObject({ answered: 0, correct: 0, skipped: 6 });
  });
  it('Leere Quellen, unvollständige Takte, falsche Pulsgruppen und Parameter werden zurückgewiesen', () => {
    for (const params of [
      { question: 'unknown' },
      { question: 'pulse', tempos: [] },
      { question: 'pulse', tempos: [NaN] },
      { question: 'rhythm-choice', tempos: [121] },
    ])
      expect(() =>
        generateListening(params as Parameters<typeof generateListening>[0], createRng(3)),
      ).toThrow();
    expect(() =>
      listeningAnswer({ ...generateListening({ question: 'pulse' }, createRng(3)), clips: [] }),
    ).toThrow();
    expect(() => listeningAnswer(item('pitch-direction', ['treble | 4/4 | G4/4']))).toThrow();
    expect(() => listeningAnswer(item('pulse', [quarters, quarters]))).toThrow();
  });
});
