/**
 * Install help (N1b). The browser's `beforeinstallprompt` event fires once, early, so boot
 * captures it here; Settings and the welcome read it through `useInstallWay`.
 */
import { useSyncExternalStore } from 'react';

/** The non-standard event Chromium browsers fire when the app can be installed. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * How this device installs the app: already installed (running standalone), the browser's own
 * prompt, the iOS Share sheet, or the browser menu.
 */
export type InstallWay = 'installed' | 'prompt' | 'ios' | 'menu';

const state: {
  deferred?: InstallPromptEvent | undefined;
  installed: boolean;
  captured?: Window | undefined;
} = {
  installed: false,
};
const listeners = new Set<() => void>();
const notify = () => {
  for (const listener of listeners) listener();
};

/** Starts listening for the install events. Called once at boot, before the first paint. */
export function captureInstallPrompt(target: Window = window): void {
  if (state.captured === target) return;
  state.captured = target;
  target.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    state.deferred = event as InstallPromptEvent;
    notify();
  });
  target.addEventListener('appinstalled', () => {
    state.deferred = undefined;
    state.installed = true;
    notify();
  });
}

/** Whether the app runs from the home screen rather than in a browser tab. */
export function isStandalone(target: Window = window): boolean {
  const nav = target.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  return target.matchMedia?.('(display-mode: standalone)').matches === true;
}

/** iPhone, iPod or iPad, including iPadOS, which reports itself as a Mac with touch. */
export function isIos(nav: Navigator = navigator): boolean {
  if (/iPhone|iPad|iPod/.test(nav.userAgent)) return true;
  return /Macintosh/.test(nav.userAgent) && nav.maxTouchPoints > 1;
}

export function installWay(target: Window = window): InstallWay {
  if (state.installed || isStandalone(target)) return 'installed';
  if (state.deferred) return 'prompt';
  return isIos(target.navigator) ? 'ios' : 'menu';
}

/** Shows the browser's install dialog. The event works once, so it is dropped either way. */
export async function promptInstall(): Promise<boolean> {
  const event = state.deferred;
  if (!event) return false;
  state.deferred = undefined;
  await event.prompt();
  const { outcome } = await event.userChoice;
  state.installed = outcome === 'accepted';
  notify();
  return state.installed;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The current install way, updated when the prompt arrives or the app gets installed. */
export function useInstallWay(): InstallWay {
  return useSyncExternalStore(subscribe, () => installWay());
}

/** Test helper: forgets any captured event, as on a fresh page load. */
export function resetInstallPrompt(): void {
  state.deferred = undefined;
  state.installed = false;
  state.captured = undefined;
}
