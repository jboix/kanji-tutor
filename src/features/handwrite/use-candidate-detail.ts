import { useEffect, useState } from 'react';
import type { Repos } from '../../domain/repos.ts';
import { kanjiDetail } from '../../domain/services/index.ts';
import type { Kanji } from '../../domain/types.ts';
import { useServices } from '../../ui/services.tsx';
import type { CandidateFacts } from './detail-text.ts';

const SHARED_SHOWN = 3;

/** The kanji of these that some word of yours contains (a derived reading with words). */
async function metOf(repos: Repos, kanji: readonly Kanji[]): Promise<string[]> {
  const rows = await Promise.all(kanji.map((k) => repos.kanjiReadings.byKanji(k.char)));
  return kanji.flatMap((k, i) =>
    (rows[i] ?? []).some((r) => r.wordIds.length > 0) ? [k.char] : [],
  );
}

const byFrequency = (a: Kanji, b: Kanji) => (a.freq ?? 9999) - (b.freq ?? 9999);

/** The component shared with the most kanji you have met, e.g. 寺 for 待 (持, 特). */
async function sharedOf(repos: Repos, kanji: Kanji): Promise<CandidateFacts['shared']> {
  const options = await Promise.all(
    kanji.components.map(async (component) => {
      const all = await repos.dictionary.kanjiByComponent(component);
      const others = all.filter((k) => k.char !== kanji.char).sort(byFrequency);
      return { component, with: (await metOf(repos, others)).slice(0, SHARED_SHOWN) };
    }),
  );
  const best = options.sort((a, b) => b.with.length - a.with.length)[0];
  return best && best.with.length > 0 ? best : undefined;
}

async function factsOf(repos: Repos, char: string): Promise<CandidateFacts | undefined> {
  const detail = await kanjiDetail(repos, char, Date.now());
  if (!detail) return undefined;
  const shared = await sharedOf(repos, detail.kanji);
  const facts: CandidateFacts = { kanji: detail.kanji, wordCount: detail.wordCount };
  if (shared) facts.shared = shared;
  return facts;
}

/** Dictionary facts and your words for the picked candidate; undefined while loading. */
export function useCandidateDetail(char: string): CandidateFacts | undefined {
  const { repos } = useServices();
  const [facts, setFacts] = useState<{ char: string; value: CandidateFacts | undefined }>();
  useEffect(() => {
    let live = true;
    void factsOf(repos, char).then((value) => live && setFacts({ char, value }));
    return () => {
      live = false;
    };
  }, [repos, char]);
  return facts?.char === char ? facts.value : undefined;
}
