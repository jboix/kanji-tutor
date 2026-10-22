import { useCallback, useEffect, useState } from 'react';
import type { Settings } from '../../domain/types.ts';
import { useServices } from '../../ui/services.tsx';

/** Persists a change and returns the new settings. */
export type PatchSettings = (patch: Partial<Settings>) => Promise<void>;

/** Current settings, a patch function that persists them, and a reload after an import. */
export function useSettings() {
  const { repos } = useServices();
  const [settings, setSettings] = useState<Settings>();
  const reload = useCallback(async () => {
    const fresh = await repos.settings.get();
    setSettings(fresh);
    return fresh;
  }, [repos]);
  useEffect(() => {
    void reload();
  }, [reload]);
  const patch: PatchSettings = useCallback(
    async (change) => setSettings(await repos.settings.patch(change)),
    [repos],
  );
  return { settings, patch, reload, replace: setSettings };
}
