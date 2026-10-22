import { describe, expect, it } from 'vitest';
import {
  foldKana,
  hasRomaji,
  isKana,
  kanaPrefix,
  normaliseReading,
  toHiragana,
  toKana,
  toKanaIn,
  toKatakana,
} from './kana.ts';

describe('kana', () => {
  it('converts romaji live, keeping a trailing n until final', () => {
    expect(toKana('kon')).toBe('こn');
    expect(toKana('konn')).toBe('こん');
    expect(toKana('kon', true)).toBe('こん');
    expect(toKana('tabemasu')).toBe('たべます');
    expect(toKana('matte')).toBe('まって');
  });

  it('converts between scripts and passes other text through', () => {
    expect(toHiragana('ショウカイ')).toBe('しょうかい');
    expect(toHiragana('shoukai')).toBe('shoukai');
    expect(toHiragana('コーヒー')).toBe('こうひい');
    expect(toKatakana('こーひー')).toBe('コーヒー');
    expect(toHiragana('紹介')).toBe('紹介');
  });

  it('detects kana and romaji', () => {
    expect(isKana('ひらがなカタカナー')).toBe(true);
    expect(isKana('紹介')).toBe(false);
    expect(isKana('')).toBe(false);
    expect(hasRomaji('たべm')).toBe(true);
    expect(hasRomaji('たべ')).toBe(false);
  });

  it('folds katakana to hiragana by code point, keeping ー and other characters', () => {
    expect(foldKana(' コーヒー ')).toBe('こーひー');
    expect(foldKana('ヴァイオリン')).toBe('ゔぁいおりん');
    expect(foldKana('人々')).toBe('人々');
  });

  it('normalises reading claims from romaji, katakana or hiragana', () => {
    expect(normaliseReading('ショウカイ')).toBe('しょうかい');
    expect(normaliseReading(' Shoukai ')).toBe('しょうかい');
    expect(normaliseReading('hon')).toBe('ほん');
    expect(normaliseReading('てがみ')).toBe('てがみ');
  });

  it('takes the kana prefix of partial input', () => {
    expect(kanaPrefix('tabem')).toBe('たべ');
    expect(kanaPrefix('kon')).toBe('こ');
    expect(kanaPrefix('コーh')).toBe('コー');
    expect(kanaPrefix('xyz')).toBe('');
    expect(kanaPrefix('')).toBe('');
  });
});

describe('toKanaIn (C6)', () => {
  it('types hiragana, with capitals as katakana (WanaKana)', () => {
    expect(toKanaIn('koohii', 'hiragana')).toBe('こおひい');
    expect(toKanaIn('KO-HI-', 'hiragana')).toBe('コーヒー');
    expect(toKanaIn('kan', 'hiragana')).toBe('かn');
    expect(toKanaIn('kan', 'hiragana', true)).toBe('かん');
  });

  it('types katakana from any romaji, keeping the kana and kanji already there', () => {
    expect(toKanaIn('ko-hi-', 'katakana')).toBe('コーヒー');
    expect(toKanaIn('学生のpan', 'katakana', true)).toBe('学生のパン');
    expect(toKanaIn('ひらがな', 'katakana')).toBe('ひらがな');
  });
});
