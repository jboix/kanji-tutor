import { describe, expect, it } from 'vitest';
import { DEFAULT_RETRY_MS, mapProviderError, retryDelayMs } from './errors.ts';

describe('mapProviderError', () => {
  it('maps 429 and RESOURCE_EXHAUSTED to rate-limit', () => {
    expect(mapProviderError({ status: 429 }).kind).toBe('rate-limit');
    expect(mapProviderError(new Error('RESOURCE_EXHAUSTED: quota')).kind).toBe('rate-limit');
  });

  it('maps aborts, key errors and anything else to provider', () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    expect(mapProviderError(abort)).toEqual({
      kind: 'provider',
      code: 'cancelled',
      message: 'The request was cancelled.',
    });
    expect(mapProviderError(Object.assign(new Error('bad'), { status: 403 }))).toMatchObject({
      code: 'refused',
      status: 403,
    });
    expect(mapProviderError('boom')).toEqual({ kind: 'provider', message: 'boom' });
    expect(mapProviderError(new Error(''))).toEqual({
      kind: 'provider',
      code: 'no-answer',
      message: 'Gemini did not answer.',
    });
    expect(mapProviderError({ status: '500' }).kind).toBe('provider');
  });
});

describe('retryDelayMs (A14)', () => {
  it('reads RetryInfo.retryDelay from the JSON body the SDK puts in the message', () => {
    const body = JSON.stringify({
      error: {
        code: 429,
        message: 'You exceeded your current quota.',
        status: 'RESOURCE_EXHAUSTED',
        details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '12.5s' }],
      },
    });
    const error = Object.assign(new Error(body), { status: 429 });
    expect(retryDelayMs(error)).toBe(12_500);
    expect(mapProviderError(error)).toEqual({
      kind: 'rate-limit',
      message: 'The tutor needs a minute: Gemini is limiting requests for this key.',
      retryAfterMs: 12_500,
    });
  });

  it('reads a Retry-After header, a "retry in" hint, or a hold the limiter set', () => {
    const headers = { get: (name: string) => (name === 'retry-after' ? '20' : null) };
    expect(retryDelayMs({ status: 429, headers })).toBe(20_000);
    expect(retryDelayMs(new Error('Quota exceeded. Please retry in 4.2s.'))).toBe(4200);
    expect(retryDelayMs({ retryAfterMs: 900 })).toBe(900);
    expect(
      retryDelayMs({ status: 429, headers: { get: () => 'Wed, 21 Oct 2026' } }),
    ).toBeUndefined();
  });

  it('falls back to a minute when Google names no wait', () => {
    expect(retryDelayMs(new Error('RESOURCE_EXHAUSTED'))).toBeUndefined();
    expect(mapProviderError({ status: 429 }).retryAfterMs).toBe(DEFAULT_RETRY_MS);
  });
});
