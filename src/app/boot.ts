import { registerSW } from 'virtual:pwa-register';
import { setRegistration } from '../ui/app-update.ts';
import { captureInstallPrompt } from '../ui/install-prompt.ts';
import type { Services } from '../ui/services.tsx';
import { applyTheme } from '../ui/theme.ts';

/** Asks the browser to keep IndexedDB through storage pressure (N5). */
async function requestPersistence(): Promise<void> {
  if (!navigator.storage?.persist) return;
  if (await navigator.storage.persisted()) return;
  await navigator.storage.persist();
}

/**
 * When a newer dictionary pack has been published, installs it in the background (online only).
 * A first install is left to onboarding.
 */
async function updatePacks(services: Services): Promise<void> {
  if (!navigator.onLine) return;
  const installed = await services.packs.installed();
  if (installed === undefined) return;
  const manifest = await services.packs.manifest();
  if (manifest.version !== installed) await services.packs.install(() => undefined);
}

/**
 * One-time startup: install prompt, theme, persistent storage and the offline service worker
 * (N1, N1b, N1e, N5). The install event can fire before the first paint, so it is caught first.
 */
export async function boot(services: Services): Promise<void> {
  captureInstallPrompt();
  const settings = await services.repos.settings.get();
  applyTheme(settings.theme);
  await requestPersistence().catch(() => undefined);
  if (import.meta.env.PROD) {
    registerSW({
      immediate: true,
      onRegisteredSW: (_url, registration) => setRegistration(registration),
    });
  }
  await updatePacks(services).catch(() => undefined);
}
