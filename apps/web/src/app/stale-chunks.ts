/** When the last reload for a missing chunk was this recent, the error is real: show it. */
export const RELOAD_GUARD_MS = 10_000;
const KEY = 'stale-chunk-reload';

/** Chrome, Safari and Firefox word a failed dynamic import differently. */
const STALE = /dynamically imported module|Importing a module script failed|Unable to preload CSS/;

/** A screen chunk that failed to load, as after a new build replaced the old hashed files. */
export function isStaleChunk(error: unknown): boolean {
  return error instanceof Error && STALE.test(error.message);
}

function lastReload(): number {
  try {
    return Number(sessionStorage.getItem(KEY) ?? 0);
  } catch {
    return 0;
  }
}

function markReload(now: number): void {
  try {
    sessionStorage.setItem(KEY, String(now));
  } catch {
    // Without storage the guard can't hold, but one reload is still better than the error.
  }
}

/**
 * Reloads the page to pick up the new build, unless that already happened in the last few
 * seconds; returns whether it reloaded.
 */
export function reloadOnce(reload: () => void = () => location.reload()): boolean {
  const now = Date.now();
  if (now - lastReload() < RELOAD_GUARD_MS) return false;
  markReload(now);
  reload();
  return true;
}
