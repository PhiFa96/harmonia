// Bounded operations on explicitly supplied material; no automatic interpretation
// of an arbitrary work. Pitch-class operations assume twelve equal divisions.
export const MOTIF_TRANSFORMS = ['T', 'I', 'R', 'RI'] as const;
export type MotifTransform = (typeof MOTIF_TRANSFORMS)[number];
function integers(values: readonly number[]): void {
  if (!values.length || values.some((value) => !Number.isSafeInteger(value)))
    throw new RangeError('Nonempty integer sequence required');
}
export function pitchClass(value: number): number {
  if (!Number.isSafeInteger(value)) throw new RangeError('Integer pitch required');
  return ((value % 12) + 12) % 12;
}
export function pitchClassSet(values: readonly number[]): readonly number[] {
  integers(values);
  return [...new Set(values.map(pitchClass))].sort((a, b) => a - b);
}
/** Unordered pairs of distinct pitch classes, bins for interval classes 1…6. */
export function intervalClassVector(values: readonly number[]): readonly number[] {
  const set = pitchClassSet(values),
    vector = [0, 0, 0, 0, 0, 0];
  set.forEach((a, index) => {
    for (const b of set.slice(index + 1)) {
      const distance = pitchClass(b - a);
      const bin = Math.min(distance, 12 - distance) - 1;
      vector[bin] = (vector[bin] ?? 0) + 1;
    }
  });
  return vector;
}
export function isTwelveToneRow(values: readonly number[]): boolean {
  integers(values);
  return values.length === 12 && pitchClassSet(values).length === 12;
}
/** I reflects pitches around zero; R reverses temporal order. Transposition is
 * added last. Call pitchClass on results when octave equivalence is intended. */
export function transformMotif(
  values: readonly number[],
  form: MotifTransform,
  transposition = 0,
): readonly number[] {
  integers(values);
  if (!MOTIF_TRANSFORMS.includes(form) || !Number.isSafeInteger(transposition))
    throw new RangeError('Invalid transformation');
  const result = values.map(
    (value) => (form === 'I' || form === 'RI' ? -value : value) + transposition,
  );
  if (form === 'R' || form === 'RI') result.reverse();
  integers(result);
  return result;
}
/** Returns all matching forms, retaining ambiguity instead of guessing. */
export function matchingMotifTransforms(
  source: readonly number[],
  target: readonly number[],
  moduloOctave = false,
): readonly MotifTransform[] {
  integers(source);
  integers(target);
  if (source.length !== target.length) return [];
  return MOTIF_TRANSFORMS.filter((form) => {
    const model = transformMotif(source, form);
    const offset = (target[0] ?? 0) - (model[0] ?? 0);
    return model.every((value, index) => {
      const delta = value + offset - (target[index] ?? 0);
      return moduloOctave ? pitchClass(delta) === 0 : delta === 0;
    });
  });
}
/** Left rotation of a discrete pulse pattern, not a simulation of continuous phasing. */
export function rotatePattern<T>(values: readonly T[], offset: number): readonly T[] {
  if (!values.length || !Number.isSafeInteger(offset)) throw new RangeError('Invalid rotation');
  const start = ((offset % values.length) + values.length) % values.length;
  return [...values.slice(start), ...values.slice(0, start)];
}
/** Exact identity labels for already delimited sections. Not sonata-form inference. */
export function sectionPattern(sections: readonly string[]): string {
  if (!sections.length || sections.length > 26 || sections.some((section) => !section.length))
    throw new RangeError('Invalid sections');
  const seen: string[] = [];
  return sections
    .map((section) => {
      if (!seen.includes(section)) seen.push(section);
      return String.fromCharCode(65 + seen.indexOf(section));
    })
    .join('');
}
