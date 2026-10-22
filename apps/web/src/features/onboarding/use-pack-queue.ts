import { useEffect } from 'react';
import type { PackLanguage } from '../../domain/repos.ts';
import type { UiLanguage } from '../../ui/languages.ts';
import { type LanguagePackState, useLanguagePack } from '../../ui/use-language-pack.ts';
import type { InstallState } from './use-pack-install.ts';

/** The downloads the wizard runs, one after the other (D136). */
export interface PackQueue {
  /** The meanings in the chosen language, when it is not English. */
  language: PackLanguage | undefined;
  pack: LanguagePackState;
  retryPack: () => void;
}

const packOf = (language: UiLanguage): PackLanguage | undefined =>
  language === 'en' ? undefined : language;

/**
 * The meanings and translations in the chosen language (N9), queued after the dictionary: once
 * it is in and the language is saved (Next on the language step), a missing pack installs on its
 * own, with no button to find and nothing announced (D136).
 */
export function usePackQueue(language: UiLanguage, install: InstallState): PackQueue {
  const [pack, installPack] = useLanguagePack(language, install.phase === 'done');
  useEffect(() => {
    if (pack.phase === 'idle') void installPack();
  }, [pack.phase, installPack]);
  return { language: packOf(language), pack, retryPack: () => void installPack() };
}
