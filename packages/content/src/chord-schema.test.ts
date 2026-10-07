import { createLessonSession } from '@harmonia/exercises';
import { describe, expect, it } from 'vitest';
import { exerciseSpecSchema } from './index.ts';

describe('Akkordübungen im Inhaltsschema', () => {
  it.each([
    { type: 'CHORD_BUILD', params: { types: ['major', 'minor', 'diminished', 'augmented'] } },
    {
      type: 'CHORD_BUILD',
      params: {
        types: ['augmented'],
        roots: ['G#'],
        inversions: [1],
        maxAccidentals: 2,
        clefs: ['bass'],
      },
    },
    {
      type: 'CHORD_IDENTIFY',
      params: {
        types: ['major', 'minor'],
        roots: ['C', 'Bb'],
        inversions: [0, 1, 2],
        presentation: 'visual',
      },
    },
    {
      type: 'CHORD_IDENTIFY',
      params: { types: ['augmented'], roots: ['C', 'E'], presentation: 'aural' },
    },
  ])('validiert %j und erzeugt eine serialisierbare Aufgabe', (spec) => {
    const parsed = exerciseSpecSchema.parse(spec);
    expect(parsed).toEqual(spec);
    const session = createLessonSession(
      { id: 'test.chord-schema', contentVersion: 1, exercises: [parsed] },
      2,
    );
    expect(session.initial.items[0]?.type).toBe(spec.type);
    expect(JSON.parse(JSON.stringify(parsed))).toEqual(parsed);
    expect(JSON.parse(JSON.stringify(session))).toEqual(session);
  });
  it.each([
    { type: 'CHORD_BUILD', params: { types: [] } },
    { type: 'CHORD_BUILD', params: { types: ['dominant7'] } },
    { type: 'CHORD_BUILD', params: { types: ['major'], roots: [] } },
    { type: 'CHORD_BUILD', params: { types: ['major'], roots: ['C♯'] } },
    { type: 'CHORD_BUILD', params: { types: ['major'], roots: ['C4'] } },
    { type: 'CHORD_BUILD', params: { types: ['major'], roots: ['C', 'B'], maxAccidentals: 0 } },
    { type: 'CHORD_BUILD', params: { types: ['augmented'], roots: ['B'], maxAccidentals: 1 } },
    { type: 'CHORD_BUILD', params: { types: ['major'], inversions: [] } },
    { type: 'CHORD_BUILD', params: { types: ['major'], inversions: [3] } },
    { type: 'CHORD_BUILD', params: { types: ['major'], range: { minMidi: 60, maxMidi: 64 } } },
    { type: 'CHORD_BUILD', params: { types: ['major'], presentation: 'visual' } },
    { type: 'CHORD_IDENTIFY', params: { types: ['major'], presentation: 'melodic' } },
    { type: 'CHORD_IDENTIFY', params: { types: ['major'], playback: 'harmonic' } },
  ])('weist ungültige, unerreichbare oder typfremde Parameter zurück: %j', (spec) => {
    expect(exerciseSpecSchema.safeParse(spec).success).toBe(false);
  });
});
