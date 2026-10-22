import { HttpError } from './http.ts';
import type { Sql } from './sql.ts';
import { fromBase64url } from './tokens.ts';

/**
 * A guard on one upload, not a quota: far above any real save (the app's data without photos is
 * well under 1 MB), it only stops a runaway request from filling the server's memory.
 */
export const MAX_SAVE_BYTES = 50 * 1024 * 1024;

const IV_BYTES = 12;

async function aesKey(secret: string): Promise<CryptoKey> {
  const raw = fromBase64url(secret.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, ''));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/** Encrypts with AES-GCM: a fresh IV, then the ciphertext. */
export async function encrypt(secret: string, plain: ArrayBuffer): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const sealed = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(secret), plain);
  const out = new Uint8Array(IV_BYTES + sealed.byteLength);
  out.set(iv);
  out.set(new Uint8Array(sealed), IV_BYTES);
  return out;
}

export async function decrypt(secret: string, sealed: Uint8Array): Promise<ArrayBuffer> {
  const iv = sealed.slice(0, IV_BYTES);
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    await aesKey(secret),
    sealed.slice(IV_BYTES),
  );
}

/** Where the encrypted saves live: one row per account, with its version. */
export interface SaveStore {
  get(accountId: string): Promise<{ data: Uint8Array; version: number } | null>;
  /** Writes `version` if the stored one is `expected` (0: none yet); false if it was not. */
  put(
    accountId: string,
    data: Uint8Array,
    write: { expected: number; at: number },
  ): Promise<boolean>;
}

/** Saves in the `saves` table. */
export function sqliteSaves(db: Sql): SaveStore {
  return {
    get: async (accountId) => {
      const sql = 'SELECT data, version FROM saves WHERE account_id = ?';
      const row = await db
        .prepare(sql)
        .bind(accountId)
        .first<{ data: Uint8Array; version: number }>();
      return row && { data: new Uint8Array(row.data), version: row.version };
    },
    put: async (accountId, data, { expected, at }) => {
      const sql =
        expected === 0
          ? 'INSERT INTO saves (account_id, version, data, updated_at) VALUES (?, 1, ?, ?) ON CONFLICT(account_id) DO NOTHING'
          : 'UPDATE saves SET version = version + 1, data = ?2, updated_at = ?3 WHERE account_id = ?1 AND version = ?4';
      const values = expected === 0 ? [accountId, data, at] : [accountId, data, at, expected];
      return (
        (
          await db
            .prepare(sql)
            .bind(...values)
            .run()
        ).changes > 0
      );
    },
  };
}

/** The account's save, decrypted, or null when there is none. */
export async function readSave(saves: SaveStore, secret: string, accountId: string) {
  const row = await saves.get(accountId);
  return row && { data: await decrypt(secret, row.data), version: row.version };
}

/**
 * Writes a save over `expected` (the version the device last saw, or 0 for none): another
 * device's newer save is never overwritten (412); the device merges and tries again.
 */
export async function writeSave(
  saves: SaveStore,
  secret: string,
  write: { accountId: string; data: ArrayBuffer; expected: number; at: number },
): Promise<number> {
  if (write.data.byteLength > MAX_SAVE_BYTES) throw new HttpError(413, 'save-too-big');
  const sealed = await encrypt(secret, write.data);
  const done = await saves.put(write.accountId, sealed, write);
  if (!done) throw new HttpError(412, 'save-changed');
  return write.expected + 1;
}
