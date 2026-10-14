import {
  parseScore,
  validateScore,
  grandStaffTarget,
  scoreTimeline,
  keyboardMidi,
} from '@harmonia/notation';
import type { TutorExample } from '@harmonia/content';
/** JSONB darf Objektschlüssel umordnen; Arrayreihenfolge und sämtliche Werte müssen gleich bleiben. */
function sameJson(expected: unknown, actual: unknown): boolean {
  if (expected === actual) return true;
  if (!expected || !actual || typeof expected !== 'object' || typeof actual !== 'object')
    return false;
  if (Array.isArray(expected))
    return (
      Array.isArray(actual) &&
      expected.length === actual.length &&
      expected.every((v, i) => sameJson(v, actual[i]))
    );
  if (Array.isArray(actual)) return false;
  const left = expected as Record<string, unknown>,
    right = actual as Record<string, unknown>;
  const keys = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every(
      (key) => Object.prototype.hasOwnProperty.call(right, key) && sameJson(left[key], right[key]),
    )
  );
}
/** Keine Modell-Makros und keine fremden Score-Objekte rendern: Quelle erneut nachvollziehen. */
export function checkedTutorExample(example: TutorExample['example']) {
  const score = parseScore(example.source);
  if (score.staves.length > 2 || validateScore(score, { allowPickup: false }).length)
    throw new Error('Invalid tutor example');
  if (score.staves.length === 2) grandStaffTarget(score);
  if (
    score.staves.some(
      (staff) =>
        staff.measures.length > 8 ||
        staff.measures.some(
          (measure) =>
            measure.voices.length !== 1 || measure.voices.some((voice) => voice.events.length > 32),
        ),
    )
  )
    throw new Error('Example size');
  const timeline = scoreTimeline(score, { bpm: example.bpm });
  if (
    timeline.durationSeconds > 60 ||
    timeline.tones.length > 128 ||
    timeline.tones.some((tone) => keyboardMidi(tone.pitch) < 0 || keyboardMidi(tone.pitch) > 127)
  )
    throw new Error('Example range');
  if (!sameJson(score, example.score) || !sameJson(timeline, example.timeline))
    throw new Error('Example source mismatch');
  return score;
}
