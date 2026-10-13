import {
  MAX_STEP,
  MIN_STEP,
  eventPitches,
  pitchAt,
  stepOf,
  validateScore,
} from '@harmonia/notation';
import { chord, formatPitch, fromMidi, midi, parseNoteName, parsePitch } from '@harmonia/theory';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  activeLessonSession,
  answerLesson,
  answerSession,
  canonicalChordAnswer,
  chordAnswerId,
  chordReferencePitch,
  chordAnswerPitches,
  chordAnswerScore,
  chordAnswerStatuses,
  chordChoiceId,
  chordEditScore,
  chordFromId,
  chordSolutionScore,
  chordTargets,
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
  generateChord,
  generateExercise,
  hintText,
  isAuralExercise,
  isChordItem,
  itemVariantKey,
  lessonSummary,
  nextExercise,
  nextLessonExercise,
  revealHint,
  sessionSummary,
  skipAuralExercises,
  skipLessonAural,
  startLessonReview,
} from './index.ts';
import type { ChordParams, ChordItem, ExerciseSpec } from './index.ts';

const PARAMS: ChordParams = {
  types: ['major', 'minor', 'diminished', 'augmented'],
  roots: ['C', 'D', 'F', 'G', 'A'],
  clefs: ['treble', 'bass'],
  inversions: [0, 1, 2],
  maxAccidentals: 1,
};
const SPECS: readonly ExerciseSpec[] = [
  { type: 'CHORD_BUILD', params: PARAMS },
  { type: 'CHORD_IDENTIFY', params: PARAMS },
  { type: 'CHORD_IDENTIFY', params: { ...PARAMS, presentation: 'aural' } },
  {
    type: 'CHORD_BUILD',
    params: {
      types: PARAMS.types,
      range: { minMidi: 21, maxMidi: 108 },
      clefs: ['treble', 'bass'],
      maxAccidentals: 2,
    },
  },
  {
    type: 'CHORD_IDENTIFY',
    params: { ...PARAMS, roots: ['F#', 'G#', 'Bb'], maxAccidentals: 2, presentation: 'aural' },
  },
  {
    type: 'CHORD_BUILD',
    params: {
      types: ['major', 'minor', 'diminished'],
      clefs: ['treble', 'bass'],
      maxAccidentals: 0,
    },
  },
];
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Testwert fehlt');
  return value;
}
function build(
  root = 'C',
  type: 'major' | 'minor' | 'diminished' | 'augmented' = 'major',
  inversion: 0 | 1 | 2 = 0,
  bass = 'C4',
): ChordItem {
  return {
    ...generateChord(
      { types: [type], roots: [root], inversions: [inversion], maxAccidentals: 2 },
      createRng(1),
      'CHORD_BUILD',
    ),
    bass: parsePitch(bass),
  };
}
describe('Dreiklangübungen', () => {
  it.each(SPECS.map((spec, index) => [index, spec] as const))(
    'Parametersatz %i: 150 Seeds sind reproduzierbar, erreichbar und eindeutig auswertbar',
    (_index, spec) => {
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const item = generateExercise(spec, createRng(seed));
          if (!isChordItem(item)) throw new Error('Akkordaufgabe fehlt');
          expect(item).toEqual(generateExercise(spec, createRng(seed)));
          expect(validateScore(item.score, { allowPickup: false })).toEqual([]);
          expect(validateScore(chordSolutionScore(item), { allowPickup: false })).toEqual([]);
          const targets = chordTargets(item);
          expect(targets).toHaveLength(3);
          expect(targets[0]).toEqual(item.bass);
          expect(evaluateExercise(item, expectedAnswer(item))).toMatchObject({
            validAnswer: true,
            correct: true,
          });
          expect(evaluateExercise(item, 'invalid').validAnswer).toBe(false);
          const range = 'range' in spec.params ? spec.params.range : undefined;
          for (const pitch of targets) {
            expect(stepOf(pitch, item.clef)).toBeGreaterThanOrEqual(MIN_STEP);
            expect(stepOf(pitch, item.clef)).toBeLessThanOrEqual(MAX_STEP);
            expect(midi(pitch)).toBeGreaterThanOrEqual(
              range?.minMidi ?? (item.clef === 'treble' ? 60 : 36),
            );
            expect(midi(pitch)).toBeLessThanOrEqual(
              range?.maxMidi ?? (item.clef === 'treble' ? 84 : 60),
            );
            expect(Math.abs(pitch.alter)).toBeLessThanOrEqual(
              'maxAccidentals' in spec.params ? (spec.params.maxAccidentals ?? 1) : 1,
            );
          }
          if (item.type === 'CHORD_BUILD') {
            expect(item.choices).toEqual([]);
            expect(
              eventPitches(required(item.score.staves[0]?.measures[0]?.voices[0]?.events[0])),
            ).toEqual([item.bass]);
            expect(chordAnswerPitches(item, null)).toEqual([item.bass, null, null]);
          } else {
            expect(new Set(item.choices).size).toBe(item.choices.length);
            expect(item.choices.length).toBeLessThanOrEqual(4);
            expect(item.choices.filter((answer) => evaluateExercise(item, answer).correct)).toEqual(
              [expectedAnswer(item)],
            );
            if (item.presentation === 'aural')
              item.choices.forEach((answer) => {
                expect(chordFromId(answer).root).toEqual(item.chord.root);
              });
          }
        }),
        { numRuns: 150, seed: 2063 },
      );
    },
    15000,
  );

  it.each([
    ['C', 'major', 0, 'C4 E4 G4'],
    ['C', 'major', 1, 'E4 G4 C5'],
    ['C', 'major', 2, 'G4 C5 E5'],
    ['A', 'minor', 0, 'A3 C4 E4'],
    ['A', 'minor', 1, 'C4 E4 A4'],
    ['A', 'minor', 2, 'E4 A4 C5'],
    ['B', 'diminished', 0, 'B3 D4 F4'],
    ['B', 'diminished', 1, 'D4 F4 B4'],
    ['B', 'diminished', 2, 'F4 B4 D5'],
    ['C', 'augmented', 0, 'C4 E4 G#4'],
    ['C', 'augmented', 1, 'E4 G#4 C5'],
    ['C', 'augmented', 2, 'G#4 C5 E5'],
    ['G#', 'augmented', 1, 'B#3 D##4 G#4'],
    ['Bb', 'minor', 0, 'Bb3 Db4 F4'],
  ] as const)(
    '%s %s, Umkehrung %i: festes Beispiel %s wird exakt gebaut',
    (root, type, inversion, text) => {
      const pitches = text.split(' ').map((value) => parsePitch(value)),
        item = build(root, type, inversion, text.split(' ')[0]);
      expect(expectedAnswer(item)).toBe(`chord-notes:${text.replaceAll(' ', ',')}`);
      expect(chordTargets(item)).toEqual(pitches);
      expect(
        evaluateExercise(
          item,
          chordAnswerId([pitches[0] ?? null, pitches[2] ?? null, pitches[1] ?? null]),
        ).correct,
      ).toBe(true);
      const visual = {
        ...item,
        type: 'CHORD_IDENTIFY' as const,
        presentation: 'visual' as const,
        pitches,
        choices: [chordChoiceId(item.chord)],
      };
      expect(expectedAnswer(visual)).toBe(`chord:${root}:${type}:${String(inversion)}`);
    },
  );

  it('enharmonischer Ton, falsche Oktave, verdoppelter Ton und ausgetauschter Basston bleiben Fehler', () => {
    const item = build('C', 'augmented');
    for (const answer of [
      'chord-notes:C4,E4,Ab4',
      'chord-notes:C4,E5,G#4',
      'chord-notes:C4,E4,E4',
      'chord-notes:E4,C4,G#4',
    ])
      expect(evaluateExercise(item, answer)).toMatchObject({ validAnswer: true, correct: false });
    const duplicate = 'chord-notes:C4,E4,E4';
    expect(
      chordAnswerPitches(item, duplicate)?.map((pitch) => pitch && formatPitch(pitch)),
    ).toEqual(['C4', 'E4', 'E4']);
    expect(chordAnswerStatuses(item, duplicate)).toEqual([true, true, false]);
    expect(validateScore(chordAnswerScore(item, duplicate))).toEqual([]);
    expect(chordAnswerStatuses(item, 'chord-notes:C4,G#4,E4')).toEqual([true, true, true]);
  });

  it('unvollständige und fehlerhafte IDs erzeugen keine Antwortdatensätze; Einzelbearbeitung erhält beide Töne', () => {
    const item = build(),
      state = createSession([item]);
    for (const invalid of [
      'chord-notes:C4,,',
      'chord-notes:C4,E4',
      'chord-notes:C4,E4,G4,',
      'chord-notes:C4,E4,G4\n',
      'chord-notes:C4,E4,G♯4',
      'chord-notes:C4,C99,G4',
      'chord-notes:C4,C0,G4',
    ]) {
      expect(evaluateExercise(item, invalid).validAnswer).toBe(false);
      expect(answerSession(state, invalid)).toBe(state);
    }
    const partial = 'chord-notes:C4,E4,';
    expect(pitchAt(chordEditScore(item, partial, 1), { measure: 1, event: 0 })).toEqual(
      parsePitch('E4'),
    );
    expect(pitchAt(chordEditScore(item, partial, 2), { measure: 1, event: 0 })).toBeUndefined();
    expect(chordAnswerPitches(item, partial)?.filter(Boolean)).toHaveLength(2);
    for (const invalid of [
      'chord:C:major:3',
      'chord:C♯:major:0',
      'chord:C:major:0\n',
      'chord:C:dominant7:0',
    ])
      expect(() => chordFromId(invalid)).toThrow();
    const wrong = answerSession(revealHint(state), 'chord-notes:C4,E4,F4');
    expect(answerSession(wrong, expectedAnswer(item))).toBe(wrong);
    expect(sessionSummary(wrong)).toMatchObject({ correct: 0, assisted: 1, answered: 1 });
  });

  it('Erkennen wertet die geschriebenen oder klingenden Töne aus; Hörfragen lösen die Symmetrie über den vorgegebenen Grundton', () => {
    const visual = generateChord(
      { types: ['major', 'minor'], roots: ['C'], inversions: [1] },
      createRng(4),
      'CHORD_IDENTIFY',
    );
    const changed = {
      ...visual,
      chord: {
        ...visual.chord,
        type: visual.chord.type === 'major' ? ('minor' as const) : ('major' as const),
        inversion: 2,
      },
    };
    expect(expectedAnswer(changed)).toBe(expectedAnswer(visual));
    const cAug = {
      ...generateChord(
        { types: ['augmented'], roots: ['C'], inversions: [0], presentation: 'aural' },
        createRng(1),
        'CHORD_IDENTIFY',
      ),
      pitches: ['C4', 'E4', 'G#4'].map((value) => parsePitch(value)),
      bass: parsePitch('C4'),
    };
    const eAug = {
      ...generateChord(
        { types: ['augmented'], roots: ['E'], inversions: [2], presentation: 'aural' },
        createRng(1),
        'CHORD_IDENTIFY',
      ),
      pitches: cAug.pitches,
      bass: cAug.bass,
    };
    expect(expectedAnswer(cAug)).toBe('chord:C:augmented:0');
    expect(expectedAnswer(eAug)).toBe('chord:E:augmented:2');
    expect(
      expectedAnswer({ ...cAug, pitches: cAug.pitches.map((pitch) => fromMidi(midi(pitch))) }),
    ).toBe(expectedAnswer(cAug));
    expect(chordReferencePitch(cAug)).toEqual(parsePitch('C4'));
    expect(chordReferencePitch(eAug)).toEqual(parsePitch('E4'));
    expect(itemVariantKey(cAug)).not.toBe(itemVariantKey(eAug));
    const fbAug = { ...eAug, chord: chord(parseNoteName('Fb'), 'augmented', 2) };
    expect(expectedAnswer(fbAug)).toBe('chord:Fb:augmented:2');
    expect(itemVariantKey(fbAug)).toBe(itemVariantKey(eAug));
    expect(exercisePrompt(cAug, 'de')).toContain('Grundton C');
  });

  it('Hör-Pause überspringt Akkord- und Intervallhörfragen, aber keine visuelle Frage oder Schreibaufgabe', () => {
    const chordItems = SPECS.slice(0, 3).map((spec) => generateExercise(spec, createRng(1)));
    const interval = generateExercise(
      { type: 'INTERVAL_IDENTIFY_AURAL', params: { intervals: ['M3'] } },
      createRng(1),
    );
    let state = skipAuralExercises(createSession([...chordItems, interval, ...chordItems]));
    expect(state.skipped).toEqual([2, 3, 6]);
    while (currentItem(state)) {
      const item = required(currentItem(state));
      expect(isAuralExercise(item)).toBe(false);
      state = nextExercise(answerSession(state, expectedAnswer(item)));
    }
    expect(sessionSummary(state)).toMatchObject({ answered: 4, correct: 4, skipped: 3 });
  });

  it('Wiederholung verändert das Musikbeispiel; die Erstwertung und unterstützte Antworten bleiben erhalten', () => {
    let state = createLessonSession(
      { id: 'test.chords', contentVersion: 1, exercises: SPECS.slice(0, 3) },
      'chord-review',
    );
    const originals = state.initial.items;
    while (state.phase === 'initial') {
      const item = required(currentItem(state.initial));
      const wrong =
        item.type === 'CHORD_BUILD'
          ? chordAnswerId([item.bass, item.bass, item.bass])
          : required(item.choices.find((answer) => answer !== expectedAnswer(item)));
      state = nextLessonExercise(answerLesson(state, wrong));
    }
    state = startLessonReview(state);
    while (state.phase === 'review') {
      const active = required(activeLessonSession(state)),
        item = required(currentItem(active));
      expect(itemVariantKey(item)).not.toBe(itemVariantKey(required(originals[active.index])));
      state = nextLessonExercise(answerLesson(state, expectedAnswer(item)));
    }
    expect(lessonSummary(state)).toMatchObject({
      correct: 0,
      answered: 3,
      reviewCorrect: 3,
      unresolved: 0,
    });
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
    const source = build();
    expect(itemVariantKey({ ...source, clef: 'bass' })).toBe(itemVariantKey(source));
  });

  it('Hör-Pause nimmt einen bereits gewerteten Hörfehler aus der Wiederholung', () => {
    let state = createLessonSession(
      {
        id: 'test.chord-skip',
        contentVersion: 1,
        exercises: [required(SPECS[2]), required(SPECS[1])],
      },
      'skip',
    );
    const hearing = required(currentItem(state.initial));
    state = nextLessonExercise(
      answerLesson(
        state,
        required(hearing.choices.find((answer) => answer !== expectedAnswer(hearing))),
      ),
    );
    state = skipLessonAural(state);
    state = nextLessonExercise(
      answerLesson(state, expectedAnswer(required(currentItem(state.initial)))),
    );
    expect(state.phase).toBe('complete');
    expect(lessonSummary(state)).toMatchObject({
      correct: 1,
      answered: 2,
      reviewSkipped: 1,
      unresolved: 1,
    });
  });

  it.each(['de', 'en-US', 'en-GB'] as const)(
    'Schreiben, Sehen und Hören haben vollständige Erklärungen und Hinweise in %s',
    (locale) => {
      for (const spec of SPECS.slice(0, 3)) {
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
      const item = build('C', 'major', 1, 'E4');
      expect(
        exerciseFeedback(item, evaluateExercise(item, expectedAnswer(item)), locale).message,
      ).toContain(locale === 'de' ? 'Sextakkord' : 'first inversion');
    },
  );

  it('jede explizite Parametergruppe muss erreichbar sein; ungültige Wurzeln, Umkehrungen und Bereiche scheitern vor dem RNG', () => {
    const invalid = [
      { types: [] },
      { types: ['dominant7'] },
      { types: ['major'], roots: [] },
      { types: ['major'], roots: ['C♯'] },
      { types: ['major'], inversions: [3] },
      { types: ['major'], inversions: [] },
      { types: ['major'], roots: ['C', 'B'], maxAccidentals: 0 },
      { types: ['augmented'], roots: ['B'], maxAccidentals: 1 },
      { types: ['major'], range: { minMidi: 60, maxMidi: 64 } },
    ];
    for (const params of invalid)
      for (let seed = 0; seed < 3; seed++)
        expect(() =>
          generateChord(params as ChordParams, createRng(seed), 'CHORD_BUILD'),
        ).toThrow();
    expect(() =>
      generateChord({ ...PARAMS, presentation: 'aural' }, createRng(1), 'CHORD_BUILD'),
    ).toThrow();
    expect(chordFromId(chordChoiceId(chord(parseNoteName('Bb'), 'minor', 1))).root).toEqual(
      parseNoteName('Bb'),
    );
    expect(canonicalChordAnswer(['G4', 'C4', 'E4'].map((value) => parsePitch(value)))).toBe(
      'chord-notes:C4,E4,G4',
    );
  });
});
