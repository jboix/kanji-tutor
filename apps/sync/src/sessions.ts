import type { Deps } from './deps.ts';
import { HttpError } from './http.ts';
import type { Device } from './store.ts';
import { randomId, randomToken, sha256 } from './tokens.ts';

/** A device unused this long signs in again. */
export const SESSION_IDLE_MS = 90 * 24 * 60 * 60 * 1000;

/** last_seen is written at most this often, to spare SQLite a write per request. */
const TOUCH_EVERY_MS = 60 * 60 * 1000;

/** A new device for the account, and its session token, which the device keeps. */
export async function newDevice(deps: Deps, accountId: string, name: string) {
  const token = randomToken();
  const now = deps.now();
  const device: Device = {
    id: randomId(),
    accountId,
    name: name.trim().slice(0, 60) || 'Device',
    tokenHash: await sha256(token),
    createdAt: now,
    lastSeen: now,
  };
  await deps.store.addDevice(device);
  await makeRoom(deps, device);
  return { token, device };
}

/** Past the cap on devices, the least recently seen others are signed out. */
async function makeRoom(deps: Deps, kept: Device) {
  const others = (await deps.store.devicesOf(kept.accountId)).filter((d) => d.id !== kept.id);
  const over = others.length + 1 - deps.caps.maxDevices;
  if (over <= 0) return;
  const oldest = others.sort((a, b) => a.lastSeen - b.lastSeen).slice(0, over);
  for (const d of oldest) await deps.store.removeDevice(kept.accountId, d.id);
}

const bearer = (request: Request) =>
  /^Bearer (\S+)$/.exec(request.headers.get('authorization') ?? '')?.[1];

/** The signed-in device, or undefined: for routes that also work signed out. */
export async function maybeDevice(request: Request, deps: Deps): Promise<Device | undefined> {
  const token = bearer(request);
  if (!token) return undefined;
  const device = await deps.store.deviceByToken(await sha256(token));
  const now = deps.now();
  if (!device || now - device.lastSeen > SESSION_IDLE_MS) return undefined;
  if (now - device.lastSeen > TOUCH_EVERY_MS) await deps.store.touchDevice(device.id, now);
  return device;
}

/** The signed-in device, or a 401. */
export async function signedIn(request: Request, deps: Deps): Promise<Device> {
  const device = await maybeDevice(request, deps);
  if (!device) throw new HttpError(401, 'signed-out');
  return device;
}
