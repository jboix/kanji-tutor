import type { KanjiReaderDb } from './db.ts';

/** Runs one clean-up step; a browser without that storage (or that refuses it) is skipped. */
async function attempt(step: () => unknown): Promise<void> {
  try {
    await step();
  } catch {
    // Nothing to clear here, or the browser blocks it; the other steps still run.
  }
}

async function clearCaches(): Promise<void> {
  const names = await caches.keys();
  await Promise.all(names.map((name) => caches.delete(name)));
}

async function unregisterWorkers(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
}

/**
 * Deletes all local data: the IndexedDB database (progress, reviews, notes, captures, settings,
 * the API key, the AI cache and the dictionary packs), local and session storage, the offline
 * caches and the service worker. The next load starts at the welcome wizard.
 */
export async function eraseLocalData(db: KanjiReaderDb): Promise<void> {
  await db.delete();
  await attempt(() => localStorage.clear());
  await attempt(() => sessionStorage.clear());
  if (typeof caches !== 'undefined') await attempt(clearCaches);
  if ('serviceWorker' in navigator) await attempt(unregisterWorkers);
}
