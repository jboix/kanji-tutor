import { describe, expect, it, vi } from 'vitest';
import type { DictionaryRepo } from '../domain/repos.ts';
import type { Word } from '../domain/types.ts';
import type { KanjiTutorDb } from './db.ts';
import { cachedDictionary, forgetDictionary } from './dictionary-cache.ts';

const word = (id: string): Word => ({
  id,
  forms: [`語${id}`],
  readings: ['ご'],
  glosses: ['word'],
  common: true,
});

/** A dictionary whose lookups are spies, over a stand-in database (only its identity is used). */
function setUp() {
  const base = {
    words: vi.fn(async (ids: readonly string[]) => ids.map(word)),
    kanjiMany: vi.fn(async (chars: readonly string[]) => chars.map(() => undefined)),
    wordsByText: vi.fn(async (text: string) => [word(text)]),
    wordsByJlpt: vi.fn(async () => [word('a'), word('b')]),
  } as unknown as DictionaryRepo;
  const db = {} as KanjiTutorDb;
  return { base, db, dictionary: cachedDictionary(db, base) };
}

describe('cachedDictionary', () => {
  it('reads each word once, side by side or later, and only the ones not read yet', async () => {
    const { base, dictionary } = setUp();
    const [a, b] = await Promise.all([dictionary.words(['1', '2']), dictionary.words(['2'])]);
    expect(a.map((w) => w?.id)).toEqual(['1', '2']);
    expect(b.map((w) => w?.id)).toEqual(['2']);
    expect((await dictionary.word('1'))?.id).toBe('1');
    await dictionary.words(['1', '3']);
    expect(vi.mocked(base.words).mock.calls).toEqual([[['1', '2']], [['3']]]);
  });

  it('reads again once the packs are written, and after a failed read', async () => {
    const { base, db, dictionary } = setUp();
    await dictionary.word('1');
    forgetDictionary(db);
    await dictionary.word('1');
    vi.mocked(base.words).mockRejectedValueOnce(new Error('closed'));
    await expect(dictionary.word('2')).rejects.toThrow('closed');
    expect((await dictionary.word('2'))?.id).toBe('2');
    expect(base.words).toHaveBeenCalledTimes(4);
  });

  it('keeps list lookups, handing each caller its own copy', async () => {
    const { base, dictionary } = setUp();
    const first = await dictionary.wordsByJlpt?.(5);
    first?.reverse();
    expect((await dictionary.wordsByJlpt?.(5))?.map((w) => w.id)).toEqual(['a', 'b']);
    await dictionary.wordsByText('駅');
    await dictionary.wordsByText('駅');
    expect(base.wordsByJlpt).toHaveBeenCalledTimes(1);
    expect(base.wordsByText).toHaveBeenCalledTimes(1);
  });

  it('starts over past its size limit, so memory stays bounded', async () => {
    const { base, dictionary } = setUp();
    await dictionary.word('first');
    const many = Array.from({ length: 6_000 }, (_, i) => `w${i}`);
    await dictionary.words(many);
    await dictionary.word('first');
    expect(vi.mocked(base.words).mock.calls.at(-1)).toEqual([['first']]);
  });
});
