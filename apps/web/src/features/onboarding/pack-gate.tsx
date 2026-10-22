import { type ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { paths } from '../../ui/paths.ts';
import type { Services } from '../../ui/services.tsx';
import { useServices } from '../../ui/services.tsx';

/** Ready when the packs are in IndexedDB and the welcome wizard is done. */
async function isReady({ packs, repos }: Services): Promise<boolean> {
  const [version, settings] = await Promise.all([packs.installed(), repos.settings.get()]);
  return version !== undefined && settings.onboarded;
}

/**
 * Renders `children` once the dictionary packs are in IndexedDB and the welcome wizard is
 * finished; otherwise sends the user to the wizard (P5). Renders nothing while it checks.
 */
export function PackGate({ children }: { children: ReactNode }) {
  const services = useServices();
  const [ready, setReady] = useState<boolean>();
  useEffect(() => {
    let live = true;
    isReady(services).then(
      (value) => live && setReady(value),
      () => live && setReady(false),
    );
    return () => {
      live = false;
    };
  }, [services]);
  if (ready === undefined) return null;
  return ready ? children : <Navigate to={paths.onboarding} replace />;
}
