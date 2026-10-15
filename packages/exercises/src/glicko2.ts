/** Glickman, Glicko-2 steps 1–8 (glicko.net/glicko/glicko2.pdf).
 * One call is one completed rating period; opponents use pre-period states.
 */
export interface Glicko2Rating {
  readonly rating: number;
  readonly deviation: number;
  readonly volatility: number;
}
export interface Glicko2Result {
  readonly opponent: Glicko2Rating;
  readonly score: number;
}
export interface Glicko2Options {
  readonly tau?: number;
  readonly maxDeviation?: number;
}
export const INITIAL_RATING: Glicko2Rating = Object.freeze({
  rating: 1500,
  deviation: 350,
  volatility: 0.06,
});
const SCALE = 173.7178;
const g = (phi: number) => 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
const logistic = (x: number) => (x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x)));
export function validateRating(value: Glicko2Rating): void {
  if (
    !Number.isFinite(value.rating) ||
    Math.abs(value.rating) > 1_000_000 ||
    !Number.isFinite(value.deviation) ||
    value.deviation <= 0 ||
    value.deviation > 100_000 ||
    !Number.isFinite(value.volatility) ||
    value.volatility <= 0 ||
    value.volatility > 10
  )
    throw new RangeError('Invalid Glicko-2 state');
}
/** Symmetric predictive probability including uncertainty of both participants. */
export function expectedRatingScore(player: Glicko2Rating, opponent: Glicko2Rating): number {
  validateRating(player);
  validateRating(opponent);
  return logistic(
    (g(Math.hypot(player.deviation, opponent.deviation) / SCALE) *
      (player.rating - opponent.rating)) /
      SCALE,
  );
}
function deviationLimit(options: Glicko2Options) {
  const limit = options.maxDeviation ?? 350;
  if (!Number.isFinite(limit) || limit <= 0 || limit > 100_000)
    throw new RangeError('Invalid deviation limit');
  return limit;
}
/** Empty periods raise uncertainty without changing the estimate or volatility. */
export function decayGlicko2(
  player: Glicko2Rating,
  periods: number,
  options: Glicko2Options = {},
): Glicko2Rating {
  validateRating(player);
  if (!Number.isSafeInteger(periods) || periods < 0) throw new RangeError('Invalid rating periods');
  return {
    ...player,
    deviation: Math.min(
      deviationLimit(options),
      Math.hypot(player.deviation, SCALE * player.volatility * Math.sqrt(periods)),
    ),
  };
}
export function updateGlicko2(
  player: Glicko2Rating,
  results: readonly Glicko2Result[],
  options: Glicko2Options = {},
): Glicko2Rating {
  validateRating(player);
  const tau = options.tau ?? 0.5;
  if (!Number.isFinite(tau) || tau < 0.01 || tau > 2) throw new RangeError('Invalid Glicko-2 tau');
  const limit = deviationLimit(options);
  if (results.length === 0) return decayGlicko2(player, 1, options);
  const mu = (player.rating - 1500) / SCALE,
    phi = player.deviation / SCALE;
  let information = 0,
    improvement = 0;
  for (const { opponent, score } of results) {
    validateRating(opponent);
    if (!Number.isFinite(score) || score < 0 || score > 1)
      throw new RangeError('Invalid Glicko-2 score');
    const weight = g(opponent.deviation / SCALE);
    const probability = Math.max(
      1e-15,
      Math.min(1 - 1e-15, logistic(weight * (mu - (opponent.rating - 1500) / SCALE))),
    );
    information += weight * weight * probability * (1 - probability);
    improvement += weight * (score - probability);
  }
  const variance = 1 / information,
    delta = variance * improvement,
    a = Math.log(player.volatility ** 2);
  const f = (x: number) => {
    const ex = Math.exp(x),
      total = phi * phi + variance + ex;
    return (ex * (delta * delta - total)) / (2 * total * total) - (x - a) / (tau * tau);
  };
  let left = a,
    right: number;
  if (delta * delta > phi * phi + variance) right = Math.log(delta * delta - phi * phi - variance);
  else {
    let k = 1;
    while (f(a - k * tau) < 0) {
      if (++k > 10_000) throw new RangeError('Glicko-2 bracket did not converge');
    }
    right = a - k * tau;
  }
  let fl = f(left),
    fr = f(right);
  for (let iteration = 0; Math.abs(right - left) > 1e-8; iteration++) {
    if (iteration > 200 || !Number.isFinite(fl + fr) || fl === fr)
      throw new RangeError('Glicko-2 solver did not converge');
    const next = left + ((left - right) * fl) / (fr - fl),
      fn = f(next);
    if (fn * fr <= 0) {
      left = right;
      fl = fr;
    } else fl /= 2;
    right = next;
    fr = fn;
  }
  const volatility = Math.exp(left / 2),
    inflated = Math.hypot(phi, volatility);
  const deviation = 1 / Math.sqrt(1 / (inflated * inflated) + information);
  const result = {
    rating: 1500 + SCALE * (mu + deviation * deviation * improvement),
    deviation: Math.min(limit, SCALE * deviation),
    volatility,
  };
  validateRating(result);
  return result;
}
