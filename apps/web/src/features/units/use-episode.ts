import { useEffect, useState } from 'react';
import type { Episode } from '../../domain/episodes/index.ts';
import { unitEpisode } from '../../domain/services/index.ts';

/** The unit's episode: undefined while it loads, null when the unit has none. */
export function useEpisode(unitId: string): Episode | null | undefined {
  const [episode, setEpisode] = useState<{ id: string; value: Episode | null }>();
  useEffect(() => {
    let live = true;
    unitEpisode(unitId).then(
      (found) => live && setEpisode({ id: unitId, value: found ?? null }),
      () => live && setEpisode({ id: unitId, value: null }),
    );
    return () => {
      live = false;
    };
  }, [unitId]);
  return episode?.id === unitId ? episode.value : undefined;
}
