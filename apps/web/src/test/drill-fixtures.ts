/** Repos where drills fit (R8): three sentences to read and every word of S.waiting known. */
import type { Repos } from '../domain/repos.ts';
import { rebuildKanjiReadings } from '../domain/services/kanji-readings.ts';
import type { Review, Sentence } from '../domain/types.ts';
import { knowBasics, NOW, readingRepos, track, W } from './reading-fixtures.ts';

const DAY = 86_400_000;

/** 先生の本。 with 先生 to read. */
export const teacher: Sentence = {
  id: 's-teacher',
  text: '先生の本。',
  source: 'tatoeba',
  tokens: [
    {
      surface: '先生',
      reading: 'せんせい',
      base: '先生',
      pos: 'noun',
      start: 0,
      wordId: W.sensei.id,
    },
    { surface: 'の', reading: 'の', base: 'の', pos: 'particle', start: 2 },
    { surface: '本', reading: 'ほん', base: '本', pos: 'noun', start: 3, wordId: W.hon.id },
    { surface: '。', reading: '。', base: '。', pos: 'symbol', start: 4 },
  ],
  wordIds: [W.sensei.id, W.hon.id],
  level: 5,
  verified: true,
};

/** Three sentences to read (来る, 学生, 先生 due) and every word of S.waiting known. */
export async function drillRepos(): Promise<Repos> {
  const repos = await readingRepos({ learnerLevel: 3, immersion: 'native' });
  await repos.sentences.put(teacher);
  await knowBasics(repos);
  const later = { dueIn: 30 * DAY };
  await track(
    repos,
    [
      [W.matsu, 3],
      [W.motsu, 3],
      [W.aida, 3],
      [W.ikiru, 3],
      [W.issho, 3],
    ],
    later,
  );
  await track(repos, [
    [W.kuru, 2],
    [W.gakusei, 2],
    [W.sensei, 1],
  ]);
  await rebuildKanjiReadings(repos);
  return repos;
}

/** A review three days ago, a right 待って unless overridden. */
export function review(extra: Partial<Review>): Review {
  return {
    at: NOW - 3 * DAY,
    itemId: `word:${W.matsu.id}`,
    answer: 'まって',
    expected: 'まって',
    verdict: 'correct',
    durationMs: 3000,
    mode: 'typed',
    ...extra,
  };
}

/** 待って read もって: a 待/持 swap. */
export const swap = review({ answer: 'もって', verdict: 'wrong', errorType: 'wrong-kanji' });
