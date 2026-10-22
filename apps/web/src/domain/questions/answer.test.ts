import { describe, expect, it } from 'vitest';
import { NOW, readingRepos, track, W } from '../../test/reading-fixtures.ts';
import { gradeQuestion, recordQuestionAnswer } from './answer.ts';
import type { ChoiceQuestion, ComprehensionQuestion } from './types.ts';

const question: ChoiceQuestion = {
  id: 'q:kanji-reading:s-wait:4',
  kind: 'kanji-reading',
  section: '問題 · 漢字読み',
  stem: { before: '駅で友達を', target: '待って', after: 'いる。', mark: 'underline' },
  options: [
    { text: 'まて', note: 'まて drops the small っ.', slip: 'sokuon' },
    { text: 'まって', note: '待って is read まって.' },
    { text: 'もって', note: '持って', swap: ['待', '持'] },
    { text: 'たいって', note: 'other', slip: 'other' },
  ],
  answer: 1,
  itemId: `word:${W.matsu.id}`,
  sentenceId: 's-wait',
};

describe('gradeQuestion', () => {
  it('grades right, wrong with the slip, a swap and a skip', () => {
    expect(gradeQuestion(question, 1)).toEqual({
      verdict: 'correct',
      expected: 'まって',
      given: 'まって',
    });
    expect(gradeQuestion(question, 0)).toMatchObject({ verdict: 'wrong', errorType: 'sokuon' });
    expect(gradeQuestion(question, 2)).toMatchObject({ errorType: 'wrong-kanji' });
    expect(gradeQuestion(question, 0, true)).toEqual({
      verdict: 'wrong',
      expected: 'まって',
      given: '',
      skipped: true,
    });
  });
});

describe('recordQuestionAnswer', () => {
  it('logs a drill review with the kind and rates the item Good', async () => {
    const repos = await readingRepos();
    await track(repos, [[W.matsu, 3]]);
    const before = await repos.items.get(`word:${W.matsu.id}`);
    await recordQuestionAnswer(repos, { question, choice: 1, durationMs: 900, now: NOW });
    const [review] = await repos.reviews.all();
    expect(review).toMatchObject({
      mode: 'drill',
      questionKind: 'kanji-reading',
      verdict: 'correct',
      sentenceId: 's-wait',
      answer: 'まって',
    });
    const after = await repos.items.get(`word:${W.matsu.id}`);
    expect(after?.level).toBe(3);
    expect(after?.card?.reps).toBe((before?.card?.reps ?? 0) + 1);
    expect(after?.card?.due).toBeGreaterThan(NOW);
  });

  it('stores a lookalike swap as the two kanji, and a skip as skipped', async () => {
    const repos = await readingRepos();
    await recordQuestionAnswer(repos, { question, choice: 2, durationMs: 1, now: NOW });
    await recordQuestionAnswer(repos, {
      question,
      choice: 0,
      skipped: true,
      durationMs: 1,
      now: NOW,
    });
    const [swap, skip] = await repos.reviews.all();
    expect(swap).toMatchObject({ expected: '待', answer: '持', errorType: 'wrong-kanji' });
    expect(skip).toMatchObject({ skipped: true, verdict: 'wrong', answer: '' });
    expect(skip?.errorType).toBeUndefined();
  });

  it('only grades a question with no item', async () => {
    const repos = await readingRepos();
    const passage: ComprehensionQuestion = {
      id: 'q:comprehension:p:0',
      kind: 'comprehension',
      section: '問題 · 読解',
      type: 'content',
      question: '何ですか。',
      evidence: 0,
      options: ['a', 'b', 'c', 'd'].map((text) => ({ text, note: text })),
      answer: 3,
    };
    const grade = await recordQuestionAnswer(repos, {
      question: passage,
      choice: 3,
      durationMs: 1,
      now: NOW,
    });
    expect(grade.verdict).toBe('correct');
    expect(await repos.reviews.all()).toHaveLength(0);
  });
});
