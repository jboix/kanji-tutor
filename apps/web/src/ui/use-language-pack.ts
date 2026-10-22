/** Whether a language's pack (glosses and translations, N9) is installed, and installing it. */
import { useCallback, useEffect, useState } from 'react';
import type { PackLanguage, PackLoader, PackProgress } from '../domain/repos.ts';
import type { UiLanguage } from './languages.ts';
import { useServices } from './services.tsx';

export type LanguagePackState =
  /** English, or a loader or manifest without this language: nothing to offer. */
  | { phase: 'none' }
  | { phase: 'installed' }
  | { phase: 'idle'; bytes: number }
  | { phase: 'loading'; progress?: PackProgress }
  | { phase: 'done' }
  | { phase: 'error' };

async function stateOf(packs: PackLoader, language: PackLanguage): Promise<LanguagePackState> {
  // Before the dictionary is in, installing a language would start the whole download.
  if (!packs.installLanguage || !(await packs.installed())) return { phase: 'none' };
  if ((await packs.installedLanguages?.())?.includes(language)) return { phase: 'installed' };
  const files = (await packs.manifest()).languages?.[language];
  if (!files) return { phase: 'none' };
  return { phase: 'idle', bytes: files.reduce((sum, file) => sum + file.bytes, 0) };
}

const isPack = (language: UiLanguage): language is PackLanguage => language !== 'en';

/**
 * The pack state of `language` and a function that installs it with progress. `ready` re-checks
 * it, e.g. once the wizard's dictionary download is done.
 */
export function useLanguagePack(
  language: UiLanguage,
  ready = true,
): [LanguagePackState, () => Promise<void>] {
  const { packs } = useServices();
  const [state, setState] = useState<LanguagePackState>({ phase: 'none' });
  useEffect(() => {
    let live = true;
    setState({ phase: 'none' });
    if (!isPack(language) || !ready) return;
    stateOf(packs, language)
      .then((next) => live && setState(next))
      .catch(() => live && setState({ phase: 'none' }));
    return () => {
      live = false;
    };
  }, [packs, language, ready]);
  const install = useCallback(async () => {
    if (!isPack(language) || !packs.installLanguage) return;
    setState({ phase: 'loading' });
    try {
      await packs.installLanguage(language, (progress) => setState({ phase: 'loading', progress }));
      setState({ phase: 'done' });
    } catch {
      setState({ phase: 'error' });
    }
  }, [packs, language]);
  return [state, install];
}
