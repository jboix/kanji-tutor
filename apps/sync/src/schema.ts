import type { Sql } from './sql.ts';

/** The tables, created when the server starts: no migration step to run by hand. */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY, email TEXT UNIQUE, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS passkeys (
    id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL, counter INTEGER NOT NULL, transports TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL,
    last_seen INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS invites (
    code_hash TEXT PRIMARY KEY, note TEXT NOT NULL, created_at INTEGER NOT NULL,
    used_by TEXT, used_at INTEGER, revoked INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS saves (
    account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    version INTEGER NOT NULL, data BLOB NOT NULL, updated_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS codes (
    key TEXT PRIMARY KEY, value TEXT NOT NULL, expires_at INTEGER NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS passkeys_account ON passkeys(account_id)',
  'CREATE INDEX IF NOT EXISTS devices_account ON devices(account_id)',
  'CREATE INDEX IF NOT EXISTS codes_expiry ON codes(expires_at)',
];

/** Creates the tables that are missing. */
export function migrate(sql: Sql): Promise<void> {
  return sql.batch(SCHEMA.map((statement) => sql.prepare(statement)));
}
