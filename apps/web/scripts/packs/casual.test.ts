import { describe, expect, it } from 'vitest';
import { casualRule } from './casual.ts';

describe('casual forms', () => {
  it.each([
    ['私はトマトが好きくない。', 'na-adjective-ku'],
    ['あの部屋は綺麗くなかった。', 'na-adjective-ku'],
    ['こんなに食べれないよ。', 'ra-nuki'],
    ['明日は来れますか。', 'ra-nuki'],
    ['その映画、見れた？', 'ra-nuki'],
    ['すげー、本当に勝った。', 'stretched-hiragana'],
    ['それはすごーい！', 'stretched-hiragana'],
    ['ねぇ、駅はどこ？', 'small-vowel'],
    ['それ、俺のっす。', 'contraction'],
    ['明日も雨っしょ？', 'contraction'],
    ['いい車じゃん！', 'contraction'],
    ['マジで疲れた。', 'slang'],
    ['旅行にめっちゃ行きたい。', 'slang'],
    ['このラーメン、やばい！', 'slang'],
    ['あいつ、うざい。', 'slang'],
  ])('drops %s (%s)', (text, rule) => {
    expect(casualRule(text)).toBe(rule);
  });

  it.each([
    '私はトマトが好きではない。',
    '食べられないものはありますか。',
    'もし見れば、分かるでしょう。',
    '出来れば明日来てください。',
    'コーヒーを飲みましょう。',
    '熱のせいで頭がぼーっとしている。',
    'じゃんけんで決めよう。',
    'ここで待ってて。',
    '宿題を忘れちゃった。',
    'それは本当じゃない。',
    '彼はマジックが得意だ。',
    '静かにしてください。',
  ])('keeps %s', (text) => {
    expect(casualRule(text)).toBeUndefined();
  });
});
