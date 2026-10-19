import { useCallback, useEffect, useState } from 'react';
import type { LearnerCoverage } from '../../domain/learner-view.ts';
import {
  learnerCoverage,
  type UnitPath,
  type UnitView,
  unitPath,
  unitView,
} from '../../domain/services/index.ts';
import { useServices } from '../../ui/services.tsx';

/** Runs `load` (memoized by the caller) and keeps its result; undefined while loading. */
function useAsync<T>(load: () => Promise<T>): T | undefined {
  const [value, setValue] = useState<{ load: () => Promise<T>; value: T }>();
  useEffect(() => {
    let live = true;
    void load().then((result) => {
      if (live) setValue({ load, value: result });
    });
    return () => {
      live = false;
    };
  }, [load]);
  return value?.load === load ? value.value : undefined;
}

/** The lesson path (T4). */
export function useUnitPath(): UnitPath | undefined {
  const { repos } = useServices();
  return useAsync(useCallback(() => unitPath(repos, Date.now()), [repos]));
}

/** Words, kanji and grammar known per level (T4, reusing P3's counts). */
export function useCoverage(): LearnerCoverage | undefined {
  const { repos } = useServices();
  return useAsync(useCallback(() => learnerCoverage(repos), [repos]));
}

/** One unit's view as of `now`; a new `now` reloads it after a change. Null for an unknown id. */
export function useUnit(id: string, now: number): UnitView | null | undefined {
  const { repos } = useServices();
  const load = useCallback(async () => (await unitView(repos, id, now)) ?? null, [repos, id, now]);
  return useAsync(load);
}
