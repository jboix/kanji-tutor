import type { Sql } from './sql.ts';
import type { Account, Device, Invite, Passkey, Store } from './store.ts';

interface AccountRow {
  id: string;
  email: string | null;
  created_at: number;
}

interface PasskeyRow {
  id: string;
  account_id: string;
  public_key: string;
  counter: number;
  transports: string;
}

interface DeviceRow {
  id: string;
  account_id: string;
  name: string;
  token_hash: string;
  created_at: number;
  last_seen: number;
}

const account = (row: AccountRow | null): Account | null =>
  row && { id: row.id, email: row.email, createdAt: row.created_at };

const passkey = (row: PasskeyRow): Passkey => ({
  id: row.id,
  accountId: row.account_id,
  publicKey: row.public_key,
  counter: row.counter,
  transports: JSON.parse(row.transports) as string[],
});

const device = (row: DeviceRow): Device => ({
  id: row.id,
  accountId: row.account_id,
  name: row.name,
  tokenHash: row.token_hash,
  createdAt: row.created_at,
  lastSeen: row.last_seen,
});

function accounts(db: Sql) {
  const one = (sql: string, value: string) =>
    db.prepare(sql).bind(value).first<AccountRow>().then(account);
  return {
    createAccount: async (a: Account) => {
      await db
        .prepare('INSERT INTO accounts (id, email, created_at) VALUES (?, ?, ?)')
        .bind(a.id, a.email, a.createdAt)
        .run();
    },
    account: (id: string) => one('SELECT * FROM accounts WHERE id = ?', id),
    accountByEmail: (email: string) => one('SELECT * FROM accounts WHERE email = ?', email),
    setEmail: async (id: string, email: string) => {
      await db.prepare('UPDATE accounts SET email = ? WHERE id = ?').bind(email, id).run();
    },
    deleteAccount: async (id: string) => {
      await db.batch([
        db.prepare('DELETE FROM saves WHERE account_id = ?').bind(id),
        db.prepare('DELETE FROM devices WHERE account_id = ?').bind(id),
        db.prepare('DELETE FROM passkeys WHERE account_id = ?').bind(id),
        db.prepare('DELETE FROM accounts WHERE id = ?').bind(id),
      ]);
    },
  };
}

function passkeys(db: Sql) {
  return {
    addPasskey: async (p: Passkey) => {
      await db
        .prepare(
          'INSERT INTO passkeys (id, account_id, public_key, counter, transports) VALUES (?, ?, ?, ?, ?)',
        )
        .bind(p.id, p.accountId, p.publicKey, p.counter, JSON.stringify(p.transports))
        .run();
    },
    passkey: async (id: string) => {
      const row = await db
        .prepare('SELECT * FROM passkeys WHERE id = ?')
        .bind(id)
        .first<PasskeyRow>();
      return row && passkey(row);
    },
    passkeysOf: async (accountId: string) => {
      const sql = 'SELECT * FROM passkeys WHERE account_id = ?';
      const { results } = await db.prepare(sql).bind(accountId).all<PasskeyRow>();
      return results.map(passkey);
    },
    setCounter: async (id: string, counter: number) => {
      await db.prepare('UPDATE passkeys SET counter = ? WHERE id = ?').bind(counter, id).run();
    },
  };
}

function devices(db: Sql) {
  return {
    addDevice: async (d: Device) => {
      await db
        .prepare(
          'INSERT INTO devices (id, account_id, name, token_hash, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .bind(d.id, d.accountId, d.name, d.tokenHash, d.createdAt, d.lastSeen)
        .run();
    },
    deviceByToken: async (tokenHash: string) => {
      const sql = 'SELECT * FROM devices WHERE token_hash = ?';
      const row = await db.prepare(sql).bind(tokenHash).first<DeviceRow>();
      return row && device(row);
    },
    devicesOf: async (accountId: string) => {
      const sql = 'SELECT * FROM devices WHERE account_id = ? ORDER BY last_seen DESC';
      const { results } = await db.prepare(sql).bind(accountId).all<DeviceRow>();
      return results.map(device);
    },
    touchDevice: async (id: string, at: number) => {
      await db.prepare('UPDATE devices SET last_seen = ? WHERE id = ?').bind(at, id).run();
    },
    removeDevice: async (accountId: string, id: string) => {
      const sql = 'DELETE FROM devices WHERE id = ? AND account_id = ?';
      return (await db.prepare(sql).bind(id, accountId).run()).changes > 0;
    },
  };
}

interface InviteRow {
  code_hash: string;
  note: string;
  created_at: number;
  used_by: string | null;
  used_at: number | null;
  revoked: number;
}

const invite = (row: InviteRow): Invite => ({
  codeHash: row.code_hash,
  note: row.note,
  createdAt: row.created_at,
  usedBy: row.used_by,
  usedAt: row.used_at,
  revoked: row.revoked === 1,
});

const OPEN = 'used_by IS NULL AND revoked = 0';

function invites(db: Sql) {
  return {
    addInvite: async (i: Pick<Invite, 'codeHash' | 'note' | 'createdAt'>) => {
      const sql = 'INSERT INTO invites (code_hash, note, created_at) VALUES (?, ?, ?)';
      await db.prepare(sql).bind(i.codeHash, i.note, i.createdAt).run();
    },
    inviteOpen: async (codeHash: string) => {
      const sql = `SELECT code_hash FROM invites WHERE code_hash = ? AND ${OPEN}`;
      return (await db.prepare(sql).bind(codeHash).first()) !== null;
    },
    takeInvite: async (codeHash: string, accountId: string, at: number) => {
      const sql = `UPDATE invites SET used_by = ?, used_at = ? WHERE code_hash = ? AND ${OPEN}`;
      return (await db.prepare(sql).bind(accountId, at, codeHash).run()).changes > 0;
    },
    invites: async () => {
      const sql = 'SELECT * FROM invites ORDER BY created_at DESC';
      return (await db.prepare(sql).all<InviteRow>()).results.map(invite);
    },
    revokeInvite: async (codeHash: string) => {
      const sql = 'UPDATE invites SET revoked = 1 WHERE code_hash = ? AND used_by IS NULL';
      return (await db.prepare(sql).bind(codeHash).run()).changes > 0;
    },
  };
}

/** The store over the server's SQLite. */
export function sqliteStore(db: Sql): Store {
  return { ...accounts(db), ...passkeys(db), ...devices(db), ...invites(db) };
}
