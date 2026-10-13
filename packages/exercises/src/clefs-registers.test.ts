import { describe, expect, it } from 'vitest';
import { parsePitch } from '@harmonia/theory';
import { grandStaffExample, parseScore } from '@harmonia/notation';
import { generateKeyFind, generateNote } from './generate.ts';
import { createRng } from '@harmonia/theory';
import { expectedAnswer, evaluateExercise } from './evaluate.ts';
import { octaveName } from './octave-names.ts';
import { inputTarget } from './pitch-input.ts';
import {
  choiceLabel,
  exerciseDescription,
  exerciseFeedback,
  exercisePrompt,
  exerciseHints,
  hintText,
} from './feedback.ts';
import { itemVariantKey } from './lesson.ts';
const pairs = [
  ['C3', 'c', 'c'],
  ['B3', 'h', 'b'],
  ['C4', 'c¹', 'c¹'],
  ['B4', 'h¹', 'b¹'],
  ['C5', 'c²', 'c²'],
  ['F5', 'f²', 'f²'],
] as const;
const range = { minMidi: 48, maxMidi: 77 };
describe('Oktavnamen aus derselben Quelle', () => {
  it.each(pairs)(
    '%s: internationale Wissenschaftsnamen und lokalisierte Helmholtz-Namen',
    (name, german, english) => {
      const initial = generateNote(
        { presentation: 'octave-name', sourceSystem: 'helmholtz', range },
        createRng(1),
      );
      for (const sourceSystem of ['helmholtz', 'scientific'] as const) {
        const item = {
          ...initial,
          choices: [...new Set([...initial.choices, name])],
          sourceSystem,
          score: parseScore(`treble | 4/4 | ${name}/1`),
        };
        expect(expectedAnswer(item)).toBe(name); // deliberately keep stale item.pitch
        expect(evaluateExercise(item, name).correct).toBe(true);
        for (const locale of ['de', 'en-US', 'en-GB'] as const) {
          const helm = locale === 'de' ? german : english;
          expect(octaveName(item, locale)).toBe(sourceSystem === 'helmholtz' ? helm : name);
          expect(choiceLabel(item, name, locale)).toBe(sourceSystem === 'helmholtz' ? name : helm);
          expect(exercisePrompt(item, locale)).toContain(
            sourceSystem === 'helmholtz' ? helm : name,
          );
          expect(exerciseFeedback(item, evaluateExercise(item, name), locale).message).toContain(
            helm,
          );
          for (const level of [1, 2, 3] as const)
            expect(hintText(item, exerciseHints(item, level), locale)).not.toMatch(/exercise\.|{{/);
        }
      }
    },
  );
  it('gleicher Buchstabe in anderer Lage bleibt in beiden Richtungen eine falsche Option', () => {
    for (let seed = 0; seed < 100; seed++) {
      const item = generateNote(
        { presentation: 'octave-name', sourceSystem: 'both', range },
        createRng(seed),
      );
      const wrong = item.choices.find(
        (a) =>
          parsePitch(a).letter === item.pitch.letter && parsePitch(a).octave !== item.pitch.octave,
      );
      expect(wrong).toBeDefined();
      expect(evaluateExercise(item, wrong ?? '').correct).toBe(false);
      expect(
        itemVariantKey({
          ...item,
          sourceSystem: item.sourceSystem === 'scientific' ? 'helmholtz' : 'scientific',
        }),
      ).toBe(itemVariantKey(item));
    }
  });
  it('weist beschädigte Quellen ab', () => {
    const item = generateNote({ presentation: 'octave-name', range }, createRng(1));
    for (const source of ['treble | 4/4 | r/1', 'treble | 4/4 | C4/2 E4/2', 'treble | 4/4 | C#4/1'])
      expect(() => expectedAnswer({ ...item, score: parseScore(source) })).toThrow(RangeError);
  });
});
describe('Tastenwahl im großen System', () => {
  it('Quelle steuert Bewertung, Erklärung und Wiederholung statt veralteter Metadaten', () => {
    const base = generateKeyFind({ presentation: 'grand-staff' }, createRng(1));
    const pitch = parsePitch('C4'),
      score = grandStaffExample(pitch, 'bass'),
      item = { ...base, pitch: parsePitch('A3'), clef: 'treble' as const, score };
    expect(expectedAnswer(item)).toBe('key:60');
    expect(inputTarget(item)).toEqual(pitch);
    expect(evaluateExercise(item, 'key:57').correct).toBe(false);
    expect(itemVariantKey(item)).toBe(
      itemVariantKey({ ...item, pitch, score: grandStaffExample(pitch, 'treble') }),
    );
    expect(exerciseFeedback(item, evaluateExercise(item, 'key:60'), 'de').message).toContain('c¹');
    expect(exerciseDescription(item, 'de')).toContain('Bassschlüssel');
    expect(exerciseDescription(item, 'de')).not.toContain('c¹');
    for (const level of [1, 2, 3] as const)
      expect(hintText(item, exerciseHints(item, level), 'de')).not.toMatch(/exercise\.|{{/);
  });
  it('beschränkt alle Generator-Parameter auf den lesbaren Einstieg', () => {
    expect(() =>
      generateKeyFind(
        { presentation: 'grand-staff', range: { minMidi: 48, maxMidi: 64 } },
        createRng(0),
      ),
    ).toThrow(RangeError);
    expect(() =>
      generateKeyFind({ presentation: 'grand-staff', maxAccidentals: 1 }, createRng(0)),
    ).toThrow(RangeError);
    expect(() =>
      generateNote({ presentation: 'octave-name', includeOctave: false }, createRng(0)),
    ).toThrow(RangeError);
    expect(() => generateNote({ sourceSystem: 'scientific' }, createRng(0))).toThrow(RangeError);
  });
});
