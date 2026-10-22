import { countUp, type Deps } from './deps.ts';
import { HttpError, json } from './http.ts';
import { decrypt, writeSave } from './saves.ts';
import { signedIn } from './sessions.ts';

/** GET /me: the account as this device sees it. */
export async function me(request: Request, deps: Deps): Promise<Response> {
  const device = await signedIn(request, deps);
  const account = await deps.store.account(device.accountId);
  return json({ accountId: device.accountId, email: account?.email ?? null, deviceId: device.id });
}

/** GET /devices: every device of the account, the one asking marked. */
export async function devices(request: Request, deps: Deps): Promise<Response> {
  const device = await signedIn(request, deps);
  const all = await deps.store.devicesOf(device.accountId);
  return json({
    devices: all.map((d) => ({
      id: d.id,
      name: d.name,
      createdAt: d.createdAt,
      lastSeen: d.lastSeen,
      current: d.id === device.id,
    })),
  });
}

/** DELETE /devices/:id: signs that device out at once (a lost phone, an old computer). */
export async function removeDevice(request: Request, deps: Deps, id: string): Promise<Response> {
  const device = await signedIn(request, deps);
  if (!(await deps.store.removeDevice(device.accountId, id))) throw new HttpError(404, 'no-device');
  return json({ ok: true });
}

/** POST /logout: signs this device out. */
export async function logout(request: Request, deps: Deps): Promise<Response> {
  const device = await signedIn(request, deps);
  await deps.store.removeDevice(device.accountId, device.id);
  return json({ ok: true });
}

/** DELETE /account: the save, the passkeys, the devices and the account, all gone. */
export async function deleteAccount(request: Request, deps: Deps): Promise<Response> {
  const device = await signedIn(request, deps);
  await deps.store.deleteAccount(device.accountId);
  return json({ ok: true });
}

/**
 * GET /save: the save, with its version as the ETag; 404 when there is none yet, and 304 when the
 * device already has this version (If-None-Match), so checking for a newer one costs nothing.
 */
export async function getSave(request: Request, deps: Deps): Promise<Response> {
  const device = await signedIn(request, deps);
  const row = await deps.saves.get(device.accountId);
  if (!row) throw new HttpError(404, 'no-save');
  const etag = `"${row.version}"`;
  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers: { etag } });
  }
  return new Response(await decrypt(deps.saveKey, row.data), {
    headers: { 'content-type': 'application/octet-stream', etag },
  });
}

/** The version a PUT expects: If-Match "n", or If-None-Match * for the first save. */
function expectedVersion(request: Request): number {
  if (request.headers.get('if-none-match') === '*') return 0;
  const match = /^"(\d+)"$/.exec(request.headers.get('if-match') ?? '');
  if (!match?.[1]) throw new HttpError(428, 'version-needed');
  return Number(match[1]);
}

/**
 * PUT /save: writes over the version the device last saw; 412 if another device saved since, 429
 * past the hourly cap. The body is the app's save, gzipped by the app; the server never opens it.
 */
export async function putSave(request: Request, deps: Deps): Promise<Response> {
  const device = await signedIn(request, deps);
  const expected = expectedVersion(request);
  if (!(await countUp(deps, `saves:${device.accountId}`, deps.caps.savesPerHour, 3600))) {
    throw new HttpError(429, 'too-many-saves');
  }
  const data = await request.arrayBuffer();
  const version = await writeSave(deps.saves, deps.saveKey, {
    accountId: device.accountId,
    data,
    expected,
    at: deps.now(),
    max: deps.caps.maxSaveBytes,
  });
  return json({ version }, 200, { etag: `"${version}"` });
}
