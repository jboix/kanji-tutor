import { useEffect, useState } from 'react';
import { type GrammarDialogues, loadDialogues } from '../domain/dialogues/index.ts';

/**
 * A grammar point's dialogues, loading their chunk the first time it is asked for: undefined
 * while it loads, and for a point without dialogues.
 */
export function useDialogues(grammarId: string): GrammarDialogues | undefined {
  const [found, setFound] = useState<{ id: string; set: GrammarDialogues | undefined }>();
  useEffect(() => {
    let live = true;
    loadDialogues().then(
      (all) => live && setFound({ id: grammarId, set: all.get(grammarId) }),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [grammarId]);
  return found?.id === grammarId ? found.set : undefined;
}
