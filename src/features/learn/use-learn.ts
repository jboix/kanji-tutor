import { useEffect, useState } from 'react';
import { recentKanji, unitPath } from '../../domain/services/index.ts';
import type { Word } from '../../domain/types.ts';
import { useServices } from '../../ui/services.tsx';

/** The tiles' detail lines (IA4): where the learner is on the path, and this week's kanji. */
export interface LearnFacts {
  /** The current unit's place among its level's units. */
  unit?: { order: number; of: number; level: number };
  kanjiThisWeek: number;
}

async function loadFacts(repos: ReturnType<typeof useServices>['repos'], now: number) {
  const [path, kanji] = await Promise.all([unitPath(repos, now), recentKanji(repos, now)]);
  const facts: LearnFacts = { kanjiThisWeek: kanji.length };
  const current = path.current;
  if (current) {
    const level = path.units.filter((u) => u.unit.level === current.unit.level);
    const order = level.findIndex((u) => u.unit.id === current.unit.id) + 1;
    facts.unit = { order, of: level.length, level: current.unit.level };
  }
  return facts;
}

/** Read after the hub shows, so the tiles never wait for it. */
export function useLearnFacts(): LearnFacts | undefined {
  const { repos } = useServices();
  const [facts, setFacts] = useState<LearnFacts>();
  useEffect(() => {
    let live = true;
    loadFacts(repos, Date.now())
      .then((next) => live && setFacts(next))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [repos]);
  return facts;
}

/** Kana → word suggestions as the query is typed (I1); none for kanji or an empty query. */
export function useWordSuggestions(query: string, enabled: boolean): Word[] {
  const { lang } = useServices();
  const [words, setWords] = useState<Word[]>([]);
  useEffect(() => {
    let live = true;
    if (!enabled || query.trim() === '') {
      setWords([]);
      return;
    }
    void lang.suggestWords(query, 6).then((found) => {
      if (live) setWords(found);
    });
    return () => {
      live = false;
    };
  }, [lang, query, enabled]);
  return words;
}
