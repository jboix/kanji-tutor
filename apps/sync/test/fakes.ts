/** In-memory stand-ins for the server's store, codes and saves, and a request helper, for tests. */
import type { Codes } from '../src/codes.ts';
import type { Deps } from '../src/deps.ts';
import type { SaveStore } from '../src/saves.ts';
import type { Account, Device, Invite, Passkey, Store } from '../src/store.ts';

interface Tables {
  accounts: Map<string, Account>;
  passkeys: Map<string, Passkey>;
  devices: Map<string, Device>;
  invites: Map<string, Invite>;
}

const values = <T>(map: Map<string, T>) => [...map.values()];

/** Removes the rows of one account from a table. */
function dropAccount<T extends { accountId: string }>(map: Map<string, T>, accountId: string) {
  for (const [key, row] of map) if (row.accountId === accountId) map.delete(key);
}

function accountsOf({ accounts, passkeys, devices }: Tables) {
  return {
    createAccount: async (a: Account) => void accounts.set(a.id, { ...a }),
    account: async (id: string) => accounts.get(id) ?? null,
    accountByEmail: async (email: string) =>
      values(accounts).find((a) => a.email === email) ?? null,
    setEmail: async (id: string, email: string) => {
      const a = accounts.get(id);
      if (a) a.email = email;
    },
    deleteAccount: async (id: string) => {
      accounts.delete(id);
      dropAccount(passkeys, id);
      dropAccount(devices, id);
    },
  };
}

function passkeysOf({ passkeys }: Tables) {
  return {
    addPasskey: async (p: Passkey) => void passkeys.set(p.id, { ...p }),
    passkey: async (id: string) => passkeys.get(id) ?? null,
    passkeysOf: async (accountId: string) =>
      values(passkeys).filter((p) => p.accountId === accountId),
    setCounter: async (id: string, counter: number) => {
      const p = passkeys.get(id);
      if (p) p.counter = counter;
    },
  };
}

function devicesOf({ devices }: Tables) {
  return {
    addDevice: async (d: Device) => void devices.set(d.id, { ...d }),
    deviceByToken: async (hash: string) =>
      values(devices).find((d) => d.tokenHash === hash) ?? null,
    devicesOf: async (accountId: string) =>
      values(devices).filter((d) => d.accountId === accountId),
    touchDevice: async (id: string, at: number) => {
      const d = devices.get(id);
      if (d) d.lastSeen = at;
    },
    removeDevice: async (accountId: string, id: string) =>
      devices.get(id)?.accountId === accountId ? devices.delete(id) : false,
  };
}

function invitesOf({ invites }: Tables) {
  const open = (hash: string) => {
    const i = invites.get(hash);
    return i && !i.usedBy && !i.revoked ? i : undefined;
  };
  return {
    addInvite: async (i: Pick<Invite, 'codeHash' | 'note' | 'createdAt'>) =>
      void invites.set(i.codeHash, { ...i, usedBy: null, usedAt: null, revoked: false }),
    inviteOpen: async (hash: string) => open(hash) !== undefined,
    takeInvite: async (hash: string, accountId: string, at: number) => {
      const i = open(hash);
      if (i) Object.assign(i, { usedBy: accountId, usedAt: at });
      return i !== undefined;
    },
    invites: async () => values(invites),
    revokeInvite: async (hash: string) => {
      const i = open(hash);
      if (i) i.revoked = true;
      return i !== undefined;
    },
  };
}

export function memoryStore(): Store & { accounts: Map<string, Account> } {
  const tables: Tables = {
    accounts: new Map(),
    passkeys: new Map(),
    devices: new Map(),
    invites: new Map(),
  };
  return {
    accounts: tables.accounts,
    ...accountsOf(tables),
    ...passkeysOf(tables),
    ...devicesOf(tables),
    ...invitesOf(tables),
  };
}

export function memoryCodes(): Codes & { keys: () => string[] } {
  const values = new Map<string, string>();
  return {
    keys: () => [...values.keys()],
    get: async (key) => values.get(key) ?? null,
    put: async (key, value) => void values.set(key, value),
    delete: async (key) => void values.delete(key),
  };
}

export function memorySaves(): SaveStore & { raw: (accountId: string) => Uint8Array | undefined } {
  const rows = new Map<string, { data: Uint8Array; version: number }>();
  return {
    raw: (accountId) => rows.get(accountId)?.data,
    get: async (accountId) => rows.get(accountId) ?? null,
    put: async (accountId, data, { expected }) => {
      if ((rows.get(accountId)?.version ?? 0) !== expected) return false;
      rows.set(accountId, { data: data.slice(), version: expected + 1 });
      return true;
    },
  };
}

export const ORIGIN = 'https://app.test';

/** 32 bytes of zeros, base64, as tofu's random_bytes would give. */
export const SAVE_KEY = btoa(String.fromCharCode(...new Uint8Array(32)));

export interface TestDeps extends Deps {
  store: ReturnType<typeof memoryStore>;
  codes: ReturnType<typeof memoryCodes>;
  saves: ReturnType<typeof memorySaves>;
  sent: { to: string; code: string }[];
  clock: { now: number };
}

export function testDeps(): TestDeps {
  const sent: { to: string; code: string }[] = [];
  const clock = { now: 1_800_000_000_000 };
  return {
    store: memoryStore(),
    codes: memoryCodes(),
    saves: memorySaves(),
    saveKey: SAVE_KEY,
    origin: ORIGIN,
    rpId: 'app.test',
    mail: async (to, code) => void sent.push({ to, code }),
    limit: () => undefined,
    now: () => clock.now,
    version: '1.2.3',
    sent,
    clock,
  };
}

/** A request from the app: its origin, a JSON body, and a bearer token if given. */
export function call(
  method: string,
  path: string,
  options: { body?: unknown; token?: string; headers?: Record<string, string> } = {},
): Request {
  const headers: Record<string, string> = { origin: ORIGIN, ...options.headers };
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  const body = options.body === undefined ? null : JSON.stringify(options.body);
  return new Request(`https://worker.test${path}`, { method, headers, body });
}
