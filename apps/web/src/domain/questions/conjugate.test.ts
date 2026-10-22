import { describe, expect, it } from 'vitest';
import { GRAMMAR_CATALOGUE } from '../grammar/catalogue.ts';
import type { Sentence, Token } from '../types.ts';
import { realiseAt } from './blank.ts';
import { classOfForm, classOfPos, type Inflection, inflect, politeNegative } from './conjugate.ts';
import { attachOf, kindsBefore, shapesOf } from './grammar-shape.ts';

const first = (dict: string, form: Inflection) => {
  const cls = classOfForm(dict);
  return cls ? inflect(dict, cls, form)[0] : undefined;
};

describe('inflect', () => {
  it.each([
    ['もらう', 'politePast', 'もらいました'],
    ['くれる', 'politePast', 'くれました'],
    ['あげる', 'te', 'あげて'],
    ['行く', 'te', '行って'],
    ['行く', 'past', '行った'],
    ['読む', 'te', '読んで'],
    ['泳ぐ', 'past', '泳いだ'],
    ['話す', 'neg', '話さない'],
    ['買う', 'neg', '買わない'],
    ['待つ', 'volitional', '待とう'],
    ['帰る', 'polite', '帰ります'],
    ['勉強する', 'politeNeg', '勉強しません'],
    ['来る', 'neg', '来ない'],
    ['くる', 'polite', 'きます'],
    ['くる', 'neg', 'こない'],
    ['ある', 'neg', 'ない'],
    ['くださる', 'politePast', 'くださいました'],
    ['高い', 'past', '高かった'],
    ['高い', 'polite', '高いです'],
    ['てもいい', 'past', 'てもよかった'],
    ['なければならない', 'polite', 'なければなりません'],
    ['かもしれない', 'polite', 'かもしれません'],
    ['に違いない', 'polite', '違いありません'],
    ['つもりだ', 'politePast', 'つもりでした'],
  ] as const)('%s in %s is %s', (dict, form, expected) => {
    expect(first(dict, form)).toContain(expected);
  });

  it('gives nothing for a form that does not exist', () => {
    expect(first('ある', 'tai')).toBeUndefined();
    expect(first('てある', 'neg')).toBeUndefined();
    expect(first('ください', 'polite')).toBeUndefined();
    expect(inflect('食べる', 'v1', 'polite')).toEqual(['食べます']);
    expect(inflect('x', 'v1', 'polite')).toEqual([]);
  });

  it('says ません for verbs and ありません after a particle', () => {
    expect(politeNegative('行か')).toBe('行きません');
    expect(politeNegative('こ')).toBe('きません');
    expect(politeNegative('では')).toBe('ではありません');
    expect(politeNegative('高く')).toBe('高くありません');
  });

  it('reads the class from JMdict tags and from form endings', () => {
    expect(classOfPos(['v5k-s', 'vi'])).toBe('v5k-s');
    expect(classOfPos(['v5m'])).toBe('v5');
    expect(classOfPos(['v1', 'vt'])).toBe('v1');
    expect(classOfPos(['vs-i'])).toBe('vs');
    expect(classOfPos(['adj-ix'])).toBe('adj-ix');
    expect(classOfPos(['n', 'vs'])).toBeUndefined();
    expect(classOfForm('帰る')).toBe('v5');
    expect(classOfForm('いる')).toBe('v1');
    expect(classOfForm('ために')).toBeUndefined();
    expect(classOfForm('でしょう')).toBeUndefined();
    expect(classOfForm('ずつ')).toBeUndefined();
    expect(classOfForm('だけでなく')).toBeUndefined();
  });
});

const tok = (surface: string, pos: string, start: number, base = surface): Token => ({
  surface,
  reading: surface,
  base,
  pos,
  start,
});

describe('realiseAt', () => {
  const tokens = [
    tok('何', 'pronoun', 0),
    tok('を', 'particle', 1),
    tok('もらい', 'verb', 2, 'もらう'),
    tok('まし', 'auxiliary', 5, 'ます'),
    tok('た', 'auxiliary', 7),
    tok('か', 'particle', 8),
  ];
  const s: Sentence = {
    id: 's',
    text: '何をもらいましたか',
    source: 'tatoeba',
    tokens,
    wordIds: [],
    verified: true,
  };

  it('takes the longest form that ends on a token boundary', () => {
    expect(realiseAt(s, 2, 'もらう', 'v5')).toMatchObject({
      text: 'もらいました',
      inflection: 'politePast',
      from: 2,
      to: 8,
    });
  });

  it('never stops at a stem', () => {
    expect(realiseAt(s, 2, 'もら', undefined)).toBeUndefined();
    expect(realiseAt(s, 9, 'もらう', 'v5')).toBeUndefined();
  });
});

describe('form shapes', () => {
  const entry = (id: string) => GRAMMAR_CATALOGUE.find((e) => e.id === id);

  it('keeps the て of a te-form and the を of a giving verb outside the blank', () => {
    expect(shapesOf(entry('te-morau') ?? GRAMMAR_CATALOGUE[0]!)).toMatchObject([
      { lead: 'て', core: 'もらう', cls: 'v5' },
    ]);
    expect(shapesOf(entry('morau') ?? GRAMMAR_CATALOGUE[0]!)).toMatchObject([
      { lead: 'を', core: 'もらう' },
    ]);
  });

  it('reads what a form attaches to from its formation', () => {
    expect([...attachOf('V-dictionary / V-ない + ことにする', 'ことにする')].sort()).toEqual([
      'dict',
      'nai',
    ]);
    expect([...attachOf('V-ない + でください', 'ないでください')]).toEqual(['naistem']);
    expect([...attachOf('V-stem / い-adj (drop い) / な-adj + すぎる', 'すぎる')].sort()).toEqual([
      'adjstem',
      'stem',
    ]);
    expect([...attachOf('person + に + V-て + もらう', 'てもらう')]).toContain('te');
  });

  it('reads what the text before a blank ends in', () => {
    const tokens = [tok('食べ', 'verb', 0, '食べる'), tok('て', 'particle', 2)];
    expect([...kindsBefore(tokens, 1)].sort()).toEqual(['naistem', 'stem']);
    expect([...kindsBefore(tokens, 2)]).toEqual(['te']);
    expect([...kindsBefore([tok('行か', 'verb', 0, '行く')], 1)]).toEqual(['naistem']);
    expect([...kindsBefore([tok('行く', 'verb', 0)], 1)].sort()).toEqual(['dict', 'plain']);
    expect([...kindsBefore([tok('遅', 'adjective', 0, '遅い')], 1)]).toEqual(['adjstem']);
    expect([...kindsBefore([], 0)]).toEqual([]);
    // だ after a noun is the copula, after a verb a past.
    expect([...kindsBefore([tok('女優', 'noun', 0), tok('だ', 'auxiliary', 2)], 2)]).toEqual([]);
    expect([
      ...kindsBefore([tok('読ん', 'verb', 0, '読む'), tok('だ', 'auxiliary', 2)], 2),
    ]).toContain('ta');
  });
});
