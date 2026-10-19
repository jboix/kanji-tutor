import type { DictionaryRepo } from '../domain/repos.ts';
import type { Word } from '../domain/types.ts';
import { foldKana, hasRomaji, isKana, kanaPrefix, toKana, toKatakana } from './kana.ts';

function dedupe(lists: readonly Word[][]): Word[] {
  const seen = new Map<string, Word>();
  for (const entry of lists.flat()) if (!seen.has(entry.id)) seen.set(entry.id, entry);
  return [...seen.values()];
}

function readsExactly(entry: Word, kana: string): boolean {
  return entry.readings.some((reading) => foldKana(reading) === kana);
}

/** Hiragana and katakana spellings of `kana`, so loanwords (コーヒー) are found from ko-hi-. */
function spellings(kana: string): string[] {
  const hiragana = foldKana(kana);
  return [...new Set([hiragana, toKatakana(hiragana)])];
}

/**
 * Words written or read exactly as `query`. Romaji is converted to kana first; kana queries also
 * try the katakana spelling.
 */
export async function lookupWord(dictionary: DictionaryRepo, query: string): Promise<Word[]> {
  const text = query.trim();
  if (!text) return [];
  const kana = hasRomaji(text) ? toKana(text.toLowerCase(), true) : text;
  if (!isKana(kana)) return dictionary.wordsByText(kana);
  return dedupe(await Promise.all(spellings(kana).map((s) => dictionary.wordsByText(s))));
}

/**
 * Kana → word suggestions (I1). Partial romaji is converted in IME mode and any unconverted tail
 * ignored ("tabem" → たべ). Words read exactly as typed come first, then common words.
 */
export async function suggestWords(
  dictionary: DictionaryRepo,
  input: string,
  limit = 8,
): Promise<Word[]> {
  const prefix = foldKana(kanaPrefix(input));
  if (!prefix || limit <= 0) return [];
  const forms = spellings(prefix);
  const lists = await Promise.all([
    ...forms.map((s) => dictionary.wordsByText(s)),
    ...forms.map((s) => dictionary.wordsByReadingPrefix(s, limit * 2)),
  ]);
  const rank = (entry: Word) => (readsExactly(entry, prefix) ? 0 : 2) + (entry.common ? 0 : 1);
  return dedupe(lists)
    .filter((entry) => entry.readings.some((reading) => foldKana(reading).startsWith(prefix)))
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, limit);
}
