import type { Plural } from "../translate";
import type { en } from "./en";

type Widen<T> = T extends string ? string : T extends Plural ? Plural : { [K in keyof T]: Widen<T[K]> };

/** The shape every language must provide, derived from the English catalog. */
export type Messages = Widen<typeof en>;

type Leaves<T, Prefix extends string, Match> = {
  [K in keyof T & string]: T[K] extends Match
    ? `${Prefix}${K}`
    : T[K] extends string | Plural
      ? never
      : Leaves<T[K], `${Prefix}${K}.`, Match>;
}[keyof T & string];

/** Dotted paths to plain messages, e.g. `myReading.backup.title`. */
export type StringKey = Leaves<Messages, "", string>;
/** Dotted paths to plural messages, e.g. `common.verses`. */
export type PluralKey = Leaves<Messages, "", Plural>;
