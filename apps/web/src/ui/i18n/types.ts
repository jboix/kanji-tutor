/**
 * Types of the message catalogues (N7b, D52). English is the source of truth: its namespaces and
 * keys define `MessageKey`, and French and Spanish must satisfy `Messages` exactly.
 */
import type { en } from './messages/en/index.ts';

/** A message with plural forms, chosen by `n` through `Intl.PluralRules`. */
export interface PluralMessage {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

type Source = typeof en;

type Shape<T> = T extends string ? string : PluralMessage;

/** What every language's catalogue holds: the English namespaces and keys, any wording. */
export type Messages = { [N in keyof Source]: { [K in keyof Source[N]]: Shape<Source[N][K]> } };

/** "read.prompt": a namespace and a key in it. */
export type MessageKey = {
  [N in keyof Source]: `${N & string}.${keyof Source[N] & string}`;
}[keyof Source];

type ValueOf<K> = K extends `${infer N}.${infer M}`
  ? N extends keyof Source
    ? M extends keyof Source[N]
      ? Source[N][M]
      : never
    : never
  : never;

type Holes<S> = S extends `${string}{${infer P}}${infer Rest}` ? P | Holes<Rest> : never;

type HolesOf<V> = V extends string
  ? Holes<V>
  : 'n' | Holes<V extends { other: infer O } ? O : never>;

/** A value put into a message: text or a number (numbers are formatted for the language). */
export type ParamValue = string | number;

/** The params a key needs: none, or one value per `{placeholder}` (and `n` for plurals). */
export type ParamsOf<K extends MessageKey> = [HolesOf<ValueOf<K>>] extends [never]
  ? []
  : [params: Record<HolesOf<ValueOf<K>>, ParamValue>];

/** A key whose message has no placeholder, for tables of labels: `t(LABELS[kind])`. */
export type PlainKey = { [K in MessageKey]: ParamsOf<K> extends [] ? K : never }[MessageKey];

/** `t('today.cards', { n: 3 })`: a message in the current language. */
export type Translate = <K extends MessageKey>(key: K, ...params: ParamsOf<K>) => string;

/** Params of a rich message: React nodes in the holes, e.g. a Japanese span in a sentence. */
export type RichParamsOf<K extends MessageKey, Node> = [HolesOf<ValueOf<K>>] extends [never]
  ? []
  : [params: Record<HolesOf<ValueOf<K>>, Node>];
