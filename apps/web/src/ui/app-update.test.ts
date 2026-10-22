import { afterEach, describe, expect, it, vi } from 'vitest';
import { BUILD, checkForUpdate, reloadFresh, setRegistration } from './app-update.ts';

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
});
