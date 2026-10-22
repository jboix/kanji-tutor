import { useCallback, useState } from 'react';
import type { CloudReason, CloudResult } from '../domain/cloud.ts';

/**
 * One cloud call at a time from a screen: `busy` while it runs, and the reason it failed, for
 * the message under the form.
 */
export function useCloudAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<CloudReason | undefined>(undefined);
  const run = useCallback(
    async <T>(call: () => Promise<CloudResult<T>>, done?: (value: T) => void): Promise<boolean> => {
      setBusy(true);
      setError(undefined);
      try {
        const result = await call();
        if (!result.ok) setError(result.error);
        else done?.(result.value);
        return result.ok;
      } finally {
        setBusy(false);
      }
    },
    [],
  );
  return { busy, error, run, clear: () => setError(undefined) };
}

/**
 * After a device brought its progress from the server, the app starts again on it, so every
 * screen and setting reads the new data.
 */
export function reopenApp(): void {
  window.location.replace(import.meta.env.BASE_URL);
}
