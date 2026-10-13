import { createLessonSession } from '@harmonia/exercises';
import { describe, expect, it } from 'vitest';
import { exerciseSpecSchema } from './index.ts';
describe('Rhythmusparameter im Inhaltsschema', () => {
  it.each([
    { type: 'RHYTHM_TAP', params: { meters: ['2/4', '3/4', '4/4', '6/8'] } },
    {
      type: 'RHYTHM_TAP',
      params: {
        meters: ['2/2', '3/8', '9/8', '12/8'],
        tempos: [60, 120],
        level: 'dotted',
        rests: false,
        toleranceMs: 40,
        clefs: ['bass'],
      },
    },
    { type: 'METER_IDENTIFY', params: { meters: ['3/4', '6/8'], clefs: ['treble', 'bass'] } },
  ])('validiert %j und erzeugt eine serialisierbare Aufgabe', (spec) => {
    const parsed = exerciseSpecSchema.parse(spec);
    expect(parsed).toEqual(spec);
    const session = createLessonSession(
      { id: 'test.rhythm-schema', contentVersion: 1, exercises: [parsed] },
      1,
    );
    expect(session.initial.items[0]?.type).toBe(spec.type);
    expect(JSON.parse(JSON.stringify(session))).toEqual(session);
  });
  it.each([
    { type: 'RHYTHM_TAP', params: { meters: [] } },
    { type: 'RHYTHM_TAP', params: { meters: ['7/8'] } },
    { type: 'RHYTHM_TAP', params: { meters: ['4/4'], tempos: [] } },
    { type: 'RHYTHM_TAP', params: { meters: ['4/4'], tempos: [59] } },
    { type: 'RHYTHM_TAP', params: { meters: ['4/4'], tempos: [120.5] } },
    { type: 'RHYTHM_TAP', params: { meters: ['4/4'], toleranceMs: 39 } },
    { type: 'RHYTHM_TAP', params: { meters: ['4/4'], toleranceMs: 181 } },
    { type: 'RHYTHM_TAP', params: { meters: ['4/4'], level: 'triplet' } },
    { type: 'RHYTHM_TAP', params: { meters: ['4/4'], rests: 'yes' } },
    { type: 'RHYTHM_TAP', params: { meters: ['4/4'], range: { minMidi: 60, maxMidi: 72 } } },
    { type: 'METER_IDENTIFY', params: { meters: ['6/8'], tempos: [96] } },
    { type: 'METER_IDENTIFY', params: { meters: ['6/8'], presentation: 'aural' } },
    { type: 'METER_IDENTIFY', params: { meters: ['3+3/8'] } },
  ])('weist falsche, unklare oder typfremde Parameter zurück: %j', (spec) => {
    expect(exerciseSpecSchema.safeParse(spec).success).toBe(false);
  });
});
