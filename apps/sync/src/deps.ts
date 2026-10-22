import type { Codes } from './codes.ts';
import type { Mailer } from './mail.ts';
import type { Limiter } from './rate-limit.ts';
import type { SaveStore } from './saves.ts';
import type { Store } from './store.ts';

/** The caps from `.env`. */
export interface Caps {
  savesPerHour: number;
  maxBodyBytes: number;
  maxSaveBytes: number;
  maxDevices: number;
}

/** What every route gets: the stores, the secrets and settings, and the clock. */
export interface Deps {
  store: Store;
  /** Short-lived values: challenges, pairing and email codes, send counters. */
  codes: Codes;
  saves: SaveStore;
  saveKey: string;
  origin: string;
  rpId: string;
  mail: Mailer;
  /** Requests a client may make without an account, per minute: for what starts a sign-in. */
  limit: Limiter;
  /** Requests a client may make per minute, to any endpoint but /health. */
  limitAll: Limiter;
  caps: Caps;
  now: () => number;
  /** The released version running, from the image (`SYNC_VERSION`), shown by /health. */
  version: string;
}

/** Reads a JSON value from the codes, or null. */
export async function getJson<T>(codes: Codes, key: string): Promise<T | null> {
  const text = await codes.get(key);
  return text === null ? null : (JSON.parse(text) as T);
}

/** Writes a JSON value to the codes for `ttl` seconds. */
export function putJson(codes: Codes, key: string, value: unknown, ttl: number) {
  return codes.put(key, JSON.stringify(value), ttl);
}

/**
 * Counts one more under `key` in a window of `seconds` that starts with the first count and does
 * not move; false, and nothing counted, once `max` is reached.
 */
export async function countUp(deps: Deps, key: string, max: number, seconds: number) {
  const now = deps.now();
  const found = await getJson<{ count: number; until: number }>(deps.codes, key);
  const window = found && found.until > now ? found : { count: 0, until: now + seconds * 1000 };
  if (window.count >= max) return false;
  const left = Math.ceil((window.until - now) / 1000);
  await putJson(deps.codes, key, { ...window, count: window.count + 1 }, left);
  return true;
}
