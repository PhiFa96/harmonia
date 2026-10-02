// Exakte Brüche für Dauern und Positionen (nie Gleitkommazahlen, sonst summieren sich Rundungsfehler).

export interface Fraction {
  /** Zähler, ganzzahlig */
  readonly num: number;
  /** Nenner, ganzzahlig und positiv */
  readonly den: number;
}

/** Erzeugt einen gekürzten Bruch mit positivem Nenner. Wirft einen RangeError bei Nenner 0 oder Nicht-Ganzzahlen. */
export function fraction(num: number, den = 1): Fraction {
  if (!Number.isSafeInteger(num) || !Number.isSafeInteger(den) || den === 0) {
    throw new RangeError(`Ungültiger Bruch: ${String(num)}/${String(den)}`);
  }
  const divisor = gcd(Math.abs(num), Math.abs(den));
  const sign = den < 0 ? -1 : 1;
  return { num: withoutNegativeZero((sign * num) / divisor), den: (sign * den) / divisor };
}

export const ZERO: Fraction = fraction(0);

export function addFractions(a: Fraction, b: Fraction): Fraction {
  return fraction(a.num * b.den + b.num * a.den, a.den * b.den);
}

export function subtractFractions(a: Fraction, b: Fraction): Fraction {
  return fraction(a.num * b.den - b.num * a.den, a.den * b.den);
}

export function multiplyFractions(a: Fraction, b: Fraction): Fraction {
  return fraction(a.num * b.num, a.den * b.den);
}

/** Wirft einen RangeError bei Division durch null. */
export function divideFractions(a: Fraction, b: Fraction): Fraction {
  return fraction(a.num * b.den, a.den * b.num);
}

export function sumFractions(values: readonly Fraction[]): Fraction {
  return values.reduce(addFractions, ZERO);
}

/** Negativ, wenn a < b; null bei Gleichheit; positiv, wenn a > b. */
export function compareFractions(a: Fraction, b: Fraction): number {
  return a.num * b.den - b.num * a.den;
}

export function fractionEquals(a: Fraction, b: Fraction): boolean {
  return compareFractions(a, b) === 0;
}

/** Nur für Ausgaben wie Sekunden – zum Rechnen immer Brüche verwenden. */
export function fractionToNumber(f: Fraction): number {
  return f.num / f.den;
}

/** „3/16“, ganze Zahlen ohne Nenner („2“). */
export function formatFraction(f: Fraction): string {
  return f.den === 1 ? String(f.num) : `${String(f.num)}/${String(f.den)}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a || 1 : gcd(b, a % b);
}

function withoutNegativeZero(value: number): number {
  return value === 0 ? 0 : value;
}
