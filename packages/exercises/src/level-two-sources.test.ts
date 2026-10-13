import { describe, expect, it } from 'vitest';
import { duration, formatPitch } from '@harmonia/theory';
import { layoutScore, parseScore, scoreTimeline } from '@harmonia/notation';
import { CONTEXT_TOPICS, contextAnswer, contextVariantKey, generateContext } from './context.ts';
import { createRng } from '@harmonia/theory';
import { generateListening, listeningAnswer, listeningTimeline } from './listening.ts';
import { generateRhythm, rhythmOnsets } from './rhythm.ts';
import { generateChord, chordTargets } from './chords.ts';
import {
  choiceLabel,
  exercisePrompt,
  exerciseFeedback,
  exerciseHints,
  hintText,
} from './feedback.ts';
import { contextNotationDescription } from './context-text.ts';
import { evaluateExercise } from './evaluate.ts';
describe('Quellen und unabhängige Stufe-2-Tabellen', () => {
  it.each(CONTEXT_TOPICS)(
    '%s: 200 reproduzierbare Quellen, passende Antwort und DE/US/UK-Texte',
    (topic) => {
      for (let seed = 0; seed < 200; seed++) {
        const item = generateContext({ topics: [topic] }, createRng(seed));
        expect(item).toEqual(generateContext({ topics: [topic] }, createRng(seed)));
        expect(evaluateExercise(item, contextAnswer(item)).correct).toBe(true);
        for (const locale of ['de', 'en-US', 'en-GB'] as const) {
          for (const text of [
            exercisePrompt(item, locale),
            exerciseFeedback(item, evaluateExercise(item, contextAnswer(item)), locale).message,
            ...[1, 2, 3].map((level) =>
              hintText(item, exerciseHints(item, level as 1 | 2 | 3), locale),
            ),
            ...item.choices.map((a) => choiceLabel(item, a, locale)),
          ])
            expect(text).not.toMatch(/exercise\.|glossary:|{{/);
        }
      }
    },
  );
  it.each([
    ['dotted-duration', 'treble | 4/4 | C4/8. r/16 r/2.', 'quarters:3/4'],
    ['tied-duration', 'treble | 4/4 | C4/4~ C4/8 r/8 r/2', 'quarters:3/2'],
    ['crossbar-duration', 'treble | 4/4 | r/2 r/4 C4/4~ | C4/2 r/2', 'quarters:3/1'],
    ['syncopation', 'treble | 4/4 | r/8 C4/8~ C4/4 C4/2', 'boolean:yes'],
    ['syncopation', 'treble | 4/4 | C4/8 C4/8 C4/4 C4/2', 'boolean:no'],
    ['triplet-duration', 'treble | 4/4 | C4/8{3:2} C4/8{3:2} C4/8{3:2} C4/2.', 'quarters:1/1'],
    ['interval-inversion', 'treble | 4/4 | C4/2 E4/2', 'interval:m6'],
    ['interval-inversion', 'treble | 4/4 | C4/2 F#4/2', 'interval:d5'],
    ['interval-reduction', 'treble | 4/4 | C4/2 D5/2', 'interval:M2'],
    ['interval-reduction', 'treble | 4/4 | C4/2 C6/2', 'interval:P8'],
  ] as const)('%s aus %s folgt der tatsächlichen Quelle', (topic, text, answer) => {
    const original = generateContext({ topics: [topic] }, createRng(1)),
      item = { ...original, source: { kind: 'score' as const, score: parseScore(text) } };
    expect(contextAnswer(item)).toBe(answer);
  });
  it('nicht sichtbare Dokumentfelder verändern eine Wiederholungsquelle nicht', () => {
    const item = generateContext({ topics: ['period-context'] }, createRng(1));
    if (item.source.kind !== 'document') throw new Error('Dokument fehlt');
    expect(contextVariantKey({ ...item, source: { ...item.source, medium: 'stream' } })).toBe(
      contextVariantKey(item),
    );
  });
  it('Notationsbeschreibung verrät Zielnamen nicht und bewahrt tatsächlich gedruckte Vorzeichen', () => {
    const item = {
      ...generateContext({ topics: ['accidental-scope'] }, createRng(1)),
      source: {
        kind: 'score' as const,
        score: parseScore('treble | 4/4 | F#4/2 F#4/2'),
        target: 1,
      },
    };
    const description = contextNotationDescription(item, 'de');
    expect(description).toMatch(/^Violinschlüssel\./);
    for (const locale of ['en-US', 'en-GB'] as const)
      expect(contextNotationDescription(item, locale)).toMatch(/^treble clef\./);
    expect(
      contextNotationDescription(
        { ...item, source: { ...item.source, score: parseScore('bass | 4/4 | F#3/2 F#3/2') } },
        'de',
      ),
    ).toMatch(/^Bassschlüssel\./);
    expect(description).not.toMatch(/fis|Fis|F#/);
    expect(description).toContain('Kreuz');
    expect(description).toContain('kein Zeichen');
  });
  it('Tripolenanschläge sind unabhängig 0/333/667/1000/1333/1667 ms bei Viertel=60', () => {
    const item = generateRhythm(
      { meters: ['2/4'], level: 'triplets', rests: false, tempos: [60] },
      createRng(1),
      'RHYTHM_TAP',
    );
    expect(rhythmOnsets(item)).toEqual([0, 333, 667, 1000, 1333, 1667]);
    const layout = layoutScore(item.score);
    expect(layout.items.filter((i) => i.kind === 'glyph' && i.role === 'tuplet')).toHaveLength(2);
  });
  it('leitereigene freie Akkorde kommen aus Tonart/Stufe statt austauschbarer Akkordmetadaten', () => {
    const item = generateChord(
      {
        types: ['major', 'minor', 'diminished'],
        diatonic: true,
        inversions: [0],
        maxAccidentals: 1,
        range: { minMidi: 60, maxMidi: 84 },
      },
      createRng(11),
      'CHORD_BUILD',
    );
    expect(item.diatonic).toBeDefined();
    expect(
      chordTargets({
        ...item,
        chord: { root: { letter: 'C', alter: 0 }, type: 'augmented', inversion: 0 },
      }),
    ).toEqual(chordTargets(item));
  });
});
describe('Neue Hörquellen', () => {
  it.each([
    'rhythm-choice-dotted',
    'pulse-subdivision',
    'rhythm-completion',
    'scale-mode',
    'melodic-memory',
  ] as const)('%s: 200 Seeds mit Quelle und tatsächlichem Klangplan', (question) => {
    for (let seed = 0; seed < 200; seed++) {
      const item = generateListening({ question }, createRng(seed));
      expect(item).toEqual(generateListening({ question }, createRng(seed)));
      expect(item.choices).toContain(listeningAnswer(item));
      expect(listeningTimeline(item).tones.length).toBeGreaterThan(0);
    }
  });
  it('zwei und drei Unterteilungen halten denselben Grundschlag bei Tempo 60', () => {
    for (let seed = 0; seed < 20; seed++) {
      const item = generateListening(
        { question: 'pulse-subdivision', tempos: [60] },
        createRng(seed),
      );
      const n = Number(listeningAnswer(item).split(':')[2]),
        timeline = listeningTimeline(item);
      expect(timeline.durationSeconds).toBe(2);
      expect(timeline.tones).toHaveLength(n * 2);
      expect(timeline.tones.map((t) => t.onsetSeconds)).toEqual(
        Array.from({ length: n * 2 }, (_, i) => i / n),
      );
    }
  });
  it('Melodiegedächtnis folgt der geänderten Tonposition', () => {
    const base = generateListening({ question: 'melodic-memory' }, createRng(3));
    const a = parseScore('treble | 4/4 | C4/4 D4/4 E4/4 G4/4'),
      b = parseScore('treble | 4/4 | C4/4 D4/4 F4/4 G4/4');
    expect(listeningAnswer({ ...base, clips: [a, b] })).toBe('listening:position:3');
    expect(() => listeningAnswer({ ...base, clips: [a, a] })).toThrow(RangeError);
  });
  it('Tripletnotation bewahrt exakte Quelltöne und volle Taktfüllung', () => {
    const score = parseScore('treble | 4/4 | C4/8{3:2} D4/8{3:2} E4/8{3:2} F4/2.');
    expect(scoreTimeline(score, { bpm: 60 }).tones.map((t) => formatPitch(t.pitch))).toEqual([
      'C4',
      'D4',
      'E4',
      'F4',
    ]);
    expect(scoreTimeline(score, { bpm: 60 }).durationSeconds).toBe(4);
    expect(duration('eighth', 0, { actual: 3, normal: 2 })).toEqual(
      score.staves[0]?.measures[0]?.voices[0]?.events[0]?.duration,
    );
  });
});
