/**
 * The cloud-save server, from the build setting `VITE_SYNC_URL`, or null. No address is
 * built in: without one, the app offers no cloud saves (no Log in on the welcome, no /log-in), so
 * a fork that sets nothing works offline and never calls anyone's server. HTTPS only, except
 * localhost for development.
 */
export function syncServer(): string | null {
  const value = String(import.meta.env.VITE_SYNC_URL ?? '').trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.hostname === 'localhost' ? url.origin : null;
  } catch {
    return null;
  }
}
