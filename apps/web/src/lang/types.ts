import type { Kanji, Token, Word } from '../domain/types.ts';

/** Splits Japanese text into tokens with hiragana readings. Runs kuromoji in a Web Worker. */
export interface Tokenizer {
  tokenize(text: string): Promise<Token[]>;
}

/** Outcome of checking a reading claimed by the AI (A8). */
export type ReadingCheck =
  /**
   * `preferred` is set when the reading is valid but a less common variant: the dictionary's
   * usual reading of that writing, e.g. にほんじん for にっぽんじん (R10).
   */
  | { status: 'verified'; preferred?: string }
  /** The dictionary and tokenizer agree on other readings; the claim is wrong. */
  | { status: 'mismatch'; expected: string[] }
  /** The surface is not in the dictionary and the tokenizer cannot confirm it. */
  | { status: 'unknown' };

/** Language services. Create with `createLang`; features get one from `useServices()`. */
export interface Lang {
  tokenize(text: string): Promise<Token[]>;
  /** Words written or read exactly as `query` (kanji, kana or romaji). */
  lookupWord(query: string): Promise<Word[]>;
  lookupKanji(char: string): Promise<Kanji | undefined>;
  /** Kana → word suggestions, Google Translate-style (I1). `kana` may still be partial romaji. */
  suggestWords(kana: string, limit?: number): Promise<Word[]>;
  /**
   * Checks that `reading` (kana) is a correct reading of `surface` against JMdict and the
   * tokenizer. Every AI reading must pass this or be shown as unverified (A8).
   */
  verifyReading(surface: string, reading: string): Promise<ReadingCheck>;
}
