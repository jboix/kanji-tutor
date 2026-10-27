import { useCallback, useEffect, useState } from 'react';
import type { AiClient } from '../../ai/types.ts';
import {
  addWildWords,
  saveWildPhoto,
  type WildPhoto,
  type WildReading,
  type WildView,
  wildPhotos,
  wildView,
} from '../../domain/services/index.ts';
import type { PreparedImage } from '../../ui/image.ts';
import { useServices } from '../../ui/services.tsx';
import { useAiResult } from '../../ui/use-ai-result.ts';

/**
 * The tutor's reading of the photo, once asked: one request, cached on the photo (A15). A reading
 * is kept with its photo under `id`, so Your photos can open it again without asking.
 */
export function useSignReading(client: AiClient, photo: PreparedImage, id: string) {
  const { repos } = useServices();
  const run = useCallback(async () => {
    const result = await client.readSign({ image: photo.media });
    if (result.ok) {
      const saved = { id, photo: photo.blob, reading: result.value, now: Date.now() };
      // A full disk keeps the photo out of Your photos, never the reading off the screen.
      await saveWildPhoto(repos, saved).catch(() => undefined);
    }
    return result;
  }, [client, photo, id, repos]);
  return useAiResult(run);
}

/** The reading against what the learner knows, read again after words are added. */
export function useWildView(reading: WildReading | undefined) {
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

/** The saved photos, newest first; undefined while they load. */
export function useWildPhotos(): WildPhoto[] | undefined {
  const { repos } = useServices();
  const [photos, setPhotos] = useState<WildPhoto[]>();
  useEffect(() => {
    let live = true;
    void wildPhotos(repos).then((rows) => live && setPhotos(rows));
    return () => {
      live = false;
    };
  }, [repos]);
  return photos;
}

/** One saved photo: undefined while loading, null when there is none. */
export function useWildPhoto(id: string): WildPhoto | null | undefined {
  const { repos } = useServices();
  const [photo, setPhoto] = useState<WildPhoto | null>();
  useEffect(() => {
    let live = true;
    void repos.wildPhotos.get(id).then((row) => live && setPhoto(row ?? null));
    return () => {
      live = false;
    };
  }, [repos, id]);
  return photo;
}
