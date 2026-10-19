import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AiError, Result } from '../../ai/types.ts';
import { useNoSpoil } from './no-spoil.tsx';

/** Where an AI call stands. `idle` until the learner asks (A13). */
export type AiState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  /** `cached`: the answer came from the local cache, with no call (A15, shown as "saved answer"). */
  | { status: 'done'; value: T; cached?: boolean }
  | { status: 'error'; error: AiError };

function settle<T>(result: Result<T>): AiState<T> {
  return result.ok
    ? { status: 'done', value: result.value, cached: result.cached }
    : { status: 'error', error: result.error };
}

function thrown(error: unknown): AiState<never> {
  // An empty message reads as "the tutor did not answer" in the learner's language.
  const message = error instanceof Error ? error.message : '';
  return { status: 'error', error: { kind: 'provider', message } };
}

type Start<T> = (run: () => Promise<Result<T>>) => void;

/**
 * A call started on demand by an `AiAction` (a button, a chip, a question, A18). Only the latest
 * call's reply is kept. Under a `NoSpoilProvider`, the answer shown has every hidden reading
 * removed (L3, D57). A cached answer comes back from the same call, marked `cached` (A15).
 */
export function useAiState<T>(): [AiState<T>, Start<T>] {
  const [state, setState] = useState<AiState<T>>({ status: 'idle' });
  const latest = useRef(0);
  useEffect(
    () => () => {
      latest.current = -1;
    },
    [],
  );
  const start = useCallback((run: () => Promise<Result<T>>) => {
    const call = latest.current + 1;
    latest.current = call;
    setState({ status: 'loading' });
    run().then(
      (result) => latest.current === call && setState(settle(result)),
      (error: unknown) => latest.current === call && setState(thrown(error)),
    );
  }, []);
  const { clean } = useNoSpoil();
  const shown = useMemo<AiState<T>>(
    () => (state.status === 'done' ? { ...state, value: clean(state.value) } : state),
    [state, clean],
  );
  return [shown, start];
}
