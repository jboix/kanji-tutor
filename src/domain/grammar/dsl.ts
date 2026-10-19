/**
 * A small combinator language for grammar detectors over tokenizer output (G1). A matcher reads
 * tokens from an index and returns every index where a match could end, so sequences backtrack
 * without regular expressions. Zero-width matchers (`not`, `prev`, `end`) check context without
 * adding tokens to the matched span.
 */
import type { Token } from '../types.ts';

/** From token index `at`, the indices just past each way the matcher matches; empty when none. */
export type Matcher = (tokens: readonly Token[], at: number) => readonly number[];

type OneOrMany = string | readonly string[];

/** What one token must look like. Every given field must hold. */
export interface TokenSpec {
  surface?: OneOrMany;
  base?: OneOrMany;
  /** Coarse part of speech, as in `Token.pos`. */
  pos?: OneOrMany;
  /** True: the surface is the dictionary form (surface equals base). False: it is inflected. */
  plain?: boolean;
  /** The surface ends with one of these. */
  ends?: OneOrMany;
  /** Hiragana reading, as in `Token.reading`. */
  reading?: OneOrMany;
}

function oneOf(value: OneOrMany | undefined, actual: string): boolean {
  if (value === undefined) return true;
  return typeof value === 'string' ? value === actual : value.includes(actual);
}

function endsWith(value: OneOrMany | undefined, surface: string): boolean {
  if (value === undefined) return true;
  const list = typeof value === 'string' ? [value] : value;
  return list.some((tail) => surface.endsWith(tail));
}

function plainFits(plain: boolean | undefined, token: Token): boolean {
  return plain === undefined || (token.surface === token.base) === plain;
}

/** Whether a token fits the spec; false for a missing token. */
export function fits(token: Token | undefined, spec: TokenSpec): boolean {
  if (token === undefined) return false;
  const words = oneOf(spec.surface, token.surface) && oneOf(spec.base, token.base);
  const shape = oneOf(spec.pos, token.pos) && endsWith(spec.ends, token.surface);
  return words && shape && oneOf(spec.reading, token.reading) && plainFits(spec.plain, token);
}

function unique(ends: readonly number[]): readonly number[] {
  return [...new Set(ends)];
}

/** One token that fits the spec. */
export function tok(spec: TokenSpec): Matcher {
  return (tokens, at) => (fits(tokens[at], spec) ? [at + 1] : []);
}

/** One token whose surface is one of these. */
export function s(...surface: string[]): Matcher {
  return tok({ surface });
}

/** One token whose base (dictionary) form is one of these. */
export function b(...base: string[]): Matcher {
  return tok({ base });
}

/** Matchers one after another. */
export function seq(...matchers: readonly Matcher[]): Matcher {
  return (tokens, at) =>
    matchers.reduce<readonly number[]>(
      (ends, matcher) => unique(ends.flatMap((end) => matcher(tokens, end))),
      [at],
    );
}

/** Any one of the matchers. */
export function alt(...matchers: readonly Matcher[]): Matcher {
  return (tokens, at) => unique(matchers.flatMap((matcher) => matcher(tokens, at)));
}

/** The matcher, or nothing. */
export function opt(matcher: Matcher): Matcher {
  return (tokens, at) => unique([at, ...matcher(tokens, at)]);
}

/** Zero-width: succeeds only where the matcher does not match. */
export function not(matcher: Matcher): Matcher {
  return (tokens, at) => (matcher(tokens, at).length === 0 ? [at] : []);
}

/** Zero-width: the token just before the current position fits the spec. */
export function prev(spec: TokenSpec): Matcher {
  return (tokens, at) => (fits(tokens[at - 1], spec) ? [at] : []);
}

/** Zero-width: the token just before the current position does not fit the spec. */
export function notPrev(spec: TokenSpec): Matcher {
  return (tokens, at) => (fits(tokens[at - 1], spec) ? [] : [at]);
}

/** Zero-width: a match of the matcher ends right here, starting at most `max` tokens back. */
export function behind(matcher: Matcher, max = 3): Matcher {
  return (tokens, at) => {
    for (let from = Math.max(0, at - max); from < at; from++) {
      if (matcher(tokens, from).includes(at)) return [at];
    }
    return [];
  };
}

/** Zero-width: no match of the matcher ends right here (looking at most `max` tokens back). */
export function notBehind(matcher: Matcher, max = 3): Matcher {
  const found = behind(matcher, max);
  return (tokens, at) => (found(tokens, at).length > 0 ? [] : [at]);
}

/** Zero-width: the end of the sentence or a punctuation symbol comes next. */
export const end: Matcher = (tokens, at) => {
  const next = tokens[at];
  return next === undefined || next.pos === 'symbol' ? [at] : [];
};

const SENTENCE_END = new Set(['。', '！', '？', '!', '?', '」', '』']);

/** Zero-width: the end of the sentence (or of a quoted sentence) comes next; a comma does not count. */
export const stop: Matcher = (tokens, at) => {
  const next = tokens[at];
  return next === undefined || SENTENCE_END.has(next.surface) ? [at] : [];
};

const CLAUSE_BREAK = new Set(['。', '！', '？', '!', '?', '「', '」', '『', '』']);

/** Skips 0 to `max` tokens, never across the end of a sentence or a quotation mark. */
export function gap(max: number): Matcher {
  return (tokens, at) => {
    const ends = [at];
    for (let i = at; i < Math.min(at + max, tokens.length); i++) {
      if (CLAUSE_BREAK.has(tokens[i]?.surface ?? '')) break;
      ends.push(i + 1);
    }
    return ends;
  };
}

function textEnd(tokens: readonly Token[], at: number, form: string): number | undefined {
  let joined = '';
  let i = at;
  while (joined.length < form.length && i < tokens.length) {
    joined += tokens[i]?.surface ?? '';
    i++;
  }
  return joined.startsWith(form) ? i : undefined;
}

/**
 * The fewest whole tokens from here whose surfaces start with one of the forms, so the form is
 * found however the tokenizer split it: "に違いな" covers に + 違い + ない.
 */
export function text(...forms: string[]): Matcher {
  return (tokens, at) =>
    unique(forms.flatMap((form) => textEnd(tokens, at, form) ?? []).filter((e) => e > at));
}
