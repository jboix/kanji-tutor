import { describe, expect, it } from 'vitest';
import { storyPieces } from './story-ruby.ts';

const read = (surface: string, reading: string, verified = true) => ({
  surface,
  reading,
  verified,
});

describe('storyPieces', () => {
  it('puts each confirmed reading over its kanji, okurigana left bare', () => {
    const pieces = storyPieces('木の下で休みました。', [
      read('木', 'き'),
      read('下', 'した'),
      read('休みました', 'やすみました'),
    ]);
    expect(pieces).toEqual([
      { before: '', base: '木', reading: 'き', after: '' },
      { text: 'の' },
      { before: '', base: '下', reading: 'した', after: '' },
      { text: 'で' },
      { before: '', base: '休', reading: 'やす', after: 'みました' },
      { text: '。' },
    ]);
  });

  it('prefers the longest word, and never shows an unconfirmed reading', () => {
    const pieces = storyPieces('日本語と山。', [
      read('日', 'ひ'),
      read('日本語', 'にほんご'),
      read('山', 'さん', false),
    ]);
    expect(pieces).toEqual([
      { before: '', base: '日本語', reading: 'にほんご', after: '' },
      { text: 'と山。' },
    ]);
  });
});
