import { useEffect, useState } from 'react';
import type { LevelCoverage } from '../../domain/learner-view.ts';
import { learnerCoverage, type UnitView, unitPath } from '../../domain/services/index.ts';
import { useServices } from '../../ui/services.tsx';

/** Words, kanji and grammar points known, over every level. */
export interface KnownCounts {
  words: number;
  kanji: number;
  grammar: number;
}

/** Home's own reads: what the learner knows, and the units around the current one. */
export interface HomeFacts {
  known: KnownCounts;
  /** The current unit and the next two on the path. */
  units: UnitView[];
  currentId?: string | undefined;
}

const sum = (levels: readonly LevelCoverage[]) => levels.reduce((n, l) => n + l.known, 0);

async function loadHome(repos: ReturnType<typeof useServices>['repos'], now: number) {
  const [coverage, path] = await Promise.all([learnerCoverage(repos), unitPath(repos, now)]);
  const at = Math.max(
    0,
    path.units.findIndex((u) => u.unit.id === path.current?.unit.id),
  );
  const facts: HomeFacts = {
    known: {
      words: sum(coverage.words),
      kanji: sum(coverage.kanji),
      grammar: sum(coverage.grammar),
    },
    units: path.units.slice(at, at + 3),
  };
  if (path.current) facts.currentId = path.current.unit.id;
  return facts;
}

/** Read after Home shows, so the rest of the screen never waits for it. */
export function useHome(now: number): HomeFacts | undefined {
  const { repos } = useServices();
  const [facts, setFacts] = useState<HomeFacts>();
  useEffect(() => {
    let live = true;
    loadHome(repos, now)
      .then((next) => live && setFacts(next))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [repos, now]);
  return facts;
}
