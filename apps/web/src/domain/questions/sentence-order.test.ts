/**
 * 文の組み立て (J5) regressions from the question quality review: every piece is a whole
 * word with its particles, and a window is asked only when its order is unique.
 */
import { describe, expect, it } from 'vitest';
import { GRAMMAR_CATALOGUE } from '../grammar/catalogue.ts';
import type { Sentence, Token } from '../types.ts';
import { sentenceOrderQuestion } from './sentence-order.ts';

type T = [surface: string, pos: string, base?: string];
const CONTENT = new Set([
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'adnominal',
  'auxiliary',
]);

function sentence(parts: readonly T[], resolved = true): Sentence {
  let start = 0;
  const tokens = parts.map(([surface, pos, base]): Token => {
    const token: Token = { surface, reading: surface, base: base ?? surface, pos, start };
    start += surface.length;
    return resolved && CONTENT.has(pos) ? { ...token, wordId: surface } : token;
  });
  const text = parts.map(([surface]) => surface).join('');
  return {
    id: text,
    text,
    translation: 'en',
    source: 'tatoeba',
    tokens,
    wordIds: [],
    verified: true,
  };
}

const ask = (parts: readonly T[], resolved = true) =>
  sentenceOrderQuestion({
    sentence: sentence(parts, resolved),
    catalogue: GRAMMAR_CATALOGUE,
    seed: 'j5',
  });

describe('文の組み立て pieces', () => {
  it('asks a sentence whose four pieces have one order', () => {
    const four = ask([
      ['私', 'pronoun'],
      ['の', 'particle'],
      ['古い', 'adjective'],
      ['本', 'noun'],
      ['は', 'particle'],
      ['赤い', 'adjective'],
      ['。', 'symbol'],
    ]);
    expect(four?.order.map((i) => four.options[i]?.text).join('')).toBe('私の古い本は赤い');
  });

  it('never offers a piece without a word (ん, だい) or a cut-off stem (新し)', () => {
    expect(
      ask([
        ['何', 'pronoun'],
        ['を', 'particle'],
        ['し', 'verb', 'する'],
        ['て', 'particle'],
        ['い', 'verb', 'いる'],
        ['た', 'auxiliary'],
        ['ん', 'noun'],
        ['だい', 'noun'],
        ['。', 'symbol'],
      ]),
    ).toBeUndefined();
    expect(
      ask([
        ['この', 'adnominal'],
        ['建物', 'noun'],
        ['は', 'particle'],
        ['新し', 'adjective', '新しい'],
        ['ん', 'noun'],
        ['だ', 'auxiliary'],
        ['。', 'symbol'],
      ]),
    ).toBeUndefined();
  });

  it('never offers a fragment the tokenizer cut out of a word (こ of こぶ)', () => {
    const parts: T[] = [
      ['ラクダ', 'noun'],
      ['に', 'particle'],
      ['は', 'particle'],
      ['二つ', 'noun'],
      ['の', 'particle'],
      ['こ', 'noun'],
      ['ぶ', 'noun'],
      ['が', 'particle'],
      ['ある', 'verb'],
      ['。', 'symbol'],
    ];
    const q = ask(parts);
    expect(q?.options.some((o) => o.text === 'こ' || o.text.startsWith('ぶ'))).not.toBe(true);
  });
});

describe('文の組み立て unique order', () => {
  it('gives up when an adverb could cross a phrase (もっと聞きたいことが / 聞きたいことがもっと)', () => {
    expect(
      ask([
        ['もっと', 'adverb'],
        ['聞き', 'verb', '聞く'],
        ['たい', 'auxiliary'],
        ['こと', 'noun'],
        ['が', 'particle'],
        ['あり', 'verb', 'ある'],
        ['ます', 'auxiliary'],
        ['。', 'symbol'],
      ]),
    ).toBeUndefined();
  });

  it('gives up when a topic could swap with another phrase (君はこの機会を…)', () => {
    expect(
      ask([
        ['君', 'pronoun'],
        ['は', 'particle'],
        ['この', 'adnominal'],
        ['機会', 'noun'],
        ['を', 'particle'],
        ['利用', 'noun'],
        ['する', 'verb'],
        ['。', 'symbol'],
      ]),
    ).toBeUndefined();
  });

  it('gives up on a floating indefinite or amount (何か, 百ドル)', () => {
    expect(
      ask([
        ['何', 'pronoun'],
        ['か', 'particle'],
        ['アルバイト', 'noun'],
        ['は', 'particle'],
        ['し', 'verb', 'する'],
        ['て', 'particle'],
        ['い', 'verb', 'いる'],
        ['ます', 'auxiliary'],
        ['か', 'particle'],
        ['。', 'symbol'],
      ]),
    ).toBeUndefined();
  });

  it('gives up when two adjectives before a noun could swap (大きな新しい建物)', () => {
    expect(
      ask([
        ['その', 'adnominal'],
        ['大きな', 'adnominal'],
        ['新しい', 'adjective'],
        ['建物', 'noun'],
        ['は', 'particle'],
        ['何', 'pronoun'],
        ['です', 'auxiliary'],
        ['か', 'particle'],
        ['。', 'symbol'],
      ]),
    ).toBeUndefined();
  });

  it('gives up when an adverb could cross a bare noun or いつでも float (あの人たちやっと)', () => {
    expect(
      ask([
        ['あの', 'adnominal'],
        ['人', 'noun'],
        ['たち', 'suffix'],
        ['やっと', 'adverb'],
        ['諦め', 'verb', '諦める'],
        ['た', 'auxiliary'],
        ['よ', 'particle'],
        ['。', 'symbol'],
      ]),
    ).toBeUndefined();
    expect(
      ask([
        ['いつ', 'pronoun'],
        ['でも', 'particle'],
        ['私', 'pronoun'],
        ['の', 'particle'],
        ['ペン', 'noun'],
        ['を', 'particle'],
        ['使っ', 'verb', '使う'],
        ['て', 'particle'],
        ['。', 'symbol'],
      ]),
    ).toBeUndefined();
  });
});

