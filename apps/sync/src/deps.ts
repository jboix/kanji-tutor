import type { Codes } from './codes.ts';
import type { Mailer } from './mail.ts';
import type { Limiter } from './rate-limit.ts';
import type { SaveStore } from './saves.ts';
import type { Store } from './store.ts';

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
  /** Requests a client may make without an account, per minute. */
  limit: Limiter;
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
