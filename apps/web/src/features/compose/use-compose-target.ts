import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { type ComposeTarget, composeTarget } from '../../domain/services/index.ts';
import { useServices } from '../../ui/services.tsx';

export type TargetState =
  | { status: 'loading' }
  /** No grammar points yet: offer to add one, tagged with the current lesson. */
  | { status: 'none'; lesson: string }
  | { status: 'ready'; target: ComposeTarget };

/** The grammar point to write with: `?grammar=<id>`, else the next one not used yet. */
export function useComposeTarget(): [TargetState, () => Promise<void>] {
  const { repos } = useServices();
  const [params] = useSearchParams();
  const grammarId = params.get('grammar') ?? undefined;
  const [state, setState] = useState<TargetState>({ status: 'loading' });
  const load = useCallback(async () => {
    const target = await composeTarget(repos, grammarId);
    const lesson = (await repos.settings.get()).currentLesson ?? '';
    setState(target ? { status: 'ready', target } : { status: 'none', lesson });
  }, [repos, grammarId]);
  useEffect(() => {
    void load();
  }, [load]);
  return [state, load];
}
