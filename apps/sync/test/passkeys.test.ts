// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handle } from '../src/app.ts';
import { call, testDeps } from './fakes.ts';
import { signedInAccount } from './helpers.ts';

// The browser's half of WebAuthn cannot run here: the library's checks are mocked, and the tests
// cover what the server does with their result.
const webauthn = vi.hoisted(() => ({
  verifyRegistrationResponse: vi.fn(),
  verifyAuthenticationResponse: vi.fn(),
}));
vi.mock('@simplewebauthn/server', async (original) => ({
  ...(await original<typeof import('@simplewebauthn/server')>()),
  ...webauthn,
}));

const registered = (id: string) => ({
  verified: true,
  registrationInfo: { credential: { id, publicKey: new Uint8Array([1, 2, 3]), counter: 0 } },
});

/** An open invite, as `cli.ts invite` makes it (D140). */
async function invite(deps: ReturnType<typeof testDeps>, code = 'KD7M-3XQP') {
  const { normalInvite, sha256 } = await import('../src/tokens.ts');
  await deps.store.addInvite({
    codeHash: await sha256(normalInvite(code)),
    note: '',
    createdAt: 1,
  });
  return code;
}

async function options(
  deps: ReturnType<typeof testDeps>,
  path: string,
  extra: { token?: string; body?: unknown } = {},
) {
  const response = await handle(call('POST', path, extra), deps);
  return (await response.json()) as { challengeId: string; options: { challenge: string } };
}

const verify = (path: string, challengeId: string, token?: string) =>
  call('POST', path, {
    ...(token ? { token } : {}),
    body: { challengeId, name: 'iPhone', response: { id: 'cred-1' } },
  });

describe('passkeys (D133)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates no account without an open invite (D140)', async () => {
    const deps = testDeps();
    const none = await handle(call('POST', '/passkey/register/options', { body: {} }), deps);
    expect(none.status).toBe(403);
    expect(await none.json()).toEqual({ error: 'invite-needed' });
    const wrong = await handle(
      call('POST', '/passkey/register/options', { body: { invite: 'AAAA-BBBB' } }),
      deps,
    );
    expect(wrong.status).toBe(403);
  });

  it('uses the invite up: a second account cannot be made with it', async () => {
    const deps = testDeps();
    webauthn.verifyRegistrationResponse.mockResolvedValue(registered('cred-9'));
    const code = await invite(deps);
    const first = await options(deps, '/passkey/register/options', { body: { invite: code } });
    const second = await options(deps, '/passkey/register/options', { body: { invite: code } });
    expect((await handle(verify('/passkey/register/verify', first.challengeId), deps)).status).toBe(
      200,
    );
    expect(
      (await handle(verify('/passkey/register/verify', second.challengeId), deps)).status,
    ).toBe(403);
    expect(deps.store.accounts.size).toBe(1);
  });

  it('creates an account and signs this device in on a first passkey', async () => {
    const deps = testDeps();
    webauthn.verifyRegistrationResponse.mockResolvedValue(registered('cred-1'));
    const code = await invite(deps);
    const { challengeId, options: opts } = await options(deps, '/passkey/register/options', {
      body: { invite: code.toLowerCase().replace('-', ' ') },
    });
    expect(opts.challenge).toBeTruthy();
    const response = await handle(verify('/passkey/register/verify', challengeId), deps);
    const { token } = (await response.json()) as { token: string };
    expect(webauthn.verifyRegistrationResponse.mock.calls[0]?.[0]).toMatchObject({
      expectedOrigin: 'https://app.test',
      expectedRPID: 'app.test',
      expectedChallenge: opts.challenge,
    });
    expect(deps.store.accounts.size).toBe(1);
    expect(await deps.store.passkey('cred-1')).toMatchObject({ publicKey: 'AQID', counter: 0 });
    expect((await handle(call('GET', '/me', { token }), deps)).status).toBe(200);
    // A challenge is used once.
    expect((await handle(verify('/passkey/register/verify', challengeId), deps)).status).toBe(400);
  });

  it('adds a passkey to the account of a signed-in device', async () => {
    const deps = testDeps();
    const laptop = await signedInAccount(deps, 'Laptop');
    webauthn.verifyRegistrationResponse.mockResolvedValue(registered('cred-2'));
    const { challengeId } = await options(deps, '/passkey/register/options', {
      token: laptop.token,
    });
    const response = await handle(
      verify('/passkey/register/verify', challengeId, laptop.token),
      deps,
    );
    expect(await response.json()).toEqual({ ok: true });
    expect((await deps.store.passkey('cred-2'))?.accountId).toBe(laptop.accountId);
    expect(deps.store.accounts.size).toBe(1);
  });

  it('signs in with a known passkey and keeps its counter; refuses an unknown one', async () => {
    const deps = testDeps();
    const phone = await signedInAccount(deps);
    await deps.store.addPasskey({
      id: 'cred-1',
      accountId: phone.accountId,
      publicKey: 'AQID',
      counter: 4,
      transports: ['internal'],
    });
    webauthn.verifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 5 },
    });
    const { challengeId } = await options(deps, '/passkey/login/options');
    const response = await handle(verify('/passkey/login/verify', challengeId), deps);
    expect((await response.json()) as object).toHaveProperty('token');
    expect((await deps.store.passkey('cred-1'))?.counter).toBe(5);
    const credential = webauthn.verifyAuthenticationResponse.mock.calls[0]?.[0].credential;
    expect([...credential.publicKey]).toEqual([1, 2, 3]);
    await deps.store.deleteAccount(phone.accountId);
    const again = await options(deps, '/passkey/login/options');
    expect((await handle(verify('/passkey/login/verify', again.challengeId), deps)).status).toBe(
      401,
    );
  });
});
