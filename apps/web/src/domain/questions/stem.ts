/** Cutting a sentence around the span a question marks, and shared span helpers. */
import { hasKanji, toKanaFold } from '../kana.ts';
import { answerSpan } from '../services/reading-check.ts';
import type { Sentence, Token } from '../types.ts';
import type { Stem } from './types.ts';

/** Character range [from, to) of a run of tokens. */
export function tokenRange(tokens: readonly Token[], first: number, last: number) {
  const a = tokens[first];
  const b = tokens[last];
  if (!(a && b)) return undefined;
  return { from: a.start, to: b.start + b.surface.length };
}

/** The sentence cut around [from, to): `target` is what the question marks or hides. */
export function stemOf(
  sentence: Pick<Sentence, 'text'>,
  from: number,
  to: number,
  mark: Stem['mark'],
): Stem {
  const { text } = sentence;
  return { before: text.slice(0, from), target: text.slice(from, to), after: text.slice(to), mark };
}

/** The kana at the end of a written form: 待つ → つ, 駅 → "". */
export function kanaTail(text: string): string {
  let end = text.length;
  while (end > 0 && !hasKanji(text.charAt(end - 1))) end--;
  return text.slice(end);
}

/** The written form without its trailing kana: 待って → 待. */
export function kanjiStem(text: string): string {
  return text.slice(0, text.length - kanaTail(text).length);
}

/** A stable question id from its kind, sentence and what it asks about. */
export function questionId(kind: string, sentenceId: string, key: string | number): string {
  return `q:${kind}:${sentenceId}:${key}`;
}

/** What ends a predicate rather than inflecting it: the copula and the じゃ of じゃない. */
const CLOSERS = new Set(['です', 'だ', 'じゃ', 'でしょ', 'でしょう']);

/**
 * Tokens underlined with a word (J1, J2): the word and its inflecting endings (待っ + て,
 * 行き + たい), not the copula after them (言う, not 言うじゃない; 行きたい, not 行きたいです).
 */
export function underlineSpan(sentence: Sentence, tokenIndex: number): number[] {
  const span = answerSpan(sentence, tokenIndex);
  const closes = (j: number) => {
    const t = sentence.tokens[j];
    return t !== undefined && (CLOSERS.has(t.base) || CLOSERS.has(t.surface));
  };
  const cut = span.findIndex((j) => j !== tokenIndex && closes(j));
  return cut > 0 ? span.slice(0, cut) : span;
}

/** The kana of the underlined tokens. */
export const underlineReading = (sentence: Sentence, tokenIndex: number) =>
  underlineSpan(sentence, tokenIndex)
    .map((j) => toKanaFold(sentence.tokens[j]?.reading ?? ''))
    .join('');
