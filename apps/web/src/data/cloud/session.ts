/**
 * This device's cloud session, in localStorage under the app's first name like its other
 * keys: the token, the save version it last saw, the hash of the data it last sent or received,
 * and whether it has changes not sent yet. Never in the database, so never in a backup.
 */
const KEY = 'kanji-reader.cloud';

export interface CloudSession {
  token: string;
  /** The server's save version this device last saw; 0 before the first. */
  version: number;
  /** SHA-256 of the data last sent or received; null before the first. */
  hash: string | null;
  /** Changes made since, not sent yet: kept so a closed app sends them on its next start. */
  dirty: boolean;
}

export function readSession(): CloudSession | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return value && typeof value === 'object' && 'token' in value ? (value as CloudSession) : null;
  } catch {
    return null;
  }
}

export function writeSession(session: CloudSession | null): void {
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage refused (a private window): the session lasts until the app closes.
  }
}
