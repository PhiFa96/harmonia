import { describe, expect, it } from 'vitest';
import { createLessonSession } from '@harmonia/exercises';
import { exerciseSpecSchema } from './index.ts';

describe('Tonleitern und Vorzeichnungen im Inhaltsschema', () => {
  it.each([
    {
      type: 'SCALE_BUILD',
      params: {
        types: ['major', 'melodicMinor'],
        direction: 'both',
        fifths: [0, 1],
        clefs: ['treble', 'bass'],
      },
    },
    {
      type: 'SCALE_IDENTIFY',
      params: { types: ['major', 'naturalMinor', 'harmonicMinor', 'melodicMinor'] },
    },
    { type: 'KEYSIG_BUILD', params: { fifths: [-7, 7], modes: ['major', 'minor'] } },
    { type: 'KEYSIG_IDENTIFY', params: { clefs: ['bass'], modes: ['minor'] } },
  ])('validiert %j und erzeugt ohne undefinierte Felder die passende Aufgabe', (spec) => {
    const parsed = exerciseSpecSchema.parse(spec);
    expect(parsed).toEqual(spec);
    expect(
      createLessonSession({ id: 'test.tonality-schema', contentVersion: 1, exercises: [parsed] }, 2)
        .initial.items[0]?.type,
    ).toBe(spec.type);
    expect(JSON.parse(JSON.stringify(parsed))).toEqual(parsed);
  });
  it.each([
    { type: 'SCALE_BUILD', params: { types: [] } },
    { type: 'SCALE_BUILD', params: { types: ['dorian'] } },
    { type: 'SCALE_BUILD', params: { types: ['major'], range: { minMidi: 60, maxMidi: 70 } } },
    { type: 'SCALE_BUILD', params: { types: ['harmonicMinor'], fifths: [7], maxAccidentals: 1 } },
    {
      type: 'SCALE_IDENTIFY',
      params: { types: ['naturalMinor', 'melodicMinor'], direction: 'descending' },
    },
    {
      type: 'SCALE_IDENTIFY',
      params: { types: ['naturalMinor', 'melodicMinor'], direction: 'both' },
    },
    { type: 'KEYSIG_BUILD', params: { fifths: [8] } },
    { type: 'KEYSIG_BUILD', params: { fifths: [] } },
    { type: 'KEYSIG_BUILD', params: { modes: ['dorian'] } },
    { type: 'KEYSIG_BUILD', params: { range: { minMidi: 60, maxMidi: 72 } } },
    { type: 'KEYSIG_IDENTIFY', params: { playback: 'harmonic' } },
  ])('weist unerreichbare, mehrdeutige und typfremde Parameter zurück: %j', (spec) => {
    expect(exerciseSpecSchema.safeParse(spec).success).toBe(false);
  });
});
