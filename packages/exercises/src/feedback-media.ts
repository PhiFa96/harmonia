import { note, singleStaffScore } from '@harmonia/notation';
import type { Score } from '@harmonia/notation';
import { buildScale, duration } from '@harmonia/theory';
import type { Key } from '@harmonia/theory';
import type { ExerciseItem } from './types.ts';
import { isKeySignatureItem, signatureKey } from './tonality.ts';

function keyExample(key: Key, octave: number): Score {
  const pitches = buildScale(
    { ...key.tonic, octave },
    key.mode === 'major' ? 'major' : 'naturalMinor',
    { includeOctave: true },
  );
  return singleStaffScore(
    [
      pitches.slice(0, 4).map((p) => note(p, duration('quarter'))),
      pitches.slice(4).map((p) => note(p, duration('quarter'))),
    ],
    { clef: octave === 3 ? 'bass' : 'treble' },
  );
}
/** Ergänzende Medien nur, wenn die Aufgabe selbst noch kein vollständiges Lösungsbild zeigt. */
export function feedbackMedia(item: ExerciseItem): {
  score?: Score;
  audio?: Score;
  label?: 'source' | 'key';
} {
  if (isKeySignatureItem(item))
    return { audio: keyExample(signatureKey(item), item.clef === 'bass' ? 3 : 4), label: 'key' };
  if (item.type === 'CONTEXT_CHOICE') {
    if (item.source.kind === 'score') return { audio: item.source.score, label: 'source' };
    if (item.source.kind === 'key')
      return { audio: keyExample(item.source.key, 4), label: 'source' };
    return {};
  }
  if (
    (item.type === 'NOTE_NAME' && item.presentation === 'octave-name') ||
    (item.type === 'KEY_FIND' && item.presentation === 'name')
  )
    return { score: item.score, audio: item.score };
  return {};
}
