import type { de } from './de.ts';

type Strings<T> = { readonly [K in keyof T]: T[K] extends string ? string : Strings<T[K]> };
type PartialStrings<T> = {
  readonly [K in keyof T]?: T[K] extends string ? string : PartialStrings<T[K]>;
};

/** Form aller Texte: dieselben Schlüssel wie Deutsch, Werte beliebige Zeichenketten. */
export type Messages = Strings<typeof de>;

/** Abweichungen einer Variante (en-GB) von ihrer Basis. */
export type PartialMessages = PartialStrings<typeof de>;

/** Verschachtelte Texte, wie sie die Prüfung verarbeitet. */
export interface MessageTree {
  readonly [key: string]: string | MessageTree;
}
