/**
 * Which build is running, and a way to get the newest one (N1e). Boot hands over the service
 * worker registration; Settings → About asks for an update or a fresh reload.
 */

/** Version, short commit and build time, set by Vite at build time; "dev" in the dev server. */
export const BUILD = {
  version: (import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'dev',
  id: (import.meta.env.VITE_BUILD_ID as string | undefined) ?? 'dev',
  at: (import.meta.env.VITE_BUILD_AT as string | undefined) ?? '',
};

export type UpdateCheck = 'updating' | 'latest' | 'unavailable';

const state: { registration?: ServiceWorkerRegistration | undefined } = {};

/** Called by boot once the service worker is registered. */
export function setRegistration(registration: ServiceWorkerRegistration | undefined): void {
  state.registration = registration;
}

/**
 * Asks the server for a newer service worker. When one is found it installs and, with
 * `autoUpdate`, takes over and reloads the page by itself.
 */
export async function checkForUpdate(): Promise<UpdateCheck> {
  const registration = state.registration;
  if (!registration) return 'unavailable';
  await registration.update();
  return registration.installing || registration.waiting ? 'updating' : 'latest';
}

/**
 * Drops the service worker and its cached app files, then reloads from the network. Progress and
 * settings live in IndexedDB and are kept. This works even when the update check cannot reach
 * the service worker script (a gated host such as an ngrok tunnel).
 */
export async function reloadFresh(target: Window = window): Promise<void> {
  const workers = await target.navigator.serviceWorker?.getRegistrations().catch(() => []);
  await Promise.all((workers ?? []).map((worker) => worker.unregister()));
  const names = (await target.caches?.keys().catch(() => [])) ?? [];
  await Promise.all(names.map((name) => target.caches.delete(name)));
  target.location.reload();
}
