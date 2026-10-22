import { describe, expect, it } from 'vitest';
import { item, memoryServer, review, save } from '../../test/cloud-saves.ts';
import type { BackupFile } from '../backup-schema.ts';
import type { CloudApi } from './api.ts';
import { gunzip } from './gzip.ts';
import type { CloudSession } from './session.ts';
import { MAX_WAIT_MS, QUIET_MS, RETRY_MS, SyncEngine } from './sync.ts';

/** One device: its data, its session, and a clock whose timers run when time is moved on. */
function device(api: CloudApi, file = save()) {
  const clock = { now: 0, timers: [] as { at: number; run: () => void }[] };
  const local = { file, session: null as CloudSession | null };
  const engine = new SyncEngine({
    api,
    local: {
      read: async () => structuredClone(local.file),
      write: async (next) => {
        local.file = structuredClone(next);
      },
      parse: async (json) => json as BackupFile,
    },
    session: {
      get: () => local.session,
      set: (s) => {
        local.session = s;
      },
    },
    now: () => clock.now,
    timer: {
      set: (run, ms) => {
        const timer = { at: clock.now + ms, run };
        clock.timers.push(timer);
        return timer;
      },
      clear: (timer) => {
        clock.timers = clock.timers.filter((t) => t !== timer);
      },
    },
  });
  /** Moves the clock on, running the timers that come due, and lets their saves finish. */
  const wait = async (ms: number) => {
    clock.now += ms;
    for (const timer of clock.timers.filter((t) => t.at <= clock.now)) {
      clock.timers = clock.timers.filter((t) => t !== timer);
      timer.run();
    }
    await engine.settled();
  };
  const edit = (change: (data: BackupFile['data']) => void) => {
    change(local.file.data);
    engine.changed();
  };
  return { engine, local, clock, wait, edit };
}

const session = (dirty = false): CloudSession => ({ token: 't', version: 0, hash: null, dirty });
const onServer = async (data: Uint8Array<ArrayBuffer> | undefined) =>
  JSON.parse(await gunzip(data ?? new Uint8Array())) as BackupFile;

describe('the save, kept in step', () => {
  it('sends after 30 s of quiet, or 2 minutes after the first change at most', async () => {
    const { api, server } = memoryServer();
    const phone = device(api);
    await phone.engine.begin(session(true));
    expect(server.puts).toBe(1);
    phone.edit((d) => d.items.push(item('1', 1)));
    await phone.wait(QUIET_MS - 1);
    expect([server.puts, phone.engine.state().status]).toEqual([1, 'waiting']);
    await phone.wait(1);
    expect(server.puts).toBe(2);
    for (let t = 0; t < MAX_WAIT_MS; t += 10_000) {
      phone.edit((d) => d.reviews.push(review('1', t)));
      await phone.wait(10_000);
    }
    expect(server.puts).toBe(3);
  });

  it('sends nothing when nothing changed, and gzips what it sends', async () => {
    const { api, server } = memoryServer();
    const phone = device(api, save({ items: [item('1', 1)] }));
    await phone.engine.begin(session(true));
    phone.edit(() => undefined);
    await phone.wait(QUIET_MS);
    expect(server.puts).toBe(1);
    expect((await onServer(server.data)).data.items).toHaveLength(1);
    expect(phone.engine.state()).toMatchObject({ status: 'saved', savedAt: QUIET_MS });
  });

  it("brings another device's save over one with no changes, deletions included", async () => {
    const { api } = memoryServer();
    const phone = device(api, save({ items: [item('1', 1), item('2', 1)] }));
    await phone.engine.begin(session(true));
    const laptop = device(api);
    await laptop.engine.begin(session());
    expect(laptop.local.file.data.items).toHaveLength(2);
    laptop.edit((d) => d.items.pop());
    await laptop.wait(QUIET_MS);
    await phone.engine.pull();
    expect(phone.local.file.data.items.map((i) => i.ref)).toEqual(['1']);
  });

  it('merges when two devices saved at once, and sends the merge', async () => {
    const { api, server } = memoryServer();
    const phone = device(api);
    await phone.engine.begin(session(true));
    const laptop = device(api);
    await laptop.engine.begin(session());
    phone.edit((d) => d.reviews.push(review('1', 1)));
    laptop.edit((d) => d.reviews.push(review('2', 2)));
    await phone.wait(QUIET_MS);
    await laptop.wait(QUIET_MS);
    const merged = (await onServer(server.data)).data.reviews.map((r) => r.itemId).sort();
    expect(merged).toEqual(['word:1', 'word:2']);
    expect(laptop.local.file.data.reviews).toHaveLength(2);
    expect(laptop.engine.state().status).toBe('saved');
  });

  it('takes the saved settings on a first sign-in, keeping what the device had', async () => {
    const { api } = memoryServer();
    const phone = device(api);
    phone.local.file.data.settings.onboarded = true;
    await phone.engine.begin(session(true));
    const laptop = device(api, save({ notes: [{ id: 'n', createdAt: 1, title: 'x', body: 'y' }] }));
    await laptop.engine.begin(session());
    expect(laptop.local.file.data.settings.onboarded).toBe(true);
    expect(laptop.local.file.data.notes).toHaveLength(1);
  });

  it('keeps a change made while a save was on its way, for the next one', async () => {
    const { api, server } = memoryServer();
    const phone = device(api);
    const put = api.putSave;
    api.putSave = async (data, version) => {
      phone.edit((d) => d.items.push(item('late', 1)));
      api.putSave = put;
      return put(data, version);
    };
    await phone.engine.begin(session(true));
    expect([server.puts, phone.engine.state().status]).toEqual([1, 'waiting']);
    await phone.wait(QUIET_MS);
    expect((await onServer(server.data)).data.items.map((i) => i.ref)).toEqual(['late']);
  });

  it('pauses past the hourly cap, waits offline, and stops when signed out elsewhere', async () => {
    const { api, fail, server } = memoryServer();
    const phone = device(api);
    fail.next = 'too-many-saves';
    await phone.engine.begin(session(true));
    expect(phone.engine.state().status).toBe('paused');
    await phone.wait(RETRY_MS);
    expect([server.puts, phone.engine.state().status]).toEqual([1, 'saved']);
    phone.edit((d) => d.items.push(item('1', 1)));
    fail.next = 'offline';
    await phone.engine.flush();
    expect(phone.engine.state().status).toBe('offline');
    fail.next = 'signed-out';
    await phone.engine.flush();
    expect([phone.engine.state().signedIn, phone.local.session]).toEqual([false, null]);
  });
});
