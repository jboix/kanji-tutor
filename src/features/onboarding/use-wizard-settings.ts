import { useCallback, useEffect, useState } from 'react';
import type { Settings } from '../../domain/types.ts';
import { useServices } from '../../ui/services.tsx';

/** Persists a change; the wizard re-renders with the new settings. */
export type PatchSettings = (patch: Partial<Settings>) => Promise<void>;

/** Settings for the wizard: loaded once, patched step by step, reloaded after an import. */
export function useWizardSettings() {
  const { repos } = useServices();
  const [settings, setSettings] = useState<Settings>();
  const reload = useCallback(async () => setSettings(await repos.settings.get()), [repos]);
  useEffect(() => {
    void reload();
  }, [reload]);
  const patch: PatchSettings = useCallback(
    async (change) => setSettings(await repos.settings.patch(change)),
    [repos],
  );
  return { settings, patch, reload };
}
