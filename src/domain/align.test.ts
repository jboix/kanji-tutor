import { describe, expect, it } from 'vitest';
import { rubyParts } from './align.ts';
import type { Kanji } from './types.ts';

/** Trimmed KANJIDIC2 entries. */
const ENTRIES: [string, string[], string[]][] = [
  ['学', ['ガク'], ['まな.ぶ']],
  ['生', ['セイ', 'ショウ'], ['い.きる', 'う.まれる', 'なま', 'き']],
  ['日', ['ニチ', 'ジツ'], ['ひ', '-び', '-か']],
  ['本', ['ホン'], ['もと']],
  ['人', ['ジン', 'ニン'], ['ひと', '-り', '-と']],
  ['一', ['イチ', 'イツ'], ['ひと-', 'ひと.つ']],
  ['大', ['ダイ', 'タイ'], ['おお-', 'おお.きい', '-おお.いに']],
  ['待', ['タイ'], ['ま.つ']],
  ['今', ['コン', 'キン'], ['いま']],
];

const KANJI: ReadonlyMap<string, Kanji> = new Map(
  ENTRIES.map(([char, on, kun]) => [char, { char, on, kun, meanings: [], components: [] }]),
);

/** "学:がく" for a part with furigana, "って" for one without. */
const show = (form: string, reading: string) =>
  rubyParts(form, reading, KANJI).map((p) => (p.reading ? `${p.text}:${p.reading}` : p.text));

describe('rubyParts (R11)', () => {
  it.each([
    ['学生', 'がくせい', ['学:がく', '生:せい']],
    ['待って', 'まって', ['待:ま', 'って']],
    ['待つ', 'まつ', ['待:ま', 'つ']],
    ['日本人', 'にほんじん', ['日:に', '本:ほん', '人:じん']],
    ['一人', 'ひとり', ['一:ひと', '人:り']],
    ['学生', 'ガクセイ', ['学:がく', '生:せい']],
  ])('splits %s / %s per kanji', (form, reading, expected) => {
    expect(show(form, reading)).toEqual(expected);
  });

  it.each([
    ['大人', 'おとな', ['大人:おとな']],
    ['今日', 'きょう', ['今日:きょう']],
    ['今日は', 'きょうは', ['今日:きょう', 'は']],
  ])('falls back to one reading over the word for %s / %s', (form, reading, expected) => {
    expect(show(form, reading)).toEqual(expected);
  });

  it('falls back to the kanji of the word, okurigana outside, without dictionary entries', () => {
    expect(rubyParts('待って', 'まって', new Map())).toEqual([
      { text: '待', reading: 'ま' },
      { text: 'って' },
    ]);
  });

  it('gives a word without kanji, or without a reading, no furigana', () => {
    expect(rubyParts('ありがとう', 'ありがとう', KANJI)).toEqual([{ text: 'ありがとう' }]);
    expect(rubyParts('学生', '', KANJI)).toEqual([{ text: '学生' }]);
  });
});
