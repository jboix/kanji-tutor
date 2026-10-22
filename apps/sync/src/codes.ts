import type { Sql } from './sql.ts';

/** Short-lived values: passkey challenges, pairing and email codes, send counters. */
export interface Codes {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

/** Codes in the `codes` table; an expired one reads as gone, and `purge` clears them. */
export function sqliteCodes(db: Sql, now: () => number): Codes & { purge(): Promise<void> } {
  return {
    get: async (key) => {
      const sql = 'SELECT value FROM codes WHERE key = ? AND expires_at > ?';
      const row = await db.prepare(sql).bind(key, now()).first<{ value: string }>();
      return row?.value ?? null;
    },
    put: async (key, value, ttlSeconds) => {
      const sql =
        'INSERT INTO codes (key, value, expires_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at';
      await db
        .prepare(sql)
        .bind(key, value, now() + ttlSeconds * 1000)
        .run();
    },
    delete: async (key) => {
      await db.prepare('DELETE FROM codes WHERE key = ?').bind(key).run();
    },
    purge: async () => {
      await db.prepare('DELETE FROM codes WHERE expires_at <= ?').bind(now()).run();
    },
  };
}
