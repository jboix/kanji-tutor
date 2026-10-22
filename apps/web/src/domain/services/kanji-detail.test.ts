import { describe, expect, it } from 'vitest';
import { NOW, readingRepos, track, W } from '../../test/reading-fixtures.ts';
import type { Repos } from '../repos.ts';
import type { Verdict } from '../types.ts';
import { kanjiDetail, readingLabel, recentKanji } from './kanji-detail.ts';
import { rebuildKanjiReadings } from './kanji-readings.ts';

async function miss(repos: Repos, wordId: string, verdict: Verdict, at = NOW - 1000) {
  await repos.reviews.add({
    at,
    itemId: `word:${wordId}`,
    answer: 'x',
    expected: 'y',
    verdict,
    durationMs: 1,
    mode: 'typed',
  });
}

describe('readingLabel', () => {
  it('shows kun okurigana after ・ and keeps on readings', () => {
    expect(readingLabel('い.きる')).toBe('い・きる');
    expect(readingLabel('セイ')).toBe('セイ');
  });
});

describe('kanjiDetail', () => {
  it('lists readings by level with the words that prove them', async () => {
    const repos = await readingRepos();
    await track(
      repos,
      [
        [W.gakusei, 4],
        [W.sensei, 3],
        [W.ikiru, 3],
      ],
      { kind: 'import', lesson: 'Minna 第1–25課' },
    );
    await track(repos, [[W.issho, 1]], { kind: 'capture' });
    await rebuildKanjiReadings(repos);
    await miss(repos, W.issho.id, 'near-miss');
    await miss(repos, W.issho.id, 'wrong', NOW - 2000);
    await miss(repos, W.gakusei.id, 'wrong', NOW - 60 * 86_400_000);
    const detail = await kanjiDetail(repos, '生', NOW);
    expect(detail?.rows.map((r) => [r.label, r.level, r.misread, r.newThisWeek])).toEqual([
      ['セイ', 4, false, false],
      ['い・きる', 3, false, false],
      ['ショウ', 1, true, true],
    ]);
    expect(detail?.rows[0]?.examples).toEqual(['学生', '先生']);
    expect(detail?.wordCount).toBe(4);
    expect(detail?.since?.lesson).toBe('Minna 第1–25課');
    expect(detail?.unmet).toEqual(['う・まれる', 'なま']);
  });

  it('shows the sound family with known and guess-it members', async () => {
    const repos = await readingRepos();
    await repos.kanjiReadings.put({
      id: '星:セイ',
      kanji: '星',
      reading: 'セイ',
      level: 3,
      wordIds: ['x'],
    });
    const detail = await kanjiDetail(repos, '生', NOW);
    expect(detail?.family).toEqual({
      sound: 'セイ',
      members: [
        { char: '星', known: true },
        { char: '性', known: false },
      ],
    });
    const member = await kanjiDetail(repos, '待', NOW);
    expect(member?.family?.members.map((m) => m.char)).toEqual(['持', '時', '寺']);
    expect(member?.family?.sound).toBe('タイ');
  });

  it('has no rows, source or family for a kanji none of your words use', async () => {
    const repos = await readingRepos();
    const detail = await kanjiDetail(repos, '駅', NOW);
    expect(detail).toMatchObject({ rows: [], unmet: ['エキ'], wordCount: 0 });
    expect(detail?.since).toBeUndefined();
    expect(detail?.family).toBeUndefined();
    expect(await kanjiDetail(repos, '鬱', NOW)).toBeUndefined();
  });
});

describe('recentKanji', () => {
  it('lists kanji of answered words first, then of this week’s words', async () => {
    const repos = await readingRepos();
    await track(repos, [[W.eki, 1]]);
    await track(repos, [[W.hon, 3]], { kind: 'import' });
    await miss(repos, W.gakusei.id, 'correct');
    await repos.reviews.add({
      at: NOW - 5,
      itemId: 'grammar:wake',
      answer: '',
      expected: '',
      verdict: 'correct',
      durationMs: 0,
      mode: 'typed',
    });
    expect(await recentKanji(repos, NOW)).toEqual(['学', '生', '駅']);
  });
});
