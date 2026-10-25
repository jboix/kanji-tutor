import { describe, expect, it } from 'vitest';
import { NOW, readingRepos } from '../../test/reading-fixtures.ts';
import type { KanjiCardDrill } from '../drills/index.ts';
import type { Repos } from '../repos.ts';
import type { KanjiReading, KnowledgeLevel } from '../types.ts';
import { kanjiCardSession } from './kanji-cards.ts';

const row = (kanji: string, reading: string, level: KnowledgeLevel): KanjiReading => ({
  id: `${kanji}:${reading}`,
  kanji,
  reading,
  level,
  wordIds: [],
});

async function withKnown(rows: KanjiReading[], settings = {}): Promise<Repos> {
  const repos = await readingRepos(settings);
  await repos.kanjiReadings.putMany(rows);
  return repos;
}

const drills = async (repos: Repos) =>
  (await kanjiCardSession(repos, NOW)).map((card) => card.drill as KanjiCardDrill);

const KNOWN = [
  row('学', 'ガク', 4),
  row('生', 'セイ', 3),
  row('生', 'い.きる', 1),
  row('本', 'ホン', 4),
  row('駅', 'エキ', 2),
  row('待', 'ま.つ', 2),
  row('先', 'セン', 3),
];

describe('A round of kanji cards (Start → Kanji)', () => {
  it('cards the kanji the learner reads, taking turns between reading and writing', async () => {
    const cards = await drills(await withKnown(KNOWN));
    expect(cards.map((d) => d.kanji).sort()).toEqual(['先', '学', '待', '本', '生', '駅']);
    expect(cards.map((d) => d.direction).slice(0, 4)).toEqual(['read', 'write', 'read', 'write']);
    expect(cards.find((d) => d.kanji === '生')?.readings.slice(0, 2)).toEqual(['セイ', 'い.きる']);
  });

  it('puts the least known first, and kanji missed lately before them', async () => {
    const repos = await withKnown(KNOWN);
    expect((await drills(repos))[0]?.kanji).toBe('生');
    await repos.reviews.add({
      at: NOW - 1000,
      itemId: 'kanji:本',
      answer: '',
      expected: 'ホン',
      verdict: 'wrong',
      durationMs: 1,
      mode: 'drill',
    });
    expect((await drills(repos))[0]?.kanji).toBe('本');
  });

  it('is as long as the session length asks, and empty before any kanji is read', async () => {
    const many = ['学', '生', '本', '駅', '待', '持', '時', '寺', '間', '読', '一', '来'];
    const rows = many.map((k) => row(k, 'x', 2));
    expect(await drills(await withKnown(rows))).toHaveLength(10);
    expect(await drills(await withKnown([]))).toEqual([]);
  });
});
