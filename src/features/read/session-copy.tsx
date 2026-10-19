/**
 * Session copy in the immersion mode (M3): a context the read screen fills from the dial and the
 * learner's level, and `<SessionCopy>` for each label. Native (today's copy) until it loads.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { immersionMode } from '../../domain/immersion.ts';
import type { Repos } from '../../domain/repos.ts';
import { createLearnerView } from '../../domain/services/learner-profile.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { useServices } from '../../ui/services.tsx';
import styles from './read.module.css';
import { type CopyKey, type CopyMode, sessionLabel, sessionText } from './read-copy.ts';

export const CopyModeContext = createContext<CopyMode>('native');

async function modeOf(repos: Repos): Promise<CopyMode> {
  const { immersion } = await repos.settings.get();
  if (immersion && immersion !== 'auto') return immersion;
  return immersionMode(await createLearnerView(repos).getLearnerProfile(), 'auto');
}

/** The immersion mode for this session: the dial, or Auto from the learner's level (M1). */
export function useCopyMode(): CopyMode {
  const { repos } = useServices();
  const [mode, setMode] = useState<CopyMode>('native');
  useEffect(() => {
    let live = true;
    modeOf(repos)
      .then((next) => live && setMode(next))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [repos]);
  return mode;
}

/** A label's text for an attribute (placeholder), in the session's mode. */
export function useCopyText(key: CopyKey): string {
  return sessionText(useT(), key, useContext(CopyModeContext));
}

/** A session label: Japanese in Klee One, with the native label under it in Japanese mode. */
export function SessionCopy({ k }: { k: CopyKey }) {
  const label = sessionLabel(useT(), k, useContext(CopyModeContext));
  if (!label.ja) return <>{label.main}</>;
  return (
    <>
      <span lang="ja" className={styles.copyJa}>
        {label.main}
      </span>
      {label.after && <span> · {label.after}</span>}
      {label.sub && (
        <span className={styles.copySub} data-sub="">
          {label.sub}
        </span>
      )}
    </>
  );
}
