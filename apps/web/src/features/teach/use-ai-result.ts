import { useCallback, useEffect, useState } from 'react';
import type { AiError, Result } from '../../ai/types.ts';

/** Where an AI call stands; `offLanguage` is kept so the reply can be marked (D35). */
export type AiResult<T> =
  | { status: 'loading' }
  | { status: 'done'; value: T; offLanguage: boolean }
  | { status: 'error'; error: AiError };

function settle<T>(result: Result<T>): AiResult<T> {
  if (!result.ok) return { status: 'error', error: result.error };
  return { status: 'done', value: result.value, offLanguage: result.offLanguage === true };
}

/**
 * Runs `run` on mount and whenever it changes (memoise it); `undefined` waits. A reply after
 * unmount or after a newer call is ignored. `retry` runs it again (after a rate limit, A14).
 */
export function useAiResult<T>(
  run: (() => Promise<Result<T>>) | undefined,
): AiResult<T> & { retry: () => void } {
  const [state, setState] = useState<AiResult<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  useEffect(() => {
    if (!run || attempt < 0) return;
    let live = true;
    setState({ status: 'loading' });
    run().then(
      (result) => live && setState(settle(result)),
      (error: unknown) =>
        live &&
        setState({
          status: 'error',
          error: { kind: 'provider', message: error instanceof Error ? error.message : '' },
        }),
    );
    return () => {
      live = false;
    };
  }, [run, attempt]);
  return { ...state, retry };
}
