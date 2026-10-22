import { describe, expect, it } from 'vitest';
import { fakeVerifier } from './testing/context.ts';
import {
  checkReading,
  checkReadings,
  isSingleKanji,
  kanjiOnly,
  keepVerifiedSentences,
} from './verify.ts';

describe('checkReading', () => {
  const lang = fakeVerifier();

  it('marks a dictionary reading verified', async () => {
    expect(await checkReading(lang, { surface: '紹介', reading: 'しょうかい' })).toEqual({
      surface: '紹介',
      reading: 'しょうかい',
      verified: true,
    });
  });

  it('marks a mismatch unverified and never swaps in the expected reading', async () => {
    expect(await checkReading(lang, { surface: '紹介', reading: 'しょかい' })).toEqual({
      surface: '紹介',
      reading: 'しょかい',
      verified: false,
    });
  });

  it('marks unknown surfaces and verifier errors unverified', async () => {
    expect((await checkReading(lang, { surface: '謎', reading: 'なぞ' })).verified).toBe(false);
    const broken = {
      verifyReading: async () => {
        throw new Error('tokenizer down');
      },
    };
    expect((await checkReading(broken, { surface: '本', reading: 'ほん' })).verified).toBe(false);
  });

  it('trims and de-duplicates claims', async () => {
    const claims = [
      { surface: ' 本', reading: 'ほん ' },
      { surface: '本', reading: 'ほん' },
      { surface: '本', reading: 'もと' },
    ];
    expect(await checkReadings(lang, claims)).toEqual([
      { surface: '本', reading: 'ほん', verified: true },
      { surface: '本', reading: 'もと', verified: false },
    ]);
  });
});

describe('keepVerifiedSentences', () => {
  it('drops sentences with a failed reading or without their target', () => {
    const sentences = [
      { text: '駅で待つ。', target: '待つ' },
      { text: '紹介する。', target: '紹介' },
      { text: '本を読む。', target: '待つ' },
    ];
    const readings = [
      { surface: '待つ', reading: 'まつ', verified: true },
      { surface: '紹介', reading: 'しょかい', verified: false },
    ];
    expect(keepVerifiedSentences(sentences, readings)).toEqual([sentences[0]]);
  });
});

describe('kanji candidates', () => {
  it('keeps single kanji only, de-duplicated', () => {
    expect(kanjiOnly(['待', '待つ', 'ま', '持', '待', 'A', '々'], (char) => char)).toEqual([
      '待',
      '持',
    ]);
    expect(isSingleKanji('𠮟')).toBe(true);
  });
});
