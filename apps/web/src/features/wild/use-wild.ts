import { useCallback, useEffect, useState } from 'react';
import type { AiClient, SignReading } from '../../ai/types.ts';
import { addWildWords, type WildView, wildView } from '../../domain/services/index.ts';
import type { PreparedImage } from '../../ui/image.ts';
import { useServices } from '../../ui/services.tsx';
import { useAiResult } from '../../ui/use-ai-result.ts';

/** The tutor's reading of the photo, once asked: one request, cached on the photo (A15). */
export function useSignReading(client: AiClient, photo: PreparedImage) {
  const run = useCallback(() => client.readSign({ image: photo.media }), [client, photo]);
  return useAiResult(run);
}

/** The reading against what the learner knows, read again after words are added. */
export function useWildView(reading: SignReading | undefined) {
  const { repos } = useServices();
  const [view, setView] = useState<WildView>();
  const [round, setRound] = useState(0);
  useEffect(() => {
    if (!reading || round < 0) return;
    let live = true;
    void wildView(repos, reading).then((next) => live && setView(next));
    return () => {
      live = false;
    };
  }, [repos, reading, round]);
  const add = useCallback(
    async (wordIds: readonly string[]) => {
      await addWildWords(repos, wordIds, Date.now());
      setRound((n) => n + 1);
    },
    [repos],
  );
  return { view, add };
}
