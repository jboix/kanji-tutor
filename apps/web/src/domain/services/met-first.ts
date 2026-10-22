/**
 * What a session met for the first time (the session end's "New today"): words read for the
 * first time, the kanji they brought that no earlier word had, and the grammar points introduced.
 */
import { GRAMMAR_CATALOGUE } from '../grammar/index.ts';
import type { GrammarEntry } from '../grammar/types.ts';
import { itemId } from '../ids.ts';
import type { Repos } from '../repos.ts';
import type { Kanji, Word } from '../types.ts';
import { kanjiOf } from './kanji-readings.ts';

/** One thing met for the first time, with what the end screen shows of it. */
export type MetFirst =
  | { kind: 'kanji'; kanji: Kanji; reading: string | undefined }
  | { kind: 'word'; word: Word }
  | { kind: 'grammar'; entry: GrammarEntry };

export interface MetFirstInput {
  /** The words read in the session, in order (repeats are fine). */
  wordIds: readonly string[];
  /** Grammar points the session introduced or marked new (G4, L7). */
  grammarIds: readonly string[];
  /** When the session started (epoch ms). */
  since: number;
}

/** A word is new when its first review ever is from this session. */
async function newWords(repos: Repos, ids: readonly string[], since: number): Promise<Word[]> {
  const unique = [...new Set(ids)];
  const firsts = await Promise.all(
    unique.map(async (id) => {
      const reviews = await repos.reviews.byItem(itemId('word', id));
      return reviews.length > 0 && reviews.every((review) => review.at >= since);
    }),
  );
  const fresh = unique.filter((_, i) => firsts[i]);
  return (await repos.dictionary.words(fresh)).flatMap((word) => (word ? [word] : []));
}

/** "い.きる" → "い": the part of a reading written under the kanji itself. */
const underKanji = (reading: string) => reading.split('.')[0] ?? reading;

/**
 * A kanji is new when no word outside this session's new ones proves a reading of it (K3); its
 * reading is the one a new word proves, if any.
 */
async function newKanji(repos: Repos, words: readonly Word[]): Promise<MetFirst[]> {
  const ids = new Set(words.map((word) => word.id));
  const chars = [...new Set(words.flatMap(kanjiOf))];
  const rows = await Promise.all(chars.map((char) => repos.kanjiReadings.byKanji(char)));
  const fresh = chars.filter((_, i) => rows[i]?.every((row) => row.wordIds.every(ids.has, ids)));
  const entries = await repos.dictionary.kanjiMany(fresh);
  return entries.flatMap((kanji): MetFirst[] => {
    if (!kanji) return [];
    const row = rows[chars.indexOf(kanji.char)]?.find((r) => r.wordIds.some(ids.has, ids));
    return [{ kind: 'kanji', kanji, reading: row && underKanji(row.reading) }];
  });
}

/** A grammar point is new when its item was added during the session. */
async function newGrammar(repos: Repos, ids: readonly string[], since: number) {
  const unique = [...new Set(ids)];
  const items = await repos.items.getMany(unique.map((id) => itemId('grammar', id)));
  const fresh = unique.filter((_, i) => (items[i]?.source.addedAt ?? -1) >= since);
  return fresh.flatMap((id): MetFirst[] => {
    const entry = GRAMMAR_CATALOGUE.find((e) => e.id === id);
    return entry ? [{ kind: 'grammar', entry }] : [];
  });
}

/** Everything the session met for the first time: kanji, then words, then grammar points. */
export async function metFirst(repos: Repos, input: MetFirstInput): Promise<MetFirst[]> {
  const words = await newWords(repos, input.wordIds, input.since);
  const kanji = await newKanji(repos, words);
  const grammar = await newGrammar(repos, input.grammarIds, input.since);
  const asWords = words.map((word): MetFirst => ({ kind: 'word', word }));
  return [...kanji, ...asWords, ...grammar];
}
