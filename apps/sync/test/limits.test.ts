// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { handle } from '../src/app.ts';
import { countUp } from '../src/deps.ts';
import { createLimiter } from '../src/rate-limit.ts';
import { newDevice } from '../src/sessions.ts';
import { call, ORIGIN, testDeps } from './fakes.ts';
import { signedInAccount } from './helpers.ts';

const HOUR = 60 * 60 * 1000;

function put(token: string, version: number, size = 10) {
  return new Request('https://worker.test/save', {
    method: 'PUT',
    headers: {
      origin: ORIGIN,
      authorization: `Bearer ${token}`,
      ...(version === 0 ? { 'if-none-match': '*' } : { 'if-match': `"${version}"` }),
    },
    body: new Uint8Array(size),
  });
}

describe('the caps', () => {
  it('limits every endpoint per client, answering 429 with CORS so the app can read it', async () => {
    const deps = { ...testDeps(), limitAll: createLimiter(1) };
    const { token } = await signedInAccount(deps);
    expect((await handle(call('GET', '/me', { token }), deps)).status).toBe(200);
    const refused = await handle(call('GET', '/me', { token }), deps);
    expect(refused.status).toBe(429);
    expect(await refused.json()).toEqual({ error: 'slow-down' });
    expect(refused.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    expect((await handle(new Request('https://worker.test/health'), deps)).status).toBe(200);
  });

  it('takes SAVES_PER_HOUR saves an hour per account, then again after the hour', async () => {
    const deps = testDeps();
    deps.caps.savesPerHour = 2;
    const { token } = await signedInAccount(deps);
    expect((await handle(put(token, 0), deps)).status).toBe(200);
    expect((await handle(put(token, 1), deps)).status).toBe(200);
    const third = await handle(put(token, 2), deps);
    expect(third.status).toBe(429);
    expect(await third.json()).toEqual({ error: 'too-many-saves' });
    deps.clock.now += HOUR;
    expect((await handle(put(token, 2), deps)).status).toBe(200);
  });

  it('caps a save at MAX_SAVE_MB and any other body at MAX_BODY_KB', async () => {
    const deps = testDeps();
    deps.caps.maxSaveBytes = 1000;
    deps.caps.maxBodyBytes = 100;
    const { token } = await signedInAccount(deps);
    expect((await handle(put(token, 0, 900), deps)).status).toBe(200);
    const big = await handle(put(token, 1, 1001), deps);
    expect([big.status, await big.json()]).toEqual([413, { error: 'save-too-big' }]);
    const body = { name: 'x'.repeat(200) };
    const long = await handle(call('POST', '/pair/start', { body }), deps);
    expect([long.status, await long.json()]).toEqual([413, { error: 'too-big' }]);
  });

  it('keeps MAX_DEVICES devices: a new one signs out the least recently seen', async () => {
    const deps = testDeps();
    deps.caps.maxDevices = 2;
    const phone = await signedInAccount(deps, 'iPhone');
    deps.clock.now += 1000;
    await newDevice(deps, phone.accountId, 'Laptop');
    deps.clock.now += 1000;
    await newDevice(deps, phone.accountId, 'Tablet');
    const names = (await deps.store.devicesOf(phone.accountId)).map((d) => d.name).sort();
    expect(names).toEqual(['Laptop', 'Tablet']);
    expect((await handle(call('GET', '/me', { token: phone.token }), deps)).status).toBe(401);
  });

  it('sends no-store and nosniff on every answer', async () => {
    const deps = testDeps();
    for (const request of [new Request('https://worker.test/health'), call('GET', '/me')]) {
      const response = await handle(request, deps);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    }
  });

  it('counts in windows that do not move with each count', async () => {
    const deps = testDeps();
    expect(await countUp(deps, 'k', 2, 3600)).toBe(true);
    deps.clock.now += 50 * 60 * 1000;
    expect(await countUp(deps, 'k', 2, 3600)).toBe(true);
    expect(await countUp(deps, 'k', 2, 3600)).toBe(false);
    // The window began with the first count, so ten more minutes open a new one.
    deps.clock.now += 10 * 60 * 1000;
    expect(await countUp(deps, 'k', 2, 3600)).toBe(true);
  });
});
