import { useCallback, useEffect, useState } from 'react';
import type { PackProgress } from '../../domain/repos.ts';
import type { MessageKey, Translate } from '../../ui/i18n/types.ts';
import { useServices } from '../../ui/services.tsx';

export type InstallState =
  | { phase: 'checking' }
  | { phase: 'idle'; bytes?: number }
  | { phase: 'loading'; progress?: PackProgress }
  | { phase: 'done' }
  | { phase: 'error' };

const STAGE_LABEL = {
  words: 'onboarding.stageWords',
  kanji: 'onboarding.stageKanji',
  sentences: 'onboarding.stageSentences',
  grammar: 'onboarding.stageGrammar',
  clusters: 'onboarding.stageClusters',
  units: 'onboarding.stageUnits',
  glosses: 'onboarding.stageGlosses',
  translations: 'onboarding.stageTranslations',
} as const satisfies Record<Exclude<PackProgress['stage'], 'done'>, MessageKey>;

/** "Words 12,000 of 48,000". */
export function stageText(t: Translate, progress: PackProgress): string {
  if (progress.stage === 'done') return t('onboarding.dictionaryLoaded');
  const stage = t(STAGE_LABEL[progress.stage]);
  return t('onboarding.stage', { stage, loaded: progress.loaded, total: progress.total });
}

/** "3.8 MB". */
export function sizeText(t: Translate, bytes: number): string {
  return t('onboarding.sizeMb', { size: Math.round(bytes / 1e5) / 10 });
}

async function initialState(packs: ReturnType<typeof useServices>['packs']): Promise<InstallState> {
  try {
    if (await packs.installed()) return { phase: 'done' };
    const manifest = await packs.manifest();
    return { phase: 'idle', bytes: manifest.files.reduce((sum, f) => sum + f.bytes, 0) };
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
