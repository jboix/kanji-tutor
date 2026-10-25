/**
 * Which build is running, and a way to get the newest one (N1e). Boot hands over the service
 * worker registration and, when a new version has downloaded, a way to apply it: Home and
 * Settings → About offer it, and nothing reloads until the learner says so.
 */
import { useSyncExternalStore } from 'react';

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
 * Asks the server for a newer service worker. When one is found it downloads, then waits:
 * `offerUpdate` puts it on Home.
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

/**
 * The waiting version reloads a page its predecessor controlled when it takes over. A page no
 * worker controls (the first visit) hears no takeover: it reloads once the new one is active,
 * or at once when the browser already activated it, as nothing held it back.
 */
export function reloadWhenActive(target: Window = window): void {
  if (target.navigator.serviceWorker?.controller) return;
  const waiting = state.registration?.waiting;
  if (!waiting) {
    target.location.reload();
    return;
  }
  waiting.addEventListener('statechange', () => {
    if (waiting.state === 'activated') target.location.reload();
  });
}

const HOUR_MS = 3_600_000;

/** Looks for a new version when the app comes back on screen, at most once an hour. */
export function watchForUpdates(target: Document = document, now = Date.now): void {
  let last = now();
  target.addEventListener('visibilitychange', () => {
    if (target.visibilityState !== 'visible' || now() - last < HOUR_MS) return;
    last = now();
    void checkForUpdate().catch(() => undefined);
  });
}

/** The version waiting to be applied, as its `version.json` describes it. */
export interface NewVersion {
  /** Unknown when `version.json` could not be read. */
  version?: string | undefined;
  /** Up to three lines on what is new. */
  notes: readonly string[];
}

export type AppUpdate =
  | { status: 'none' }
  | { status: 'ready'; next: NewVersion }
  | { status: 'updating'; next: NewVersion };

const NONE: AppUpdate = { status: 'none' };
const noUpdate = async (): Promise<void> => undefined;
const store: { update: AppUpdate; apply: () => Promise<void>; listeners: Set<() => void> } = {
  update: NONE,
  apply: noUpdate,
  listeners: new Set(),
};

function setUpdate(update: AppUpdate): void {
  store.update = update;
  for (const listener of store.listeners) listener();
}

function subscribe(listener: () => void): () => void {
  store.listeners.add(listener);
  return () => store.listeners.delete(listener);
}

/** Reads `version.json` from the server; an empty description when it cannot. */
export async function fetchNewVersion(
  base: string,
  load: (url: string, init: RequestInit) => Promise<Response> = fetch,
): Promise<NewVersion> {
  try {
    const response = await load(`${base}version.json`, { cache: 'no-store' });
    const data = (await response.json()) as { version?: unknown; notes?: unknown };
    const notes = Array.isArray(data.notes) ? data.notes.filter((n) => typeof n === 'string') : [];
    return { version: typeof data.version === 'string' ? data.version : undefined, notes };
  } catch {
    return { notes: [] };
  }
}

/** Called by boot when a new version has downloaded; `apply` switches to it and reloads. */
export async function offerUpdate(
  apply: () => Promise<void>,
  describe: () => Promise<NewVersion> = () => fetchNewVersion(import.meta.env.BASE_URL),
): Promise<void> {
  store.apply = apply;
  setUpdate({ status: 'ready', next: await describe() });
}

/** Update now: the waiting version takes over and the page reloads by itself. */
export async function applyUpdate(): Promise<void> {
  if (store.update.status !== 'ready') return;
  setUpdate({ status: 'updating', next: store.update.next });
  await store.apply();
}

/** The update on offer, if any. */
export function useAppUpdate(): AppUpdate {
  return useSyncExternalStore(subscribe, () => store.update);
}

const DISMISSED_KEY = 'kanji-reader:update-dismissed';
const dismissed = { value: undefined as string | undefined, listeners: new Set<() => void>() };

/** For tests: no update on offer, nothing dismissed. */
export function resetAppUpdate(): void {
  store.apply = noUpdate;
  dismissed.value = undefined;
  globalThis.localStorage?.removeItem(DISMISSED_KEY);
  setUpdate(NONE);
}

function readDismissed(): string | undefined {
  try {
    return globalThis.localStorage?.getItem(DISMISSED_KEY) ?? undefined;
  } catch {
    return dismissed.value;
  }
}

/** The key a dismissal is remembered under: the version, or one shared by unknown ones. */
const dismissKey = (next: NewVersion) => next.version ?? 'unknown';

/** Later: Home stops offering this version; a newer one shows again. Settings keeps it. */
export function dismissUpdate(next: NewVersion): void {
  dismissed.value = dismissKey(next);
  try {
    globalThis.localStorage?.setItem(DISMISSED_KEY, dismissed.value);
  } catch {
    // Storage may be blocked; the dismissal still holds for this run.
  }
  for (const listener of dismissed.listeners) listener();
}

function subscribeDismissed(listener: () => void): () => void {
  dismissed.listeners.add(listener);
  return () => dismissed.listeners.delete(listener);
}

/** True when the learner put this version off with Later. */
export function useUpdateDismissed(next: NewVersion | undefined): boolean {
  const key = useSyncExternalStore(subscribeDismissed, () => dismissed.value ?? readDismissed());
  return next !== undefined && key === dismissKey(next);
}
