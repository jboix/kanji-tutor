import { describe, expect, it } from 'vitest';
import { curriculumRepos } from '../../test/fixture-curriculum.ts';
import type { KnowledgeLevel } from '../types.ts';
import { kanjiWall, wallAround } from './kanji-wall.ts';

const row = (kanji: string, reading: string, level: KnowledgeLevel) => ({
  id: `${kanji}:${reading}`,
  kanji,
  reading,
  level,
  wordIds: [],
});

describe('the kanji wall', () => {
  it("tiles the learner's level, most frequent first, every kanji not yet read at first", async () => {
    const repos = await curriculumRepos();
    const wall = await kanjiWall(repos);
    expect(wall.level).toBe(5);
    expect(wall.tiles.slice(0, 3).map((tile) => tile.char)).toEqual(['日', '一', '国']);
    expect(wall.tiles.every((tile) => tile.state === 'not-started')).toBe(true);
    expect(wall.known).toBe(0);
  });

  it("reads a kanji's state from its best reading", async () => {
    const repos = await curriculumRepos();
    await repos.kanjiReadings.putMany([
      row('日', 'ニチ', 1),
      row('日', 'ひ', 3),
      row('一', 'イチ', 2),
    ]);
    const { tiles, known } = await kanjiWall(repos);
    const state = (char: string) => tiles.find((tile) => tile.char === char)?.state;
    expect([state('日'), state('一'), state('国')]).toEqual(['known', 'learning', 'not-started']);
    expect(known).toBe(1);
  });

  it("rings the first kanji of the current unit's words not yet read", async () => {
    const repos = await curriculumRepos();
    expect((await kanjiWall(repos)).current).toBe('学');
    await repos.kanjiReadings.putMany([row('学', 'ガク', 3)]);
    expect((await kanjiWall(repos)).current).not.toBe('学');
  });

  it('shows another level when asked', async () => {
    const repos = await curriculumRepos();
    const wall = await kanjiWall(repos, 4);
    expect(wall.level).toBe(4);
    expect(wall.tiles.length).toBeGreaterThan(0);
  });
});

describe('wallAround', () => {
  const tiles = [...'一二三四五六七八九十'].map((char) => ({
    char,
    state: 'known' as const,
  }));
  const chars = (char: string, size: number) =>
    wallAround(tiles, char, size)
      .map((tile) => tile.char)
      .join('');

  it('centres the kanji, and keeps the glimpse full at either end', () => {
    expect(chars('五', 3)).toBe('四五六');
    expect(chars('一', 3)).toBe('一二三');
    expect(chars('十', 3)).toBe('八九十');
  });

  it('gives the whole wall when it is smaller, and nothing for a kanji not on it', () => {
    expect(chars('五', 21)).toBe('一二三四五六七八九十');
    expect(chars('百', 3)).toBe('');
  });
});
