import type { DictionaryRepo } from '../domain/repos.ts';
import { resolveTokens } from './resolve-tokens.ts';
import { lookupWord, suggestWords } from './suggest.ts';
import type { Lang, Tokenizer } from './types.ts';
import { verifyReading } from './verify.ts';
import { createWordLookup } from './word-lookup.ts';

/** What `createLang` needs: the read-only dictionary packs and a tokenizer. */
export interface LangDeps {
  dictionary: DictionaryRepo;
  tokenizer: Tokenizer;
}

/** Wires the language services over a dictionary and a tokenizer. */
export function createLang(deps: LangDeps): Lang {
  const { dictionary, tokenizer } = deps;
  const lookup = createWordLookup(dictionary);
  return {
    tokenize: async (text) => resolveTokens(await tokenizer.tokenize(text), lookup),
    lookupWord: (query) => lookupWord(dictionary, query),
    lookupKanji: (char) => dictionary.kanji(char.trim()),
    suggestWords: (kana, limit) => suggestWords(dictionary, kana, limit),
    verifyReading: (surface, reading) => verifyReading(surface, reading, { tokenizer, lookup }),
  };
}
