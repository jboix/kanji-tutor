import { describe, expect, it } from 'vitest';
import type { TokenizeRequest, TokenizeResponse } from './tokenizer-protocol.ts';
import { createWorkerTokenizer, dictPathFor, type TokenizerWorker } from './worker-tokenizer.ts';

class FakeWorker implements TokenizerWorker {
  readonly received: TokenizeRequest[] = [];
  terminated = false;
  private onMessage: ((event: MessageEvent<TokenizeResponse>) => void) | undefined;
  private onError: ((event: ErrorEvent) => void) | undefined;

  postMessage(message: TokenizeRequest): void {
    this.received.push(message);
  }

  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<TokenizeResponse>) => void,
  ): void;
  addEventListener(type: 'error', listener: (event: ErrorEvent) => void): void;
  addEventListener(type: string, listener: (event: never) => void): void {
    if (type === 'message')
      this.onMessage = listener as (e: MessageEvent<TokenizeResponse>) => void;
    else this.onError = listener as (e: ErrorEvent) => void;
  }

  terminate(): void {
    this.terminated = true;
  }

  reply(data: TokenizeResponse): void {
    this.onMessage?.({ data } as MessageEvent<TokenizeResponse>);
  }

  crash(message: string): void {
    this.onError?.({ message } as ErrorEvent);
  }
}

function setup() {
  const workers: FakeWorker[] = [];
  const tokenizer = createWorkerTokenizer('/dict/', {
    createWorker: () => {
      const worker = new FakeWorker();
      workers.push(worker);
      return worker;
    },
  });
  return { tokenizer, workers };
}

const TOKEN = { surface: '本', reading: 'ほん', base: '本', pos: 'noun', start: 0 };

describe('createWorkerTokenizer', () => {
  it('starts the worker lazily and matches responses to requests', async () => {
    const { tokenizer, workers } = setup();
    expect(workers).toHaveLength(0);
    const first = tokenizer.tokenize('本');
    const second = tokenizer.tokenize('本本');
    const worker = workers[0]!;
    expect(workers).toHaveLength(1);
    expect(worker.received.map((r) => r.text)).toEqual(['本', '本本']);
    expect(worker.received[0]?.dictPath).toBe('/dict/');
    worker.reply({ id: 2, tokens: [TOKEN, { ...TOKEN, start: 1 }] });
    worker.reply({ id: 1, tokens: [TOKEN] });
    worker.reply({ id: 99, tokens: [] });
    await expect(first).resolves.toEqual([TOKEN]);
    await expect(second).resolves.toHaveLength(2);
  });

  it('rejects worker-reported errors', async () => {
    const { tokenizer, workers } = setup();
    const result = tokenizer.tokenize('本');
    workers[0]?.reply({ id: 1, error: 'dictionary 404' });
    await expect(result).rejects.toThrow('Tokenizer: dictionary 404');
  });

  it('rejects in-flight requests when the worker crashes, then restarts it', async () => {
    const { tokenizer, workers } = setup();
    const result = tokenizer.tokenize('本');
    workers[0]?.crash('');
    await expect(result).rejects.toThrow('Tokenizer worker failed: unknown error');
    expect(workers[0]?.terminated).toBe(true);
    const retry = tokenizer.tokenize('本');
    expect(workers).toHaveLength(2);
    workers[1]?.reply({ id: 2, tokens: [TOKEN] });
    await expect(retry).resolves.toEqual([TOKEN]);
  });
});

describe('dictPathFor', () => {
  it('turns the dictionary URL into a same-origin absolute path', () => {
    expect(dictPathFor('/dict/', 'https://x.github.io/kanji-reader/read')).toBe('/dict/');
    expect(dictPathFor('/kanji-reader/dict/', 'https://x.github.io/kanji-reader/')).toBe(
      '/kanji-reader/dict/',
    );
    expect(dictPathFor('dict', 'https://x.github.io/kanji-reader/')).toBe('/kanji-reader/dict/');
    expect(dictPathFor('https://x.github.io/a/dict/', 'https://x.github.io/')).toBe('/a/dict/');
    expect(dictPathFor('/dict/', undefined)).toBe('/dict/');
  });
});
