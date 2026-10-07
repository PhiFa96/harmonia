import { MAX_STEP, MIN_STEP, pitchAt, stepOf, validateScore } from '@harmonia/notation';
import { formatPitch, keyFifths, midi, parsePitch } from '@harmonia/theory';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  activeLessonSession,
  answerLesson,
  answerSession,
  createLessonSession,
  createRng,
  createSession,
  currentItem,
  evaluateExercise,
  exerciseDescription,
  exerciseFeedback,
  exerciseHints,
  exercisePrompt,
  expectedAnswer,
  generateExercise,
  generateScale,
  generateKeySignature,
  hintText,
  isScaleItem,
  isKeySignatureItem,
  itemVariantKey,
  lessonSummary,
  nextLessonExercise,
  revealHint,
  scaleAnswerId,
  scaleAnswerPitches,
  scaleAnswerScore,
  scalePitches,
  scaleSlot,
  scaleSolutionScore,
  sessionSummary,
  signatureAnswerNotes,
  signatureSolutionScore,
  startLessonReview,
} from './index.ts';
import type { ExerciseSpec, ScaleParams } from './index.ts';

const SCALE_PARAMS: ScaleParams = {
  types: ['major', 'naturalMinor', 'harmonicMinor', 'melodicMinor'],
  clefs: ['treble', 'bass'],
  fifths: [-2, -1, 0, 1, 2],
  maxAccidentals: 1,
};
const SPECS: readonly ExerciseSpec[] = [
  { type: 'SCALE_BUILD', params: { ...SCALE_PARAMS, direction: 'both' } },
  { type: 'SCALE_IDENTIFY', params: SCALE_PARAMS },
  {
    type: 'SCALE_IDENTIFY',
    params: {
      ...SCALE_PARAMS,
      types: ['major', 'naturalMinor', 'harmonicMinor'],
      direction: 'descending',
    },
  },
  {
    type: 'SCALE_BUILD',
    params: {
      types: ['melodicMinor', 'harmonicMinor'],
      fifths: [5, 6, 7],
      maxAccidentals: 2,
      range: { minMidi: 36, maxMidi: 90 },
      direction: 'both',
    },
  },
  {
    type: 'KEYSIG_IDENTIFY',
    params: {
      clefs: ['treble', 'bass'],
      fifths: Array.from({ length: 15 }, (_, index) => index - 7),
    },
  },
  {
    type: 'KEYSIG_BUILD',
    params: {
      clefs: ['treble', 'bass'],
      fifths: Array.from({ length: 15 }, (_, index) => index - 7),
    },
  },
];
describe('Tonleitern und Vorzeichnungen', () => {
  it.each(SPECS.map((spec, index) => [index, spec] as const))(
    'Parametersatz %i: 150 Seeds ergeben gültige, eindeutige und reproduzierbare Aufgaben',
    (_index, spec) => {
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const item = generateExercise(spec, createRng(seed));
          expect(item).toEqual(generateExercise(spec, createRng(seed)));
          expect(validateScore(item.score, { allowPickup: false })).toEqual([]);
          expect(evaluateExercise(item, expectedAnswer(item))).toMatchObject({
            validAnswer: true,
            correct: true,
          });
          expect(evaluateExercise(item, 'invalid').validAnswer).toBe(false);
          if (isScaleItem(item)) {
            const range = 'range' in spec.params ? spec.params.range : undefined;
            expect(scalePitches(item)).toHaveLength(8);
            expect(validateScore(scaleSolutionScore(item), { allowPickup: false })).toEqual([]);
            for (const pitch of scalePitches(item)) {
              expect(stepOf(pitch, item.clef)).toBeGreaterThanOrEqual(MIN_STEP);
              expect(stepOf(pitch, item.clef)).toBeLessThanOrEqual(MAX_STEP);
              expect(midi(pitch)).toBeGreaterThanOrEqual(
                range?.minMidi ?? (item.clef === 'treble' ? 60 : 36),
              );
              expect(midi(pitch)).toBeLessThanOrEqual(
                range?.maxMidi ?? (item.clef === 'treble' ? 84 : 60),
              );
            }
            if (item.type === 'SCALE_BUILD') {
              expect(item.choices).toEqual([]);
              expect(pitchAt(item.score, scaleSlot(0))).toEqual(item.tonic);
              for (let index = 1; index < 8; index++)
                expect(pitchAt(item.score, scaleSlot(index))).toBeUndefined();
            } else
              expect(
                item.choices.filter((answer) => evaluateExercise(item, answer).correct),
              ).toEqual([expectedAnswer(item)]);
          } else if (isKeySignatureItem(item)) {
            expect(validateScore(signatureSolutionScore(item), { allowPickup: false })).toEqual([]);
            if (item.type === 'KEYSIG_BUILD')
              expect(item.score.staves[0]?.keySignature.fifths).toBe(0);
            else {
              expect(new Set(item.choices).size).toBe(item.choices.length);
              expect(
                item.choices.filter((answer) => evaluateExercise(item, answer).correct),
              ).toEqual([expectedAnswer(item)]);
            }
          }
        }),
        { numRuns: 150, seed: 2062 },
      );
    },
    15000,
  );

  it.each([
    ['major', 1, 'ascending', ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5']],
    ['major', -1, 'ascending', ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5']],
    ['harmonicMinor', 0, 'ascending', ['A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G#5', 'A5']],
    ['melodicMinor', 0, 'ascending', ['A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G#5', 'A5']],
    ['melodicMinor', 0, 'descending', ['A5', 'G5', 'F5', 'E5', 'D5', 'C5', 'B4', 'A4']],
  ] as const)(
    '%s, Vorzeichnung %i, %s: vollständige Schreibweise aus unabhängigen Beispielen',
    (scaleType, fifths, direction, expected) => {
      const item = generateScale(
        { types: [scaleType], fifths: [fifths], direction },
        createRng(1),
        'SCALE_BUILD',
      );
      const pinned = { ...item, tonic: parsePitch(expected[0]) };
      expect(expectedAnswer(pinned)).toBe(`notes:${expected.join(',')}`);
      expect(scalePitches(pinned).map((pitch) => formatPitch(pitch))).toEqual(expected);
    },
  );

  it('gleicher Klang, falsche Oktave oder Reihenfolge bleibt ein Schreibfehler; Teilantworten werden nicht gewertet', () => {
    const item = {
      ...generateScale({ types: ['major'], fifths: [1] }, createRng(1), 'SCALE_BUILD'),
      tonic: parsePitch('G4'),
    };
    const answer = expectedAnswer(item);
    for (const wrong of [
      answer.replace('F#5', 'Gb5'),
      answer.replace('G5', 'G4'),
      answer.replace('A4,B4', 'B4,A4'),
    ])
      expect(evaluateExercise(item, wrong)).toMatchObject({ validAnswer: true, correct: false });
    for (const invalid of [
      'notes:G4,,,,,,,',
      'notes:G4,A4',
      `${answer}\n`,
      answer.replace('F#5', 'F♯5'),
      'notes:C99,,,,,,,',
    ]) {
      expect(evaluateExercise(item, invalid).validAnswer).toBe(false);
      const state = createSession([item]);
      expect(answerSession(state, invalid)).toBe(state);
    }
    const partial = scaleAnswerId([
      item.tonic,
      parsePitch('A4'),
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(scaleAnswerPitches(item, partial)?.filter(Boolean)).toHaveLength(2);
    expect(pitchAt(scaleAnswerScore(item, partial), scaleSlot(1))).toEqual(parsePitch('A4'));
    const state = answerSession(revealHint(createSession([item])), answer.replace('G5', 'G4'));
    expect(answerSession(state, answer)).toBe(state);
    expect(sessionSummary(state)).toMatchObject({ answered: 1, correct: 0, assisted: 1 });
  });

  it('Erkennen berechnet die Art aus der Tonfolge; identische absteigende Mollformen werden nicht getrennt angeboten', () => {
    const item = generateScale(SCALE_PARAMS, createRng(4), 'SCALE_IDENTIFY');
    const falsifiedMetadata = {
      ...item,
      scaleType: item.scaleType === 'major' ? ('naturalMinor' as const) : ('major' as const),
    };
    expect(expectedAnswer(falsifiedMetadata)).toBe(expectedAnswer(item));
    for (const direction of ['descending', 'both'] as const)
      expect(() =>
        generateScale({ ...SCALE_PARAMS, direction }, createRng(1), 'SCALE_IDENTIFY'),
      ).toThrow(/nicht unterscheidbar/);
    expect(() =>
      generateScale({ ...SCALE_PARAMS, direction: 'descending' }, createRng(1), 'SCALE_BUILD'),
    ).not.toThrow();
  });

  it.each([
    [0, 'major', 'signature:', 'tonality:major:C'],
    [0, 'minor', 'signature:', 'tonality:minor:A'],
    [2, 'major', 'signature:F#,C#', 'tonality:major:D'],
    [-3, 'minor', 'signature:Bb,Eb,Ab', 'tonality:minor:C'],
    [7, 'major', 'signature:F#,C#,G#,D#,A#,E#,B#', 'tonality:major:C#'],
    [-7, 'major', 'signature:Bb,Eb,Ab,Db,Gb,Cb,Fb', 'tonality:major:Cb'],
  ] as const)(
    'Vorzeichnung %i %s hat eine eindeutige schriftliche und modale Antwort',
    (fifths, mode, written, identified) => {
      expect(
        expectedAnswer(
          generateKeySignature({ fifths: [fifths], modes: [mode] }, createRng(1), 'KEYSIG_BUILD'),
        ),
      ).toBe(written);
      const item = generateKeySignature(
        { fifths: [fifths], modes: [mode] },
        createRng(1),
        'KEYSIG_IDENTIFY',
      );
      expect(expectedAnswer(item)).toBe(identified);
      expect(exercisePrompt(item, 'en-US')).toContain(mode);
    },
  );

  it('Reihenfolge, gemischte Vorzeichen und doppelte Töne sind auswertbare Fehler; null ist keine leere Vorzeichnung', () => {
    const item = generateKeySignature(
      { fifths: [2], modes: ['major'] },
      createRng(1),
      'KEYSIG_BUILD',
    );
    for (const answer of ['signature:C#,F#', 'signature:F#,F#', 'signature:F#,Cb', 'signature:'])
      expect(evaluateExercise(item, answer)).toMatchObject({ validAnswer: true, correct: false });
    for (const invalid of [
      'signature:F',
      'signature:F##',
      'signature:F♯',
      'signature:F#,',
      'signature:F#\n',
      'signature:A#,B#,C#,D#,E#,F#,G#,A#',
    ])
      expect(evaluateExercise(item, invalid).validAnswer).toBe(false);
    expect(signatureAnswerNotes(null)).toBeUndefined();
    expect(
      evaluateExercise(
        generateKeySignature({ fifths: [0] }, createRng(1), 'KEYSIG_BUILD'),
        'signature:',
      ).correct,
    ).toBe(true);
    const changedPicture = {
      ...generateKeySignature({ fifths: [2], modes: ['major'] }, createRng(1), 'KEYSIG_IDENTIFY'),
      score: signatureSolutionScore(
        generateKeySignature({ fifths: [-1], modes: ['major'] }, createRng(1), 'KEYSIG_BUILD'),
      ),
    };
    expect(expectedAnswer(changedPicture)).toBe('tonality:major:F');
  });

  it.each(['de', 'en-US', 'en-GB'] as const)(
    'alle vier Typen erklären sich mit drei Hinweisstufen in %s',
    (locale) => {
      for (const spec of [SPECS[0], SPECS[1], SPECS[4], SPECS[5]]) {
        if (!spec) throw new Error('Testparameter fehlen');
        const item = generateExercise(spec, createRng(19));
        const texts = [
          exercisePrompt(item, locale),
          exerciseDescription(item, locale),
          exerciseFeedback(item, evaluateExercise(item, expectedAnswer(item)), locale).message,
          ...([1, 2, 3] as const).map((level) =>
            hintText(item, exerciseHints(item, level), locale),
          ),
        ];
        for (const text of texts) {
          expect(text.length).toBeGreaterThan(10);
          expect(text).not.toMatch(/exercise\.|glossary:|\{\{|\$t\(/);
        }
      }
      const scale = generateScale({ types: ['major'], fifths: [0] }, createRng(1), 'SCALE_BUILD');
      expect(hintText(scale, exerciseHints(scale, 2), locale)).toContain(
        locale === 'de' ? 'Halbtöne' : locale === 'en-US' ? 'half steps' : 'semitones',
      );
    },
  );

  it('unerreichbare Parameter scheitern für jede Gruppe vor der Zufallsauswahl', () => {
    for (const fifths of [[], [8], [1.5]])
      expect(() => generateKeySignature({ fifths }, createRng(1), 'KEYSIG_BUILD')).toThrow(
        RangeError,
      );
    for (const params of [
      { ...SCALE_PARAMS, types: [] },
      { ...SCALE_PARAMS, range: { minMidi: 60, maxMidi: 70 } },
      { ...SCALE_PARAMS, fifths: [0, 7], maxAccidentals: 0 as const },
    ]) {
      for (let seed = 0; seed < 5; seed++)
        expect(() => generateScale(params, createRng(seed), 'SCALE_BUILD')).toThrow(RangeError);
    }
    expect(() => generateKeySignature({ modes: [] }, createRng(1), 'KEYSIG_IDENTIFY')).toThrow(
      RangeError,
    );
  });

  it('alle vier Fehler werden in neuen musikalischen Varianten wiederholt; Schlüsselwechsel allein genügt nicht', () => {
    const specs = [SPECS[0], SPECS[1], SPECS[4], SPECS[5]].filter(
      (spec): spec is ExerciseSpec => !!spec,
    );
    let state = createLessonSession(
      { id: 'test.tonality', contentVersion: 1, exercises: specs },
      'tonality-review',
    );
    const originals = state.initial.items;
    while (state.phase === 'initial') {
      const item = currentItem(state.initial);
      if (!item) throw new Error('Aufgabe fehlt');
      const wrong =
        item.type === 'SCALE_BUILD' && isScaleItem(item)
          ? scaleAnswerId(
              scalePitches(item).map((pitch, index) => (index === 1 ? item.tonic : pitch)),
            )
          : item.type === 'KEYSIG_BUILD'
            ? expectedAnswer(item) === 'signature:'
              ? 'signature:F#'
              : 'signature:'
            : item.choices.find((answer) => answer !== expectedAnswer(item));
      if (!wrong) throw new Error('Falsche Antwort fehlt');
      state = nextLessonExercise(answerLesson(state, wrong));
    }
    state = startLessonReview(state);
    while (state.phase === 'review') {
      const active = activeLessonSession(state),
        item = active && currentItem(active);
      const original = active && originals[active.index];
      if (!active || !item || !original) throw new Error('Wiederholung fehlt');
      expect(itemVariantKey(item)).not.toBe(itemVariantKey(original));
      state = nextLessonExercise(answerLesson(state, expectedAnswer(item)));
    }
    expect(lessonSummary(state)).toMatchObject({
      correct: 0,
      answered: 4,
      reviewCorrect: 4,
      unresolved: 0,
    });
    const signature = generateKeySignature({}, createRng(1), 'KEYSIG_BUILD');
    expect(itemVariantKey({ ...signature, clef: 'bass' })).toBe(itemVariantKey(signature));
    expect(keyFifths(signature.key)).toBeGreaterThanOrEqual(-7);
  });
});
