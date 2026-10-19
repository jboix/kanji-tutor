/**
 * Links to outside references (R9, D58): Jisho for words and kanji, Wiktionary for kanji, Tatoeba
 * for a sentence's source, Tofugu's kana guide in the welcome (P8). Only the link itself leaves
 * the device, when the learner opens it.
 */

/** The outside sites the app links to. Their names are brands, never translated. */
export type ExternalSite = 'jisho' | 'wiktionary' | 'tatoeba' | 'tofugu';

export const SITE_NAMES: Readonly<Record<ExternalSite, string>> = {
  jisho: 'Jisho',
  wiktionary: 'Wiktionary',
  tatoeba: 'Tatoeba',
  tofugu: 'Tofugu',
};

/**
 * A free guide to hiragana, then katakana, for learners who cannot read kana yet (P8). A plain
 * link: no query string, opened without a referrer.
 */
export const KANA_GUIDE_URL = 'https://www.tofugu.com/japanese/learn-hiragana/';

/** Jisho's search for a word or any Japanese text. */
export function jishoWordUrl(text: string): string {
  return `https://jisho.org/search/${encodeURIComponent(text.trim())}`;
}

/** Jisho's kanji page: the search for the character with the #kanji tag. */
export function jishoKanjiUrl(kanji: string): string {
  return `https://jisho.org/search/${encodeURIComponent(kanji.trim())}%20%23kanji`;
}

/** The English Wiktionary entry for a kanji. */
export function wiktionaryKanjiUrl(kanji: string): string {
  return `https://en.wiktionary.org/wiki/${encodeURIComponent(kanji.trim())}`;
}

/** The Tatoeba page of the sentence with that id. */
export function tatoebaSentenceUrl(sourceRef: string): string {
  return `https://tatoeba.org/en/sentences/show/${encodeURIComponent(sourceRef.trim())}`;
}

/**
 * The text to search for a grammar pattern: its first form, without the 〜 placeholder or
 * parenthesised parts ("〜じゃない／ではありません" → "じゃない").
 */
export function grammarSearchText(pattern: string): string {
  const first = pattern.split(/[／/]/)[0] ?? pattern;
  return first
    .replace(/[〜~]/g, '')
    .replace(/[(（][^)）]*[)）]/g, '')
    .trim();
}

/** Jisho's search for a grammar pattern. */
export function jishoGrammarUrl(pattern: string): string {
  return jishoWordUrl(grammarSearchText(pattern));
}
