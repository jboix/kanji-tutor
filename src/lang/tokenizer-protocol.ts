import type { Token } from '../domain/types.ts';
import { type KuromojiToken, mapKuromojiTokens } from './kuromoji-map.ts';

/** Message from the page to the tokenizer worker. */
export interface TokenizeRequest {
  id: number;
  /** Same-origin path of the kuromoji dictionary folder; the first request's value is used. */
  dictPath: string;
  text: string;
}

/** Message from the tokenizer worker back to the page. */
export type TokenizeResponse = { id: number; tokens: Token[] } | { id: number; error: string };

/** A built kuromoji tokenizer, reduced to what we call. */
export interface RawTokenizer {
  tokenize(text: string): KuromojiToken[];
}

/** Builds kuromoji from a dictionary path (browser build in the worker, Node build in tests). */
export type BuildRawTokenizer = (dictPath: string) => Promise<RawTokenizer>;

/** The worker side of the protocol: `postMessage` plus a message listener. */
export interface WorkerScope {
  postMessage(message: TokenizeResponse): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<TokenizeRequest>) => void): void;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Answers tokenize requests on `scope`. Kuromoji is built once, on the first request, and
 * requests that arrive while it loads wait for it. A failed build is retried on the next request.
 */
export function serveTokenizer(scope: WorkerScope, build: BuildRawTokenizer): void {
  let tokenizer: Promise<RawTokenizer> | undefined;
  scope.addEventListener('message', async ({ data }) => {
    tokenizer ??= build(data.dictPath);
    try {
      const raw = await tokenizer;
      scope.postMessage({ id: data.id, tokens: mapKuromojiTokens(raw.tokenize(data.text)) });
    } catch (error) {
      tokenizer = undefined;
      scope.postMessage({ id: data.id, error: errorText(error) });
    }
  });
}

/** Wraps kuromoji's callback builder in a promise. */
export function buildWith(
  builder: (options: { dicPath: string }) => {
    build(callback: (err: Error | null, tokenizer: RawTokenizer) => void): void;
  },
): BuildRawTokenizer {
  return (dictPath) =>
    new Promise((resolve, reject) => {
      builder({ dicPath: dictPath }).build((err, tokenizer) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
    });
}
