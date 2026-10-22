import type { CloudState } from '../../domain/cloud.ts';
import type { BackupFile } from '../backup-schema.ts';
import { type CloudApi, CloudError, type RemoteSave } from './api.ts';
import { gunzip, gzip, sha256 } from './gzip.ts';
import { mergeSaves } from './merge.ts';
import type { CloudSession } from './session.ts';

/** A change is sent once nothing more changed for this long… */
export const QUIET_MS = 30_000;
/** …or this long after the first change not sent, even while changes go on. */
export const MAX_WAIT_MS = 120_000;
/** After the hourly cap, or a failure, the next try. */
export const RETRY_MS = 10 * 60_000;
/** Saves refused because another device saved first, merged and sent again, at most. */
const CONFLICT_TRIES = 3;

export interface SyncDeps {
  api: CloudApi;
  /** This device's data as a backup file, and replacing it (not counted as a change). */
  local: {
    read(): Promise<BackupFile>;
    write(file: BackupFile): Promise<void>;
    parse(json: unknown): Promise<BackupFile | null>;
  };
  session: { get(): CloudSession | null; set(session: CloudSession | null): void };
  now: () => number;
  timer: { set(run: () => void, ms: number): unknown; clear(handle: unknown): void };
}

const hashOf = (file: BackupFile) => sha256(JSON.stringify(file.data));
const reasonOf = (error: unknown) => (error instanceof CloudError ? error.reason : 'server');

/**
 * Keeps this device's progress and the server's in step: it sends after a pause in the
 * changes, or at most two minutes after the first, sends nothing when nothing changed, and on a
 * clash with another device's save merges the two and sends again. One task runs at a time.
 */
export class SyncEngine {
  #state: CloudState;
  #listeners = new Set<(state: CloudState) => void>();
  #timer: unknown;
  #firstChange: number | undefined;
  /** Changes counted so far: one made while a save is on its way is not taken as sent. */
  #changes = 0;
  #queue: Promise<void> = Promise.resolve();

  constructor(private readonly deps: SyncDeps) {
    const session = deps.session.get();
    this.#state = { signedIn: session !== null, status: session?.dirty ? 'waiting' : 'saved' };
  }

  state(): CloudState {
    return this.#state;
  }

  subscribe(listener: (state: CloudState) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** Something changed on this device: it is sent after the pause. */
  changed(): void {
    const session = this.deps.session.get();
    if (!session) return;
    this.#changes += 1;
    if (!session.dirty) this.deps.session.set({ ...session, dirty: true });
    this.#firstChange ??= this.deps.now();
    this.#arm(Math.min(QUIET_MS, this.#firstChange + MAX_WAIT_MS - this.deps.now()));
    if (this.#state.status !== 'saving') this.#set({ status: 'waiting' });
  }

  /** Sends this device's changes now. */
  flush(): Promise<void> {
    return this.#enqueue(() => this.#push(CONFLICT_TRIES));
  }

  /** Once the task under way, if any, has finished. */
  settled(): Promise<void> {
    return this.#queue;
  }

  /** Looks for a newer save from another device, and brings it here. */
  pull(): Promise<void> {
    return this.#enqueue(() => this.#pull());
  }

  /** A new session (signed in): its first task is to look for the saved progress. */
  begin(session: CloudSession): Promise<void> {
    this.deps.session.set(session);
    this.#set({ signedIn: true, status: session.dirty ? 'waiting' : 'saved' });
    return session.dirty ? this.flush() : this.pull();
  }

  /** Signed out: nothing more is sent; the progress stays on the device. */
  end(): void {
    this.deps.timer.clear(this.#timer);
    this.#firstChange = undefined;
    this.deps.session.set(null);
    this.#set({ signedIn: false, status: 'saved' });
  }

  #set(change: Partial<CloudState>) {
    this.#state = { ...this.#state, ...change };
    for (const listener of this.#listeners) listener(this.#state);
  }

  #arm(ms: number) {
    this.deps.timer.clear(this.#timer);
    this.#timer = this.deps.timer.set(() => void this.flush(), Math.max(0, ms));
  }

  #enqueue(task: () => Promise<void>): Promise<void> {
    this.#queue = this.#queue.then(task).catch(() => this.#set({ status: 'failed' }));
    return this.#queue;
  }

  /** Sent or found up to date; changes made meanwhile wait for the next save. */
  #saved(session: CloudSession, change: Partial<CloudSession>, seen = this.#changes) {
    const dirty = this.#changes !== seen;
    this.deps.session.set({ ...session, ...change, dirty });
    this.#set({ status: dirty ? 'waiting' : 'saved', savedAt: this.deps.now() });
    if (dirty) this.#arm(QUIET_MS);
  }

  async #push(tries: number): Promise<void> {
    const session = this.deps.session.get();
    if (!session?.dirty) return;
    this.deps.timer.clear(this.#timer);
    this.#firstChange = undefined;
    this.#set({ status: 'saving' });
    const seen = this.#changes;
    const file = await this.deps.local.read();
    const hash = await hashOf(file);
    if (hash === session.hash) return this.#saved(session, {}, seen);
    try {
      const version = await this.deps.api.putSave(
        await gzip(JSON.stringify(file)),
        session.version,
      );
      this.#saved(session, { version, hash }, seen);
    } catch (error) {
      await this.#pushFailed(reasonOf(error), tries);
    }
  }

  async #pushFailed(reason: CloudError['reason'], tries: number): Promise<void> {
    if (reason === 'save-changed' && tries > 1) {
      await this.#pull();
      return this.#push(tries - 1);
    }
    this.#stopped(reason);
  }

