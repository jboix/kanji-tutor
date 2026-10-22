import { useEffect, useState } from 'react';
import { type KanjiDetail, kanjiDetail, recentKanji } from '../../domain/services/index.ts';
import type { Word } from '../../domain/types.ts';
import { useServices } from '../../ui/services.tsx';

type Loaded<T> = { state: 'loading' } | { state: 'ready'; value: T };

/** The kanji page data for one character; `undefined` value when KANJIDIC lacks it. */
export function useKanjiDetail(char: string): Loaded<KanjiDetail | undefined> {
  const { repos } = useServices();
  const [result, setResult] = useState<Loaded<KanjiDetail | undefined>>({ state: 'loading' });
  useEffect(() => {
    let live = true;
    setResult({ state: 'loading' });
    void kanjiDetail(repos, char, Date.now()).then((value) => {
      if (live) setResult({ state: 'ready', value });
    });
    return () => {
      live = false;
    };
  }, [repos, char]);
  return result;
}

/** Kanji of this week's and recently answered words. */
export function useRecentKanji(): string[] {
  const { repos } = useServices();
  const [chars, setChars] = useState<string[]>([]);
  useEffect(() => {
    void recentKanji(repos, Date.now()).then(setChars);
  }, [repos]);
  return chars;
}

/** Kana → word suggestions as the query is typed (I1); empty for kanji or empty queries. */
export function useSuggestions(query: string, enabled: boolean): Word[] {
  const { lang } = useServices();
  const [words, setWords] = useState<Word[]>([]);
  useEffect(() => {
    let live = true;
    if (!enabled || query.trim() === '') {
      setWords([]);
      return;
    }
    void lang.suggestWords(query, 8).then((found) => {
      if (live) setWords(found);
    });
    return () => {
      live = false;
    };
  }, [lang, query, enabled]);
  return words;
}
