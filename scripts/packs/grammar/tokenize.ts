/** Tokenizes sentences exactly as the pack pipeline does, for grammar detection and its tests. */
import type { Token } from '../../../src/domain/types.ts';
import { buildTokenizer, type Tokenize } from '../tokenizer.ts';
import { mapTokens } from '../tokens.ts';

/** Turns raw kuromoji output into pack tokens (word ids are not needed for grammar). */
export function packTokens(tokenize: Tokenize, text: string): Token[] {
  return mapTokens(text, tokenize(text), new Map()).tokens;
}

/** A sentence → tokens function backed by kuromoji, loaded from `root/node_modules`. */
export async function packTokenizer(root: string): Promise<(text: string) => Token[]> {
  const tokenize = await buildTokenizer(root);
  return (text) => packTokens(tokenize, text);
}
