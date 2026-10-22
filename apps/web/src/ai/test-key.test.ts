import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './limiter.ts';
import type { GenAiSdk } from './providers/gemini.ts';
import { testKey } from './test-key.ts';

function sdkThat(generate: () => Promise<{ text?: string }>) {
  const keys: string[] = [];
  const models: string[] = [];
  class GoogleGenAI {
    models = {
      generateContent: (params: { model: string }) => {
        models.push(params.model);
        return generate();
      },
    };
    constructor(options: { apiKey: string }) {
      keys.push(options.apiKey);
    }
  }
  return { loadSdk: async (): Promise<GenAiSdk> => ({ GoogleGenAI }), keys, models };
}

describe('testKey', () => {
  it('returns ok after one tiny call with the trimmed key and chosen model', async () => {
    const sdk = sdkThat(async () => ({ text: '{"ok":true}' }));
    const result = await testKey('  key-1 ', 'gemini-2.5-flash', { loadSdk: sdk.loadSdk });
    expect(result).toEqual({ ok: true, value: { model: 'gemini-2.5-flash' }, cached: false });
    expect(sdk.keys).toEqual(['key-1']);
    expect(sdk.models).toEqual(['gemini-2.5-flash']);
  });

  it('returns no-key for an empty key without loading the SDK', async () => {
    const sdk = sdkThat(async () => ({}));
    expect(await testKey('  ', 'm', { loadSdk: sdk.loadSdk })).toMatchObject({
      ok: false,
      error: { kind: 'no-key' },
    });
    expect(sdk.keys).toEqual([]);
  });

  it.each([
    [429, 'rate-limit'],
    [400, 'provider'],
  ])('maps HTTP %i to %s', async (status, kind) => {
    const sdk = sdkThat(() => Promise.reject(Object.assign(new Error('x'), { status })));
    expect(
      await testKey('k', 'm', { loadSdk: sdk.loadSdk, limiter: createRateLimiter() }),
    ).toMatchObject({
      ok: false,
      error: { kind },
    });
  });
});
