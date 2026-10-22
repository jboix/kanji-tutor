import { useCallback, useState } from 'react';
import type { AiClient, AiError, AssessLevelInput, LevelAssessment } from '../../ai/types.ts';

export type Assessment =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; value: LevelAssessment }
  | { status: 'error'; error: AiError };

/**
 * "Ask the tutor to assess" (A11, A13): one assessLevel call per press of its `AiAction`, never
 * on its own; `peek` finds an assessment already made for these answers (A18).
 */
export function useAssessment(input: AssessLevelInput) {
  const [state, setState] = useState<Assessment>({ status: 'idle' });
  const peek = useCallback((client: AiClient) => client.peek('assessLevel', input), [input]);
  const ask = useCallback(
    (client: AiClient) => {
      setState({ status: 'loading' });
      client.assessLevel(input).then(
        (result) =>
          setState(
            result.ok
              ? { status: 'done', value: result.value }
              : { status: 'error', error: result.error },
          ),
        (error: unknown) =>
          setState({
            status: 'error',
            error: {
              kind: 'provider',
              message: error instanceof Error ? error.message : '',
            },
          }),
      );
    },
    [input],
  );
  return { state, ask, peek };
}
