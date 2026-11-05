import { useEffect, useState } from 'react';
import { type KanjiDetail, kanjiDetail } from '../../domain/services/index.ts';
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