  /** Why nothing was sent or brought, as the state shows it, and when to try again. */
  #stopped(reason: CloudError['reason']) {
    if (reason === 'signed-out') return this.end();
    if (reason === 'offline') return this.#set({ status: 'offline' });
    this.#arm(RETRY_MS);
    const paused = reason === 'too-many-saves' || reason === 'slow-down';
    this.#set({ status: paused ? 'paused' : 'failed' });
  }

  async #pull(): Promise<void> {
    const session = this.deps.session.get();
    if (!session) return;
    let remote: RemoteSave;
    try {
      remote = await this.deps.api.getSave(session.version);
    } catch (error) {
      return this.#stopped(reasonOf(error));
    }
    if (remote.status === 'got') return this.#bring(session, remote.data, remote.version);
    if (remote.status === 'none') return this.#firstSave(session);
    if (!session.dirty) this.#set({ status: 'saved', savedAt: this.deps.now() });
  }

  /** No save on the server yet: this device's progress is the first. */
  #firstSave(session: CloudSession) {
    this.deps.session.set({ ...session, version: 0, hash: null });
    this.changed();
  }

  /**
   * A newer save from another device. With nothing changed here since the last save it replaces
   * this device's data, deletions included; otherwise the two are merged, and the merge is sent.
   */
  async #bring(session: CloudSession, bytes: Uint8Array<ArrayBuffer>, version: number) {
    const theirs = await this.deps.local.parse(JSON.parse(await gunzip(bytes)));
    if (!theirs) return this.#stopped('server');
    const theirHash = await hashOf(theirs);
    if (!session.dirty && session.hash !== null) {
      await this.deps.local.write(theirs);
      return this.#saved(session, { version, hash: theirHash }, this.#changes);
    }
    const mine = await this.deps.local.read();
    const prefer = session.hash === null ? 'theirs' : 'mine';
    const merged = { ...theirs, data: mergeSaves(mine.data, theirs.data, prefer) };
    await this.deps.local.write(merged);
    const same = (await hashOf(merged)) === theirHash;
    this.deps.session.set({ ...session, version, hash: theirHash, dirty: !same });
    if (same) this.#set({ status: 'saved', savedAt: this.deps.now() });
    else this.changed();
  }
}
