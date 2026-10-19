import { useEffect, useState } from 'react';
import type { SessionCard, Target } from '../../domain/session-types.ts';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import { useServices } from '../../ui/services.tsx';
import { loadWordTeaching, type WordTeaching } from './word-teaching.ts';

/** The teaching content for a target, once loaded (L1, L2). */
export function useTeaching(card: SessionCard, target: Target): WordTeaching | undefined {
  const { repos } = useServices();
  const { t, language } = useI18n();
  const [teaching, setTeaching] = useState<WordTeaching>();
  useEffect(() => {
    let live = true;
    void loadWordTeaching(repos, card, target, { t, language }).then(
      (loaded) => live && setTeaching(loaded),
    );
    return () => {
      live = false;
    };
  }, [repos, card, target, t, language]);
  return teaching;
}
