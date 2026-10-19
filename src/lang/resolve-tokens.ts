import type { Token, Word } from '../domain/types.ts';
import { foldKana } from './kana.ts';
import { joinKanaWords, kanaSpans, kanaWordOf } from './kana-join.ts';
import { pickWord, type WordLookup } from './word-lookup.ts';

const UNRESOLVED_POS = new Set(['particle', 'symbol']);

/**
 * The token read as its word's preferred reading when the tokenizer chose a valid variant of
 * the word's usual writing (日本人 にっぽんじん → にほんじん, D56), with the variants kept.
 */
export function preferReading(token: Token, word: Word): Token {
  const variants = word.variants ?? [];
  const preferred = word.readings[0];
  if (variants.length === 0 || !preferred || token.surface !== word.forms[0]) return token;
  if (token.surface !== token.base) return token;
  const reading = foldKana(token.reading);
  const known = reading === foldKana(preferred) || variants.map(foldKana).includes(reading);
  return known ? { ...token, reading: foldKana(preferred), variants } : token;
}

async function resolveOne(token: Token, lookup: WordLookup): Promise<Token> {
  if (UNRESOLVED_POS.has(token.pos) || token.wordId) return token;
  let words = await lookup(token.base);
  if (words.length === 0 && token.surface !== token.base) words = await lookup(token.surface);
  const word = pickWord(words, token);
  return word === undefined ? token : preferReading({ ...token, wordId: word.id }, word);
}

/** The kana words the tokens split (わが|まま → わがまま), joined back (D92). */
async function joinSplitWords(tokens: readonly Token[], lookup: WordLookup): Promise<Token[]> {
  const texts = kanaSpans(tokens);
  const words = await Promise.all(texts.map(async (text) => kanaWordOf(await lookup(text), text)));
  const found = new Map(
    texts.flatMap((text, i) => (words[i] ? [[text, words[i].id] as const] : [])),
  );
  return joinKanaWords(tokens, found);
}

/**
 * Joins the kana words the tokenizer split, then sets each token's JMdict `wordId` (particles
 * and symbols are skipped). Lookups are shared.
 */
export async function resolveTokens(
  tokens: readonly Token[],
  lookup: WordLookup,
): Promise<Token[]> {
  const joined = await joinSplitWords(tokens, lookup);
  return Promise.all(joined.map((token) => resolveOne(token, lookup)));
}
