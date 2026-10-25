import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyUpdate,
  BUILD,
  checkForUpdate,
  fetchNewVersion,
  offerUpdate,
  reloadFresh,
  reloadWhenActive,
  resetAppUpdate,
  setRegistration,
  watchForUpdates,
} from './app-update.ts';

function registration(found: boolean) {
  const reg = { installing: null as object | null, waiting: null, update: vi.fn() };
  reg.update.mockImplementation(async () => {
    if (found) reg.installing = {};
  });
  return reg as unknown as ServiceWorkerRegistration & { update: ReturnType<typeof vi.fn> };
}

describe('app update (N1e)', () => {
  afterEach(() => setRegistration(undefined));

  it('knows which build is running', () => {
    expect(BUILD.id).toMatch(/\S/);
  });

  it('reports no update service without a registration', async () => {
    expect(await checkForUpdate()).toBe('unavailable');
  });

  it('asks the server and says whether a new version is installing', async () => {
    const latest = registration(false);
    setRegistration(latest);
    expect(await checkForUpdate()).toBe('latest');
    expect(latest.update).toHaveBeenCalledOnce();
    setRegistration(registration(true));
    expect(await checkForUpdate()).toBe('updating');
  });

  it('drops the service worker and the app caches, keeps the data, and reloads', async () => {
    const unregister = vi.fn(async () => true);
    const deleted: string[] = [];
    const reload = vi.fn();
    const target = {
      navigator: { serviceWorker: { getRegistrations: async () => [{ unregister }] } },
      caches: {
        keys: async () => ['workbox-precache', 'fonts'],
        delete: async (name: string) => deleted.push(name) > 0,
      },
      location: { reload },
    } as unknown as Window;
    await reloadFresh(target);
    expect(unregister).toHaveBeenCalledOnce();
    expect(deleted).toEqual(['workbox-precache', 'fonts']);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('still reloads where there is no service worker or cache storage', async () => {
    const reload = vi.fn();
    await reloadFresh({ navigator: {}, location: { reload } } as unknown as Window);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('reads the new version and its notes from the server, never from a cache', async () => {
    const load = vi.fn(async () => Response.json({ version: '1.5.0', notes: ['One', 2] }));
    expect(await fetchNewVersion('/app/', load)).toEqual({ version: '1.5.0', notes: ['One'] });
    expect(load).toHaveBeenCalledWith('/app/version.json', { cache: 'no-store' });
  });

  it('describes nothing when version.json cannot be read', async () => {
    const load = vi.fn(async () => new Response('<html>', { status: 404 }));
    expect(await fetchNewVersion('/', load)).toEqual({ notes: [] });
  });

  it('applies an update once, and only while one is offered', async () => {
    resetAppUpdate();
    const apply = vi.fn(async () => undefined);
    await applyUpdate();
    await offerUpdate(apply, async () => ({ notes: [] }));
    await applyUpdate();
    await applyUpdate();
    expect(apply).toHaveBeenCalledOnce();
    resetAppUpdate();
  });

  it('looks for a new version when the app comes back, at most once an hour', () => {
    const latest = registration(false);
    setRegistration(latest);
    let now = 0;
    const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' }) as Document;
    watchForUpdates(doc, () => now);
    now = 30 * 60_000;
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(latest.update).not.toHaveBeenCalled();
    now = 61 * 60_000;
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(latest.update).toHaveBeenCalledOnce();
  });

  it('reloads a page no worker controls once the new version is active', () => {
    const waiting = Object.assign(new EventTarget(), { state: 'installed' });
    setRegistration({ waiting } as unknown as ServiceWorkerRegistration);
    const reload = vi.fn();
    const page = (controller: object | null) =>
      ({ navigator: { serviceWorker: { controller } }, location: { reload } }) as unknown as Window;
    reloadWhenActive(page({}));
    reloadWhenActive(page(null));
    waiting.dispatchEvent(new Event('statechange'));
    expect(reload).not.toHaveBeenCalled();
    waiting.state = 'activated';
    waiting.dispatchEvent(new Event('statechange'));
    expect(reload).toHaveBeenCalledOnce();
    setRegistration({ waiting: null } as unknown as ServiceWorkerRegistration);
    reloadWhenActive(page(null));
    expect(reload).toHaveBeenCalledTimes(2);
  });
});
