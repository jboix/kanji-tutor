import type { Token } from '../types.ts';

/** A sentence to render with a blank: the blank is its own token, so it can be underlined. */
export interface BlankedSentence {
  text: string;
  tokens: Token[];
  /** Index of the blank token. */
  blank: number;
}

/** The blank shown in place of the hidden text: one box per kanji, a fixed gap for grammar. */
export const KANJI_BLANK = '〇';
export const PATTERN_BLANK = '＿＿＿';

/** The part of a token outside [start, end), keeping its metadata; undefined when none. */
function piece(token: Token, from: number, to: number): Token | undefined {
  const a = Math.max(from, token.start);
  const b = Math.min(to, token.start + token.surface.length);
  if (b <= a) return undefined;
  const surface = token.surface.slice(a - token.start, b - token.start);
  return { ...token, surface, start: a };
}

/**
 * The sentence with the text in [start, end) replaced by `fill`. Tokens cut by the range keep
 * the part outside it (待っ with 待 blanked → 〇っ), and every offset after it is shifted.
 */
export function blankText(
  sentence: { text: string; tokens: readonly Token[] },
  start: number,
  end: number,
  fill: string,
): BlankedSentence {
  const before = sentence.tokens.flatMap((t) => piece(t, 0, start) ?? []);
  const after = sentence.tokens.flatMap((t) => piece(t, end, Number.POSITIVE_INFINITY) ?? []);
  const shift = fill.length - (end - start);
  const blank: Token = { surface: fill, reading: fill, base: fill, pos: 'symbol', start };
  return {
    text: sentence.text.slice(0, start) + fill + sentence.text.slice(end),
    tokens: [...before, blank, ...after.map((t) => ({ ...t, start: t.start + shift }))],
    blank: before.length,
  };
}
