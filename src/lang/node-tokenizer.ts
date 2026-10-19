import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import kuromoji from 'kuromoji';
import type { Token } from '../domain/types.ts';
import { mapKuromojiTokens } from './kuromoji-map.ts';
import { buildWith, type RawTokenizer } from './tokenizer-protocol.ts';
import type { Tokenizer } from './types.ts';

/** Folder of kuromoji's bundled IPADIC dictionary in `node_modules`. */
export function defaultDictPath(): string {
  const require = createRequire(import.meta.url);
  return join(dirname(require.resolve('kuromoji/package.json')), 'dict');
}

/**
 * Kuromoji tokenizer for Node/Bun (tests and the pack build pipeline). Never bundled into the
 * app: import it from `src/lang/node.ts`. The dictionary loads on the first call (about 1–2 s).
 */
export function createNodeTokenizer(dictPath = defaultDictPath()): Tokenizer {
  let raw: Promise<RawTokenizer> | undefined;
  return {
    async tokenize(text: string): Promise<Token[]> {
      raw ??= buildWith(kuromoji.builder)(dictPath);
      return mapKuromojiTokens((await raw).tokenize(text));
    },
  };
}
