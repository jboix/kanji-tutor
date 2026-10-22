import { describe, expect, it } from 'vitest';
import type { Kanji } from '../../domain/types.ts';
import { ENGLISH } from '../../ui/i18n/load.ts';
import { createTranslator } from '../../ui/i18n/translate.ts';
import { jaSegments, readingsLine, segmentText, wordsLine } from './detail-text.ts';

const t = createTranslator('en', ENGLISH, ENGLISH);

const MATSU: Kanji = {
  char: '待',
  meanings: ['wait'],
  on: ['タイ'],
  kun: ['ま.つ'],
  components: ['彳', '寺'],
};

describe('candidate detail copy', () => {
  it('shows on and kun readings with ・ before okurigana (handwrite.html)', () => {
    expect(segmentText(readingsLine(MATSU))).toBe('タイ · ま・つ');
    expect(segmentText(readingsLine({ ...MATSU, on: ['セイ', 'ショウ', 'ジョウ'], kun: [] }))).toBe(
      'セイ、ショウ',
    );
    expect(segmentText(readingsLine({ ...MATSU, on: [], kun: ['い.きる', 'う.まれる'] }))).toBe(
      'い・きる、う・まれる',
    );
  });

  it('counts your words and names the shared component (handwrite.html)', () => {
    const text = segmentText(
      wordsLine(t, 'en', {
        kanji: MATSU,
        wordCount: 3,
        shared: { component: '寺', with: ['持', '特'] },
      }),
    );
    expect(text).toBe("In 3 of your words. Shares 寺 with 持 and 特, which you've also met.");
  });

  it('lists three kanji and handles one word or none', () => {
    const three = { component: '寺', with: ['持', '特', '時'] };
    expect(segmentText(wordsLine(t, 'en', { kanji: MATSU, wordCount: 1, shared: three }))).toBe(
      "In 1 of your words. Shares 寺 with 持, 特 and 時, which you've also met.",
    );
    const one = { component: '寺', with: ['持'] };
    expect(segmentText(wordsLine(t, 'en', { kanji: MATSU, wordCount: 0, shared: one }))).toBe(
      "Not in your words yet. Shares 寺 with 持, which you've also met.",
    );
    expect(segmentText(wordsLine(t, 'en', { kanji: MATSU, wordCount: 0 }))).toBe(
      'Not in your words yet.',
    );
  });

  it('marks Japanese runs so they are set in Klee One', () => {
    expect(
      wordsLine(t, 'en', { kanji: MATSU, wordCount: 2, shared: { component: '寺', with: ['持'] } }),
    ).toContainEqual({ ja: '寺' });
    expect(jaSegments('寺 on the right, read まつ')).toEqual([
      { ja: '寺' },
      ' on the right, read ',
      { ja: 'まつ' },
    ]);
    expect(jaSegments('no Japanese')).toEqual(['no Japanese']);
  });
});
