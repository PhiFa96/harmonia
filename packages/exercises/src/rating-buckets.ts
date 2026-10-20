import type { ExerciseSpec, ExerciseType } from './types.ts';

/** Explicit parameter profiles, never question text, answers, seeds or locale. */
export const RATING_PARAMETERS = {
  SIGHT_SING: ['clefs', 'range', 'maxAccidentals', 'level'],
  SING_INTERVAL: ['clefs', 'range', 'maxAccidentals', 'level', 'intervals'],
  PLAY_BACK: ['clefs', 'range', 'maxAccidentals', 'level', 'intervals'],
  NOTE_NAME: ['clefs', 'range', 'maxAccidentals', 'includeOctave', 'presentation', 'sourceSystem'],
  NOTE_PLACE: ['clefs', 'range', 'maxAccidentals'],
  KEY_FIND: ['clefs', 'range', 'maxAccidentals', 'presentation'],
  INTERVAL_IDENTIFY_VISUAL: [
    'clefs',
    'range',
    'maxAccidentals',
    'intervals',
    'direction',
    'question',
  ],
  INTERVAL_IDENTIFY_AURAL: ['clefs', 'range', 'maxAccidentals', 'intervals', 'playback'],
  INTERVAL_BUILD: ['clefs', 'range', 'maxAccidentals', 'intervals', 'direction', 'question'],
  SCALE_BUILD: ['clefs', 'range', 'maxAccidentals', 'types', 'fifths', 'direction'],
  SCALE_IDENTIFY: ['clefs', 'range', 'maxAccidentals', 'types', 'fifths', 'direction'],
  KEYSIG_BUILD: ['clefs', 'modes', 'fifths'],
  KEYSIG_IDENTIFY: ['clefs', 'modes', 'fifths'],
  CHORD_BUILD: ['clefs', 'range', 'maxAccidentals', 'types', 'roots', 'inversions', 'diatonic'],
  CHORD_IDENTIFY: [
    'clefs',
    'range',
    'maxAccidentals',
    'types',
    'roots',
    'inversions',
    'diatonic',
    'presentation',
  ],
  RHYTHM_TAP: ['meters', 'clefs', 'tempos', 'level', 'rests', 'toleranceMs'],
  METER_IDENTIFY: ['meters', 'clefs', 'presentation'],
  KNOWLEDGE_MC: ['topics', 'maxDots', 'maxAccidentals', 'presentation'],
  MATCH: ['topics', 'maxDots', 'maxAccidentals', 'count'],
  ORDER: ['topics', 'maxDots', 'count', 'direction'],
  LISTENING_CHOICE: ['question', 'tempos'],
  CONTEXT_CHOICE: ['topics', 'years', 'modes', 'rootPosition'],
  CADENCE_IDENTIFY: ['fifths', 'types'],
  FUNCTION_ANALYSIS: ['fifths', 'degrees', 'notation'],
  MELODY_DICTATION: ['level'],
  RHYTHM_DICTATION: ['level'],
} as const satisfies Record<ExerciseType, readonly string[]>;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).sort().join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => JSON.stringify(k) + ':' + canonical(v))
        .join(',') +
      '}'
    );
  if (typeof value === 'number' && !Number.isFinite(value))
    throw new RangeError('Invalid rating parameter');
  if (value === null || ['string', 'boolean', 'number'].includes(typeof value))
    return JSON.stringify(value);
  throw new RangeError('Invalid rating parameter');
}
export function ratingBucket(spec: ExerciseSpec, contentVersion: number): string {
  if (!Number.isSafeInteger(contentVersion) || contentVersion < 1)
    throw new RangeError('Invalid rating content version');
  const allowed: readonly string[] = RATING_PARAMETERS[spec.type];
  if (Object.keys(spec.params).some((key) => !allowed.includes(key)))
    throw new RangeError('Unversioned rating parameter');
  const id = `g2:1:${String(contentVersion)}:${spec.type}:${canonical(spec.params)}`;
  if (id.length > 2048) throw new RangeError('Rating profile is too large');
  return id;
}
