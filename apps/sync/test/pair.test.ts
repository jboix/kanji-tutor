// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { handle } from '../src/app.ts';
import { call, testDeps } from './fakes.ts';
import { signedInAccount } from './helpers.ts';

async function start(deps: ReturnType<typeof testDeps>) {
  const response = await handle(
    call('POST', '/pair/start', { body: { name: 'Chrome on Windows' } }),
    deps,
  );
  return (await response.json()) as { code: string; secret: string; expiresIn: number };
}

describe('linking a device (D133)', () => {
  it('shows a code, the phone sees who asks and approves, and the computer gets a session', async () => {
    const deps = testDeps();
    const phone = await signedInAccount(deps);
    const { code, secret, expiresIn } = await start(deps);
    expect(code).toMatch(/^[A-Z2-9]{3}-[A-Z2-9]{3}$/);
    expect(expiresIn).toBe(120);
    const claim = () => handle(call('POST', '/pair/claim', { body: { code, secret } }), deps);
    expect(await (await claim()).json()).toEqual({ status: 'pending' });
    const peek = await handle(call('GET', `/pair/${code}`, { token: phone.token }), deps);
    expect(await peek.json()).toEqual({ name: 'Chrome on Windows' });
    await handle(call('POST', '/pair/approve', { token: phone.token, body: { code } }), deps);
    const approved = (await (await claim()).json()) as { status: string; token: string };
    expect(approved.status).toBe('approved');
    const me = await handle(call('GET', '/me', { token: approved.token }), deps);
    expect(((await me.json()) as { accountId: string }).accountId).toBe(phone.accountId);
    // Single use: the code is gone.
    expect((await claim()).status).toBe(404);
  });

  it('gives nothing to a wrong secret, and needs a signed-in phone to approve', async () => {
    const deps = testDeps();
    const { code } = await start(deps);
    const wrong = await handle(
      call('POST', '/pair/claim', { body: { code, secret: 'x'.repeat(43) } }),
      deps,
    );
    expect(wrong.status).toBe(404);
    const unsigned = await handle(call('POST', '/pair/approve', { body: { code } }), deps);
    expect(unsigned.status).toBe(401);
  });
});
