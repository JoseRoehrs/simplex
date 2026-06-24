import Fraction from 'fraction.js';

/** Aritmética racional EXATA para os quadros do Simplex (sem ruído de ponto flutuante). */
export type Frac = Fraction;

export function F(value: number | string | Fraction = 0): Fraction {
  return new Fraction(value as number);
}

/** Representação em fração imprópria para exibição: "4/3", "-2", "0". */
export function fracToString(f: Fraction): string {
  return f.toFraction(false);
}

export function isZero(f: Fraction): boolean {
  return f.equals(0);
}

export function isNeg(f: Fraction): boolean {
  return f.compare(0) < 0;
}

export function isPos(f: Fraction): boolean {
  return f.compare(0) > 0;
}
