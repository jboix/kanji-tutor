import { describe, expect, it, vi } from 'vitest';
import { NOW, readingRepos, track, W } from '../../test/reading-fixtures.ts';
import { importKnown, wordsOnList } from './import-known.ts';

const DAY = 86_400_000;

describe('wordsOnList', () => {
  it('scans by reading prefix when the dictionary has no JLPT index', async () => {
    const repos = await readingRepos();
    const ids = (await wordsOnList(repos.dictionary, 4)).map((w) => w.id).sort();
    expect(ids).toEqual([W.aida.id, W.ikiru.id, W.shoukai.id].sort());
    const n5 = (await wordsOnList(repos.dictionary, 5)).map((w) => w.id);
    expect(n5).toContain(W.koohii.id);
  });

  it('uses wordsByJlpt when the dictionary provides it', async () => {
    const repos = await readingRepos();
    const wordsByJlpt = vi.fn(async () => [W.eki]);
    const dictionary = { ...repos.dictionary, wordsByJlpt };
    expect(await wordsOnList(dictionary, 5)).toEqual([W.eki]);
    expect(wordsByJlpt).toHaveBeenCalledWith(5);
  });
});

describe('importKnown', () => {
  it('marks N5 words with kanji known at level 3, with cards due in 1 to 12 weeks', async () => {
    const repos = await readingRepos();
    const progress = vi.fn();
    const result = await importKnown(repos, { lists: ['n5'], now: NOW, onProgress: progress });
    expect(result).toEqual({ marked: 11, already: 0, notFound: [] });
    const item = await repos.items.get(`word:${W.eki.id}`);
    expect(item).toMatchObject({ level: 3, source: { kind: 'import', lesson: 'JLPT N5' } });
    expect(item?.card?.due).toBeGreaterThanOrEqual(NOW + 7 * DAY);
    expect(item?.card?.due).toBeLessThan(NOW + 85 * DAY);
    expect(await repos.items.get(`word:${W.kore.id}`)).toBeUndefined();
    expect(progress).toHaveBeenLastCalledWith(11, 11);
    expect(await repos.kanjiReadings.get('駅:エキ')).toMatchObject({ level: 3 });
  });

  it('is idempotent', async () => {
    const repos = await readingRepos();
    await importKnown(repos, { lists: ['n5', 'n4'], now: NOW });
    const again = await importKnown(repos, { lists: ['n5', 'n4'], now: NOW + DAY });
    expect(again).toEqual({ marked: 0, already: 14, notFound: [] });
    expect(await repos.items.count()).toBe(14);
  });

  it('maps Minna lessons to the JLPT lists', async () => {
    const repos = await readingRepos();
    expect((await importKnown(repos, { minnaUpTo: 12, now: NOW })).marked).toBe(11);
    expect((await repos.items.get(`word:${W.eki.id}`))?.source.lesson).toBe('Minna 第1–12課');
    const more = await importKnown(repos, { minnaUpTo: 40, now: NOW });
    expect(more.marked).toBe(3);
    expect((await repos.items.get(`word:${W.aida.id}`))?.source.lesson).toBe('Minna 第26–40課');
  });

  it('imports pasted lines with a lesson tag and reports lines it cannot find', async () => {
    const repos = await readingRepos();
    const result = await importKnown(repos, {
      pasted: '紹介\n\n一生\nいっしょう\nふぉお\n紹介',
      lesson: 'Tobira 第1課',
      now: NOW,
    });
    expect(result).toEqual({ marked: 2, already: 0, notFound: ['ふぉお'] });
    expect((await repos.items.get(`word:${W.issho.id}`))?.source.lesson).toBe('Tobira 第1課');
  });

  it('uses the given lookup for pasted lines (romaji through lang)', async () => {
    const repos = await readingRepos();
    const lookup = vi.fn(async () => [W.shoukai]);
    const result = await importKnown(repos, { pasted: 'shoukai', now: NOW, lookup });
    expect(result.marked).toBe(1);
    expect(lookup).toHaveBeenCalledWith('shoukai');
  });

  it('raises a word below level 3 and keeps one already known', async () => {
    const repos = await readingRepos();
    await track(repos, [
      [W.eki, 1],
      [W.hon, 4],
    ]);
    const result = await importKnown(repos, { pasted: '駅\n本', now: NOW });
    expect(result).toEqual({ marked: 1, already: 1, notFound: [] });
    expect((await repos.items.get(`word:${W.eki.id}`))?.level).toBe(3);
    expect((await repos.items.get(`word:${W.hon.id}`))?.level).toBe(4);
  });

  it('applies a list again without duplicating, lowering or resetting a card (P2)', async () => {
    const repos = await readingRepos();
    await importKnown(repos, { lists: ['n5'], now: NOW });
    await track(repos, [
      [W.eki, 4],
      [W.hon, 1],
    ]);
    const before = await repos.items.getMany([`word:${W.eki.id}`, `word:${W.hon.id}`]);
    const count = await repos.items.count();
    const again = await importKnown(repos, { lists: ['n5', 'n4'], now: NOW + DAY });
    const third = await importKnown(repos, { lists: ['n5'], now: NOW + 2 * DAY });
    expect(again.marked).toBe(4);
    expect(third).toEqual({ marked: 0, already: 11, notFound: [] });
    expect(await repos.items.count()).toBe(count + 3);
    const [eki, hon] = await repos.items.getMany([`word:${W.eki.id}`, `word:${W.hon.id}`]);
    expect(eki).toEqual(before[0]);
    expect(hon?.level).toBe(3);
    expect(hon?.card).toEqual(before[1]?.card);
  });

  it('moves the learner level past the lists and never lowers it', async () => {
    const repos = await readingRepos();
    await importKnown(repos, { pasted: '駅', now: NOW });
    expect((await repos.settings.get()).learnerLevel).toBeUndefined();
    await importKnown(repos, { lists: ['n5'], now: NOW });
    expect((await repos.settings.get()).learnerLevel).toBe(4);
    await importKnown(repos, { minnaUpTo: 40, now: NOW });
    expect((await repos.settings.get()).learnerLevel).toBe(3);
    await importKnown(repos, { lists: ['n5'], now: NOW });
    expect((await repos.settings.get()).learnerLevel).toBe(3);
  });
});
