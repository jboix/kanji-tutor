import { describe, expect, it } from 'vitest';
import { withJlptIndex } from '../../test/jlpt-index.ts';
import { K, NOW, readingRepos, track, W } from '../../test/reading-fixtures.ts';
import type { Kanji } from '../types.ts';
import { importKnown } from './import-known.ts';
import { learnedGrammar, learnedGroups, learnedKanji, learnedWords, stateOf } from './learned.ts';

const JLPT: Record<string, 5 | 4 | 3> = { 駅: 5, 本: 5, 読: 5, 学: 5, 生: 5, 待: 4, 間: 4, 紹: 3 };
const KANJI: Kanji[] = K.map((k) => {
  const jlpt = JLPT[k.char];
  return jlpt ? { ...k, jlpt } : k;
});

describe('stateOf', () => {
  it('maps levels 1–2 to learning and 3–4 to known', () => {
    expect([undefined, 0, 1, 2, 3, 4].map((l) => stateOf(l as never))).toEqual([
      'not-started',
      'not-started',
      'learning',
      'learning',
      'known',
      'known',
    ]);
  });
});

describe('learnedWords', () => {
  it('groups words with kanji by JLPT list, with coverage and states', async () => {
    const repos = withJlptIndex(await readingRepos());
    await track(repos, [
      [W.eki, 3],
      [W.matsu, 1],
      [W.issho, 4],
    ]);
    const [n5, n4, n3, other] = await learnedWords(repos);
    expect(n5).toMatchObject({ level: 5, total: 11, known: 1, learning: 1 });
    expect(n5?.entries.slice(0, 2).map((e) => [e.text, e.state])).toEqual([
      ['待つ', 'learning'],
      ['駅', 'known'],
    ]);
    expect(n5?.entries.map((e) => e.text)).not.toContain('これ');
    expect(n4).toMatchObject({ level: 4, total: 3, known: 0 });
    expect(n3).toMatchObject({ level: 3, total: 2, known: 1 });
    expect(other).toMatchObject({ level: 'other', total: 0 });
  });

  it('counts the same after a list is applied twice', async () => {
    const repos = withJlptIndex(await readingRepos());
    await importKnown(repos, { lists: ['n5'], now: NOW });
    const first = await learnedGroups(repos, 'words');
    await importKnown(repos, { lists: ['n5'], now: NOW });
    expect(await learnedGroups(repos, 'words')).toEqual(first);
    expect(first[0]).toMatchObject({ total: 11, known: 11 });
  });

  it('puts tracked words off the lists under other', async () => {
    const repos = withJlptIndex(await readingRepos(), [W.eki]);
    await track(repos, [[W.hon, 2]]);
    const groups = await learnedWords(repos);
    expect(groups[3]?.entries).toEqual([
      { key: W.hon.id, text: '本', reading: 'ほん', meaning: 'book', state: 'learning' },
    ]);
  });
});

describe('learnedKanji', () => {
  it('uses the kanji JLPT index and the best reading level of each kanji', async () => {
    const repos = withJlptIndex(await readingRepos(), undefined, KANJI);
    await importKnown(repos, { pasted: '駅', now: NOW });
    const [n5, n4, , other] = await learnedKanji(repos);
    expect(n5).toMatchObject({ total: 5, known: 1 });
    expect(n5?.entries[0]).toMatchObject({ key: '駅', state: 'known' });
    expect(n4?.total).toBe(2);
    expect(other?.total).toBe(0);
  });

  it('falls back to the kanji of the level words without the index', async () => {
    const repos = await readingRepos();
    repos.dictionary.kanjiMany = async (chars) =>
      chars.map((char) => KANJI.find((k) => k.char === char));
    await importKnown(repos, { pasted: '紹介', now: NOW });
    const [n5, , n3, other] = await learnedKanji(repos);
    expect(n5?.entries.map((e) => e.key).sort()).toEqual(['学', '本', '生', '読', '駅'].sort());
    expect(n3?.total).toBe(0);
    expect(other?.entries.map((e) => e.key).sort()).toEqual(['介', '紹'].sort());
  });
});

describe('learnedGrammar', () => {
  it('groups points by level, with points without one under other', async () => {
    const repos = await readingRepos();
    await repos.grammar.putMany([
      { id: 'te-iru', pattern: '〜ている', meaning: 'ongoing', level: 5, exampleSentenceIds: [] },
      { id: 'wake', pattern: '〜わけではない', meaning: 'not that', exampleSentenceIds: [] },
    ]);
    await repos.items.put({
      id: 'grammar:te-iru',
      kind: 'grammar',
      ref: 'te-iru',
      level: 3,
      source: { kind: 'textbook', week: '2026-W42', addedAt: NOW },
      updatedAt: NOW,
    });
    const [n5, n4, , other] = await learnedGrammar(repos);
    expect(n5).toMatchObject({ total: 1, known: 1 });
    expect(n4?.total).toBe(0);
    expect(other?.entries).toEqual([
      { key: 'wake', text: '〜わけではない', meaning: 'not that', state: 'not-started' },
    ]);
  });
});
