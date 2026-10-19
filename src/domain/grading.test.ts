import { describe, expect, it } from 'vitest';
import { gradeReading, nearMissType } from './grading.ts';
import { devoice, shortenVowels, toKanaFold } from './kana.ts';

describe('gradeReading', () => {
  it.each([
    // accepted, given, verdict, errorType
    [['がっこう'], 'がっこう', 'correct', undefined],
    [['がっこう'], ' がっこう ', 'correct', undefined],
    [['がっこう'], 'ガッコウ', 'correct', 'kana-variant'],
    [['ガッコウ'], 'がっこう', 'correct', 'kana-variant'],
    [['がっこう'], 'gakkou', 'correct', undefined],
    [['しょうかい'], 'shoukai', 'correct', undefined],
    [['かあど'], 'カード', 'correct', 'kana-variant'],
    [['カード'], 'ka-do', 'correct', undefined],
    [['いく', 'ゆく'], 'ゆく', 'correct', undefined],
    // long vowels
    [['しょうかい'], 'しょかい', 'near-miss', 'long-vowel'],
    [['いっしょ'], 'いっしょう', 'near-miss', 'long-vowel'],
    [['おばあさん'], 'おばさん', 'near-miss', 'long-vowel'],
    [['おばさん'], 'おばあさん', 'near-miss', 'long-vowel'],
    [['せんせい'], 'せんせ', 'near-miss', 'long-vowel'],
    [['とおい'], 'とい', 'near-miss', 'long-vowel'],
    [['びょういん'], 'びよういん', 'wrong', 'other'],
    [['びょういん'], 'びょいん', 'near-miss', 'long-vowel'],
    // sokuon
    [['がっこう'], 'がこう', 'near-miss', 'sokuon'],
    [['きって'], 'きて', 'near-miss', 'sokuon'],
    [['きて'], 'きって', 'near-miss', 'sokuon'],
    [['ざっし'], 'zasshi', 'correct', undefined],
    [['ざっし'], 'zashi', 'near-miss', 'sokuon'],
    // rendaku
    [['てがみ'], 'てかみ', 'near-miss', 'rendaku'],
    [['ひとびと'], 'ひとひと', 'near-miss', 'rendaku'],
    [['にほんじん'], 'にほんしん', 'near-miss', 'rendaku'],
    [['いっぽん'], 'いっほん', 'near-miss', 'rendaku'],
    [['にほんご'], 'にぼんご', 'near-miss', 'rendaku'],
    // a voicing change on the first mora is not rendaku
    [['てんき'], 'でんき', 'wrong', 'other'],
    [['でんき'], 'てんき', 'wrong', 'other'],
    [['かみ'], 'がみ', 'wrong', 'other'],
    [['ほん'], 'ぽん', 'wrong', 'other'],
    [['ぶた'], 'ふた', 'wrong', 'other'],
    // other
    [['がっこう'], 'がくせい', 'wrong', 'other'],
    [['がっこう'], '', 'wrong', 'other'],
    [['がっこう'], 'がこ', 'wrong', 'other'],
    [[], 'がっこう', 'wrong', 'other'],
  ] as const)('%j / %s → %s %s', (accepted, given, verdict, errorType) => {
    const grade = gradeReading(accepted, given);
    expect(grade.verdict).toBe(verdict);
    expect(grade.errorType).toBe(errorType);
  });

  it('flags a lookalike word reading as wrong-kanji (待って read as 持って)', () => {
    expect(gradeReading(['まって'], 'もって', ['もって'])).toEqual({
      verdict: 'wrong',
      errorType: 'wrong-kanji',
      expected: 'まって',
      given: 'もって',
    });
  });

  it('prefers an exact match over a confusable one', () => {
    expect(gradeReading(['もって'], 'もって', ['もって']).verdict).toBe('correct');
  });

  it('accepts confusables written in katakana or romaji', () => {
    expect(gradeReading(['まって'], 'motte', ['モッテ']).errorType).toBe('wrong-kanji');
  });

  it('reports the normalised forms it compared', () => {
    expect(gradeReading(['ショウカイ'], 'shokai')).toEqual({
      verdict: 'near-miss',
      errorType: 'long-vowel',
      expected: 'しょうかい',
      given: 'しょかい',
    });
  });

  it('checks every accepted reading for a near-miss', () => {
    const grade = gradeReading(['ひとびと', 'にんにん'], 'ひとひと');
    expect(grade).toMatchObject({ verdict: 'near-miss', expected: 'ひとびと' });
  });
});

describe('gradeReading with variants (D56)', () => {
  it('grades a valid variant correct and names the preferred reading', () => {
    const accepted = ['にほんじん', 'にっぽんじん'];
    expect(gradeReading(accepted, 'にっぽんじん', [], ['にっぽんじん'])).toEqual({
      verdict: 'correct',
      expected: 'にっぽんじん',
      given: 'にっぽんじん',
      variantOf: 'にほんじん',
    });
    expect(gradeReading(accepted, 'nihonjin', [], ['にっぽんじん']).variantOf).toBeUndefined();
    expect(gradeReading(accepted, 'ニッポンジン', [], ['にっぽんじん'])).toMatchObject({
      verdict: 'correct',
      errorType: 'kana-variant',
      variantOf: 'にほんじん',
    });
  });
});

describe('nearMissType', () => {
  it('returns nothing for identical readings', () => {
    expect(nearMissType('がっこう', 'がっこう')).toBeUndefined();
  });
});

describe('kana helpers', () => {
  it.each([
    ['しょうかい', 'しょかい'],
    ['おばあさん', 'おばさん'],
    ['せんせい', 'せんせ'],
    ['おおきい', 'おき'],
    ['らあめん', 'らめん'],
    ['きって', 'きって'],
  ])('shortenVowels(%s) = %s', (kana, short) => {
    expect(shortenVowels(kana)).toBe(short);
  });

  it.each([
    ['てがみ', 'てかみ'],
    ['いっぽん', 'いっほん'],
    ['ひとびと', 'ひとひと'],
  ])('devoice(%s) = %s', (kana, plain) => {
    expect(devoice(kana)).toBe(plain);
  });

  it.each([
    ['ガッコウ', 'がっこう'],
    ['ka-do', 'かあど'],
    ['ラーメン', 'らあめん'],
    ['ga kkou', 'がっこう'],
  ])('toKanaFold(%s) = %s', (text, kana) => {
    expect(toKanaFold(text)).toBe(kana);
  });
});
