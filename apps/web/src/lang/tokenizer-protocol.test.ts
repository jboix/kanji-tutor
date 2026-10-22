import { describe, expect, it, vi } from 'vitest';
import type { KuromojiToken } from './kuromoji-map.ts';
import {
  buildWith,
  type RawTokenizer,
  serveTokenizer,
  type TokenizeRequest,
  type TokenizeResponse,
  type WorkerScope,
} from './tokenizer-protocol.ts';

const EKI: KuromojiToken = {
  surface_form: '駅',
  pos: '名詞',
  pos_detail_1: '一般',
  basic_form: '駅',
  reading: 'エキ',
  word_position: 1,
};

function fakeScope() {
  const posted: TokenizeResponse[] = [];
  let listener: ((event: MessageEvent<TokenizeRequest>) => void) | undefined;
  const scope: WorkerScope = {
    postMessage: (message) => posted.push(message),
    addEventListener: (_type, fn) => {
      listener = fn;
    },
  };
  const send = (data: TokenizeRequest) => listener?.({ data } as MessageEvent<TokenizeRequest>);
  return { scope, posted, send };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('serveTokenizer', () => {
  it('builds once and answers every request with mapped tokens', async () => {
    const { scope, posted, send } = fakeScope();
    const tokenizer: RawTokenizer = { tokenize: () => [EKI] };
    const build = vi.fn(async () => tokenizer);
    serveTokenizer(scope, build);
    send({ id: 1, dictPath: '/dict/', text: '駅' });
    send({ id: 2, dictPath: '/other/', text: '駅' });
    await flush();
    expect(build).toHaveBeenCalledOnce();
    expect(build).toHaveBeenCalledWith('/dict/');
    expect(posted).toEqual([
      { id: 1, tokens: [{ surface: '駅', reading: 'えき', base: '駅', pos: 'noun', start: 0 }] },
      { id: 2, tokens: [{ surface: '駅', reading: 'えき', base: '駅', pos: 'noun', start: 0 }] },
    ]);
  });

  it('reports a failed build and retries on the next request', async () => {
    const { scope, posted, send } = fakeScope();
    const build = vi
      .fn<(path: string) => Promise<RawTokenizer>>()
      .mockRejectedValueOnce(new Error('404 base.dat.gz'))
      .mockRejectedValueOnce('plain failure')
      .mockResolvedValue({ tokenize: () => [] });
    serveTokenizer(scope, build);
    send({ id: 1, dictPath: '/dict/', text: 'a' });
    await flush();
    send({ id: 2, dictPath: '/dict/', text: 'b' });
    await flush();
    send({ id: 3, dictPath: '/dict/', text: 'c' });
    await flush();
    expect(posted).toEqual([
      { id: 1, error: '404 base.dat.gz' },
      { id: 2, error: 'plain failure' },
      { id: 3, tokens: [] },
    ]);
  });
});

describe('buildWith', () => {
  it('wraps the callback builder in a promise', async () => {
    const tokenizer: RawTokenizer = { tokenize: () => [] };
    const ok = buildWith(() => ({ build: (cb) => cb(null, tokenizer) }));
    await expect(ok('/dict/')).resolves.toBe(tokenizer);
    const fail = buildWith(() => ({ build: (cb) => cb(new Error('bad dict'), tokenizer) }));
    await expect(fail('/dict/')).rejects.toThrow('bad dict');
  });
});