describe('文の組み立て words cut by the tokenizer', () => {
  it('never ends a window before the rest of its last word (一時間 | 半)', () => {
    const q = ask([
      ['行く', 'verb'],
      ['の', 'noun'],
      ['に', 'particle'],
      ['一', 'noun'],
      ['時間', 'noun'],
      ['半', 'noun'],
      ['かかっ', 'verb', 'かかる'],
      ['た', 'auxiliary'],
      ['。', 'symbol'],
    ]);
    expect(q?.options.some((o) => o.text === '時間' || o.text === '半')).not.toBe(true);
  });

  it('never starts a piece with a verb that only follows another (がる of つけたがる)', () => {
    expect(
      ask([
        ['かっこ', 'noun'],
        ['つけ', 'verb', 'つける'],
        ['た', 'auxiliary'],
        ['がる', 'verb'],
        ['ん', 'noun'],
        ['だ', 'auxiliary'],
        ['から', 'particle'],
        ['。', 'symbol'],
      ]),
    ).toBeUndefined();
  });

  it('never offers a stray kana as a piece (ま, え of 話したまえ)', () => {
    expect(
      ask([
        ['さあ', 'interjection'],
        ['話し', 'verb', '話す'],
        ['た', 'auxiliary'],
        ['ま', 'other'],
        ['え', 'other'],
        ['。', 'symbol'],
      ]),
    ).toBeUndefined();
  });
});

describe('文の組み立て floating pieces', () => {
  it('gives up when a question word, an amount with ほど or a で phrase could move', () => {
    const where = ask([
      ['そんな', 'adnominal'],
      ['おめかし', 'noun'],
      ['し', 'verb', 'する'],
      ['て', 'particle'],
      ['どこ', 'pronoun'],
      ['行く', 'verb'],
      ['の', 'particle'],
      ['？', 'symbol'],
    ]);
    expect(where).toBeUndefined();
    const lots = ask([
      ['やる', 'verb'],
      ['こと', 'noun'],
      ['は', 'particle'],
      ['山', 'noun'],
      ['ほど', 'particle'],
      ['ある', 'verb'],
      ['。', 'symbol'],
    ]);
    expect(lots).toBeUndefined();
    const really = ask([
      ['マジ', 'noun'],
      ['で', 'auxiliary'],
      ['時間', 'noun'],
      ['が', 'particle'],
      ['ない', 'adjective'],
      ['ん', 'noun'],
      ['だ', 'auxiliary'],
      ['よ', 'particle'],
      ['。', 'symbol'],
    ]);
    expect(really).toBeUndefined();
  });

  it('gives up when two noun-の phrases could each go with either noun (私の家の前にサクラの)', () => {
    expect(
      ask([
        ['私', 'pronoun'],
        ['の', 'particle'],
        ['家', 'noun'],
        ['の', 'particle'],
        ['前', 'noun'],
        ['に', 'particle'],
        ['サクラ', 'noun'],
        ['の', 'particle'],
        ['木', 'noun'],
        ['が', 'particle'],
        ['ある', 'verb'],
        ['。', 'symbol'],
      ]),
    ).toBeUndefined();
  });

  it('never offers the rest of a word the tokenizer broke (この|つ|ぼの for このつぼの)', () => {
    const broken = sentence([
      ['この', 'adnominal'],
      ['つ', 'auxiliary'],
      ['ぼ', 'verb'],
      ['の', 'particle'],
      ['年代', 'noun'],
      ['を', 'particle'],
      ['決める', 'verb'],
      ['の', 'noun'],
      ['は', 'particle'],
      ['難しい', 'adjective'],
      ['。', 'symbol'],
    ]);
    const { wordId: _, ...tsu } = broken.tokens[1] as Token;
    broken.tokens[1] = tsu;
    const q = sentenceOrderQuestion({ sentence: broken, catalogue: GRAMMAR_CATALOGUE, seed: 'j5' });
    expect(q?.options.some((o) => o.text.startsWith('ぼ'))).not.toBe(true);
  });
});
