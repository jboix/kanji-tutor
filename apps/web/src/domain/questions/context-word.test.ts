/**
 * 文脈規定 (J3) regressions from the question quality review (D54): a verb is blanked with its
 * ending and every option conjugated alike; numbers, counters, compound parts and given-away
 * words are never blanked; options keep the answer's shape and everyday spelling.
 */
import { describe, expect, it } from 'vitest';
import { S } from '../../test/reading-fixtures.ts';
import type { Sentence, Token, Word } from '../types.ts';
import { contextWordQuestion, sameKind } from './context-word.ts';

const word = (id: string, form: string, gloss: string, pos: string[]): Word => ({
  id,
  forms: [form],
  readings: ['x'],
  glosses: [gloss],
  common: true,
  jlpt: 5,
  pos,
});

const verbs = [
  word('v1', '持つ', 'to hold', ['v5t']),
  word('v2', '読む', 'to read', ['v5m']),
  word('v3', '書く', 'to write', ['v5k']),
  word('v4', '食べる', 'to eat', ['v1']),
];
const matsu = word('3', '待つ', 'to wait', ['v5t']);
const nouns = [
  word('n1', '山', 'mountain', ['n']),
  word('n2', '川', 'river', ['n']),
  word('n3', '空', 'sky', ['n']),
  word('n4', '机', 'desk', ['n']),
];

type T = [surface: string, pos: string, wordId?: string, base?: string];

function sentence(id: string, parts: readonly T[]): Sentence {
  let start = 0;
  const tokens = parts.map(([surface, pos, wordId, base]): Token => {
    const token = { surface, reading: surface, base: base ?? surface, pos, start };
    start += surface.length;
    return wordId ? { ...token, wordId } : token;
  });
  const text = parts.map(([surface]) => surface).join('');
  return { id, text, translation: 'en', source: 'tatoeba', tokens, wordIds: [], verified: true };
}

const ask = (
  s: Sentence,
  tokenIndex: number,
  w: Word,
  candidates: Word[],
  corpus: Sentence[] = [],
) => contextWordQuestion({ sentence: s, tokenIndex, word: w, candidates, corpus, seed: 'j3' });

const texts = (q: ReturnType<typeof ask>) => q?.options.map((o) => o.text).sort() ?? [];

describe('文脈規定 blanks', () => {
  it('blanks a verb with its ending and conjugates every option alike', () => {
    const at = S.waiting.tokens.findIndex((t) => t.surface === '待っ');
    const q = ask(S.waiting, at, matsu, verbs);
    expect(q?.stem).toMatchObject({
      before: '駅で友達を',
      target: '待って',
      after: 'いる間に、本を読みました。',
    });
    expect(texts(q).every((t) => /(って|んで|いて|べて)$/u.test(t))).toBe(true);
    expect(texts(q)).toContain('待って');
  });

  it('never blanks a counter or a number (何本, 二日)', () => {
    const hon = word('7', '本', 'book', ['n']);
    const pens = sentence('pens', [
      ['ペン', 'noun'],
      ['は', 'particle'],
      ['何', 'noun'],
      ['本', 'noun', '7'],
      ['いる', 'verb'],
      ['？', 'symbol'],
    ]);
    expect(ask(pens, 3, hon, nouns)).toBeUndefined();
    const two = word('ni', '二', 'two', ['num']);
    const days = sentence('days', [
      ['二', 'noun', 'ni'],
      ['日', 'suffix'],
    ]);
    expect(ask(days, 0, two, nouns)).toBeUndefined();
    expect(sameKind(nouns[0] as Word, word('d', '６日', 'the sixth', ['n']))).toBe(false);
  });

  it('never blanks part of a compound (代わり of 代わりばんこ)', () => {
    const kawari = word('k', '代わり', 'substitute', ['n']);
    const turns = sentence('turns', [
      ['彼ら', 'pronoun'],
      ['は', 'particle'],
      ['代わり', 'noun', 'k'],
      ['ばんこ', 'noun'],
      ['に', 'particle'],
      ['運転', 'noun'],
    ]);
    expect(ask(turns, 2, kawari, nouns)).toBeUndefined();
  });

  it('never blanks a word the rest of the sentence writes (歌を歌う)', () => {
    const uta = word('u', '歌', 'song', ['n']);
    const sing = sentence('sing', [
      ['歌', 'noun', 'u'],
      ['を', 'particle'],
      ['歌う', 'verb'],
      ['。', 'symbol'],
    ]);
    expect(ask(sing, 0, uta, nouns)).toBeUndefined();
  });
});

describe('文脈規定 context', () => {
  it('never blanks a sentence with too little left to choose by (（白いです）か。)', () => {
    const white = word('w', '白い', 'white', ['adj-i']);
    const bare = sentence('bare', [
      ['白い', 'adjective', 'w'],
      ['です', 'auxiliary'],
      ['か', 'particle'],
      ['。', 'symbol'],
    ]);
    const adjectives = ['丸い', '早い', '多い'].map((f, i) => word(`a${i}`, f, f, ['adj-i']));
    expect(ask(bare, 0, white, adjectives)).toBeUndefined();
  });
});

describe('文脈規定 options', () => {
  it('keeps adverbial nouns with adverbial nouns (今, 先週)', () => {
    const ima = word('i', '今', 'now', ['n', 'adj-no', 'adv']);
    expect(sameKind(ima, nouns[0] as Word)).toBe(false);
    expect(sameKind(ima, word('s', '先週', 'last week', ['n', 'adv']))).toBe(true);
  });

  it('keeps verbs with verbs of the same transitivity', () => {
    const open = word('o', '開ける', 'to open', ['v1', 'vt']);
    expect(sameKind(open, word('a', '開く', 'to be open', ['v5k', 'vi']))).toBe(false);
    expect(sameKind(open, word('c', '閉める', 'to close', ['v1', 'vt']))).toBe(true);
    expect(sameKind(open, nouns[0] as Word)).toBe(false);
  });

  it('drops a candidate the corpus writes in kana (為 for ため)', () => {
    const tame = word('t', '為', 'sake', ['n']);
    const kana = sentence('kana', [
      ['その', 'adnominal'],
      ['ため', 'noun', 't'],
    ]);
    const hon = word('7', '本', 'book', ['n']);
    const s = sentence('book', [
      ['この', 'adnominal'],
      ['本', 'noun', '7'],
      ['を', 'particle'],
      ['毎日', 'noun'],
      ['読む', 'verb'],
    ]);
    const q = ask(s, 1, hon, [tame, ...nouns], [kana, kana, kana]);
    expect(q).toBeDefined();
    expect(texts(q)).not.toContain('為');
  });

  it('drops a candidate that makes a sentence of the packs', () => {
    const hon = word('7', '本', 'book', ['n']);
    const s = sentence('book', [
      ['この', 'adnominal'],
      ['本', 'noun', '7'],
      ['を', 'particle'],
      ['毎日', 'noun'],
      ['読む', 'verb'],
    ]);
    const known = (text: string) => text === 'この山を毎日読む';
    const q = contextWordQuestion({
      sentence: s,
      tokenIndex: 1,
      word: hon,
      candidates: nouns,
      corpus: [],
      known,
      seed: 'j3',
    });
    expect(q).toBeDefined();
    expect(texts(q)).not.toContain('山');
  });
});
