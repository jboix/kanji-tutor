import { describe, expect, it } from 'vitest';
import { curriculumRepos } from '../../test/fixture-curriculum.ts';
import type { Kanji } from '../types.ts';
import { filterTiles, readingMatch, searchWall } from './kanji-wall-search.ts';

const kanji = (char: string, on: string[], kun: string[]): Kanji => ({
  char,
  meanings: [],
  on,
  kun,
  components: [],
});

const NEAR = kanji('近', ['キン', 'コン'], ['ちか.い']);

describe('readingMatch', () => {
  it("matches on'yomi in hiragana and kun'yomi without its dot, a whole reading first", () => {
    expect(readingMatch(NEAR, 'きん')).toBe(0);
    expect(readingMatch(NEAR, 'ちかい')).toBe(0);
    expect(readingMatch(NEAR, 'ちか')).toBe(1);
  });

  it('finds the kanji of a word spelled with its stem, but not from a one-kana stem', () => {
    expect(readingMatch(NEAR, 'ちかく')).toBe(2);
    expect(readingMatch(kanji('血', ['ケツ'], ['ち']), 'ちかく')).toBeUndefined();
    expect(readingMatch(NEAR, 'えき')).toBeUndefined();
  });
});

describe('searchWall', () => {
  it('finds kanji by a reading typed in romaji or kana, with their state', async () => {
    const repos = await curriculumRepos();
    await repos.kanjiReadings.putMany([
      { id: '駅:エキ', kanji: '駅', reading: 'エキ', level: 3, wordIds: [] },
    ]);
    expect(await searchWall(repos, 'eki')).toContainEqual({ char: '駅', state: 'known' });
    expect((await searchWall(repos, 'ちかい'))[0]).toEqual({ char: '近', state: 'not-started' });
  });

  it('finds kanji typed as themselves, and nothing for an empty query', async () => {
    const repos = await curriculumRepos();
    expect((await searchWall(repos, '学日')).map((t) => t.char).sort()).toEqual(['学', '日']);
    expect(await searchWall(repos, '  ')).toEqual([]);
  });
});

describe('filterTiles', () => {
  it('keeps the tiles in one state, or all', () => {
    const tiles = [
      { char: '日', state: 'known' as const },
      { char: '一', state: 'learning' as const },
      { char: '国', state: 'not-started' as const },
    ];
    expect(filterTiles(tiles, 'learning')).toEqual([{ char: '一', state: 'learning' }]);
    expect(filterTiles(tiles, 'all')).toHaveLength(3);
  });
});
