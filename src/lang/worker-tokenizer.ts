import type { Token } from '../domain/types.ts';
import type { TokenizeRequest, TokenizeResponse } from './tokenizer-protocol.ts';
import type { Tokenizer } from './types.ts';

/** The page side of a worker, reduced to what the tokenizer client uses. */
export interface TokenizerWorker {
  postMessage(message: TokenizeRequest): void;
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<TokenizeResponse>) => void,
  ): void;
  addEventListener(type: 'error', listener: (event: ErrorEvent) => void): void;
  terminate(): void;
}

/** Options for `createWorkerTokenizer`; tests inject a fake worker. */
export interface WorkerTokenizerOptions {
  createWorker?: () => TokenizerWorker;
}

interface Pending {
  resolve: (tokens: Token[]) => void;
  reject: (error: Error) => void;
}

function startWorker(): TokenizerWorker {
  return new Worker(new URL('./tokenizer-worker.ts', import.meta.url), { type: 'module' });
}

/**
 * Kuromoji joins the dictionary path with `path.join`, which breaks `https://` URLs and resolves
 * relative paths against the worker script. Pass it a same-origin absolute path instead.
 */
export function dictPathFor(dictUrl: string, pageUrl = globalThis.location?.href): string {
  if (pageUrl === undefined) return dictUrl;
  const path = new URL(dictUrl, pageUrl).pathname;
  return path.endsWith('/') ? path : `${path}/`;
}

class WorkerClient {
  private worker: TokenizerWorker | undefined;
  private readonly pending = new Map<number, Pending>();
  private nextId = 1;

  constructor(
    private readonly dictPath: string,
    private readonly create: () => TokenizerWorker,
  ) {}

  tokenize(text: string): Promise<Token[]> {
    const id = this.nextId++;
    const worker = this.ensureWorker();
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage({ id, dictPath: this.dictPath, text });
    });
  }

  private ensureWorker(): TokenizerWorker {
    if (this.worker) return this.worker;
    const worker = this.create();
    worker.addEventListener('message', ({ data }) => this.settle(data));
    worker.addEventListener('error', (event) => this.fail(worker, event.message));
    this.worker = worker;
    return worker;
  }

  private settle(response: TokenizeResponse): void {
    const pending = this.pending.get(response.id);
    if (!pending) return;
    this.pending.delete(response.id);
    if ('error' in response) pending.reject(new Error(`Tokenizer: ${response.error}`));
    else pending.resolve(response.tokens);
  }

  /** A crashed worker rejects everything in flight; the next request starts a fresh one. */
  private fail(worker: TokenizerWorker, message: string): void {
    worker.terminate();
    this.worker = undefined;
    for (const pending of this.pending.values()) {
      pending.reject(new Error(`Tokenizer worker failed: ${message || 'unknown error'}`));
    }
    this.pending.clear();
  }
}

/**
 * Tokenizer that runs kuromoji in a Web Worker, loading its dictionary from `dictUrl`. The
 * worker starts on the first `tokenize` call; calls made while the dictionary loads are queued.
 */
export function createWorkerTokenizer(
  dictUrl: string,
  options: WorkerTokenizerOptions = {},
): Tokenizer {
  const client = new WorkerClient(dictPathFor(dictUrl), options.createWorker ?? startWorker);
  return { tokenize: (text) => client.tokenize(text) };
}
