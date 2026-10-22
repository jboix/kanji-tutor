import { beforeEach, describe, expect, it } from 'vitest';
import { readingRepos, track, W } from '../../test/reading-fixtures.ts';
import { introDue, markIntroduced, resetIntroduced, wasIntroduced } from './intro-once.ts';

const MATSU = 'word:3' as const;

beforeEach(() => {
  resetIntroduced();
  localStorage.clear();
});

describe('the intro-once rule (L1)', () => {
  it('is due for an untracked word and for a level-0 word with no review', async () => {
    const repos = await readingRepos();
    expect(await introDue(repos, MATSU)).toBe(true);
    await track(repos, [[W.matsu, 0]]);
    expect(await introDue(repos, MATSU)).toBe(true);
  });

  it('is not due once the word was seen or reviewed', async () => {
    const repos = await readingRepos();
    await track(repos, [[W.matsu, 1]]);
    expect(await introDue(repos, MATSU)).toBe(false);
    const fresh = await readingRepos();
    await track(fresh, [[W.matsu, 0]]);
    await fresh.reviews.add({
      at: 0,
      itemId: MATSU,
      answer: '',
      expected: 'まつ',
      verdict: 'wrong',
      durationMs: 1,
      mode: 'typed',
    });
    expect(await introDue(fresh, MATSU)).toBe(false);
  });

  it('never shows the same intro twice, even after a reload', async () => {
    const repos = await readingRepos();
    markIntroduced(MATSU);
    expect(await introDue(repos, MATSU)).toBe(false);
    resetIntroduced();
    expect(wasIntroduced(MATSU)).toBe(true);
    expect(JSON.parse(localStorage.getItem('kanji-reader:introduced') ?? '[]')).toEqual([MATSU]);
  });

  it('still holds in memory when storage is unusable', () => {
    localStorage.setItem('kanji-reader:introduced', '{broken');
    markIntroduced(MATSU);
    expect(wasIntroduced(MATSU)).toBe(true);
  });
});
