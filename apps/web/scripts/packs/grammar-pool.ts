/**
 * Runs `grammarIdsOf` over many sentences on worker threads: the 265 detectors take about 1.4 ms
 * a sentence, so 200,000 candidates would take five minutes on one core. Order is kept.
 */
import { availableParallelism } from 'node:os';
import type { Token } from '../../src/domain/types.ts';

function run(batch: Token[][]): Promise<string[][]> {
  const worker = new Worker(new URL('./grammar-worker.ts', import.meta.url));
  return new Promise((done, fail) => {
    worker.onmessage = (event: MessageEvent<string[][]>) => {
      done(event.data);
      worker.terminate();
    };
    worker.onerror = (error) => {
      fail(error);
      worker.terminate();
    };
    worker.postMessage(batch);
  });
}

/** Grammar ids of each token list, in input order. */
export async function grammarIdsInParallel(all: Token[][]): Promise<string[][]> {
  const threads = Math.max(1, availableParallelism() - 1);
  const size = Math.ceil(all.length / threads);
  const batches: Token[][][] = [];
  for (let i = 0; i < all.length; i += size) batches.push(all.slice(i, i + size));
  return (await Promise.all(batches.map(run))).flat();
}
