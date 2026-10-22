import { describe, expect, it } from 'vitest';
import { coarsePos, type KuromojiToken, mapKuromojiTokens } from './kuromoji-map.ts';

function raw(overrides: Partial<KuromojiToken>): KuromojiToken {
  return {
    surface_form: '駅',
    pos: '名詞',
    pos_detail_1: '一般',
    basic_form: '駅',
    reading: 'エキ',
    word_position: 1,
    ...overrides,
  };
}

describe('kuromoji mapping', () => {
  it.each([
    ['名詞', '一般', 'noun'],
    ['名詞', '代名詞', 'pronoun'],
    ['名詞', '接尾', 'suffix'],
    ['動詞', '自立', 'verb'],
    ['形容詞', '自立', 'adjective'],
    ['副詞', '一般', 'adverb'],
    ['助詞', '格助詞', 'particle'],
    ['助動詞', '*', 'auxiliary'],
    ['記号', '読点', 'symbol'],
    ['接頭詞', '名詞接続', 'prefix'],
    ['連体詞', '*', 'adnominal'],
    ['接続詞', '*', 'conjunction'],
    ['感動詞', '*', 'interjection'],
    ['フィラー', '*', 'other'],
  ])('%s/%s → %s', (pos, detail, expected) => {
    expect(coarsePos({ pos, pos_detail_1: detail })).toBe(expected);
  });

  it('maps readings to hiragana, base forms and 0-based offsets', () => {
    const tokens = mapKuromojiTokens([
      raw({}),
      raw({
        surface_form: '待っ',
        pos: '動詞',
        basic_form: '待つ',
        reading: 'マッ',
        word_position: 2,
      }),
    ]);
    expect(tokens).toEqual([
      { surface: '駅', reading: 'えき', base: '駅', pos: 'noun', start: 0 },
      { surface: '待っ', reading: 'まっ', base: '待つ', pos: 'verb', start: 1 },
    ]);
  });

  it('falls back to the surface for unknown words and computes missing offsets', () => {
    const tokens = mapKuromojiTokens([
      raw({ surface_form: 'ｘｙ', basic_form: '*', reading: undefined, word_position: 0 }),
      raw({ surface_form: 'ほげ', basic_form: '', reading: '*', word_position: 0 }),
    ]);
    expect(tokens.map((t) => [t.surface, t.reading, t.base, t.start])).toEqual([
      ['ｘｙ', 'ｘｙ', 'ｘｙ', 0],
      ['ほげ', 'ほげ', 'ほげ', 2],
    ]);
  });
});
