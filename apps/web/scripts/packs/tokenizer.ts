/**
 * Builds the kuromoji (IPADIC) tokenizer in Bun, straight from node_modules: the dictionary is
 * found the way `root`'s package resolves kuromoji, wherever the workspace installed it.
 */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import kuromoji from 'kuromoji';
import type { RawToken } from './tokens.ts';

export type Tokenize = (text: string) => RawToken[];

export function buildTokenizer(root: string): Promise<Tokenize> {
  const kuromojiPackage = createRequire(join(root, 'package.json')).resolve(
    'kuromoji/package.json',
  );
  const dicPath = join(dirname(kuromojiPackage), 'dict');
  return new Promise((done, fail) => {
    kuromoji.builder({ dicPath }).build((error, tokenizer) => {
      if (error) fail(error);
      else done((text) => tokenizer.tokenize(text));
    });
  });
}
