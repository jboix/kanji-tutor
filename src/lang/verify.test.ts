import { beforeAll, describe, expect, it } from 'vitest';
import { createLang } from './lang.ts';
import { createNodeTokenizer } from './node-tokenizer.ts';
import { createFakeDictionary } from './testing/fake-dictionary.ts';
import type { Tokenizer } from './types.ts';

const tokenizer = createNodeTokenizer();
const lang = createLang({ dictionary: createFakeDictionary(), tokenizer });

beforeAll(async () => {
  await tokenizer.tokenize('準備');
}, 20_000);

describe('verifyReading names the usual reading of a variant (R10)', () => {
  it('verifies にっぽんじん and names にほんじん as the usual reading', async () => {
    await expect(lang.verifyReading('日本人', 'にっぽんじん')).resolves.toEqual({
      status: 'verified',
      preferred: 'にほんじん',
    });
    await expect(lang.verifyReading('日本人', 'にほんじん')).resolves.toEqual({
      status: 'verified',
    });
  });

  it('leaves a reading with a meaning of its own unmarked', async () => {
    await expect(lang.verifyReading('今日', 'こんにち')).resolves.toEqual({ status: 'verified' });
  });
});

describe('verifyReading catches wrong readings (A8)', () => {
  it.each([
    ['紹介', 'しょかい', ['しょうかい']],
    ['一生', 'いっしょ', ['いっしょう']],
    ['手紙', 'てかみ', ['てがみ']],
    ['人々', 'ひとひと', ['ひとびと']],
    ['待って', 'もって', ['まって']],
    ['行った', 'いきった', ['いった']],
    ['読みました', 'よみまさた', ['よみました']],
    ['友達を待っている', 'ともだちをもっている', ['ともだちをまっている']],
    ['ひらがな', 'ひらかな', ['ひらがな']],
    ['コーヒー', 'こうひい', ['こーひー']],
  ])('%s read as %s is a mismatch', async (surface, reading, expected) => {
    await expect(lang.verifyReading(surface, reading)).resolves.toEqual({
      status: 'mismatch',
      expected,
    });
  });

  it('lists every JMdict reading when the claim matches none', async () => {
    await expect(lang.verifyReading('今日', 'こんじつ')).resolves.toEqual({
      status: 'mismatch',
      expected: ['きょう', 'こんにち'],
    });
  });
});

describe('verifyReading accepts correct readings', () => {
  it.each([
    ['紹介', 'しょうかい'],
    ['紹介', 'ショウカイ'],
    ['紹介', 'shoukai'],
    ['一生', 'いっしょう'],
    ['人々', 'ひとびと'],
    ['今日', 'こんにち'],
    ['待って', 'まって'],
    ['読みました', 'よみました'],
    ['待っている間に', 'まっているあいだに'],
    ['待っている間に', 'まっているまに'],
    [
      '駅で友達を待っている間に、本を読みました。',
      'えきでともだちをまっているあいだに、ほんをよみました。',
    ],
    [
      '駅で友達を待っている間に、本を読みました。',
      'えきでともだちをまっているあいだにほんをよみました',
    ],
    ['食べた', 'たべた'],
    ['行った', 'いった'],
    ['行った', 'おこなった'],
    ['読んで', 'よんで'],
    ['コーヒー', 'こーひー'],
    ['こーひー', 'コーヒー'],
    ['ほん', 'ホン'],
    [' 本 ', 'ほん'],
    ['本を読む', 'ほん を よむ'],
  ])('%s read as %s is verified', async (surface, reading) => {
    await expect(lang.verifyReading(surface, reading)).resolves.toEqual({ status: 'verified' });
  });
});

describe('verifyReading cannot confirm', () => {
  it.each([
    ['', 'ほん'],
    ['本', ''],
    ['本', '本'],
    ['ＸＹＺ社', 'えっくすわいぜっとしゃ'],
  ])('%s read as %s is unknown', async (surface, reading) => {
    await expect(lang.verifyReading(surface, reading)).resolves.toEqual({ status: 'unknown' });
  });

  it('is unknown when the tokenizer fails or returns nothing', async () => {
    const broken: Tokenizer = { tokenize: () => Promise.reject(new Error('no dict')) };
    const empty: Tokenizer = { tokenize: async () => [] };
    const dictionary = createFakeDictionary();
    for (const t of [broken, empty]) {
      const check = createLang({ dictionary, tokenizer: t }).verifyReading('待って', 'まって');
      await expect(check).resolves.toEqual({ status: 'unknown' });
    }
  });
});
