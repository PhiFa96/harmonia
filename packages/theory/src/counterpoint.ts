// Internal teaching profile, after Open Music Theory, firstSpecies.md (R1 in
// docs/quality/p4-19-quellenentwurf.md). Not a complete stylistic assessment.
import { intervalBetween } from './interval.ts';
import { midi, pitch, type Pitch } from './pitch.ts';

export interface CounterpointDyad {
  readonly lower: Pitch;
  readonly upper: Pitch;
}
export const COUNTERPOINT_RULES = [
  'consonance',
  'crossing',
  'interior-unison',
  'spacing',
  'consecutive-perfect',
  'direct-perfect',
  'overlap',
  'boundary',
  'closing-motion',
] as const;
export type CounterpointRule = (typeof COUNTERPOINT_RULES)[number];
export interface CounterpointFinding {
  readonly rule: CounterpointRule;
  /** Zero-based position; transition findings refer to the arrival. */
  readonly at: number;
}

function checked(p: Pitch): Pitch {
  return pitch(p.letter, p.alter, p.octave);
}

/** Spelling matters: an augmented second is not a consonant minor third. */
export function isCounterpointConsonance(lower: Pitch, upper: Pitch): boolean {
  const interval = intervalBetween(checked(lower), checked(upper));
  const simple = ((interval.number - 1) % 7) + 1;
  return (
    interval.direction === 1 &&
    ((interval.quality === 'P' && [1, 5].includes(simple)) ||
      (['m', 'M'].includes(interval.quality) && [3, 6].includes(simple)))
  );
}

export function contrapuntalMotion(
  a: CounterpointDyad,
  b: CounterpointDyad,
): 'static' | 'oblique' | 'contrary' | 'similar' {
  const low = Math.sign(midi(checked(b.lower)) - midi(checked(a.lower)));
  const high = Math.sign(midi(checked(b.upper)) - midi(checked(a.upper)));
  if (low === 0 && high === 0) return 'static';
  if (low === 0 || high === 0) return 'oblique';
  return low === high ? 'similar' : 'contrary';
}

/** Equal-duration 1:1 dyads, cantus in the lower voice, counterpoint above.
 * Checks nine explicitly bounded rules. No rhythm, mode, melodic climax,
 * singability, or second-to-fifth species judgement is implied by an empty result.
 */
export function analyzeFirstSpecies(
  dyads: readonly CounterpointDyad[],
): readonly CounterpointFinding[] {
  if (dyads.length < 2) throw new RangeError('At least two first-species dyads required');
  const intervals = dyads.map(({ lower, upper }) =>
    intervalBetween(checked(lower), checked(upper)),
  );
  const findings: CounterpointFinding[] = [];
  const add = (rule: CounterpointRule, at: number) => {
    findings.push({ rule, at });
  };
  const perfectClass = (at: number) => {
    const i = intervals[at];
    return i?.direction === 1 && i.quality === 'P' ? ((i.number - 1) % 7) + 1 : 0;
  };
  dyads.forEach((dyad, at) => {
    const interval = intervals[at];
    if (!interval) throw new RangeError('Missing interval');
    if (!isCounterpointConsonance(dyad.lower, dyad.upper)) add('consonance', at);
    if (midi(dyad.upper) < midi(dyad.lower)) add('crossing', at);
    if (at > 0 && at < dyads.length - 1 && interval.number === 1 && interval.quality === 'P')
      add('interior-unison', at);
    if (interval.number > 12 || midi(dyad.upper) - midi(dyad.lower) > 19) add('spacing', at);
    if (
      at === 0 &&
      !(interval.quality === 'P' && [1, 5, 8].includes(interval.number) && interval.direction === 1)
    )
      add('boundary', at);
    if (
      at === dyads.length - 1 &&
      !(interval.quality === 'P' && [1, 8].includes(interval.number) && interval.direction === 1)
    )
      add('boundary', at);
    const previous = dyads[at - 1];
    if (!previous) return;
    const currentClass = perfectClass(at);
    if ([1, 5].includes(currentClass) && currentClass === perfectClass(at - 1))
      add('consecutive-perfect', at);
    const motion = contrapuntalMotion(previous, dyad);
    if ([1, 5].includes(currentClass) && motion === 'similar') add('direct-perfect', at);
    if (midi(dyad.lower) > midi(previous.upper) || midi(dyad.upper) < midi(previous.lower))
      add('overlap', at);
    if (at === dyads.length - 1) {
      const steps = [
        intervalBetween(previous.lower, dyad.lower),
        intervalBetween(previous.upper, dyad.upper),
      ];
      const penultimate = intervals[at - 1];
      const closes =
        penultimate?.direction === 1 &&
        ((penultimate.number === 3 && penultimate.quality === 'm') ||
          (penultimate.number === 6 && penultimate.quality === 'M'));
      if (
        motion !== 'contrary' ||
        steps.some((i) => i.number !== 2 || !['m', 'M'].includes(i.quality)) ||
        !closes
      )
        add('closing-motion', at);
    }
  });
  return findings;
}
