/**
 * What the server keeps: accounts, their passkeys, devices (each with its session token's hash)
 * and invites. An interface, so the routes run over SQLite in production and memory in tests.
 */

export interface Account {
  id: string;
  /** The recovery email, once confirmed with a code. */
  email: string | null;
  createdAt: number;
}

export interface Passkey {
  /** The credential id, base64url. */
  id: string;
  accountId: string;
  /** The COSE public key, base64url. */
  publicKey: string;
  counter: number;
  transports: string[];
}

export interface Device {
  id: string;
  accountId: string;
  name: string;
  /** SHA-256 of the session token, hex: the token itself is never stored. */
  tokenHash: string;
  createdAt: number;
  lastSeen: number;
}

export interface Invite {
  /** SHA-256 of the code, hex: the code itself is shown once, when it is made. */
  codeHash: string;
  /** Who it is for, e.g. "for Marta". */
  note: string;
  createdAt: number;
  /** The account it created, once used. */
  usedBy: string | null;
  usedAt: number | null;
  revoked: boolean;
}

export interface Store {
  createAccount(account: Account): Promise<void>;
  account(id: string): Promise<Account | null>;
  accountByEmail(email: string): Promise<Account | null>;
  setEmail(accountId: string, email: string): Promise<void>;
  deleteAccount(id: string): Promise<void>;
  addPasskey(passkey: Passkey): Promise<void>;
  passkey(id: string): Promise<Passkey | null>;
  passkeysOf(accountId: string): Promise<Passkey[]>;
  setCounter(id: string, counter: number): Promise<void>;
  addDevice(device: Device): Promise<void>;
  deviceByToken(tokenHash: string): Promise<Device | null>;
  devicesOf(accountId: string): Promise<Device[]>;
  touchDevice(id: string, at: number): Promise<void>;
  removeDevice(accountId: string, id: string): Promise<boolean>;
  addInvite(invite: Pick<Invite, 'codeHash' | 'note' | 'createdAt'>): Promise<void>;
  /** Unused and not revoked. */
  inviteOpen(codeHash: string): Promise<boolean>;
  /** Marks it used by the account; false if it was used or revoked meanwhile. */
  takeInvite(codeHash: string, accountId: string, at: number): Promise<boolean>;
  invites(): Promise<Invite[]>;
  revokeInvite(codeHash: string): Promise<boolean>;
}
