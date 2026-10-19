import { describe, expect, it } from 'vitest';
import { knowBasics, NOW, readingRepos, S, track, W } from '../../test/reading-fixtures.ts';
import type { Repos } from '../repos.ts';
import type { SessionCard, Target } from '../session-types.ts';
import { recordAnswer } from './answer.ts';

function cardFor(sentence: SessionCard['sentence'], surface: string, readings: string[]) {
  const tokenIndex = sentence.tokens.findIndex((t) => t.surface === surface);
  const wordId = sentence.tokens[tokenIndex]?.wordId ?? '';
  const target: Target = { tokenIndex, itemId: `word:${wordId}`, wordId, surface, readings };
  const card: SessionCard = { sentence, targets: [target], reason: 'due' };
  return { card, target };
}

const waiting = () => cardFor(S.waiting, '待っ', ['まっ', 'まって']);

async function answer(repos: Repos, given: string, at = NOW, pick = waiting()) {
  return recordAnswer(repos, { ...pick, answer: given, mode: 'typed', durationMs: 5000, now: at });
}

describe('recordAnswer', () => {
  it('grades a lookalike reading as wrong-kanji and keeps the level at 2', async () => {
    const repos = await readingRepos();
    await knowBasics(repos);
    await track(repos, [[W.matsu, 2]]);
    const grade = await answer(repos, 'motte');
    expect(grade).toMatchObject({ verdict: 'wrong', errorType: 'wrong-kanji', given: 'もって' });
    const item = await repos.items.get(`word:${W.matsu.id}`);
    expect(item?.level).toBe(2);
    expect(item?.card?.reps).toBe(1);
    const [review] = await repos.reviews.all();
    expect(review).toMatchObject({
      sentenceId: S.waiting.id,
      answer: 'motte',
      verdict: 'wrong',
      errorType: 'wrong-kanji',
      mode: 'typed',
    });
  });

  it('grades an unrelated reading as other', async () => {
    const repos = await readingRepos();
    await track(repos, [[W.matsu, 3]]);
    const grade = await answer(repos, 'たべて');
    expect(grade).toMatchObject({ verdict: 'wrong', errorType: 'other' });
    expect((await repos.items.get(`word:${W.matsu.id}`))?.level).toBe(2);
  });

  it('moves a correct answer up one level; 4 needs a sentence new to the word', async () => {
    const repos = await readingRepos();
    await track(repos, [[W.matsu, 2]]);
    expect((await answer(repos, 'まって')).verdict).toBe('correct');
    expect((await repos.items.get(`word:${W.matsu.id}`))?.level).toBe(3);
    await answer(repos, 'まっ', NOW + 1000);
    expect((await repos.items.get(`word:${W.matsu.id}`))?.level).toBe(3);
    await answer(repos, 'まつ', NOW + 2000, cardFor(S.waitPlain, '待つ', ['まつ']));
    expect((await repos.items.get(`word:${W.matsu.id}`))?.level).toBe(4);
  });

  it('flags a missing っ as a near-miss and schedules it sooner than a correct answer', async () => {
    const repos = await readingRepos();
    await track(repos, [[W.matsu, 2]]);
    const grade = await answer(repos, 'まて');
    expect(grade).toMatchObject({ verdict: 'near-miss', errorType: 'sokuon' });
    expect((await repos.items.get(`word:${W.matsu.id}`))?.level).toBe(2);
  });

  it('grades "I don\'t know" as a skip: Again, no error type, flagged in the review (L4)', async () => {
    const repos = await readingRepos();
    await track(repos, [[W.matsu, 3]]);
    const pick = waiting();
    const input = { ...pick, answer: '', mode: 'typed' as const, durationMs: 3000, now: NOW };
    const grade = await recordAnswer(repos, { ...input, skipped: true });
    expect(grade).toEqual({ verdict: 'wrong', expected: 'まっ', given: '', skipped: true });
    const skipped = await repos.items.get(`word:${W.matsu.id}`);
    expect(skipped?.level).toBe(2);
    const [review] = await repos.reviews.all();
    expect(review).toMatchObject({ verdict: 'wrong', skipped: true, answer: '' });
    expect(review?.errorType).toBeUndefined();
    const right = await readingRepos();
    await track(right, [[W.matsu, 3]]);
    await answer(right, 'まって');
    const known = await right.items.get(`word:${W.matsu.id}`);
    expect(skipped?.card?.due ?? 0).toBeLessThan(known?.card?.due ?? 0);
  });

  it('creates the item for a word met for the first time in a session', async () => {
    const repos = await readingRepos();
    const pick = cardFor(S.student, '学生', ['がくせい']);
    await answer(repos, 'がくせい', NOW, pick);
    const item = await repos.items.get(`word:${W.gakusei.id}`);
    expect(item).toMatchObject({ level: 1, source: { kind: 'session', week: '2026-W42' } });
    expect(item?.card?.reps).toBe(1);
  });

  it('derives 生:セイ from 学生, not 生:い.きる (K3)', async () => {
    const repos = await readingRepos();
    await track(repos, [[W.gakusei, 2]]);
    await answer(repos, 'がくせい', NOW, cardFor(S.student, '学生', ['がくせい']));
    const ids = (await repos.kanjiReadings.byKanji('生')).map((r) => r.id);
    expect(ids).toEqual(['生:セイ']);
    const row = await repos.kanjiReadings.get('生:セイ');
    expect(row).toMatchObject({ level: 3, wordIds: [W.gakusei.id] });
    expect(await repos.kanjiReadings.get('学:ガク')).toMatchObject({ level: 3 });
  });

  it('keeps other words that prove the same kanji reading when one word changes', async () => {
    const repos = await readingRepos();
    await track(repos, [
      [W.gakusei, 2],
      [W.sensei, 4],
    ]);
    await repos.kanjiReadings.put({
      id: '生:セイ',
      kanji: '生',
      reading: 'セイ',
      level: 4,
      wordIds: [W.sensei.id],
    });
    await answer(repos, 'x', NOW, cardFor(S.student, '学生', ['がくせい']));
    const row = await repos.kanjiReadings.get('生:セイ');
    expect(row?.level).toBe(4);
    expect(row?.wordIds.sort()).toEqual([W.gakusei.id, W.sensei.id].sort());
  });
});
