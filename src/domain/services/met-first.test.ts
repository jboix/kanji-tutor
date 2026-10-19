import { describe, expect, it } from 'vitest';
import { NOW, readingRepos, W } from '../../test/reading-fixtures.ts';
import { gradeReading } from '../grading.ts';
import type { Repos } from '../repos.ts';
import type { Word } from '../types.ts';
import { saveGradedReading } from './answer.ts';
import { introduceGrammar } from './grammar-intro.ts';
import { metFirst } from './met-first.ts';

const START = NOW;

async function read(repos: Repos, word: Word, at: number, answer = word.readings[0] ?? '') {
  const result = gradeReading(word.readings, answer);
  await saveGradedReading(repos, {
    wordId: word.id,
    result,
    answer,
    mode: 'typed',
    durationMs: 5000,
    now: at,
  });
}

const labels = (met: Awaited<ReturnType<typeof metFirst>>) =>
  met.map((m) => {
    if (m.kind === 'kanji') return `kanji ${m.kanji.char} ${m.reading ?? ''}`;
    if (m.kind === 'word') return `word ${m.word.forms[0]}`;
    return `grammar ${m.entry.id}`;
  });

describe('metFirst (D115)', () => {
  it('lists the words first read in the session and the kanji only they brought', async () => {
    const repos = await readingRepos();
    // 持つ was read yesterday, so neither it nor 持 is new; 待つ and 待 are.
    await read(repos, W.motsu, START - 86_400_000);
    await read(repos, W.matsu, START + 1000);
    await read(repos, W.motsu, START + 2000);
    const met = await metFirst(repos, {
      wordIds: [W.matsu.id, W.motsu.id, W.matsu.id],
      grammarIds: [],
      since: START,
    });
    expect(labels(met)).toEqual(['kanji 待 ま', 'word 待つ']);
  });

  it('counts a word first met with a miss, and its kanji', async () => {
    const repos = await readingRepos();
    await read(repos, W.eki, START + 1000, 'えぎ');
    const met = await metFirst(repos, { wordIds: [W.eki.id], grammarIds: [], since: START });
    expect(labels(met)).toEqual(['kanji 駅 エキ', 'word 駅']);
  });

  it('leaves out a kanji another known word already proves', async () => {
    const repos = await readingRepos();
    await read(repos, W.aida, START - 86_400_000);
    await read(repos, W.ma, START + 1000);
    const met = await metFirst(repos, { wordIds: [W.ma.id], grammarIds: [], since: START });
    expect(labels(met)).toEqual(['word 間']);
  });

  it('lists the grammar points introduced during the session only', async () => {
    const repos = await readingRepos();
    await introduceGrammar(repos, 'desu', START - 1000);
    await introduceGrammar(repos, 'te-mo-ii', START + 1000);
    const met = await metFirst(repos, {
      wordIds: [],
      grammarIds: ['desu', 'te-mo-ii', 'te-mo-ii', 'not-a-point'],
      since: START,
    });
    expect(labels(met)).toEqual(['grammar te-mo-ii']);
  });
});
