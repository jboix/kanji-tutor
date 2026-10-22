import { useCallback, useEffect, useState } from 'react';
import {
  type ImportKnownResult,
  importKnown,
  type JlptList,
  type LearnedGroup,
  type LearnedKind,
  learnedGroups,
} from '../../domain/services/index.ts';
import { useServices } from '../../ui/services.tsx';

/** The groups of one kind; undefined while a new kind loads. `version` reloads in place. */
export function useLearnedGroups(kind: LearnedKind, version: number): LearnedGroup[] | undefined {
  const { repos } = useServices();
  const [loaded, setLoaded] = useState<{ kind: LearnedKind; groups: LearnedGroup[] }>();
  useEffect(() => {
    let live = true;
    void learnedGroups(repos, kind).then((groups) => {
      if (live && version >= 0) setLoaded({ kind, groups });
    });
    return () => {
      live = false;
    };
  }, [repos, kind, version]);
  return loaded?.kind === kind ? loaded.groups : undefined;
}

export type ApplyPhase =
  | { phase: 'idle' }
  | { phase: 'running'; list: JlptList }
  | { phase: 'done'; list: JlptList; result: ImportKnownResult }
  | { phase: 'failed' };

/** Applies a JLPT list again (P2): idempotent, never lowers a level. */
export function useApplyList(onDone: () => void): [ApplyPhase, (list: JlptList) => Promise<void>] {
  const { repos } = useServices();
  const [phase, setPhase] = useState<ApplyPhase>({ phase: 'idle' });
  const apply = useCallback(
    async (list: JlptList) => {
      setPhase({ phase: 'running', list });
      try {
        const result = await importKnown(repos, { lists: [list], now: Date.now() });
        setPhase({ phase: 'done', list, result });
        onDone();
      } catch {
        setPhase({ phase: 'failed' });
      }
    },
    [repos, onDone],
  );
  return [phase, apply];
}
