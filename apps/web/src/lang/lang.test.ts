import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Word } from '../domain/types.ts';
import { createLang } from './lang.ts';
import { createNodeTokenizer } from './node-tokenizer.ts';
import { createFakeDictionary, SAMPLE_WORDS } from './testing/fake-dictionary.ts';

const tokenizer = createNodeTokenizer();

beforeAll(async () => {
  await tokenizer.tokenize('準備');
}, 20_000);

function setup(words: readonly Word[] = SAMPLE_WORDS) {
  const dictionary = createFakeDictionary(words);
  const wordsByText = vi.spyOn(dictionary, 'wordsByText');
  return { lang: createLang({ dictionary, tokenizer }), wordsByText };
}

const ids = (words: readonly Word[]) => words.map((w) => w.id);

describe('tokenize', () => {
  it('tokenizes with readings, offsets and resolved word ids', async () => {
    const { lang } = setup();
    const tokens = await lang.tokenize('駅で友達を待っている間に、本を読みました。');
    const text = tokens.map((t) => `${t.surface}:${t.reading}:${t.pos}:${t.wordId ?? '-'}`);
    expect(text).toEqual([
      '駅:えき:noun:1175880',
      'で:で:particle:-',
      '友達:ともだち:noun:1430570',
      'を:を:particle:-',
      '待っ:まっ:verb:1407980',
      'て:て:particle:-',
      'いる:いる:verb:-',
      '間:ま:noun:1196010',
      'に:に:particle:-',
      '、:、:symbol:-',
      '本:ほん:noun:1522150',
      'を:を:particle:-',
      '読み:よみ:verb:1557080',
      'まし:まし:auxiliary:-',
      'た:た:auxiliary:-',
      '。:。:symbol:-',
    ]);
    expect(tokens.map((t) => t.start)).toEqual([
      0, 1, 2, 4, 5, 7, 8, 10, 11, 12, 13, 14, 15, 17, 19, 20,
    ]);
  });

  it('looks each base form up once per text and skips particles', async () => {
    const { lang, wordsByText } = setup();
    await lang.tokenize('本と本と本');
    expect(wordsByText.mock.calls.map(([text]) => text)).toEqual(['本']);
  });

  it('prefers the entry whose reading matches the token', async () => {
    const homographs: Word[] = [
      { id: 'a', forms: ['行く'], readings: ['ゆく'], glosses: ['to go (lit.)'], common: false },
      { id: 'b', forms: ['行く'], readings: ['いく'], glosses: ['to go'], common: true },
      { id: 'c', forms: ['上手'], readings: ['うわて'], glosses: ['upper part'], common: false },
      { id: 'd', forms: ['上手'], readings: ['じょうず'], glosses: ['skilful'], common: false },
    ];
    const { lang } = setup(homographs);
    const tokens = await lang.tokenize('上手に行った');
    expect(tokens.find((t) => t.surface === '上手')?.wordId).toBe('d');
    const go = await lang.tokenize('学校に行きます');
    expect(go.find((t) => t.base === '行く')?.wordId).toBe('b');
  });

  it('falls back to the surface when the base form is not in the dictionary', async () => {
    const words: Word[] = [
      { id: 'x', forms: ['待っ'], readings: ['まっ'], glosses: ['(test)'], common: true },
    ];
    const { lang } = setup(words);
    const tokens = await lang.tokenize('待って');
    expect(tokens[0]?.wordId).toBe('x');
  });
});

describe('lookupWord', () => {
  it('finds words by kanji, kana, katakana spelling and romaji', async () => {
    const { lang } = setup();
    expect(ids(await lang.lookupWord('手紙'))).toEqual(['1328000']);
    expect(ids(await lang.lookupWord('てがみ'))).toEqual(['1328000']);
    expect(ids(await lang.lookupWord('tegami'))).toEqual(['1328000']);
    expect(ids(await lang.lookupWord('ko-hi-'))).toEqual(['1037590']);
    expect(ids(await lang.lookupWord('ナニ'))).toEqual(['1188380']);
    expect(await lang.lookupWord('  ')).toEqual([]);
  });

  it('looks kanji up by character', async () => {
    const { lang } = setup();
    expect((await lang.lookupKanji(' 待'))?.phonetic).toBe('寺');
    expect(await lang.lookupKanji('龘')).toBeUndefined();
  });
});

describe('suggestWords (I1)', () => {
  it('suggests from partial romaji, exact readings first, then common words', async () => {
    const { lang } = setup();
    const words = await lang.suggestWords('tabem');
    expect(ids(words)).toEqual(['1358280', '1358300', '2029110']);
    const exact = await lang.suggestWords('taberu');
    expect(ids(exact)[0]).toBe('1358280');
  });

  it('puts exact matches before longer common words', async () => {
    const { lang } = setup();
    const words = await lang.suggestWords('ma');
    expect(ids(words)[0]).toBe('1196010');
    expect(ids(words)).toContain('1407980');
  });

  it('finds katakana loanwords from romaji and respects the limit', async () => {
    const { lang } = setup();
    expect(ids(await lang.suggestWords('ko-'))).toEqual(['1037590']);
    expect(await lang.suggestWords('ta', 1)).toHaveLength(1);
    expect(await lang.suggestWords('ta', 0)).toEqual([]);
    expect(await lang.suggestWords('xyz')).toEqual([]);
  });
});
