import { describe, expect, it } from 'vitest';
import {
  type AdjectiveForm,
  classOf,
  conjugateAdjective,
  conjugateVerb,
  FORM_LEVEL,
  formsAt,
  type VerbForm,
} from './forms.ts';

/** The first surface of a verb in a form, its class read from its ending. */
const verb = (dict: string, form: VerbForm) => {
  const cls = classOf(dict);
  return cls ? conjugateVerb(dict, cls, form)[0] : undefined;
};

describe('conjugateVerb: ichidan', () => {
  it.each([
    ['dict', '食べる'],
    ['masu', '食べます'],
    ['masen', '食べません'],
    ['mashita', '食べました'],
    ['masenDeshita', '食べませんでした'],
    ['stem', '食べ'],
    ['te', '食べて'],
    ['ta', '食べた'],
    ['nai', '食べない'],
    ['nakatta', '食べなかった'],
    ['tai', '食べたい'],
    ['mashou', '食べましょう'],
    ['volitional', '食べよう'],
    ['potential', '食べられる'],
    ['passive', '食べられる'],
    ['causative', '食べさせる'],
    ['imperative', '食べろ'],
    ['ba', '食べれば'],
    ['tara', '食べたら'],
  ] as const)('食べる in %s is %s', (form, expected) => {
    expect(verb('食べる', form)).toBe(expected);
  });

  it('conjugates the reading the same way', () => {
    expect(verb('たべる', 'te')).toBe('たべて');
    expect(verb('みる', 'potential')).toBe('みられる');
    expect(verb('おきる', 'nai')).toBe('おきない');
  });
});

describe('conjugateVerb: godan, by the last kana', () => {
  it.each([
    ['書く', 'te', '書いて'],
    ['書く', 'ta', '書いた'],
    ['泳ぐ', 'te', '泳いで'],
    ['泳ぐ', 'ta', '泳いだ'],
    ['話す', 'te', '話して'],
    ['待つ', 'te', '待って'],
    ['死ぬ', 'te', '死んで'],
    ['遊ぶ', 'te', '遊んで'],
    ['読む', 'te', '読んで'],
    ['読む', 'ta', '読んだ'],
    ['帰る', 'te', '帰って'],
    ['買う', 'te', '買って'],
    ['買う', 'nai', '買わない'],
    ['買う', 'passive', '買われる'],
    ['買う', 'causative', '買わせる'],
    ['書く', 'potential', '書ける'],
    ['書く', 'passive', '書かれる'],
    ['書く', 'causative', '書かせる'],
    ['書く', 'imperative', '書け'],
    ['書く', 'volitional', '書こう'],
    ['書く', 'ba', '書けば'],
    ['書く', 'tara', '書いたら'],
    ['話す', 'potential', '話せる'],
    ['待つ', 'potential', '待てる'],
    ['待つ', 'nai', '待たない'],
    ['読む', 'masu', '読みます'],
    ['読む', 'stem', '読み'],
    ['飲む', 'tai', '飲みたい'],
    ['帰る', 'nai', '帰らない'],
    ['帰る', 'masu', '帰ります'],
    ['入る', 'te', '入って'],
    ['走る', 'potential', '走れる'],
  ] as const)('%s in %s is %s', (dict, form, expected) => {
    expect(verb(dict, form)).toBe(expected);
  });
});

