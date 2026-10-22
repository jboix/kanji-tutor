/** Adds the Dexie dictionary's JLPT indexes to the fixture dictionary, for tests that need them. */
import type { Repos } from '../domain/repos.ts';
import type { Kanji, Sentence, Word } from '../domain/types.ts';
import { ALL_WORDS, K, W } from './reading-fixtures.ts';

/** これは本です。 Its one kanji word is the N5 word 本: readable by a learner from zero. */
export const HON: Sentence = {
  id: 's-hon',
  text: 'これは本です。',
  source: 'tatoeba',
  tokens: [
    { surface: 'これ', reading: 'これ', base: 'これ', pos: 'pronoun', start: 0, wordId: W.kore.id },
    { surface: 'は', reading: 'は', base: 'は', pos: 'particle', start: 2 },
    { surface: '本', reading: 'ほん', base: '本', pos: 'noun', start: 3, wordId: W.hon.id },
    { surface: 'です', reading: 'です', base: 'です', pos: 'auxiliary', start: 4 },
    { surface: '。', reading: '。', base: '。', pos: 'symbol', start: 6 },
  ],
  wordIds: [W.kore.id, W.hon.id],
  level: 5,
  verified: true,
};

export function withJlptIndex(
  repos: Repos,
  words: readonly Word[] = ALL_WORDS,
  kanji: readonly Kanji[] = K,
): Repos {
  repos.dictionary = {
    ...repos.dictionary,
    wordsByJlpt: async (level) => words.filter((word) => word.jlpt === level),
    kanjiByJlpt: async (level) => kanji.filter((entry) => entry.jlpt === level),
  };
  return repos;
}
