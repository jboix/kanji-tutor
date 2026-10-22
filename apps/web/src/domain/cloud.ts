/**
 * Cloud saves as the features see them: signing in, the devices, and the save kept in step
 * in the background. `src/data/cloud` implements it over the sync server; features reach it as
 * `useServices().cloud`, which is absent when the build has no server.
 */

/** Why a cloud call failed: the server's reasons, and the device's own. */
export type CloudReason =
  | 'offline'
  | 'server'
  | 'signed-out'
  | 'invite-needed'
  | 'passkey-cancelled'
  | 'passkey-refused'
  | 'passkey-unknown'
  | 'challenge-expired'
  | 'code-expired'
  | 'code-used'
  | 'code-wrong'
  | 'email-off'
  | 'email-failed'
  | 'email-taken'
  | 'too-many-codes'
  | 'slow-down'
  | 'bad-request';

export type CloudResult<T = void> = { ok: true; value: T } | { ok: false; error: CloudReason };

/**
 * Where the save stands. `waiting`: changes not sent yet (they go after a pause); `offline`:
 * they go when the device is back online; `paused`: the hourly cap was reached, they go later.
 */
export type SaveStatus = 'saved' | 'waiting' | 'saving' | 'offline' | 'paused' | 'failed';

export interface CloudState {
  signedIn: boolean;
  status: SaveStatus;
  /** When the save last reached the server, or was found up to date. */
  savedAt?: number;
}

export interface CloudDevice {
  id: string;
  name: string;
  createdAt: number;
  lastSeen: number;
  /** The device asking. */
  current: boolean;
}

/** A device asking to join, as typed on the signed-in one. */
export interface LinkRequest {
  name: string;
}

export interface CloudPort {
  state(): CloudState;
  /** Calls `listener` on every change of state; returns the unsubscribe. */
  subscribe(listener: (state: CloudState) => void): () => void;

  /** A new account from an invite, with a passkey for this device; the save is sent at once. */
  turnOn(invite: string, deviceName: string): Promise<CloudResult>;
  /** Signs in with a passkey and brings this device the saved progress. */
  logInWithPasskey(deviceName: string): Promise<CloudResult>;
  /** Starts linking this device: the code to type on the signed-in one. */
  startLink(deviceName: string): Promise<CloudResult<{ code: string; expiresIn: number }>>;
  /** Waits for the signed-in device to approve, then brings the saved progress. */
  waitForLink(signal: AbortSignal): Promise<CloudResult>;
  sendLogInCode(email: string): Promise<CloudResult>;
  logInWithCode(email: string, code: string, deviceName: string): Promise<CloudResult>;

  /** On the signed-in device: who asks with this code, then letting them in. */
  peekLink(code: string): Promise<CloudResult<LinkRequest>>;
  approveLink(code: string): Promise<CloudResult>;
  email(): Promise<CloudResult<string | null>>;
  addEmail(email: string): Promise<CloudResult>;
  confirmEmail(code: string): Promise<CloudResult>;
  addPasskey(): Promise<CloudResult>;
  devices(): Promise<CloudResult<CloudDevice[]>>;
  removeDevice(id: string): Promise<CloudResult>;

  /** Looks for a newer save, then sends this device's changes, now. */
  saveNow(): Promise<void>;
  /** Signs this device out; its progress stays on it. */
  logOut(): Promise<CloudResult>;
  /** Deletes the account and its save on the server; this device keeps its progress. */
  deleteAccount(): Promise<CloudResult>;
}
