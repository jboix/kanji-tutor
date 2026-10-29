import { describe, expect, it } from 'vitest';
import type { Word } from '../types.ts';
import { verbNamed } from './verb-lookup.ts';

const word = (extra: Partial<Word>): Word => ({
  id: '1',
  forms: [],
  readings: [],
  glosses: [],
  common: true,
  ...extra,
});

const dictionary = (words: Word[]) => ({ wordsByText: async () => words });

describe('verbNamed', () => {
  it('finds the verb with its class from the dictionary’s tags', async () => {
    const asobu = word({ forms: ['遊ぶ'], readings: ['あそぶ'], pos: ['v5b'] });
    expect(await verbNamed(dictionary([asobu]), 'あそぶ')).toEqual({
      written: '遊ぶ',
      reading: 'あそぶ',
      cls: 'v5',
    });
  });

  it('skips words that are not verbs, and finds none among them', async () => {
    const hon = word({ forms: ['本'], readings: ['ほん'], pos: ['n'] });
    expect(await verbNamed(dictionary([hon]), 'ほん')).toBeUndefined();
  });
});
