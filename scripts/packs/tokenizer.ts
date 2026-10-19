/** Builds the kuromoji (IPADIC) tokenizer in Bun, straight from node_modules. */
import { resolve } from 'node:path';
import kuromoji from 'kuromoji';
import type { RawToken } from './tokens.ts';

export type Tokenize = (text: string) => RawToken[];

export function buildTokenizer(root: string): Promise<Tokenize> {
  const dicPath = resolve(root, 'node_modules/kuromoji/dict');
  return new Promise((done, fail) => {
    kuromoji.builder({ dicPath }).build((error, tokenizer) => {
      if (error) fail(error);
      else done((text) => tokenizer.tokenize(text));
    });
  });
}
