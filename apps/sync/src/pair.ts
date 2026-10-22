import { z } from 'zod';
import { type Deps, getJson, putJson } from './deps.ts';
import { body, HttpError, json } from './http.ts';
import { newDevice, signedIn } from './sessions.ts';
import { pairingCode, randomToken, sha256 } from './tokens.ts';

/** A pairing code works for two minutes, once. */
export const PAIR_TTL = 120;

interface Pairing {
  /** The new device's secret, hashed: only it can claim the session. */
  secretHash: string;
  name: string;
  /** Set when a signed-in device approves. */
  accountId: string | null;
}

const CODE = z.string().regex(/^[A-Z2-9]{3}-[A-Z2-9]{3}$/);
const keyOf = (code: string) => `pair:${code}`;

async function pairing(deps: Deps, code: string): Promise<Pairing> {
  const found = await getJson<Pairing>(deps.codes, keyOf(code));
  if (!found) throw new HttpError(404, 'code-expired');
  return found;
}

/** POST /pair/start (the new device): a code to show and type, and a secret to keep. */
export async function pairStart(request: Request, deps: Deps): Promise<Response> {
  deps.limit(request);
  const { name } = await body(request, z.object({ name: z.string().trim().min(1).max(60) }));
  const code = pairingCode();
  const secret = randomToken();
  const value: Pairing = { secretHash: await sha256(secret), name, accountId: null };
  await putJson(deps.codes, keyOf(code), value, PAIR_TTL);
  return json({ code, secret, expiresIn: PAIR_TTL });
}

/** GET /pair/:code (the signed-in phone): which device asks, before approving. */
export async function pairPeek(request: Request, deps: Deps, code: string): Promise<Response> {
  await signedIn(request, deps);
  const parsed = CODE.safeParse(code.toUpperCase());
  if (!parsed.success) throw new HttpError(404, 'code-expired');
  const found = await pairing(deps, parsed.data);
  if (found.accountId) throw new HttpError(409, 'code-used');
  return json({ name: found.name });
}

/** POST /pair/approve (the signed-in phone): the new device joins this account. */
export async function pairApprove(request: Request, deps: Deps): Promise<Response> {
  const device = await signedIn(request, deps);
  const { code } = await body(request, z.object({ code: CODE }));
  const found = await pairing(deps, code);
  if (found.accountId) throw new HttpError(409, 'code-used');
  await putJson(deps.codes, keyOf(code), { ...found, accountId: device.accountId }, PAIR_TTL);
  return json({ ok: true });
}

/** POST /pair/claim (the new device, polling): pending, or its session token once approved. */
export async function pairClaim(request: Request, deps: Deps): Promise<Response> {
  const input = await body(request, z.object({ code: CODE, secret: z.string().min(20) }));
  const found = await pairing(deps, input.code);
  if (found.secretHash !== (await sha256(input.secret))) throw new HttpError(404, 'code-expired');
  if (!found.accountId) return json({ status: 'pending' });
  await deps.codes.delete(keyOf(input.code));
  const { token } = await newDevice(deps, found.accountId, found.name);
  return json({ status: 'approved', token });
}
