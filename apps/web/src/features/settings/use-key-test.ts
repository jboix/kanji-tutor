import { useCallback, useState } from 'react';
import { testKey } from '../../ai/index.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { testKeyMessage, thrownMessage } from './key-messages.ts';

export type KeyTestState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'done'; ok: boolean; message: string };

async function runTest(key: string, model: string, t: Translate): Promise<KeyTestState> {
  try {
    const result = await testKey(key, model);
    return { status: 'done', ok: result.ok, message: testKeyMessage(result, key, t) };
  } catch (error) {
    return { status: 'done', ok: false, message: thrownMessage(error, key, t) };
  }
}

/**
 * "Test key": the one real AI call outside a task (N3). Offline is caught before calling. `run`
 * resolves true when the key works.
 */
export function useKeyTest(model: string) {
  const t = useT();
  const [state, setState] = useState<KeyTestState>({ status: 'idle' });
  const run = useCallback(
    async (key: string) => {
      if (!navigator.onLine) {
        setState({ status: 'done', ok: false, message: t('settingsAi.testOffline') });
        return false;
      }
      setState({ status: 'running' });
      const result = await runTest(key, model, t);
      setState(result);
      return result.status === 'done' && result.ok;
    },
    [model, t],
  );
  const reset = useCallback(() => setState({ status: 'idle' }), []);
  return { state, run, reset };
}
