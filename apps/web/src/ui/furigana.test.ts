import { describe, expect, it } from 'vitest';
import { hasKanji, splitFurigana } from './furigana.ts';

describe('splitFurigana', () => {
  it('puts the reading over the kanji and leaves okurigana outside', () => {
    expect(splitFurigana('待って', 'まって')).toEqual({
      before: '',
      base: '待',
      reading: 'ま',
      after: 'って',
    });
  });

  it('handles leading kana', () => {
    expect(splitFurigana('お茶', 'おちゃ')).toEqual({
      before: 'お',
      base: '茶',
      reading: 'ちゃ',
      after: '',
    });
  });

  it('keeps the whole word for a jukugo', () => {
    expect(splitFurigana('紹介', 'しょうかい')).toEqual({
      before: '',
      base: '紹介',
      reading: 'しょうかい',
      after: '',
    });
  });

  it('never leaves the base or reading empty', () => {
    const parts = splitFurigana('生きる', 'きる');
    expect(parts?.base.length).toBeGreaterThan(0);
    expect(parts?.reading.length).toBeGreaterThan(0);
  });

  it('returns null for kana-only text or a missing reading', () => {
    expect(splitFurigana('ない', 'ない')).toBeNull();
    expect(splitFurigana('本', '')).toBeNull();
  });

  it('detects kanji, including 々', () => {
    expect(hasKanji('様々')).toBe(true);
    expect(hasKanji('々')).toBe(true);
    expect(hasKanji('ひらがな カタカナ')).toBe(false);
  });
});
