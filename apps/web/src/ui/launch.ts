import { useEffect } from 'react';

/** How long the launch screen fades; it leaves the document after. */
const FADE_MS = 200;

/**
 * The launch screen stays at least this long from the page's start (U12): a quick database
 * open would otherwise flash it and the first screen's loading line, and the layout jitters.
 */
export const MIN_LAUNCH_MS = 600;

/**
 * Past the minimum, the launch screen also waits for the fonts the first screen asked for, so
 * it never fades onto a fallback font that then swaps to Klee One or Zen Kaku, but never
 * longer than this: a slow font then swaps in under the screen.
 */
export const FONT_WAIT_MS = 700;

/** Resolves when the document's fonts have loaded, or after `cap` ms, whichever comes first. */
function fontsOrCap(cap: number): Promise<void> {
  const capped = new Promise<void>((resolve) => setTimeout(resolve, cap));
  const fonts = typeof document.fonts === 'undefined' ? capped : document.fonts.ready;
  return Promise.race([fonts.then(() => undefined), capped]);
}

/**
 * Ends the launch screen of `index.html` (N1c) once a screen has mounted: it fades out and
 * leaves the document, so it covers the router's lazy chunks and the pack check, not just
 * React's first render. Every later call finds it gone and does nothing.
 */
export function endLaunch(): void {
  const launch = document.getElementById('launch');
  if (!launch || launch.dataset.done !== undefined) return;
  launch.dataset.done = 'pending';
  setTimeout(
    () => void fontsOrCap(FONT_WAIT_MS).then(() => fade(launch)),
    Math.max(0, MIN_LAUNCH_MS - performance.now()),
  );
}

function fade(launch: HTMLElement): void {
  launch.dataset.done = '';
  launch.setAttribute('aria-hidden', 'true');
  setTimeout(() => launch.remove(), FADE_MS);
}

/** The localStorage key index.html reads before the first paint; keep both in step. */
export const WELCOMED_KEY = 'kanji-tutor-welcomed';

/**
 * Mirrors "the welcome is done" for index.html: until it is, the launch screen is plain paper,
 * since the first screen is the welcome, which draws the icon itself.
 */
export function rememberWelcomed(done: boolean): void {
  try {
    if (done) localStorage.setItem(WELCOMED_KEY, '1');
    else localStorage.removeItem(WELCOMED_KEY);
  } catch {
    // Storage blocked: index.html then shows the icon, as before.
  }
}

/**
 * Removes the launch screen at once, with no minimum and no fade: for the first-run welcome
 *, whose own animation starts from the blank icon tile.
 */
export function dropLaunch(): void {
  document.getElementById('launch')?.remove();
}

/** Calls `endLaunch` when the calling screen mounts. */
export function useEndLaunch(): void {
  useEffect(endLaunch, []);
}
