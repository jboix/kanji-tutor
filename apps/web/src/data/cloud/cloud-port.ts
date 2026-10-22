import type { CloudDevice, CloudPort, CloudReason, CloudResult } from '../../domain/cloud.ts';
import type { KanjiTutorDb } from '../db.ts';
import { type CloudApi, CloudError, cloudApi } from './api.ts';
import { watchChanges } from './changes.ts';
import { readSession, writeSession } from './session.ts';
import { linkToken, type PendingLink, passkeyToken, registerPasskey } from './sign-in.ts';
import { SyncEngine } from './sync.ts';

/** The device's reasons pass through; the save's own are the server's business. */
const PORT_REASONS = new Set<string>(['save-changed', 'too-many-saves', 'no-save']);

async function attempt<T>(run: () => Promise<T>): Promise<CloudResult<T>> {
  try {
    return { ok: true, value: await run() };
  } catch (error) {
    const reason = error instanceof CloudError ? error.reason : 'server';
    return { ok: false, error: (PORT_REASONS.has(reason) ? 'server' : reason) as CloudReason };
  }
}

/** The save as a backup file, read and written through the backup code, which loads on use. */
function localSave(db: KanjiTutorDb, mute: (on: boolean) => void) {
  const backup = () => import('../backup.ts');
  return {
    read: async () => (await backup()).exportBackup(db),
    write: async (file: Parameters<Awaited<ReturnType<typeof backup>>['importBackup']>[1]) => {
      mute(true);
      try {
        await (await backup()).importBackup(db, file);
      } finally {
        mute(false);
      }
    },
    parse: async (json: unknown) => {
      const parsed = (await backup()).parseBackup(json);
      return parsed.ok ? parsed.backup : null;
    },
  };
}

/** The engine over this database: it hears every change, and sends on the schedule. */
function engineFor(db: KanjiTutorDb, api: CloudApi): SyncEngine {
  let muted = false;
  const engine = new SyncEngine({
    api,
    local: localSave(db, (on) => {
      muted = on;
    }),
    session: { get: readSession, set: writeSession },
    now: Date.now,
    timer: { set: (run, ms) => setTimeout(run, ms), clear: (h) => clearTimeout(h as number) },
  });
  watchChanges(
    db,
    () => engine.changed(),
    () => muted,
  );
  return engine;
}

/** Back online, or back to the app: look for news; leaving it: send what is waiting at once. */
function follow(engine: SyncEngine) {
  window.addEventListener('online', () => void engine.pull().then(() => engine.flush()));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void engine.flush();
    else void engine.pull();
  });
}

/** The account's own calls, for a signed-in device. */
function accountCalls(api: CloudApi) {
  return {
    peekLink: (code: string) =>
      attempt(() => api.get<{ name: string }>(`/pair/${encodeURIComponent(code)}`)),
    approveLink: (code: string) =>
      attempt(async () => void (await api.post('/pair/approve', { code }))),
    email: () => attempt(async () => (await api.get<{ email: string | null }>('/me')).email),
    addEmail: (email: string) => attempt(async () => void (await api.post('/email', { email }))),
    confirmEmail: (code: string) =>
      attempt(async () => void (await api.post('/email/confirm', { code }))),
    addPasskey: () => attempt(async () => void (await registerPasskey(api, 'Device'))),
    devices: () =>
      attempt(async () => (await api.get<{ devices: CloudDevice[] }>('/devices')).devices),
    removeDevice: (id: string) => attempt(() => api.remove(`/devices/${encodeURIComponent(id)}`)),
  };
}

type SignedIn = (token: string, dirty?: boolean) => Promise<void>;

const deviceName = (text: string) => text.trim().slice(0, 60) || 'Device';

/** A new account from an invite, and signing in with a passkey. */
function passkeyCalls(api: CloudApi, signedIn: SignedIn) {
  return {
    turnOn: (invite: string, name: string) =>
      attempt(async () => {
        const { token } = await registerPasskey(api, deviceName(name), invite.trim());
        if (token) await signedIn(token, true);
      }),
    logInWithPasskey: (name: string) =>
      attempt(async () => signedIn(await passkeyToken(api, deviceName(name)))),
  };
}

/** Linking this device from a signed-in one: a code to type there, then waiting. */
function linkCalls(api: CloudApi, signedIn: SignedIn) {
  let link: PendingLink | undefined;
  return {
    startLink: (name: string) =>
      attempt(async () => {
        const body = { name: deviceName(name) };
        const started = await api.post<Omit<PendingLink, 'expiresAt'> & { expiresIn: number }>(
          '/pair/start',
          body,
        );
        link = { ...started, expiresAt: Date.now() + started.expiresIn * 1000 };
        return { code: started.code, expiresIn: started.expiresIn };
      }),
    waitForLink: (signal: AbortSignal) =>
      attempt(async () => {
        if (!link) throw new CloudError('code-expired');
        const token = await linkToken(api, link, signal, Date.now);
        if (token) await signedIn(token);
      }),
  };
}

/** Signing in with a code sent to the recovery email. */
function emailCalls(api: CloudApi, signedIn: SignedIn) {
  return {
    sendLogInCode: (email: string) =>
      attempt(async () => void (await api.post('/email/login', { email: email.trim() }))),
    logInWithCode: (email: string, code: string, name: string) =>
      attempt(async () => {
        const body = { email: email.trim(), code: code.trim(), name: deviceName(name) };
        await signedIn((await api.post<{ token: string }>('/email/login/verify', body)).token);
      }),
  };
}

/** The save now, signing out, deleting the account. */
function sessionCalls(api: CloudApi, engine: SyncEngine) {
  const stillOn = (error: unknown) => {
    if (!(error instanceof CloudError && error.reason === 'signed-out')) throw error;
  };
  return {
    state: () => engine.state(),
    subscribe: (listener: Parameters<SyncEngine['subscribe']>[0]) => engine.subscribe(listener),
    saveNow: async () => {
      await engine.pull();
      await engine.flush();
    },
    logOut: () =>
      attempt(async () => {
        await engine.flush();
        await api.post('/logout').catch(stillOn);
        engine.end();
      }),
    deleteAccount: () =>
      attempt(async () => {
        await api.remove('/account');
        engine.end();
      }),
  };
}

/**
 * Cloud saves over the sync server at `url`. A device that was signed in carries on where
 * it stopped: it looks for a newer save, and sends what it had not sent yet.
 */
export function createCloudPort(db: KanjiTutorDb, url: string): CloudPort {
  const api = cloudApi(url, () => readSession()?.token ?? null);
  const engine = engineFor(db, api);
  follow(engine);
  const session = readSession();
  if (session) void engine.begin(session);
  const signedIn: SignedIn = (token, dirty = false) =>
    engine.begin({ token, version: 0, hash: null, dirty });
  return {
    ...passkeyCalls(api, signedIn),
    ...linkCalls(api, signedIn),
    ...emailCalls(api, signedIn),
    ...accountCalls(api),
    ...sessionCalls(api, engine),
  };
}