describe('conjugateVerb: irregular', () => {
  it.each([
    ['行く', 'te', '行って'],
    ['行く', 'ta', '行った'],
    ['行く', 'tara', '行ったら'],
    ['行く', 'masu', '行きます'],
    ['行く', 'potential', '行ける'],
    ['いく', 'te', 'いって'],
    ['する', 'te', 'して'],
    ['する', 'nai', 'しない'],
    ['する', 'potential', 'できる'],
    ['する', 'passive', 'される'],
    ['する', 'causative', 'させる'],
    ['する', 'imperative', 'しろ'],
    ['する', 'volitional', 'しよう'],
    ['勉強する', 'masu', '勉強します'],
    ['勉強する', 'potential', '勉強できる'],
    ['べんきょうする', 'te', 'べんきょうして'],
    ['来る', 'te', '来て'],
    ['来る', 'nai', '来ない'],
    ['来る', 'potential', '来られる'],
    ['来る', 'imperative', '来い'],
    ['くる', 'masu', 'きます'],
    ['くる', 'nai', 'こない'],
    ['くる', 'te', 'きて'],
    ['くる', 'potential', 'こられる'],
    ['くる', 'causative', 'こさせる'],
    ['くる', 'volitional', 'こよう'],
    ['くる', 'ba', 'くれば'],
  ] as const)('%s in %s is %s', (dict, form, expected) => {
    expect(verb(dict, form)).toBe(expected);
  });

  it('gives ある no potential, passive, causative or wish', () => {
    for (const form of ['potential', 'passive', 'causative', 'imperative', 'tai'] as const) {
      expect(conjugateVerb('ある', 'v5r-i', form)).toEqual([]);
    }
    expect(conjugateVerb('ある', 'v5r-i', 'masu')).toEqual(['あります']);
    expect(conjugateVerb('ある', 'v5r-i', 'te')).toEqual(['あって']);
  });

  it('keeps くださる to its polite forms', () => {
    expect(conjugateVerb('くださる', 'v5aru', 'masu')).toEqual(['くださいます']);
    expect(conjugateVerb('くださる', 'v5aru', 'passive')).toEqual([]);
  });

  it('gives nothing for a word that is not a verb', () => {
    expect(conjugateVerb('高い', 'adj-i', 'te')).toEqual([]);
    expect(conjugateVerb('x', 'v1', 'te')).toEqual([]);
  });
});

describe('classOf', () => {
  it('prefers the JMdict tags', () => {
    expect(classOf('要る', ['v5r'])).toBe('v5');
    expect(classOf('見る', ['v1', 'vt'])).toBe('v1');
    expect(classOf('行く', ['v5k-s'])).toBe('v5k-s');
    expect(classOf('来る', ['vk'])).toBe('vk');
    expect(classOf('勉強する', ['vs-i'])).toBe('vs');
  });

  it('falls back to the ending, with the godan verbs in る that look ichidan', () => {
    expect(classOf('帰る')).toBe('v5');
    expect(classOf('知る')).toBe('v5');
    expect(classOf('起きる')).toBe('v1');
    expect(classOf('寝る', undefined, 'ねる')).toBe('v1');
    expect(classOf('見る', [], 'みる')).toBe('v1');
    expect(classOf('切る', undefined, 'きる')).toBe('v5');
    expect(classOf('高い')).toBe('adj-i');
  });
});

describe('conjugateAdjective', () => {
  it.each([
    ['高い', 'desu', '高いです'],
    ['高い', 'katta', '高かった'],
    ['高い', 'kattaDesu', '高かったです'],
    ['高い', 'kunai', '高くない'],
    ['高い', 'kunakatta', '高くなかった'],
    ['高い', 'kute', '高くて'],
    ['いい', 'katta', 'よかった'],
    ['いい', 'kunai', 'よくない'],
    ['たかい', 'kute', 'たかくて'],
  ] as const)('%s in %s is %s', (dict, form, expected) => {
    const cls = classOf(dict);
    expect(cls && conjugateAdjective(dict, cls, form as AdjectiveForm)[0]).toBe(expected);
  });

  it('gives nothing for a verb', () => {
    expect(conjugateAdjective('食べる', 'v1', 'kute')).toEqual([]);
  });
});

describe('levels', () => {
  it('asks an N5 learner only for N5 forms', () => {
    const n5 = formsAt(5);
    expect(n5).toContain('te');
    expect(n5).toContain('nai');
    expect(n5).not.toContain('potential');
    expect(n5).not.toContain('passive');
    expect(n5).not.toContain('volitional');
  });

  it('adds the N4 forms at N4 and keeps them at N3', () => {
    expect(formsAt(4)).toEqual(expect.arrayContaining(['potential', 'passive', 'ba', 'te']));
    expect(formsAt(3)).toHaveLength(Object.keys(FORM_LEVEL).length);
  });
});
