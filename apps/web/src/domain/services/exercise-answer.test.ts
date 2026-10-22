import { describe, expect, it } from 'vitest';
import { fixturePack } from '../../test/fixture-pack.ts';
import { NOW, readingRepos, W } from '../../test/reading-fixtures.ts';
import { buildDrill, meaningDrill } from '../drills/index.ts';
import { isExercise, recordDrillAnswer } from './drill-answer.ts';

const line = fixturePack().sentences.find((s) => s.id === 'unit:i-am-a-student:6');
const timing = { durationMs: 2000, now: NOW, step: 0 };

describe('recording S4 exercises', () => {
  it('logs a meaning check and a skip against the word, never its level', async () => {
    const repos = await readingRepos();
    const drill = meaningDrill({ word: W.eki, others: [W.hon, W.gakusei, W.sensei], seed: 'a' });
    if (!drill) throw new Error('no drill');
    expect(isExercise(drill)).toBe(true);
    const wrong = String((drill.answer + 1) % 4);
    expect((await recordDrillAnswer(repos, { drill, answer: wrong, ...timing })).verdict).toBe(
      'wrong',
    );
    await recordDrillAnswer(repos, { drill, answer: '', ...timing, skipped: true });
    const reviews = await repos.reviews.all();
    expect(reviews.map((r) => [r.itemId, r.verdict, r.skipped ?? false])).toEqual([
      [`word:${W.eki.id}`, 'wrong', false],
      [`word:${W.eki.id}`, 'wrong', true],
    ]);
    expect(await repos.items.get(`word:${W.eki.id}`)).toBeUndefined();
  });

  it('grades a sentence built with no item to review, and logs nothing', async () => {
    const repos = await readingRepos();
    const drill = line && buildDrill({ sentence: line, seed: 'a' });
    if (!drill) throw new Error('no drill');
    const grade = await recordDrillAnswer(repos, {
      drill,
      answer: 'リンさんは会社の人です',
      ...timing,
    });
    expect(grade.verdict).toBe('correct');
    expect(await repos.reviews.all()).toEqual([]);
  });
});
