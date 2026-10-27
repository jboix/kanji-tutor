/** Episodes (pure): the data, loaded on demand so it stays out of the app shell. */
import type { Episode } from './types.ts';

export type * from './types.ts';

let loading: Promise<ReadonlyMap<string, Episode>> | undefined;

/** Every unit's episode by unit id, loading their chunk once. */
export function loadEpisodes(): Promise<ReadonlyMap<string, Episode>> {
  if (!loading) {
    loading = import('./catalogue.ts').then(
      ({ EPISODES }) => new Map(EPISODES.map((episode) => [episode.unitId, episode])),
    );
    loading.catch(() => {
      loading = undefined;
    });
  }
  return loading;
}
