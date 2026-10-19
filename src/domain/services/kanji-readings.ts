import { hasKanji } from '../kana.ts';
import { deriveKanjiReadings, type KnownWord } from '../knowledge.ts';
import type { Repos } from '../repos.ts';
import type { Item, Kanji, KanjiReading, Word } from '../types.ts';

/** Distinct kanji of a word's written forms. */
export function kanjiOf(word: Word): string[] {
  return [...new Set(word.forms.flatMap((form) => [...form].filter(hasKanji)))].filter(
    (char) => char !== '々',
  );
}

async function knownWords(repos: Repos, items: readonly Item[]): Promise<KnownWord[]> {
  const words = await repos.dictionary.words(items.map((item) => item.ref));
  return items.flatMap((item, i) => {
    const word = words[i];
    return word ? [{ word, level: item.level }] : [];
  });
}

async function kanjiMap(repos: Repos, words: readonly KnownWord[]) {
  const chars = [...new Set(words.flatMap((known) => kanjiOf(known.word)))];
  const entries = await repos.dictionary.kanjiMany(chars);
  return new Map(
    entries.flatMap((entry): [string, Kanji][] => (entry ? [[entry.char, entry]] : [])),
  );
}

async function derive(repos: Repos, items: readonly Item[]): Promise<KanjiReading[]> {
  const words = await knownWords(repos, items);
  return deriveKanjiReadings(words, await kanjiMap(repos, words));
}

/**
 * Recomputes the derived kanji readings of one word's kanji (K3), from that word and every word
 * that already proves a reading of those kanji. Call after the word's level changed.
 */
export async function refreshKanjiReadings(repos: Repos, word: Word): Promise<KanjiReading[]> {
  const chars = kanjiOf(word);
  const rows = (await Promise.all(chars.map((char) => repos.kanjiReadings.byKanji(char)))).flat();
  const ids = [...new Set([word.id, ...rows.flatMap((row) => row.wordIds)])];
  const items = (await repos.items.getMany(ids.map((id) => `word:${id}` as const))).flatMap(
    (item) => (item ? [item] : []),
  );
  const derived = (await derive(repos, items)).filter((row) => chars.includes(row.kanji));
  await repos.kanjiReadings.putMany(derived);
  return derived;
}

/** Recomputes every derived kanji reading from all word items (K3), e.g. after an import. */
export async function rebuildKanjiReadings(repos: Repos): Promise<number> {
  const items = (await repos.items.byKind('word')).filter((item) => item.level > 0);
  const derived = await derive(repos, items);
  await repos.kanjiReadings.putMany(derived);
  return derived.length;
}
