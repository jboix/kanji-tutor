import { afterEach, describe, expect, it, vi } from 'vitest';
import { cloudApi } from './api.ts';

afterEach(() => vi.unstubAllGlobals());

/** `fetch` answering `response`, recording each request. */
function answering(response: () => Response) {
  const calls: Request[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push(new Request(url, init));
      return response();
    }),
  );
  return calls;
}

describe('the sync server client', () => {
  it('calls with the session token, and turns an error into its reason', async () => {
    const calls = answering(() => Response.json({ error: 'code-wrong' }, { status: 400 }));
    const api = cloudApi('https://api.test', () => 'secret');
    await expect(api.post('/email/confirm', { code: '1' })).rejects.toMatchObject({
      reason: 'code-wrong',
    });
    expect(calls[0]?.headers.get('authorization')).toBe('Bearer secret');
    expect(calls[0]?.url).toBe('https://api.test/email/confirm');
  });

  it('is offline when the request does not get through', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(cloudApi('https://api.test', () => null).get('/me')).rejects.toMatchObject({
      reason: 'offline',
    });
  });

  it('asks for the save by version, and writes over the one it saw', async () => {
    const api = cloudApi('https://api.test', () => 't');
    let calls = answering(() => new Response(null, { status: 304 }));
    expect(await api.getSave(3)).toEqual({ status: 'same' });
    expect(calls[0]?.headers.get('if-none-match')).toBe('"3"');
    answering(() => Response.json({ error: 'no-save' }, { status: 404 }));
    expect(await api.getSave(0)).toEqual({ status: 'none' });
    calls = answering(() => new Response(new Uint8Array([1, 2]), { headers: { etag: '"4"' } }));
    expect(await api.getSave(3)).toEqual({
      status: 'got',
      data: new Uint8Array([1, 2]),
      version: 4,
    });
    calls = answering(() => Response.json({ version: 5 }));
    expect(await api.putSave(new Uint8Array([1]), 4)).toBe(5);
    expect(calls[0]?.headers.get('if-match')).toBe('"4"');
    calls = answering(() => Response.json({ version: 1 }));
    await api.putSave(new Uint8Array([1]), 0);
    expect(calls[0]?.headers.get('if-none-match')).toBe('*');
  });
});
