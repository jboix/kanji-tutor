import { z } from 'zod';
import { countUp, type Deps, getJson, putJson } from './deps.ts';
import { body, HttpError, json } from './http.ts';
import { newDevice, signedIn } from './sessions.ts';
import { emailCode, sha256 } from './tokens.ts';

/** An email code works for ten minutes and five tries. */
const CODE_TTL = 600;
const MAX_TRIES = 5;
/** At most this many codes per address per hour. */
const MAX_SENDS = 5;

interface PendingCode {
  codeHash: string;
  tries: number;
  /** For a new recovery email: the address being confirmed. */
  email?: string;
}

const EMAIL = z.string().trim().toLowerCase().email().max(200);
const CODE = z.string().regex(/^\d{6}$/);

/** Counts sends per address; a 429 past the hourly limit. */
async function limitSends(deps: Deps, email: string) {
  if (!(await countUp(deps, `sends:${email}`, MAX_SENDS, 3600))) {
    throw new HttpError(429, 'too-many-codes');
  }
}

async function sendCode(deps: Deps, key: string, email: string, extra: Partial<PendingCode>) {
  await limitSends(deps, email);
  const code = emailCode();
  await putJson(deps.codes, key, { codeHash: await sha256(code), tries: 0, ...extra }, CODE_TTL);
  await deps.mail(email, code);
}

/** Checks a code against `key`, counting tries; the pending code once it matches. */
async function checkCode(deps: Deps, key: string, code: string): Promise<PendingCode> {
  const pending = await getJson<PendingCode>(deps.codes, key);
  if (!pending || pending.tries >= MAX_TRIES) throw new HttpError(400, 'code-expired');
  if (pending.codeHash !== (await sha256(code))) {
    await putJson(deps.codes, key, { ...pending, tries: pending.tries + 1 }, CODE_TTL);
    throw new HttpError(400, 'code-wrong');
  }
  await deps.codes.delete(key);
  return pending;
}

/** POST /email (signed in): sends a code to confirm a recovery email. */
export async function emailAdd(request: Request, deps: Deps): Promise<Response> {
  const device = await signedIn(request, deps);
  const { email } = await body(request, z.object({ email: EMAIL }));
  const owner = await deps.store.accountByEmail(email);
  if (owner && owner.id !== device.accountId) throw new HttpError(409, 'email-taken');
  await sendCode(deps, `email-add:${device.accountId}`, email, { email });
  return json({ ok: true });
}

/** POST /email/confirm (signed in): the code from the email makes it the recovery email. */
export async function emailConfirm(request: Request, deps: Deps): Promise<Response> {
  const device = await signedIn(request, deps);
  const { code } = await body(request, z.object({ code: CODE }));
  const pending = await checkCode(deps, `email-add:${device.accountId}`, code);
  if (!pending.email) throw new HttpError(400, 'code-expired');
  await deps.store.setEmail(device.accountId, pending.email);
  return json({ ok: true });
}

/**
 * POST /email/login: sends a sign-in code when an account has this recovery email. It answers
 * the same either way, so nobody can learn which addresses have an account.
 */
export async function emailLogin(request: Request, deps: Deps): Promise<Response> {
  deps.limit(request);
  const { email } = await body(request, z.object({ email: EMAIL }));
  if (await deps.store.accountByEmail(email))
    await sendCode(deps, `email-login:${email}`, email, {});
  return json({ ok: true });
}

/** POST /email/login/verify: the code signs this device in. */
export async function emailLoginVerify(request: Request, deps: Deps): Promise<Response> {
  const input = await body(
    request,
    z.object({ email: EMAIL, code: CODE, name: z.string().trim().min(1).max(60) }),
  );
  await checkCode(deps, `email-login:${input.email}`, input.code);
  const account = await deps.store.accountByEmail(input.email);
  if (!account) throw new HttpError(400, 'code-expired');
  const { token } = await newDevice(deps, account.id, input.name);
  return json({ token });
}
