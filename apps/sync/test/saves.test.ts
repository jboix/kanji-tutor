// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { handle } from '../src/app.ts';
import { decrypt, encrypt } from '../src/saves.ts';
import { call, SAVE_KEY, testDeps } from './fakes.ts';
import { signedInAccount } from './helpers.ts';

const bytes = (text: string): Uint8Array<ArrayBuffer> => new TextEncoder().encode(text);

function put(token: string, data: Uint8Array<ArrayBuffer>, headers: Record<string, string>) {
  return new Request('https://worker.test/save', {
    method: 'PUT',
    headers: { origin: 'https://app.test', authorization: `Bearer ${token}`, ...headers },
    body: data,
  });
}

describe('saves (D133)', () => {
  it('encrypts with a fresh IV each time, and decrypts back', async () => {
    const plain = bytes('progress').buffer;
    const one = await encrypt(SAVE_KEY, plain);
    const two = await encrypt(SAVE_KEY, plain);
    expect(one).not.toEqual(two);
    expect(new TextDecoder().decode(await decrypt(SAVE_KEY, one))).toBe('progress');
  });

  it('stores the first save, serves it with its version, and keeps it encrypted at rest', async () => {
    const deps = testDeps();
    const { accountId, token } = await signedInAccount(deps);
    expect((await handle(call('GET', '/save', { token }), deps)).status).toBe(404);
    const first = await handle(put(token, bytes('v1'), { 'if-none-match': '*' }), deps);
    expect(first.headers.get('etag')).toBe('"1"');
    const raw = deps.saves.raw(accountId);
    expect(new TextDecoder().decode(raw)).not.toContain('v1');
    const got = await handle(call('GET', '/save', { token }), deps);
    expect(got.headers.get('etag')).toBe('"1"');
    expect(await got.text()).toBe('v1');
  });

  it("never overwrites another device's newer save (412), and needs a version (428)", async () => {
    const deps = testDeps();
    const { token } = await signedInAccount(deps);
    await handle(put(token, bytes('v1'), { 'if-none-match': '*' }), deps);
    const second = await handle(put(token, bytes('v2'), { 'if-match': '"1"' }), deps);
    expect(second.headers.get('etag')).toBe('"2"');
    const stale = await handle(put(token, bytes('old'), { 'if-match': '"1"' }), deps);
    expect(stale.status).toBe(412);
    expect((await handle(put(token, bytes('x'), {}), deps)).status).toBe(428);
    expect(await (await handle(call('GET', '/save', { token }), deps)).text()).toBe('v2');
  });
});
