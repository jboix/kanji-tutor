/** Worker: grammar ids for a batch of token lists (see grammar-pool.ts). */
import type { Token } from '../../src/domain/types.ts';
import { grammarIdsOf } from './grammar/detect.ts';

declare const self: Worker;

self.onmessage = (event: MessageEvent<Token[][]>) => {
  self.postMessage(event.data.map((tokens) => grammarIdsOf(tokens)));
};
