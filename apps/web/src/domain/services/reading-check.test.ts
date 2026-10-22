import { describe, expect, it } from 'vitest';
import { ALL_WORDS, S, W } from '../../test/reading-fixtures.ts';
import type { Token } from '../types.ts';
import {
  answerSpan,
  isLoneKanji,
  preferredReading,
  readingFits,
  spanReadings,
  spanVariants,
  stemReading,
} from './reading-check.ts';

const token = (surface: string, reading: string, base = surface, pos = 'noun'): Token => ({
  surface,
  reading,
  base,
  pos,
  start: 0,
});

describe('readingFits', () => {
  it('accepts a dictionary reading, in either kana script', () => {
    expect(readingFits(token('駅', 'えき'), W.eki)).toBe(true);
    expect(readingFits(token('駅', 'エキ'), W.eki)).toBe(true);
  });

  it('compares the stem of a conjugated form', () => {
    expect(readingFits(token('待っ', 'まっ', '待つ', 'verb'), W.matsu)).toBe(true);
    expect(readingFits(token('待っ', 'もっ', '待つ', 'verb'), W.matsu)).toBe(false);
    expect(readingFits(token('読み', 'よみ', '読む', 'verb'), W.yomu)).toBe(true);
  });

  it('knows the stems of 来る', () => {
    expect(readingFits(token('来', 'き', '来る', 'verb'), W.kuru)).toBe(true);
    expect(readingFits(token('来', 'ら', '来る', 'verb'), W.kuru)).toBe(false);
  });

  it('rejects readings JMdict does not have', () => {
    expect(readingFits(token('金', 'きむ'), W.kane)).toBe(false);
    expect(readingFits(token('', ''), W.kane)).toBe(false);
  });
});

describe('lone kanji', () => {
  it('is a single kanji in dictionary form', () => {
    expect(isLoneKanji(token('間', 'ま'))).toBe(true);
    expect(isLoneKanji(token('来', 'き', '来る', 'verb'))).toBe(false);
    expect(isLoneKanji(token('駅前', 'えきまえ'))).toBe(false);
  });

  it('prefers the entry on the easiest JLPT list, then common, then lowest id', () => {
    expect(preferredReading('間', ALL_WORDS)).toBe('あいだ');
    expect(preferredReading('鬱', ALL_WORDS)).toBeUndefined();
    const { jlpt: _jlpt, ...plain } = W.ma;
    const rare = { ...plain, id: '99', common: false, readings: ['かん'] };
    expect(preferredReading('間', [rare, plain])).toBe('ま');
    expect(preferredReading('間', [{ ...plain, id: '100' }, plain])).toBe('ま');
  });
});

describe('answer span', () => {
  it('attaches て and auxiliaries to verbs only', () => {
    const verb = S.waiting.tokens.findIndex((t) => t.surface === '待っ');
    expect(answerSpan(S.waiting, verb)).toEqual([verb, verb + 1]);
    const yomi = S.waiting.tokens.findIndex((t) => t.surface === '読み');
    expect(spanReadings(S.waiting, yomi)).toEqual(['よみ', 'よみまし', 'よみました']);
    const noun = S.waiting.tokens.findIndex((t) => t.surface === '間');
    expect(answerSpan(S.waiting, noun)).toEqual([noun]);
  });

  it('reads the kanji stem', () => {
    expect(stemReading('待っ', 'まっ')).toBe('ま');
    expect(stemReading('駅', 'えき')).toBe('えき');
    expect(stemReading('食べる', 'たべ')).toBe('たべ');
  });
});

describe('spanVariants (D56)', () => {
  it('lists a target’s valid variants after its preferred reading, with any endings', () => {
    const nihonjin = { ...token('日本人', 'にほんじん'), variants: ['にっぽんじん'] };
    const sentence = {
      id: 's',
      text: '日本人です',
      source: 'tatoeba' as const,
      tokens: [nihonjin, token('です', 'です', 'です', 'auxiliary')],
      wordIds: [],
      verified: true,
    };
    expect(spanVariants(sentence, 0)).toEqual(['にっぽんじん']);
    expect(spanReadings(sentence, 0)).toEqual(['にほんじん']);
    const adjective = { ...token('大き', 'おおき', '大きい', 'adjective'), variants: ['でか'] };
    const ending = token('かっ', 'かっ', 'かっ', 'auxiliary');
    const past = { ...sentence, tokens: [adjective, ending] };
    expect(spanVariants(past, 0)).toEqual(['でか', 'でかかっ']);
    expect(spanVariants(S.waiting, 0)).toEqual([]);
  });
});
