import { describe, expect, it } from 'vitest';
import { GRAMMAR_CATALOGUE } from '../grammar/catalogue.ts';
import { classOf } from './forms.ts';
import { applyPattern, type Cue, PATTERN_RULES, patternRule, takesCue } from './patterns.ts';

const cue = (written: string, reading: string, noun = false): Cue => ({
  written,
  reading,
  cls: noun ? undefined : classOf(written, undefined, reading),
});

const apply = (grammarId: string, c: Cue) => {
  const rule = patternRule(grammarId);
  if (!rule) throw new Error(`no rule for ${grammarId}`);
  return applyPattern(rule, c);
};

const TABERU = cue('食べる', 'たべる');
const IKU = cue('行く', 'いく');
const GAKUSEI = cue('学生', 'がくせい', true);

describe('PATTERN_RULES', () => {
  it('names catalogue points only, each once, with a shape', () => {
    const ids = new Set(GRAMMAR_CATALOGUE.map((e) => e.id));
    for (const rule of PATTERN_RULES) {
      expect(ids.has(rule.grammarId), rule.grammarId).toBe(true);
      expect(rule.shape).toMatch(/^〜/u);
      expect(rule.ends.length).toBeGreaterThan(0);
    }
    expect(new Set(PATTERN_RULES.map((r) => r.grammarId)).size).toBe(PATTERN_RULES.length);
  });

  it('gives every verb rule an answer for an ichidan, a godan and an irregular verb', () => {
    const verbs = [TABERU, cue('書く', 'かく'), cue('する', 'する'), cue('来る', 'くる')];
    for (const rule of PATTERN_RULES.filter((r) => r.takes === 'verb')) {
      for (const v of verbs)
        expect(applyPattern(rule, v), `${rule.grammarId} ${v.written}`).toBeDefined();
    }
  });
});

describe('applyPattern', () => {
  it.each([
    ['te-mo-ii', TABERU, '食べてもいいですか', 'たべてもいいですか'],
    ['te-mo-ii', IKU, '行ってもいいですか', 'いってもいいですか'],
    ['te-wa-ikenai', cue('読む', 'よむ'), '読んではいけません', 'よんではいけません'],
    ['te-kudasai', cue('待つ', 'まつ'), '待ってください', 'まってください'],
    ['naide-kudasai', cue('話す', 'はなす'), '話さないでください', 'はなさないでください'],
    ['masen-ka', IKU, '行きませんか', 'いきませんか'],
    ['tai', cue('飲む', 'のむ'), '飲みたいです', 'のみたいです'],
    ['ta-koto-ga-aru', IKU, '行ったことがあります', 'いったことがあります'],
    [
      'nakereba-naranai',
      cue('勉強する', 'べんきょうする'),
      '勉強しなければなりません',
      'べんきょうしなければなりません',
    ],
    ['nakute-mo-ii', cue('来る', 'くる'), '来なくてもいいです', 'こなくてもいいです'],
    ['you-to-omou', TABERU, '食べようと思います', 'たべようとおもいます'],
    ['you-ni-naru', cue('泳ぐ', 'およぐ'), '泳げるようになりました', 'およげるようになりました'],
    ['passive', cue('書く', 'かく'), '書かれる', 'かかれる'],
    ['ni-iku', cue('買う', 'かう'), '買いにいきます', 'かいにいきます'],
    ['ja-nai', GAKUSEI, '学生じゃありません', 'がくせいじゃありません'],
    ['ka-question', GAKUSEI, '学生ですか', 'がくせいですか'],
    ['adj-ku-nai', cue('高い', 'たかい'), '高くないです', 'たかくないです'],
    ['adj-katta', cue('いい', 'いい'), 'よかったです', 'よかったです'],
  ])('%s on %s', (id, c, written, reading) => {
    const answer = apply(id, c);
    expect(answer?.written).toBe(written);
    expect(answer?.reading).toBe(reading);
    expect(answer?.accepted).toContain(written);
    expect(answer?.accepted).toContain(reading);
  });

  it('accepts each usual ending', () => {
    const answer = apply('ja-nai', GAKUSEI);
    expect(answer?.accepted).toEqual(
      expect.arrayContaining(['がくせいではありません', 'がくせいじゃないです']),
    );
    expect(apply('tai', TABERU)?.accepted).toContain('たべたい');
    expect(apply('you-to-omou', IKU)?.accepted).toContain('いこうとおもいます');
    expect(apply('adj-ku-nai', cue('高い', 'たかい'))?.accepted).toContain('たかくありません');
  });

  it('takes only the kind of word the point attaches to', () => {
    const teMoIi = patternRule('te-mo-ii');
    const desu = patternRule('desu');
    if (!teMoIi || !desu) throw new Error('rules');
    expect(takesCue(teMoIi, GAKUSEI)).toBe(false);
    expect(takesCue(desu, TABERU)).toBe(false);
    expect(applyPattern(teMoIi, GAKUSEI)).toBeUndefined();
    expect(applyPattern(patternRule('adj-katta') ?? desu, TABERU)).toBeUndefined();
  });

  it('gives nothing when the form does not exist', () => {
    expect(apply('passive', cue('ある', 'ある'))).toBeUndefined();
    expect(apply('tai', cue('ある', 'ある'))).toBeUndefined();
  });

  it('has no rule for a point without pattern drills', () => {
    expect(patternRule('kara-made')).toBeUndefined();
  });
});
