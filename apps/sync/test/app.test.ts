// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { handle } from '../src/app.ts';
import { call, ORIGIN, testDeps } from './fakes.ts';
import { signedInAccount } from './helpers.ts';

describe('the sync server (D133, D140)', () => {
  it('answers /health to anyone, with the version running', async () => {
    const response = await handle(new Request('https://worker.test/health'), testDeps());
    expect(await response.json()).toEqual({ ok: true, version: '1.2.3' });
  });

  it("answers the app's preflight, and refuses other origins", async () => {
    const deps = testDeps();
    const preflight = await handle(call('OPTIONS', '/save'), deps);
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    expect(preflight.headers.get('access-control-allow-headers')).toContain('if-match');
    const other = await handle(
      call('GET', '/me', { headers: { origin: 'https://evil.test' } }),
      deps,
    );
    expect(other.status).toBe(403);
  });

  it('needs a session where it should, and says why', async () => {
    const deps = testDeps();
    const response = await handle(call('GET', '/me'), deps);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'signed-out' });
    expect(response.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    expect((await handle(call('GET', '/nope'), deps)).status).toBe(404);
    const bad = await handle(call('POST', '/pair/start', { body: { name: '' } }), deps);
    expect(bad.status).toBe(400);
  });

  it('lists the devices, signs one out, and forgets a device left unused for 90 days', async () => {
    const deps = testDeps();
    const phone = await signedInAccount(deps);
    const { newDevice } = await import('../src/sessions.ts');
    const laptop = await newDevice(deps, phone.accountId, 'Chrome on Windows');
    const list = await handle(call('GET', '/devices', { token: phone.token }), deps);
    const { devices } = (await list.json()) as { devices: { name: string; current: boolean }[] };
    expect(devices.map((d) => [d.name, d.current])).toEqual(
      expect.arrayContaining([
        ['iPhone', true],
        ['Chrome on Windows', false],
      ]),
    );
    const removed = await handle(
      call('DELETE', `/devices/${laptop.device.id}`, { token: phone.token }),
      deps,
    );
    expect(removed.status).toBe(200);
    expect((await handle(call('GET', '/me', { token: laptop.token }), deps)).status).toBe(401);
    deps.clock.now += 91 * 24 * 60 * 60 * 1000;
    expect((await handle(call('GET', '/me', { token: phone.token }), deps)).status).toBe(401);
  });

  it('deletes the account with its save', async () => {
    const deps = testDeps();
    const { accountId, token } = await signedInAccount(deps);
    await handle(
      call('PUT', '/save', { token, headers: { 'if-none-match': '*' }, body: { a: 1 } }),
      deps,
    );
    expect(deps.saves.raw(accountId)).toBeDefined();
    expect((await handle(call('DELETE', '/account', { token }), deps)).status).toBe(200);
    // The save goes with the account (ON DELETE in SQLite; see sqlite-store.test.ts).
    expect(await deps.store.account(accountId)).toBeNull();
    expect((await handle(call('GET', '/me', { token }), deps)).status).toBe(401);
  });
});
