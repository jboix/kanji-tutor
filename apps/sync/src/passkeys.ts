import {
  type AuthenticationResponseJSON,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  type RegistrationResponseJSON,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { z } from 'zod';
import { type Deps, getJson, putJson } from './deps.ts';
import { body, HttpError, json } from './http.ts';
import { maybeDevice, newDevice, signedIn } from './sessions.ts';
import { fromBase64url, normalInvite, randomId, sha256, toBase64url } from './tokens.ts';

/** A challenge lives five minutes, and is used once. */
const CHALLENGE_TTL = 300;

interface Challenge {
  challenge: string;
  accountId: string;
  /** Registering a passkey for an account that exists (a signed-in device), not a new one. */
  existing: boolean;
  /** For a new account: the invite it uses (D140), hashed. */
  inviteHash?: string;
}

const NAME = z.string().trim().min(1).max(60);
const VERIFY = z.object({
  challengeId: z.string().uuid(),
  name: NAME,
  response: z.record(z.string(), z.unknown()),
});

async function takeChallenge(deps: Deps, id: string): Promise<Challenge> {
  const key = `challenge:${id}`;
  const challenge = await getJson<Challenge>(deps.codes, key);
  if (!challenge) throw new HttpError(400, 'challenge-expired');
  await deps.codes.delete(key);
  return challenge;
}

async function giveChallenge(deps: Deps, challenge: Challenge) {
  const id = randomId();
  await putJson(deps.codes, `challenge:${id}`, challenge, CHALLENGE_TTL);
  return id;
}

const INVITE = z.object({ invite: z.string().max(40).optional() });

/** The hash of an open invite, or a 403: new accounts are by invitation only (D140). */
async function openInvite(request: Request, deps: Deps): Promise<string> {
  const { invite = '' } = await body(request, INVITE);
  const hash = await sha256(normalInvite(invite));
  if (!invite || !(await deps.store.inviteOpen(hash))) throw new HttpError(403, 'invite-needed');
  return hash;
}

/**
 * POST /passkey/register/options: a new account (signed out, turning on cloud saves, with an
 * invite) or one more passkey for this account (signed in, e.g. after linking a computer).
 */
export async function registerOptions(request: Request, deps: Deps): Promise<Response> {
  const device = await maybeDevice(request, deps);
  if (!device) deps.limit(request);
  const inviteHash = device ? undefined : await openInvite(request, deps);
  const accountId = device?.accountId ?? randomId();
  const existing = device ? await deps.store.passkeysOf(accountId) : [];
  const options = await generateRegistrationOptions({
    rpName: 'Kanji Tutor',
    rpID: deps.rpId,
    userName: 'Kanji Tutor',
    userID: new TextEncoder().encode(accountId),
    attestationType: 'none',
    authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
    excludeCredentials: existing.map((p) => ({ id: p.id, transports: p.transports })),
  });
  const challengeId = await giveChallenge(deps, {
    challenge: options.challenge,
    accountId,
    existing: device !== undefined,
    ...(inviteHash ? { inviteHash } : {}),
  });
  return json({ challengeId, options });
}

/** A new account, if its invite is still open; it is used up here, once. */
async function createAccount(deps: Deps, challenge: Challenge) {
  const { accountId, inviteHash = '' } = challenge;
  if (!(await deps.store.takeInvite(inviteHash, accountId, deps.now()))) {
    throw new HttpError(403, 'invite-needed');
  }
  await deps.store.createAccount({ id: accountId, email: null, createdAt: deps.now() });
}

/** POST /passkey/register/verify: stores the passkey; a new account also gets this device. */
export async function registerVerify(request: Request, deps: Deps): Promise<Response> {
  const input = await body(request, VERIFY);
  const challenge = await takeChallenge(deps, input.challengeId);
  if (challenge.existing) await signedIn(request, deps);
  const result = await verifyRegistrationResponse({
    response: input.response as unknown as RegistrationResponseJSON,
    expectedChallenge: challenge.challenge,
    expectedOrigin: deps.origin,
    expectedRPID: deps.rpId,
  });
  if (!result.verified) throw new HttpError(400, 'passkey-refused');
  const { credential } = result.registrationInfo;
  if (!challenge.existing) await createAccount(deps, challenge);
  await deps.store.addPasskey({
    id: credential.id,
    accountId: challenge.accountId,
    publicKey: toBase64url(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports ?? [],
  });
  if (challenge.existing) return json({ ok: true });
  const { token } = await newDevice(deps, challenge.accountId, input.name);
  return json({ token });
}

/** POST /passkey/login/options: any passkey of this site (discoverable credentials). */
export async function loginOptions(request: Request, deps: Deps): Promise<Response> {
  deps.limit(request);
  const options = await generateAuthenticationOptions({
    rpID: deps.rpId,
    userVerification: 'preferred',
  });
  const challengeId = await giveChallenge(deps, {
    challenge: options.challenge,
    accountId: '',
    existing: false,
  });
  return json({ challengeId, options });
}

/** POST /passkey/login/verify: checks the signature, then signs this device in. */
export async function loginVerify(request: Request, deps: Deps): Promise<Response> {
  const input = await body(request, VERIFY);
  const challenge = await takeChallenge(deps, input.challengeId);
  const response = input.response as unknown as AuthenticationResponseJSON;
  const passkey = await deps.store.passkey(String(response.id));
  if (!passkey) throw new HttpError(401, 'passkey-unknown');
  const result = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge.challenge,
    expectedOrigin: deps.origin,
    expectedRPID: deps.rpId,
    credential: {
      id: passkey.id,
      publicKey: fromBase64url(passkey.publicKey),
      counter: passkey.counter,
      transports: passkey.transports,
    },
  });
  if (!result.verified) throw new HttpError(401, 'passkey-refused');
  await deps.store.setCounter(passkey.id, result.authenticationInfo.newCounter);
  const { token } = await newDevice(deps, passkey.accountId, input.name);
  return json({ token });
}
