import { describe, expect, it } from 'vitest';
import { dictionaryRepos } from '../../test/memory-repos.ts';
import type { Kanji, Sentence, Token, Word } from '../types.ts';
import { fitsLevel } from './level-fit.ts';

const word = (id: string, forms: string[], readings: string[], jlpt?: Word['jlpt']): Word => ({
  id,
  forms,
  readings,
  glosses: [],
  common: true,
  ...(jlpt ? { jlpt } : {}),
});
const kanji = (char: string, jlpt?: Kanji['jlpt']): Kanji => ({
  char,
  meanings: [],
  on: [],
  kun: [],
  components: [],
  ...(jlpt ? { jlpt } : {}),
});

const WORDS = [
  word('1', ['本'], ['ほん'], 5),
  word('2', ['経済'], ['けいざい'], 3),
  word('3', ['お前'], ['おまえ'], 3),
  word('4', ['寧ろ'], ['むしろ'], 3),
  word('5', ['此れ'], ['これ'], 1),
  word('6', ['瓦'], ['グラム'], 5),
  word('7', ['今'], ['いま'], 5),
  word('8', ['居間'], ['いま'], 3),
];
const KANJI = [kanji('本', 5), kanji('経', 3), kanji('済', 3), kanji('前', 5), kanji('瓦', 2)];

function tok(surface: string, pos: string, wordId?: string, base = surface): Token {
  return { surface, reading: surface, base, pos, start: 0, ...(wordId ? { wordId } : {}) };
}
function sentence(tokens: Token[], grammarIds: string[] = []): Sentence {
  const text = tokens.map((t) => t.surface).join('');
  return { id: 's', text, source: 'tatoeba', tokens, wordIds: [], verified: true, grammarIds };
}

const repos = dictionaryRepos(WORDS, KANJI);
const n5 = { repos, levels: new Map(), learnerLevel: 5 as const };
const fits = (s: Sentence, options: string[] = [], ctx = n5) => fitsLevel(ctx, s, options);

describe('questions fit the level (J6)', () => {
  it('keeps an N5 sentence, and leaves out one with an N3 word the learner does not know', async () => {
    expect(await fits(sentence([tok('本', 'noun', '1'), tok('だ', 'auxiliary')]))).toBe(true);
    const hard = sentence([tok('経済', 'noun', '2'), tok('だ', 'auxiliary')]);
    expect(await fits(hard)).toBe(false);
    expect(await fits(hard, [], { ...n5, levels: new Map([['2', 3]]) })).toBe(true);
  });

  it('judges a pronoun written in kanji, but not a kana pronoun the lists tag oddly', async () => {
    expect(await fits(sentence([tok('お前', 'pronoun', '3')]))).toBe(false);
    expect(await fits(sentence([tok('これ', 'pronoun', '5')]))).toBe(true);
  });

  it('leaves out a kana word only when every word read so is two levels harder', async () => {
    expect(await fits(sentence([tok('むしろ', 'adverb', '4')]))).toBe(false);
    // The token resolved to 居間 (N3), but いま is also 今 (N5).
    expect(await fits(sentence([tok('いま', 'noun', '8')]))).toBe(true);
  });

  it('checks the options’ kanji and the sentence’s grammar', async () => {
    const plain = sentence([tok('本', 'noun', '1')]);
    expect(await fits(plain, ['本', 'ほん'])).toBe(true);
    expect(await fits(plain, ['瓦'])).toBe(false);
    expect(await fits(sentence([tok('本', 'noun', '1')], ['tsumori']))).toBe(false);
    expect(await fits(sentence([tok('本', 'noun', '1')], ['desu']))).toBe(true);
  });
});
