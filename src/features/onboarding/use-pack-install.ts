import { useCallback, useEffect, useState } from 'react';
import type { PackProgress } from '../../domain/repos.ts';
import { useServices } from '../../ui/services.tsx';

export type InstallState =
  | { phase: 'checking' }
  | { phase: 'idle' }
  | { phase: 'loading'; progress?: PackProgress }
  | { phase: 'done' }
  | { phase: 'error' };

async function initialState(packs: ReturnType<typeof useServices>['packs']): Promise<InstallState> {
  try {
    return (await packs.installed()) ? { phase: 'done' } : { phase: 'idle' };
  } catch {
    return { phase: 'idle' };
  }
}

/** Whether the packs are installed, and a function that installs them with progress. */
export function usePackInstall(): [InstallState, () => Promise<boolean>] {
  const { packs } = useServices();
  const [state, setState] = useState<InstallState>({ phase: 'checking' });
  useEffect(() => {
    let live = true;
    void initialState(packs).then((next) => live && setState(next));
    return () => {
      live = false;
    };
  }, [packs]);
  const install = useCallback(async () => {
    setState({ phase: 'loading' });
    try {
      await packs.install((progress) => setState({ phase: 'loading', progress }));
      setState({ phase: 'done' });
      return true;
    } catch {
      setState({ phase: 'error' });
      return false;
    }
  }, [packs]);
  return [state, install];
}
