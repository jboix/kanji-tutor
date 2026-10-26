import { describe, expect, it } from 'vitest';
import { SEASON_WORDS, WORD } from './season-words.ts';
import { seasonAt, seasonExample } from './seasons.ts';

const on = (month: number, day: number) => new Date(2026, month - 1, day, 12).getTime();

describe('the word of the season', () => {
  it('takes the word whose fortnight the date is in, and its third of the season', () => {
    expect(seasonAt(on(10, 26))).toMatchObject({
      word: { written: '紅葉' },
      season: 'autumn',
      phase: 'late',
    });
    expect(seasonAt(on(2, 4))).toMatchObject({
      word: { written: '梅' },
      season: 'spring',
      phase: 'early',
    });
    expect(seasonAt(on(8, 7))).toMatchObject({
      word: { written: '花火' },
      season: 'summer',
      phase: 'late',
    });
  });

  it('runs over the turn of the year', () => {
    expect(seasonAt(on(12, 31))).toMatchObject({ word: { written: '大掃除' }, phase: 'mid' });
    expect(seasonAt(on(1, 3))).toMatchObject({
      word: { written: 'お正月' },
      season: 'winter',
      phase: 'mid',
    });
    expect(seasonAt(on(1, 6))).toMatchObject({
      word: { written: '雪' },
      season: 'winter',
      phase: 'late',
    });
  });

  it('keeps the words in calendar order, each example holding its word once', () => {
    const keys = SEASON_WORDS.map(({ from: [m, d] }) => m * 100 + d);
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
    expect(new Set(keys).size).toBe(keys.length);
    for (const word of SEASON_WORDS) {
      expect(
        word.example.filter((piece) => piece === WORD),
        word.written,
      ).toHaveLength(1);
    }
  });

  it('builds the example as tokens, the word resolved to its dictionary id', () => {
    const word = SEASON_WORDS.find((w) => w.written === '紅葉');
    if (!word) throw new Error('fixture');
    const { text, tokens, index } = seasonExample(word, '2857870');
    expect(text).toBe('山の紅葉がきれいです。');
    expect(tokens[index]).toMatchObject({
      surface: '紅葉',
      reading: 'もみじ',
      wordId: '2857870',
      start: 2,
    });
    expect(tokens[0]).toMatchObject({ surface: '山', reading: 'やま', start: 0 });
    expect(tokens.at(-1)).toMatchObject({ surface: '。', pos: 'symbol' });
  });
});
