import { describe, expect, it } from 'vitest';
import type { Token } from '../../src/domain/types.ts';
import type { JmWord } from './jmdict.ts';
import { preferReadings, preferToken, readingsFor } from './readings.ts';

type Kana = [text: string, common: boolean, tags?: string[], applies?: string[]];

/** An entry shaped like jmdict-simplified's, with `senses` listing each sense's readings. */
function entry(id: string, kanji: string, kana: Kana[], senses: string[][] = [['*']]): JmWord {
  return {
    id,
    kanji: [{ common: true, text: kanji, tags: [] }],
    kana: kana.map(([text, common, tags = [], applies = ['*']]) => ({
      text,
      common,
      tags,
      appliesToKanji: applies,
    })),
    sense: senses.map((appliesToKana) => ({
      partOfSpeech: ['n'],
      appliesToKana,
      misc: [],
      gloss: [{ lang: 'eng', text: 'x' }],
    })),
  };
}

// As in JMdict 2026-10-12.
const WORDS = [
  entry('1464700', '日本人', [
    ['にほんじん', true],
    ['にっぽんじん', false],
  ]),
  entry('1582710', '日本', [
    ['にほん', true],
    ['にっぽん', true],
  ]),
  entry(
    '1576150',
    '一人',
    [
      ['ひとり', true],
      ['いちにん', false, [], ['一人', '１人']],
    ],
    [['*'], ['ひとり']],
  ),
  entry('1414170', '大人', [
    ['おとな', true, ['gikun']],
    ['だいにん', false, ['rk']],
  ]),
  entry(
    '1584660',
    '明日',
    [
      ['あした', true, ['gikun']],
      ['あす', true, ['gikun']],
      ['みょうにち', true],
    ],
    [['*'], ['あす']],
  ),
  entry(
    '1579110',
    '今日',
    [
      ['きょう', true, ['gikun']],
      ['こんにち', true],
    ],
    [['*'], ['こんにち']],
  ),
  entry('1576260', '一日', [
    ['いちにち', true],
    ['いちじつ', false],
  ]),
  entry('2225040', '一日', [['ついたち', true]]),
  entry('1189000', '何', [
    ['なに', true],
    ['なん', true],
  ]),
];
const BY_ID = new Map(WORDS.map((w) => [w.id, w]));

function token(surface: string, reading: string, wordId: string): Token {
  return { surface, reading, base: surface, pos: 'noun', start: 0, wordId };
}

const read = (surface: string, reading: string, id: string) =>
  preferToken(token(surface, reading, id), BY_ID);

describe('preferred readings', () => {
  it('reads a word as its preferred reading, keeping the variants it may be typed as', () => {
    expect(read('日本人', 'にっぽんじん', '1464700')).toMatchObject({
      reading: 'にほんじん',
      variants: ['にっぽんじん'],
    });
    expect(read('日本', 'にっぽん', '1582710')).toMatchObject({
      reading: 'にほん',
      variants: ['にっぽん'],
    });
    expect(read('一人', 'いちにん', '1576150')).toMatchObject({ reading: 'ひとり' });
    expect(read('大人', 'だいにん', '1414170')).toMatchObject({ reading: 'おとな' });
    expect(read('大人', 'だいにん', '1414170').variants).toBeUndefined();
    expect(read('明日', 'みょうにち', '1584660')).toMatchObject({
      reading: 'あした',
      variants: ['みょうにち'],
    });
  });

  it('keeps a reading with a sense of its own, and readings of other entries', () => {
    expect(read('今日', 'こんにち', '1579110')).toEqual(token('今日', 'こんにち', '1579110'));
    expect(read('明日', 'あす', '1584660').reading).toBe('あす');
    expect(read('一日', 'ついたち', '2225040')).toEqual(token('一日', 'ついたち', '2225040'));
    expect(read('一日', 'いちにち', '1576260')).toMatchObject({
      reading: 'いちにち',
      variants: ['いちじつ'],
    });
    expect(read('今日', 'きょう', '1579110')).toEqual(token('今日', 'きょう', '1579110'));
  });

  it('leaves lone kanji, kana and conjugated tokens alone', () => {
    expect(read('何', 'なん', '1189000').reading).toBe('なん');
    const conjugated = { ...token('日本', 'にっぽん', '1582710'), base: '日本だ' };
    expect(preferToken(conjugated, BY_ID)).toBe(conjugated);
  });

  it('never prefers a rare, search-only or restricted reading', () => {
    expect(readingsFor(BY_ID.get('1414170') as JmWord, '大人')).toEqual(['おとな']);
    expect(readingsFor(BY_ID.get('1576150') as JmWord, '一人')).toEqual(['ひとり', 'いちにん']);
    expect(readingsFor(BY_ID.get('1576150') as JmWord, 'ひとり')).toEqual([]);
  });

  it('counts the readings it changes', () => {
    const tokens = [token('日本人', 'にっぽんじん', '1464700'), token('今日', 'きょう', '1579110')];
    expect(preferReadings(tokens, BY_ID).changed).toBe(1);
  });
});
