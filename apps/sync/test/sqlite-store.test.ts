// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { sqliteCodes } from '../src/codes.ts';
import { sqliteSaves } from '../src/saves.ts';
import { migrate } from '../src/schema.ts';
import { sqliteStore } from '../src/sqlite-store.ts';
import { nodeSql } from './node-sql.ts';

async function ready() {
  const sql = nodeSql();
  await migrate(sql);
  await migrate(sql);
  return sql;
}

describe('the SQLite store', () => {
  it('keeps accounts, passkeys and devices, and drops them with the account', async () => {
    const store = sqliteStore(await ready());
    await store.createAccount({ id: 'a1', email: null, createdAt: 1 });
    await store.setEmail('a1', 'me@example.com');
    expect(await store.accountByEmail('me@example.com')).toEqual({
      id: 'a1',
      email: 'me@example.com',
      createdAt: 1,
    });
    await store.addPasskey({
      id: 'c1',
      accountId: 'a1',
      publicKey: 'AQID',
      counter: 0,
      transports: ['internal', 'hybrid'],
    });
    await store.setCounter('c1', 3);
    expect(await store.passkey('c1')).toMatchObject({
      counter: 3,
      transports: ['internal', 'hybrid'],
    });
    const device = { accountId: 'a1', name: 'iPhone', createdAt: 1, lastSeen: 1 };
    await store.addDevice({ ...device, id: 'd1', tokenHash: 'h1' });
    await store.addDevice({ ...device, id: 'd2', tokenHash: 'h2', name: 'Laptop', lastSeen: 5 });
    await store.touchDevice('d1', 9);
    expect((await store.devicesOf('a1')).map((d) => d.id)).toEqual(['d1', 'd2']);
    expect(await store.removeDevice('other', 'd2')).toBe(false);
    expect(await store.removeDevice('a1', 'd2')).toBe(true);
    await store.deleteAccount('a1');
    expect(await store.account('a1')).toBeNull();
    expect(await store.passkey('c1')).toBeNull();
    expect(await store.deviceByToken('h1')).toBeNull();
  });

  it('uses an invite once, and never a revoked one', async () => {
    const store = sqliteStore(await ready());
    await store.addInvite({ codeHash: 'i1', note: 'for Marta', createdAt: 1 });
    await store.addInvite({ codeHash: 'i2', note: '', createdAt: 2 });
    expect(await store.inviteOpen('i1')).toBe(true);
    expect(await store.takeInvite('i1', 'a1', 5)).toBe(true);
    expect(await store.takeInvite('i1', 'a2', 6)).toBe(false);
    expect(await store.inviteOpen('i1')).toBe(false);
    expect(await store.revokeInvite('i2')).toBe(true);
    expect(await store.takeInvite('i2', 'a3', 7)).toBe(false);
    expect(await store.revokeInvite('i1')).toBe(false);
    expect((await store.invites()).map((i) => [i.note, i.usedBy, i.revoked])).toEqual([
      ['', null, true],
      ['for Marta', 'a1', false],
    ]);
  });

  it('forgets a code once it expires, and purges it', async () => {
    const sql = await ready();
    const clock = { now: 1000 };
    const codes = sqliteCodes(sql, () => clock.now);
    await codes.put('pair:K7F-29Q', '{"a":1}', 120);
    await codes.put('pair:K7F-29Q', '{"a":2}', 120);
    expect(await codes.get('pair:K7F-29Q')).toBe('{"a":2}');
    clock.now += 121_000;
    expect(await codes.get('pair:K7F-29Q')).toBeNull();
    await codes.purge();
    expect(await sql.prepare('SELECT COUNT(*) AS n FROM codes').first()).toEqual({ n: 0 });
  });

  it('writes a save over the version it expects, and drops it with the account', async () => {
    const sql = await ready();
    const store = sqliteStore(sql);
    const saves = sqliteSaves(sql);
    await store.createAccount({ id: 'a1', email: null, createdAt: 1 });
    const data = new Uint8Array([1, 2, 3]);
    expect(await saves.put('a1', data, { expected: 1, at: 1 })).toBe(false);
    expect(await saves.put('a1', data, { expected: 0, at: 1 })).toBe(true);
    expect(await saves.put('a1', data, { expected: 0, at: 2 })).toBe(false);
    expect(await saves.put('a1', new Uint8Array([4]), { expected: 1, at: 3 })).toBe(true);
    const saved = await saves.get('a1');
    expect(saved?.version).toBe(2);
    expect([...(saved?.data ?? [])]).toEqual([4]);
    await store.deleteAccount('a1');
    expect(await saves.get('a1')).toBeNull();
  });
});
