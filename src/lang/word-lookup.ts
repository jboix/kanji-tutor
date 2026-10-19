import type { DictionaryRepo } from '../domain/repos.ts';
import type { Token, Word } from '../domain/types.ts';
import { foldKana, isKana } from './kana.ts';

/** Memoised `wordsByText`. */
export type WordLookup = (text: string) => Promise<Word[]>;

const MAX_CACHED = 5000;

/**
 * Memoises `dictionary.wordsByText` per text. Empty results are not kept, so words become
 * visible once the dictionary packs finish installing.
 */
export function createWordLookup(dictionary: DictionaryRepo): WordLookup {
  const cache = new Map<string, Promise<Word[]>>();
  return (text) => {
    const hit = cache.get(text);
    if (hit) return hit;
    if (cache.size >= MAX_CACHED) cache.clear();
    const result = dictionary.wordsByText(text);
    cache.set(text, result);
    result.then(
      (words) => words.length === 0 && cache.delete(text),
      () => cache.delete(text),
    );
    return result;
  };
}

/** Entries that are written exactly as `text` (not just read as it). */
export function writtenAs(words: readonly Word[], text: string): Word[] {
  return words.filter((entry) => entry.forms.includes(text));
}

/** Trailing kana (okurigana) of a written form, folded to hiragana: 待っ → っ, 食べる → べる. */
export function trailingKana(text: string): string {
  let start = text.length;
  while (start > 0 && isKana(text.slice(start - 1, start))) start--;
  return foldKana(text.slice(start));
}

/** The reading of a token's kanji stem: 待っ/まっ → ま, 友達/ともだち → ともだち. */
export function stemReading(token: Pick<Token, 'surface' | 'reading'>): string {
  const tail = trailingKana(token.surface);
  const reading = foldKana(token.reading);
  return tail && reading.endsWith(tail) ? reading.slice(0, -tail.length) : reading;
}

function readsAs(entry: Word, test: (reading: string) => boolean): boolean {
  return entry.readings.some((reading) => test(foldKana(reading)));
}

/**
 * Picks the entry a token most likely means: one whose reading matches the token (whole reading
 * for dictionary forms, stem for conjugated ones), common entries first, else the first entry.
 */
export function pickWord(words: readonly Word[], token: Token): Word | undefined {
  const reading = foldKana(token.reading);
  const stem = stemReading(token);
  const matches = words.filter((entry) =>
    token.surface === token.base
      ? readsAs(entry, (r) => r === reading)
      : readsAs(entry, (r) => r.startsWith(stem)),
  );
  const pool = matches.length > 0 ? matches : words;
  return pool.find((entry) => entry.common) ?? pool[0];
}
