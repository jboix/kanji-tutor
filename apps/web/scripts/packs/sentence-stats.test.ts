import { describe, expect, it } from 'vitest';
import type { JlptLevel } from '../../src/domain/learner-view.ts';
import type { Sentence } from '../../src/domain/types.ts';
import { sentenceStats } from './sentence-stats.ts';

function sentence(id: string, text: string, level: JlptLevel, wordIds: string[] = []): Sentence {
  const tokens = wordIds.map((wordId) => ({
    surface: '漢',
    reading: '',
    base: '漢',
    pos: 'noun',
    start: 0,
    wordId,
  }));
  return { id, text, source: 'tatoeba', tokens, wordIds, level, verified: true };
}

describe('sentence stats', () => {
  it('reports length per level, focus words and casual forms, leaving unit passages out', () => {
    const lines = sentenceStats(
      [
        sentence('1', '花ですか。', 5, ['a']),
        sentence('2', '花が好きです。', 5, ['a']),
        sentence('3', 'マジで駅まで歩いた。', 5, ['a']),
        sentence('4', '彼は大統領に選ばれた。', 3, ['b']),
        { ...sentence('5', '長い文章です。', 3), source: 'unit' },
      ],
      (id) => ({ a: 5, b: 3 })[id] as JlptLevel | undefined,
    );
    expect(lines).toEqual([
      '4 pack sentences (unit passages left out):',
      '  N5: 3 sentences, length p10/p50/p90 4/6/9, <6 33.3%, <8 66.7%, <10 100.0%',
      '  N3: 1 sentences, length p10/p50/p90 10/10/10, <6 0.0%, <8 0.0%, <10 0.0%',
      '  focus words (alone) 2: 1 with 3+ sentences, 1 with fewer',
      '  focus words (with up to 1 more) 2: 1 with 3+ sentences, 1 with fewer',
      '  casual forms: slang 1',
    ]);
  });
});
